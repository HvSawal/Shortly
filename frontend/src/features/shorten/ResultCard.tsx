import { CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type ShortenResponse } from "@/lib/api"
import { formatIsoDateTime, truncateMiddle } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
    result: ShortenResponse
    highlight?: boolean
}

export function ResultCard({ result, highlight = false }: Props) {
    const shortUrl = result.shortUrl
    const originalUrl = result.originalUrl
    const [copied, setCopied] = useState(false)

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(shortUrl)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 900)
            toast.success("Copied short URL")
        } catch {
            toast.error("Copy failed")
        }
    }

    function onOpen() {
        window.open(shortUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <Card
            className={cn(
                "rounded-2xl shadow-sm transition-all duration-500",
                highlight &&
                "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-background shadow-lg shadow-violet-500/10 dark:ring-pink-500/30 dark:shadow-pink-500/10"
            )}
        >
            <CardHeader className="space-y-1">
                <div className="flex items-start justify-center-safe gap-3">
                    <CardTitle className="text-base">Your short link is</CardTitle>
                    <Badge variant="success" className="h-6 px-2.5 text-sm font-medium gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready
                    </Badge>
                </div>
                <CardDescription>Share it anywhere. Redirect is optimized with caching.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-3 shadow-sm dark:shadow-2xl dark:shadow-slate-50/5">
                    <div className="mt-1 break-all font-mono text-lg">{shortUrl}</div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button type="button" variant="pasteBtn" className="group h-11" onClick={onCopy}>
                            {/*Copy*/}
                            {copied ? (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            ) : (
                                <Copy className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                            )}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button type="button" variant="outline" className="group h-11" onClick={onOpen}>
                            <ExternalLink className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            Open
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="text-muted-foreground">Code</div>
                        <div className="font-mono">{result.code || "—"}</div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                        <div className="text-muted-foreground">Created</div>
                        <div>{formatIsoDateTime(result.createdAt)}</div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                        <div className="text-muted-foreground">Expires</div>
                        <div>{formatIsoDateTime(result.expiresAt)}</div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-muted-foreground">Original URL</div>
                        <div className="break-all">
                            <span className="font-mono">{truncateMiddle(originalUrl, 96)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}