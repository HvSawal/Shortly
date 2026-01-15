import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {useEffect, useState} from "react";

/**
 * Vite-friendly theme detection (no next-themes dependency).
 * Sonner supports: "light" | "dark" | "system"
 */
function getTheme(): ToasterProps["theme"] {
    if (typeof document === "undefined") return "system"
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function Toaster(props: ToasterProps) {
    const [theme, setTheme] = useState<ToasterProps["theme"]>(() => getTheme())

    useEffect(() => {
        // Watch the <html> class for dark/light changes
        const el = document.documentElement
        const obs = new MutationObserver(() => setTheme(getTheme()))
        obs.observe(el, { attributes: true, attributeFilter: ["class"] })
        return () => obs.disconnect()
    }, [])

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="h-4 w-4" />,
                info: <InfoIcon className="h-4 w-4" />,
                warning: <TriangleAlertIcon className="h-4 w-4" />,
                error: <OctagonXIcon className="h-4 w-4" />,
                loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
            }}
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}
