import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline"
  size?: "md" | "sm" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
          size === "md" && "h-11 px-5",
          size === "sm" && "h-9 px-4",
          size === "icon" && "h-10 w-10 p-0",
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
