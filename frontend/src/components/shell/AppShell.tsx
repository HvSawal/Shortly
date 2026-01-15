import * as React from "react"
import {HeaderBar} from "@/components/shell/HeaderBar"
import {FooterBar} from "@/components/shell/FooterBar"

export function AppShell({children}: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* soft background */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-24 right-[-40px] h-72 w-72 rounded-full bg-[hsl(var(--brand-2))/0.14] blur-3xl" />
                <div className="absolute -bottom-24 left-[-40px] h-72 w-72 rounded-full bg-[hsl(var(--brand))/0.12] blur-3xl" />
            </div>

            <HeaderBar/>

            <main className="mx-auto max-w-3xl px-4 py-10 sm:py-8">
                {children}
            </main>

            <FooterBar/>
        </div>
    )
}
