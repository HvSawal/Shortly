import * as React from "react"
import {Clipboard, Eye, EyeOff, Loader2, Wand2} from "lucide-react"
import {toast} from "sonner"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Switch} from "@/components/ui/switch"
import {cn} from "@/lib/utils.ts";

type Props = {
    url: string
    setUrl: (v: string) => void
    preview: boolean
    setPreview: (v: boolean) => void
    isLoading: boolean
    onSubmit: () => void
    onClear?: () => void

    touched: boolean
    setTouched: (v: boolean) => void
    urlError?: string | null
}

export function ShortenFormCard({
                                    url,
                                    setUrl,
                                    preview,
                                    setPreview,
                                    isLoading,
                                    onSubmit,
                                    onClear,
                                    touched,
                                    setTouched,
                                    urlError,
                                }: Props) {
    const canSubmit = url.trim().length > 0 && !isLoading;
    const showError = touched && !!urlError;
    const [popped, setPopped] = React.useState(false);

    async function onPaste() {
        try {
            const text = await navigator.clipboard.readText()
            if (!text) {
                toast.info("Clipboard is empty")
                return
            }
            setUrl(text.trim())
            setTouched(true)
            toast.success("Pasted")
        } catch {
            toast.error("Clipboard access blocked")
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault()
            if (canSubmit) onSubmit()
        }
    }

    function pop() {
        setPopped(true);
        window.setTimeout(() => setPopped(false), 200);
    }

    const urlErrorId = "url-error"

    return (
        <Card className="rounded-2xl shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">Shorten a URL</CardTitle>
                <CardDescription>
                    Paste a long link. We’ll return a clean short URL that’s easy to share.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-medium">
                        Destination URL
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="url"
                            placeholder="https://example.com/some/very/long/link"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            className="h-11"
                            autoComplete="off"
                            inputMode="url"
                            error={showError ? urlErrorId : false}
                        />
                        <Button
                            variant="pasteBtn"
                            className="group h-11 shrink-0 dark:bg-white"
                            onClick={() => { pop(); onPaste(); }}
                            disabled={isLoading}
                            title="Paste from clipboard"
                        >
                            <Clipboard className={cn("mr-2 h-4 w-4 transition-transform group-hover:rotate-[-8deg]",popped && "animate-pop")}/>
                            Paste
                        </Button>
                    </div>
                    {showError ? (
                        <p id={urlErrorId} className="text-xs text-destructive">
                            {urlError}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Tip: include the full scheme (https://).
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            {preview ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                            <span className="font-medium">Preview mode</span>
                            <span className="text-muted-foreground">
                                (optional)
                            </span>
                        </div>
                        <Switch className="
                            bg-slate-900
                            dark:bg-slate-100
                            data-[state=checked]:bg-purple-600
                            data-[state=checked]:dark:bg-purple-500
                            [&_span]:bg-slate-50
                            [&_span]:dark:bg-slate-900
                            [&_span]:border-2
                            "
                                checked={preview} onCheckedChange={setPreview} disabled={isLoading}/>
                    </div>

                    {/*<p className="text-xs text-muted-foreground">*/}
                    {/*    Tip: include the full scheme (https://). We’ll validate input and return a ProblemDetails error*/}
                    {/*    if invalid.*/}
                    {/*</p>*/}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                        type="button"
                        variant={"shorten"}
                        className="group h-11 w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.95]"
                        onClick={() => {
                            // mark touched so error shows if invalid
                            setTouched(true)
                            if (canSubmit) onSubmit()
                        }}
                        disabled={!canSubmit}
                    >
                        {/*<Wand2 className="mr-2 h-4 w-4"/>*/}
                        {/*{isLoading ? "Shortening…" : "Shorten"}*/}
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Shortening…
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-105" />
                                Shorten
                            </>
                        )}
                    </Button>

                    {onClear ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full sm:w-auto"
                            onClick={onClear}
                            disabled={isLoading && url.trim().length === 0}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}
