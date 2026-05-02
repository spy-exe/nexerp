import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] text-[var(--fg)]",
        className
      )}
      {...props}
    />
  )
}
