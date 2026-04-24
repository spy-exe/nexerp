import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" && "bg-primary text-primary-foreground shadow-soft hover:translate-y-[-1px]",
          variant === "ghost" && "text-foreground hover:bg-foreground/5",
          variant === "outline" && "border border-line bg-white text-foreground hover:bg-muted/40",
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
