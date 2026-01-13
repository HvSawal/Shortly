package dev.hvsawal.shortener.analytics;

import dev.hvsawal.shortener.configuration.ShortenerConfigurationProperties;
import dev.hvsawal.shortener.repository.ShortUrlRepository;
import dev.hvsawal.shortener.support.resilience.DbBulkhead;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.LongAdder;

@Component
public class InMemoryBatchedClickTracker implements ClickTracker {

    private static final Logger log = LoggerFactory.getLogger(InMemoryBatchedClickTracker.class);
    private final TransactionTemplate tx;

    private final boolean enabled;
    private final int maxEntries;

    private final AtomicReference<ConcurrentHashMap<Long, LongAdder>> buffer =
            new AtomicReference<>(new ConcurrentHashMap<>());
    private final AtomicInteger approxEntries = new AtomicInteger(0);

    private final ShortUrlRepository repo;
    private final DbBulkhead bulkhead;

    private final Counter recorded;
    private final Counter dropped;
    private final Counter flushed;

    public InMemoryBatchedClickTracker(ShortenerConfigurationProperties props,
                                       ShortUrlRepository repo,
                                       DbBulkhead bulkhead,
                                       MeterRegistry registry,
                                       PlatformTransactionManager txManager){
        this.enabled = props.clickcount().enabled();
        this.maxEntries = Math.max(1, props.clickcount().maxBufferEntries());
        this.repo = repo;
        this.bulkhead = bulkhead;
        this.tx = new TransactionTemplate(txManager);
        this.tx.setTimeout(1);

        this.recorded = Counter.builder("shortener_click_recorded_total").register(registry);
        this.dropped  = Counter.builder("shortener_click_dropped_total").register(registry);
        this.flushed  = Counter.builder("shortener_click_flushed_total").register(registry);
    }

    @Override
    public void record(long id) {
        if (!enabled) return;

        // best-effort: if buffer is too large, drop
        if (approxEntries.get() > maxEntries) {
            dropped.increment();
            return;
        }

        ConcurrentHashMap<Long, LongAdder> map = buffer.get();
        LongAdder adder = map.get(id);
        if (adder == null) {
            // try to add a new entry
            LongAdder newAdder = new LongAdder();
            LongAdder existing = map.putIfAbsent(id, newAdder);
            adder = (existing != null) ? existing : newAdder;
            if (existing == null) approxEntries.incrementAndGet();
        }

        adder.increment();
        recorded.increment();
    }

    // flush interval controlled by @Scheduled + config value below (see step 3)
    @Scheduled(fixedDelayString = "${shortener.clickcount.flush-interval-ms:1000}")
    public void scheduledFlush() {
        if (!enabled) return;

        // best-effort: never block redirect traffic. If DB is “busy”, skip this flush.
        try (var permit = bulkhead.tryAcquireResolve()) {
            if (!permit.acquired()) return;
            flushNow();
        }
    }

    void flushNow() {
        Map<Long, LongAdder> old = buffer.getAndSet(new ConcurrentHashMap<>());
        approxEntries.set(0);

        long totalDelta = 0;

        for (Map.Entry<Long, LongAdder> e : old.entrySet()) {
            long id = e.getKey();
            long delta = e.getValue().sumThenReset();
            if (delta <= 0) continue;

            totalDelta += delta;

            try {
                tx.executeWithoutResult(status -> repo.incrementClickCount(id, delta));
                flushed.increment(delta);
            } catch (Exception ex) {
                // best-effort: drop analytics, but log once so we can see it if it keeps happening
                log.warn("Click flush failed for id={} delta={} (dropping). {}", id, delta, ex.toString());
            }
        }

        if (totalDelta > 0) {
            log.debug("Flushed click deltas total={}", totalDelta);
        }
    }
}
