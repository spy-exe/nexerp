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
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50",
          size === "md"   && "h-9 px-4",
          size === "sm"   && "h-8 px-3 text-xs",
          size === "icon" && "h-9 w-9 p-0",
          variant === "primary" &&
            "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e87a] focus-visible:ring-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:shadow-[0_0_32px_rgba(0,255,136,0.38)]",
          variant === "ghost" &&
            "text-[#f0f0f0] hover:bg-white/5",
          variant === "outline" &&
            "border border-white/10 bg-transparent text-[#f0f0f0] hover:bg-white/5 hover:border-white/20",
          variant === "danger" &&
            "bg-[#ff4444] text-white hover:bg-[#e63939] focus-visible:ring-[#ff4444]",
          variant === "success" &&
            "bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00e87a] focus-visible:ring-[#00ff88]",
          variant === "warning" &&
            "bg-[#ffd700] text-[#0a0a0a] hover:bg-[#e6c200] focus-visible:ring-[#ffd700]",
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
