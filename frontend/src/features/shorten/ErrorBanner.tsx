import {Banner} from "@/features/feedback/Banner.tsx";
import {ApiError} from "@/lib/api"

type Props = {
    error: unknown
    onDismiss?: () => void
}

function toBannerModel(error: unknown): {
    title: string
    detail?: string
    requestId?: string
} {
    if (error instanceof ApiError) {
        if (error.kind === "network") {
            return {
                title: "Backend service is unavailable",
                detail: "Please try again in a few mins.",
            }
        }

        const requestIdRaw = error.problem?.properties?.requestId
        const requestId = typeof requestIdRaw === "string" ? requestIdRaw : undefined

        return {
            title: error.problem?.title ?? "Request failed",
            detail: error.problem?.detail ?? error.message,
            requestId,
        }
    }

    if (error instanceof Error) {
        return {title: "Something went wrong", detail: error.message}
    }

    return {title: "Something went wrong"}
}

export function ErrorBanner({error, onDismiss}: Props) {
    const msg = toBannerModel(error)

    return (
        <Banner
            variant="error"
            title={msg.title}
            detail={msg.detail}
            requestId={msg.requestId}
            onDismiss={onDismiss}
        />
    )
}