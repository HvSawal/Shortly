import * as React from "react"
import {useEffect} from "react"
import {Badge} from "@/components/ui/badge"
import {ShortenFormCard} from "@/features/shorten/ShortenFormCard"
import {ResultCard} from "@/features/shorten/ResultCard"
import {ErrorBanner} from "@/features/shorten/ErrorBanner"
import {type ShortenResponse, shortenUrl} from "@/lib/api"
import {normalizeUrlCandidate} from "@/lib/format"
import {Sparkles} from "lucide-react";
import {validateUrl} from "@/lib/validateUrl.ts";
import {Banner} from "@/features/feedback/Banner.tsx";
import {toast} from "sonner";

import {AnimatePresence, motion, useReducedMotion} from "framer-motion";

export function HomePage() {

    const reduceMotion = useReducedMotion()

    const [url, setUrl] = React.useState("")
    const [preview, setPreview] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [result, setResult] = React.useState<ShortenResponse | null>(null)
    const [error, setError] = React.useState<unknown>(null)

    const [warning, setWarning] = React.useState<string | null>(null)

    const [touched, setTouched] = React.useState(false)
    const urlValidation = React.useMemo(() => validateUrl(url), [url])
    const urlError = urlValidation.ok ? null : urlValidation.message

    useEffect(() => {
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
            const data = await shortenUrl({url: normalizeUrlCandidate(url), preview})
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
        setWarning(null)
        setTouched(false)
        const el = document.getElementById("url") as HTMLInputElement | null
        el?.focus()
    }

    const enter = reduceMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
        : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 6 } }

    return (
        <div className="space-y-6">
            {/* Hero */}
            <section className="space-y-4">
                <div className="mb-10 text-center space-y-4">
                    <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl ">
                        Ship short links, <br className="hidden sm:block"/>
                        <span
                            className="bg-linear-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-pink-500 dark:via-purple-600 dark:to-violet-600">
                            broaden your reach<a href={"https://hsawal-portfolio.vercel.app/"}>.</a>
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg dark:text-slate-400 text-slate-800">
                        Transform long, ugly links into short, reusable URLs. Built with high-performance APIs,
                        defensive security, and fast redirects.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={"outline"}
                           className="animate-bounce border px-3 py-1 text-xs font-medium
                           bg-white/50 text-purple-700 shadow-sm
                           dark:bg-slate-900/10 dark:text-purple-400/80 dark:shadow-sm dark:shadow-slate-50/10
                           transition-transform hover:scale-105">
                        <Sparkles className="h-3.5 w-3.5 "/>
                        Vercel Demo
                    </Badge>
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        React + Vite
                    </Badge>
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        Responsive + dark mode
                    </Badge>
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        Motion Animation
                    </Badge>

                </div>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Spring
                        Boot 3</Badge>
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Postgres
                        + Flyway</Badge>
                    <Badge variant={"outline"}
                           className="bg-slate-100  text-slate-600  hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Caffeine
                        cache</Badge>
                </div>
            </section>

            {/* System warning banners */}
            <AnimatePresence>
                {warning ? (
                    <motion.div key="warning" {...enter} transition={{ duration: 0.22, ease: "easeOut" }}>
                        <Banner
                            variant="warning"
                            title="Taking longer than usual"
                            detail={warning}
                            onDismiss={() => setWarning(null)}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Error (server/network) */}
            <AnimatePresence>
                {error ?  (
                        <motion.div key="system-error" {...enter} transition={{ duration: 0.22, ease: "easeOut" }}>
                            <ErrorBanner error={error} onDismiss={() => setError(null)}/>
                        </motion.div>
                ) : null}
            </AnimatePresence>

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
            <AnimatePresence>
                {result ? (
                    <motion.div key="result" {...enter} transition={{ duration: 0.22, ease: "easeInOut" }}>
                        <ResultCard result={result}/>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}