import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * If true -> error styling + aria-invalid
     * If string -> also provides an error message id hook (you still render message outside)
     */
    error?: boolean | string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
        const errorId = typeof error === "string" ? error : undefined
        const describedBy =
            [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined

        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background " +
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium " +
                    "placeholder:text-muted-foreground " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 " +
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "",
                    className
                )}
                aria-invalid={!!error || undefined}
                aria-describedby={describedBy}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }