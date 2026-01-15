import { ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type ShortenResponse } from "@/lib/api"
import { formatIsoDateTime, truncateMiddle } from "@/lib/format"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Props = {
    result: ShortenResponse
}

export function ResultCard({ result }: Props) {
    const shortUrl = result.shortUrl
    const originalUrl = result.originalUrl

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(shortUrl)
            toast.success("Copied short URL")
        } catch {
            toast.error("Copy failed")
        }
    }

    function onOpen() {
        window.open(shortUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <Card className="rounded-2xl shadow-sm">
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
            {/*<CardHeader className="space-y-1">*/}
            {/*    <div className="flex items-start justify-between gap-3">*/}
            {/*        <div>*/}
            {/*            <CardTitle className="text-base">Your short link</CardTitle>*/}
            {/*            <CardDescription>Share it anywhere. Redirect is optimized with caching.</CardDescription>*/}
            {/*        </div>*/}

            {/*        <Badge variant="secondary" className="gap-1">*/}
            {/*            <CheckCircle2 className="h-3.5 w-3.5" />*/}
            {/*            Ready*/}
            {/*        </Badge>*/}
            {/*    </div>*/}
            {/*</CardHeader>*/}

            <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-3 shadow-sm dark:shadow-2xl dark:shadow-slate-50/5">
                    {/*<div className="text-xs text-muted-foreground">Short URL</div>*/}
                    <div className="mt-1 break-all font-mono text-lg">{shortUrl}</div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button type="button" variant="pasteBtn" className="h-11" onClick={onCopy}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                        <Button type="button" variant="outline" className="h-11" onClick={onOpen}>
                            <ExternalLink className="mr-2 h-4 w-4" />
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