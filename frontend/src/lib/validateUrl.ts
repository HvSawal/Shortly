export type UrlValidationResult =
    | { ok: true; normalized: string }
    | { ok: false; message: string }

/**
 * Frontend URL validation:
 * - requires http/https
 * - requires a hostname (or localhost)
 * - blocks javascript:, data:, file:
 * - trims whitespace
 *
 * Note: This is UX validation; backend must still validate.
 */
export function validateUrl(raw: string): UrlValidationResult {
    const input = (raw ?? "").trim()

    if (input.length === 0) {
        return { ok: false, message: "URL is required." }
    }

    // Basic whitespace rejection
    if (/\s/.test(input)) {
        return { ok: false, message: "URL cannot contain spaces." }
    }

    let url: URL
    try {
        url = new URL(input)
    } catch {
        return { ok: false, message: "Enter a valid URL (include https://)." }
    }

    const protocol = url.protocol.toLowerCase()
    if (protocol !== "http:" && protocol !== "https:") {
        return { ok: false, message: "Only http:// and https:// URLs are allowed." }
    }

    // Hostname rules: allow localhost; otherwise require dot (example.com)
    const host = url.hostname.toLowerCase()
    const isLocalhost = host === "localhost"
    const hasDot = host.includes(".")
    if (!isLocalhost && !hasDot) {
        return { ok: false, message: "Hostname must look like a real domain (example.com)." }
    }

    // Optional: block obviously unsafe schemes (already filtered by protocol, but kept explicit)
    if (["javascript:", "data:", "file:"].includes(protocol)) {
        return { ok: false, message: "That URL scheme is not allowed." }
    }

    // Normalize: keep as URL string (preserves path/query)
    return { ok: true, normalized: url.toString() }
}