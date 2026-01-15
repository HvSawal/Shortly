export function formatIsoDateTime(iso?: string | null): string {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function truncateMiddle(input: string, max = 56): string {
    if (!input) return ""
    if (input.length <= max) return input
    const head = Math.max(10, Math.floor(max * 0.6))
    const tail = Math.max(8, max - head - 1)
    return `${input.slice(0, head)}…${input.slice(input.length - tail)}`
}

export function safeHostname(url: string): string {
    try {
        const u = new URL(url)
        return u.hostname
    } catch {
        return ""
    }
}

export function normalizeUrlCandidate(raw: string): string {
    return raw.trim()
}