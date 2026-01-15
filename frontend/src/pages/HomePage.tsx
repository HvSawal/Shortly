import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { ShortenFormCard } from "@/features/shorten/ShortenFormCard"
import { ResultCard } from "@/features/shorten/ResultCard"
import { ErrorBanner } from "@/features/shorten/ErrorBanner"
import { shortenUrl, type ShortenResponse } from "@/lib/api"
import { normalizeUrlCandidate } from "@/lib/format"
import {Sparkles} from "lucide-react";
import {validateUrl} from "@/lib/validateUrl.ts";
import {Banner} from "@/features/feedback/Banner.tsx";
import {toast} from "sonner";

export function HomePage() {
    const [url, setUrl] = React.useState("")
    const [preview, setPreview] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [result, setResult] = React.useState<ShortenResponse | null>(null)
    const [error, setError] = React.useState<unknown>(null)

    const [warning, setWarning] = React.useState<string | null>(null)

    const [touched, setTouched] = React.useState(false)
    const urlValidation = React.useMemo(() => validateUrl(url), [url])
    const urlError = urlValidation.ok ? null : urlValidation.message

    React.useEffect(() => {
        // Autofocus the URL input if present
        const el = document.getElementById("url") as HTMLInputElement | null
        el?.focus()
    }, [])

    async function onSubmit() {
        setError(null)
        setResult(null)
        setWarning(null)



        // block backend call if invalid
        const v = validateUrl(url)
        if (!v.ok) {
            setTouched(true)
            return
        }

        setIsLoading(true)

        const warnTimer = window.setTimeout(() => {
            setWarning("This is taking longer than usual… still working.")
        }, 1200)

        try {
            const data = await shortenUrl({ url: normalizeUrlCandidate(url), preview })
            setResult(data)
            toast.success("Short link created")
        } catch (e) {
            setError(e)
        } finally {
            window.clearTimeout(warnTimer)
            setWarning(null)
            setIsLoading(false)
        }
    }

    function onClear() {
        setUrl("")
        setResult(null)
        setError(null)
        setTouched(false)
        const el = document.getElementById("url") as HTMLInputElement | null
        el?.focus()
    }

    return (
        <div className="space-y-6">
            {/* Hero */}
            <section className="space-y-4">
                <div className="mb-10 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-white/50 px-3 py-1 text-xs font-medium text-purple-700 shadow-sm backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5" />
                        Production-grade demo
                    </div>

                    <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl ">
                        Ship short links, <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-pink-500 dark:via-purple-600 dark:to-violet-600">
                            broaden your reach.
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg dark:text-slate-400 text-slate-800">
                        Transform long, ugly links into short, reusable URLs. Built with high-performance APIs, defensive security, and fast redirects.
                    </p>

                    {/*<div className="flex flex-wrap justify-center gap-2 pt-2">*/}
                    {/*    {["No auth (V1)", "Default expiry", "Anti-enumeration codes", "Backpressure (429/503)"].map((tag) => (*/}
                    {/*        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">*/}
                    {/*            {tag}*/}
                    {/*        </Badge>*/}
                    {/*    ))}*/}
                    {/*</div>*/}
                </div>

                {/*<div className="space-y-2">*/}
                {/*    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">*/}
                {/*        Ship short links that feel production-ready.*/}
                {/*    </h1>*/}
                {/*    <p className="max-w-prose text-muted-foreground">*/}
                {/*        Clean URL shortening with strong validation, consistent errors, caching for fast redirects,*/}
                {/*        and a UI that looks like a real product.*/}
                {/*    </p>*/}
                {/*</div>*/}

                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Fast redirect path</Badge>
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Shareable result card</Badge>
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Responsive + dark mode</Badge>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Spring Boot 3</Badge>
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Postgres + Flyway</Badge>
                    <Badge variant={"outline"} className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Caffeine cache</Badge>
                </div>
            </section>

            {warning ? (
                <Banner
                    variant="warning"
                    title="Taking longer than usual ... "
                    detail={warning}
                    onDismiss={() => setWarning(null)}
                />
            ) : null}

            {/* Error (server/network) */}
            {error ? <ErrorBanner error={error} onDismiss={() => setError(null)} /> : null}

            {/* Form */}
            <ShortenFormCard
                url={url}
                setUrl={(v) => {
                    setUrl(v)
                    // if user starts typing, don’t force error until blur/submit unless already touched
                    if (!touched) return
                }}
                preview={preview}
                setPreview={setPreview}
                isLoading={isLoading}
                onSubmit={onSubmit}
                onClear={onClear}
                touched={touched}
                setTouched={setTouched}
                urlError={urlError}
            />

            {/* Result */}
            {result ? <ResultCard result={result} /> : null}
        </div>
    )
}