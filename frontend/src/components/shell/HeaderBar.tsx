import * as React from "react"
import { Link2, Moon, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

function getInitialTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "dark"
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") return saved
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function HeaderBar() {
    const [theme, setTheme] = React.useState<"light" | "dark">(() => getInitialTheme())

    React.useEffect(() => {
        const root = document.documentElement
        root.classList.toggle("dark", theme === "dark")
        localStorage.setItem("theme", theme)
    }, [theme])

    return (
        <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background shadow-sm">
                        <Link2 className="h-4 w-4" />
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-semibold tracking-tight">Shortly</div>
                        <div className="text-xs text-muted-foreground">URL Shortener</div>
                    </div>
                    <Separator orientation="vertical" className="mx-2 hidden h-6 sm:block" />
                    <div className="hidden items-center gap-2 sm:flex">
                        <Badge variant="secondary">V1</Badge>
                        <Badge variant="outline">No Auth</Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle theme"
                        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </header>
    )
}