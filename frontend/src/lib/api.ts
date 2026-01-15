export type ProblemDetails = {
    type?: string
    title?: string
    status?: number
    detail?: string
    instance?: string
    // Spring ProblemDetail can carry extra fields via "properties"
    properties?: {
        requestId?: string
        [key: string]: unknown
    }
}

export type ShortenResponse = {
    code: string
    shortUrl: string
    originalUrl: string
    createdAt?: string
    expiresAt?: string | null
}

export class ApiError extends Error {
    readonly kind: "network" | "http" | "unknown"
    readonly status?: number
    readonly problem?: ProblemDetails

    constructor(args: {
        message: string
        kind: ApiError["kind"]
        status?: number
        problem?: ProblemDetails
    }) {
        super(args.message)
        this.kind = args.kind
        this.status = args.status
        this.problem = args.problem
    }
}

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null
}

function looksLikeProblemDetails(v: unknown): v is ProblemDetails {
    if (!isObject(v)) return false
    // "title" and "status" are the most common anchors
    return ("title" in v && typeof v.title === "string") || ("status" in v && typeof v.status === "number")
}

function getBaseUrl(): string {
    // Vercel: set VITE_API_BASE_URL=https://<tunnel-host>
    // Local dev: fallback to http://localhost:8080
    const env = import.meta.env.VITE_API_BASE_URL as string | undefined
    return (env && env.trim().length > 0 ? env.trim() : "http://localhost:8080").replace(/\/+$/, "")
}

async function parseJsonSafe(res: Response): Promise<unknown> {
    try {
        return await res.json()
    } catch {
        return null
    }
}

export async function shortenUrl(args: { url: string; preview?: boolean }): Promise<ShortenResponse> {
    const base = getBaseUrl()
    const qs = args.preview ? "?preview=true" : ""
    const endpoint = `${base}/api/v1/shorten${qs}`

    let res: Response
    try {
        res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: args.url }),
        })
    } catch (e) {
        throw new ApiError({
            kind: "network",
            message: "Backend unavailable",
        })
    }

    if (!res.ok) {
        const payload = await parseJsonSafe(res)
        const problem = looksLikeProblemDetails(payload) ? (payload as ProblemDetails) : undefined
        const msg =
            problem?.title ||
            problem?.detail ||
            `Request failed (${res.status})`
        throw new ApiError({
            kind: "http",
            status: res.status,
            problem,
            message: msg,
        })
    }

    const data = (await res.json()) as ShortenResponse
    return data
}