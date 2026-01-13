package dev.hvsawal.shortener.support.resilience;

import dev.hvsawal.shortener.configuration.ShortenerConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.Semaphore;

@Component
public class DbBulkhead {
    private final Semaphore sem;
    private final Duration shortenWait;
    private final Duration resolveWait;

    public DbBulkhead(ShortenerConfigurationProperties props) {
        this.sem = new Semaphore(Math.max(1, props.bulkhead().dbPermits()));
        this.shortenWait = Duration.ofMillis(Math.max(0, props.bulkhead().acquireTimeoutMs().shorten()));
        this.resolveWait = Duration.ofMillis(Math.max(0, props.bulkhead().acquireTimeoutMs().resolve()));
    }

    public Permit tryAcquireShorten() {
        return tryAcquire(shortenWait);
    }

    public Permit tryAcquireResolve() {
        return tryAcquire(resolveWait);
    }

    private Permit tryAcquire(Duration wait) {
        try {
            boolean ok = sem.tryAcquire(wait.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
            return new Permit(ok, sem);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Permit(false, sem);
        }
    }

    public record Permit(boolean acquired, Semaphore sem) implements AutoCloseable {
        @Override public void close() { if (acquired) sem.release(); }
    }
}
