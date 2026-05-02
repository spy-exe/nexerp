import * as React from "react"

import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-lg border border-[color:var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--fg)] outline-none transition-all duration-150 placeholder:text-[var(--fg-soft)] focus:border-[#00ff88]/40 focus:ring-2 focus:ring-[#00ff88]/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
