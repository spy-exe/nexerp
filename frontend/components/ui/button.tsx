import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "success" | "warning"
  size?: "md" | "sm" | "icon"
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, disabled, isLoading = false, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
          size === "md" && "h-9 px-4",
          size === "sm" && "h-8 px-3 text-xs",
          size === "icon" && "h-9 w-9 p-0",
          variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
          variant === "ghost" && "text-slate-700 hover:bg-slate-50",
          variant === "outline" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
          variant === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
          variant === "warning" && "bg-amber-500 text-slate-950 hover:bg-amber-600",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className={cn("h-4 w-4 animate-spin", size !== "icon" && "mr-2")} />}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
