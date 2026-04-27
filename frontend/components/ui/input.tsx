import * as React from "react"

import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
