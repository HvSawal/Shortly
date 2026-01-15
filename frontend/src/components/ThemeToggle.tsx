import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"
const KEY = "url-shortener-theme"

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(KEY, theme)
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light")

    useEffect(() => {
        const saved = localStorage.getItem(KEY) as Theme | null
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        const initial: Theme = saved ?? (prefersDark ? "dark" : "light")
        applyTheme(initial)
        setTheme(initial)
    }, [])

    function toggle() {
        const next: Theme = theme === "dark" ? "light" : "dark"
        applyTheme(next)
        setTheme(next)
    }

    return (
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
    )
}
