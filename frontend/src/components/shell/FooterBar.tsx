import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function FooterBar() {
    const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer")

    return (
        <footer className="border-t">
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Built with Spring Boot 3 + React + shadcn/ui
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={() => open("http://localhost:8080/swagger-ui/index.html#/")}
                            title="Backend Swagger (same host)"
                        >
                            Swagger
                        </Button>
                        <Button type="button" variant="outline" className="h-9" onClick={() => open("#")}>
                            Docs
                        </Button>
                        <Button type="button" variant="outline" className="h-9" onClick={() => open("#")}>
                            GitHub
                        </Button>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="text-xs text-muted-foreground">
                    Tip: When using Cloudflare Tunnel + Vercel, keep <code>VITE_API_BASE_URL</code> and backend{" "}
                    <code>SHORTENER_PUBLIC_BASE_URL</code> in sync.
                </div>
            </div>
        </footer>
    )
}