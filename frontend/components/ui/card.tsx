import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-slate-900",
        className
      )}
      {...props}
    />
  )
}
