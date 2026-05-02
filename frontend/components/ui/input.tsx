import * as React from "react"

import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-[#f0f0f0] outline-none transition-all duration-150 placeholder:text-[#555555] focus:border-[#00ff88]/40 focus:ring-2 focus:ring-[#00ff88]/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
