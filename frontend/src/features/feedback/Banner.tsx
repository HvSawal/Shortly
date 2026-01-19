import * as React from "react"
import {AlertTriangle, CheckCircle2, Info, XCircle,} from "lucide-react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"

export type BannerVariant = "error" | "warning" | "info" | "success"

export type BannerAction = {
    label: string
    onClick: () => void
    variant?: "default" | "secondary" | "outline" | "ghost"
}

type Props = {
    variant: BannerVariant
    title: string
    detail?: string
    requestId?: string
    onDismiss?: () => void
    action?: BannerAction
    className?: string
    icon?: React.ReactNode
}

const STYLES: Record<BannerVariant, { root: string; icon: string }> = {
    error: {
        root: "border-destructive/35 bg-destructive/10",
        icon: "text-destructive",
    },
    warning: {
        root: "border-yellow-500/35 bg-yellow-500/10",
        icon: "text-yellow-600 dark:text-yellow-400",
    },
    info: {
        root: "border-sky-500/30 bg-sky-500/10",
        icon: "text-sky-600 dark:text-sky-400",
    },
    success: {
        root: "border-emerald-500/30 bg-emerald-500/10",
        icon: "text-emerald-600 dark:text-emerald-400",
    },
}

function defaultIcon(variant: BannerVariant) {
    switch (variant) {
        case "error":
            return <XCircle className="h-5 w-5 text-red-500/80"/>
        case "warning":
            return <AlertTriangle className="h-5 w-5"/>
        case "info":
            return <Info className="h-5 w-5"/>
        case "success":
            return <CheckCircle2 className="h-5 w-5"/>
    }
}

export function Banner({
                           variant,
                           title,
                           detail,
                           requestId,
                           onDismiss,
                           action,
                           className,
                           icon,
                       }: Props) {
    const styles = STYLES[variant]

    return (
        <div
            role={variant === "error" ? "alert" : "status"}
            className={cn(
                "rounded-2xl border p-4 shadow-sm",
                styles.root,
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <div className={cn("mt-0.5", styles.icon)}>
                        {icon ?? defaultIcon(variant)}
                    </div>

                    <div className="space-y-1">
                        <div className="text-sm font-semibold">{title}</div>
                        {detail ? (
                            <div className="text-sm text-muted-foreground">{detail}</div>
                        ) : null}

                        {requestId ? (
                            <div className="text-xs text-muted-foreground">
                                requestId: <span className="font-mono">{requestId}</span>
                            </div>
                        ) : null}

                        {action ? (
                            <div className="pt-1">
                                <Button
                                    type="button"
                                    variant={action.variant ?? "outline"}
                                    className="h-9"
                                    onClick={action.onClick}
                                >
                                    {action.label}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>

                {onDismiss ? (
                    <Button type="button" variant="ghost" className="h-9" onClick={onDismiss}>
                        Dismiss
                    </Button>
                ) : null}
            </div>
        </div>
    )
}