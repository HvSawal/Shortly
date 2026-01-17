import {Button} from "@/components/ui/button"

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
                        <Button type="button" variant="outline" className="h-9"
                                onClick={() => open("/docs/performance")}>
                            Docs
                        </Button>
                        <Button type="button" variant="outline" className="h-9"
                                onClick={() => open("https://github.com/HvSawal/Shortly")}>
                            GitHub
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    )
}