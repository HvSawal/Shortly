import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Activity, Clock, ShieldCheck, Gauge } from "lucide-react";

type RunMetrics = {
    name: string;
    runId: string;
    createdAt: string;
    httpReqs: number;
    iterations: number;
    errorRate: number; // 0..1
    latency: {
        avg_ms: number;
        p95_ms: number;
        p99_ms: number;
        max_ms: number;
    };
};

type LatestPayload = {
    runId: string;
    generatedAt: string;
    runs: RunMetrics[];
};

type HistoryPayload = LatestPayload[];

function fmtMs(n: number) {
    if (!Number.isFinite(n)) return "-";
    if (n < 1) return `${(n * 1000).toFixed(0)}µs`;
    return `${n.toFixed(2)}ms`;
}

function fmtPct(rate: number) {
    if (!Number.isFinite(rate)) return "-";
    return `${(rate * 100).toFixed(2)}%`;
}

function fmtNum(n: number) {
    if (!Number.isFinite(n)) return "-";
    return new Intl.NumberFormat().format(Math.round(n));
}

function baseUrl() {
    const env = (import.meta as any).env?.VITE_PERF_RESULTS_BASE_URL as string | undefined;
    if (env && env.trim().length > 0) return env.replace(/\/+$/, "");
    return "/perf/results";
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
    return res.json();
}

function pillClass(ok: boolean) {
    return ok
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-red-500/30 bg-red-500/10 text-red-400";
}

function metricCardBg() {
    return "bg-gradient-to-br from-primary/10 via-background to-background";
}

type TrendPoint = {
    t: string;
    ts: number;
    p95: number;
    p99: number;
    err: number;
};

function extractScenario(runs: RunMetrics[], scenarioName: string) {
    return runs.find((r) => r.name === scenarioName) ?? null;
}

export default function PerformanceDashboard() {
    const [latest, setLatest] = React.useState<LatestPayload | null>(null);
    const [history, setHistory] = React.useState<HistoryPayload | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const b = baseUrl();
        Promise.all([
            fetchJson<LatestPayload>(`${b}/latest.json`),
            fetchJson<HistoryPayload>(`${b}/history.json`),
        ])
            .then(([l, h]) => {
                setLatest(l);
                setHistory(h);
            })
            .catch((e) => setError(e?.message ?? String(e)));
    }, []);

    const redirectLatest = latest ? extractScenario(latest.runs, "redirect_domain_safe") : null;
    const mixedLatest = latest ? extractScenario(latest.runs, "mixed_domain_safe") : null;

    const overallP95 = (() => {
        const vals = [redirectLatest?.latency.p95_ms, mixedLatest?.latency.p95_ms].filter(
            (v): v is number => typeof v === "number" && Number.isFinite(v)
        );
        return vals.length ? Math.max(...vals) : null;
    })();

    const overallP99 = (() => {
        const vals = [redirectLatest?.latency.p99_ms, mixedLatest?.latency.p99_ms].filter(
            (v): v is number => typeof v === "number" && Number.isFinite(v)
        );
        return vals.length ? Math.max(...vals) : null;
    })();

    const overallErr = (() => {
        const vals = [redirectLatest?.errorRate, mixedLatest?.errorRate].filter(
            (v): v is number => typeof v === "number" && Number.isFinite(v)
        );
        return vals.length ? Math.max(...vals) : null;
    })();

    const overallReqs = (redirectLatest?.httpReqs ?? 0) + (mixedLatest?.httpReqs ?? 0);
    const ok = (overallErr ?? 0) < 0.01 && (overallP95 ?? 0) < 150;

    const trendRedirect: TrendPoint[] = React.useMemo(() => {
        if (!history) return [];
        const pts: TrendPoint[] = [];
        for (const entry of history) {
            const r = extractScenario(entry.runs, "redirect_domain_safe");
            if (!r) continue;
            const ts = Date.parse(entry.generatedAt) || Date.now();
            pts.push({
                t: new Date(ts).toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
                ts,
                p95: r.latency.p95_ms ?? 0,
                p99: r.latency.p99_ms ?? 0,
                err: r.errorRate ?? 0,
            });
        }
        return pts.sort((a, b) => a.ts - b.ts);
    }, [history]);

    const trendMixed: TrendPoint[] = React.useMemo(() => {
        if (!history) return [];
        const pts: TrendPoint[] = [];
        for (const entry of history) {
            const r = extractScenario(entry.runs, "mixed_domain_safe");
            if (!r) continue;
            const ts = Date.parse(entry.generatedAt) || Date.now();
            pts.push({
                t: new Date(ts).toLocaleDateString(undefined, { month: "short", day: "2-digit" }),
                ts,
                p95: r.latency.p95_ms ?? 0,
                p99: r.latency.p99_ms ?? 0,
                err: r.errorRate ?? 0,
            });
        }
        return pts.sort((a, b) => a.ts - b.ts);
    }, [history]);

    return (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-2 sm:py-2">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Performance</h1>
                    <p className="mt-2 text-base sm:text-sm opacity-80">
                        Scheduled k6 checks against production domains (redirect-only + mixed).
                    </p>
                </div>

                <div
                    className={`w-fit rounded-full border px-3 py-1.5 text-sm sm:text-xs ${pillClass(ok)}`}
                >
                    {ok ? "Healthy" : "Degraded"} · p95 {overallP95 ? fmtMs(overallP95) : "-"} · err{" "}
                    {overallErr != null ? fmtPct(overallErr) : "-"}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-base sm:text-sm">
                    <div className="font-medium">Could not load performance data</div>
                    <div className="mt-1 opacity-80 break-words">{error}</div>
                    <div className="mt-2 text-sm sm:text-xs opacity-70">
                        Source: <span className="font-mono break-all">{baseUrl()}</span>
                    </div>
                </div>
            )}

            {/* Loading */}
            {!latest ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted/20" />
                    ))}
                </div>
            ) : (
                <>
                    {/* KPI Row */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="p95 (worst)"
                            value={overallP95 != null ? fmtMs(overallP95) : "-"}
                            hint="Target: < 150ms"
                            icon={<Clock className="h-5 w-5 sm:h-4 sm:w-4 opacity-70" />}
                        />
                        <KpiCard
                            label="p99 (worst)"
                            value={overallP99 != null ? fmtMs(overallP99) : "-"}
                            hint="Target: < 300ms"
                            icon={<Gauge className="h-5 w-5 sm:h-4 sm:w-4 opacity-70" />}
                        />
                        <KpiCard
                            label="Error rate"
                            value={overallErr != null ? fmtPct(overallErr) : "-"}
                            hint="Target: < 1%"
                            icon={<ShieldCheck className="h-5 w-5 sm:h-4 sm:w-4 opacity-70" />}
                        />
                        <KpiCard
                            label="Requests (latest)"
                            value={fmtNum(overallReqs)}
                            hint="Across both scenarios"
                            icon={<Activity className="h-5 w-5 sm:h-4 sm:w-4 opacity-70" />}
                        />
                    </div>

                    {/* Scenario Cards */}
                    <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <ScenarioCard
                            title="Redirect only (domain · safe)"
                            subtitle="GET go.hsawal.com/{code} (no follow redirects)"
                            run={redirectLatest}
                        />
                        <ScenarioCard
                            title="Mixed (domain · safe)"
                            subtitle="redirect-heavy + low shorten"
                            run={mixedLatest}
                        />
                    </div>

                    {/* Trends */}
                    <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <TrendCard title="Redirect p95 trend" subtitle="p95 latency over time" data={trendRedirect} metric="p95" />
                        <TrendCard title="Mixed p95 trend" subtitle="p95 latency over time" data={trendMixed} metric="p95" />
                    </div>

                    <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
                        <TrendCard title="Redirect error trend" subtitle="error rate over time" data={trendRedirect} metric="err" />
                        <TrendCard title="Mixed error trend" subtitle="error rate over time" data={trendMixed} metric="err" />
                    </div>

                    {/* Raw info */}
                    <div className="mt-8 sm:mt-10 rounded-2xl border p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-base sm:text-sm font-semibold">Data source</div>
                                <div className="mt-1 text-sm sm:text-xs opacity-70">
                                    <span className="font-mono break-all">{baseUrl()}</span>
                                </div>
                            </div>
                            <div className="text-sm sm:text-xs opacity-70">
                                runId: <span className="font-mono break-all">{latest.runId}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({
                     label,
                     value,
                     hint,
                     icon,
                 }: {
    label: string;
    value: string;
    hint: string;
    icon: React.ReactNode;
}) {
    return (
        <div className={`rounded-2xl border p-4 ${metricCardBg()}`}>
            <div className="flex items-center justify-between">
                <div className="text-sm sm:text-xs opacity-70">{label}</div>
                {icon}
            </div>
            <div className="mt-2 text-3xl sm:text-2xl font-semibold leading-none">{value}</div>
            <div className="mt-2 text-sm sm:text-xs opacity-70">{hint}</div>
        </div>
    );
}

function ScenarioCard({
                          title,
                          subtitle,
                          run,
                      }: {
    title: string;
    subtitle: string;
    run: RunMetrics | null;
}) {
    const isOk = (run?.errorRate ?? 0) < 0.01 && (run?.latency.p95_ms ?? 0) < 150;

    return (
        <div className="rounded-2xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="text-lg sm:text-sm font-semibold">{title}</div>
                    <div className="mt-1 text-base sm:text-xs opacity-70">{subtitle}</div>
                </div>
                <div className={`w-fit rounded-full border px-3 py-1.5 text-sm sm:text-xs ${pillClass(isOk)}`}>
                    {isOk ? "OK" : "Watch"}
                </div>
            </div>

            {!run ? (
                <div className="mt-4 rounded-xl border bg-muted/20 p-4 text-base sm:text-sm opacity-80">
                    No data for this scenario yet.
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-base sm:text-sm">
                    <MetricRow label="avg" value={fmtMs(run.latency.avg_ms)} />
                    <MetricRow label="p95" value={fmtMs(run.latency.p95_ms)} />
                    <MetricRow label="p99" value={fmtMs(run.latency.p99_ms)} />
                    <MetricRow label="max" value={fmtMs(run.latency.max_ms)} />
                    <MetricRow label="errors" value={fmtPct(run.errorRate)} />
                    <MetricRow label="reqs" value={fmtNum(run.httpReqs)} />
                </div>
            )}
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-background/40 p-3">
            <div className="text-sm sm:text-xs opacity-70">{label}</div>
            <div className="mt-1 font-mono text-base sm:text-sm break-all">{value}</div>
        </div>
    );
}

function TrendCard({
                       title,
                       subtitle,
                       data,
                       metric,
                   }: {
    title: string;
    subtitle: string;
    data: TrendPoint[];
    metric: "p95" | "p99" | "err";
}) {
    const hasData = data && data.length > 1;

    const stroke = "hsl(var(--primary))";
    const grid = "hsl(var(--border))";

    const yFormatter = (v: number) => {
        if (metric === "err") return `${(v * 100).toFixed(1)}%`;
        return `${Math.round(v)}ms`;
    };

    return (
        <div className="rounded-2xl border p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="text-lg sm:text-sm font-semibold">{title}</div>
                    <div className="mt-1 text-base sm:text-xs opacity-70">{subtitle}</div>
                </div>
                <div className="text-sm sm:text-xs opacity-70">{hasData ? `${data.length} pts` : "—"}</div>
            </div>

            <div className="mt-4 h-56 sm:h-60">
                {!hasData ? (
                    <div className="flex h-full items-center justify-center rounded-xl border bg-muted/20 text-base sm:text-sm opacity-80">
                        Not enough history yet (needs 2+ runs).
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid stroke={grid} strokeOpacity={0.35} vertical={false} />
                            <XAxis dataKey="t" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={yFormatter}
                                width={48}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--background))",
                                    border: `1px solid ${grid}`,
                                    borderRadius: 12,
                                }}
                                labelStyle={{ opacity: 0.8 }}
                                formatter={(value: any) => {
                                    const v = Number(value);
                                    if (metric === "err") return `${(v * 100).toFixed(2)}%`;
                                    return `${v.toFixed(2)}ms`;
                                }}
                            />
                            <Line type="monotone" dataKey={metric} dot={false} stroke={stroke} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
