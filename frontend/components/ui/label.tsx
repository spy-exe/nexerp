import { cn } from "@/lib/utils"

export function Label({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium text-[var(--fg-muted)]", className)}
    >
      {children}
    </label>
  )
}
