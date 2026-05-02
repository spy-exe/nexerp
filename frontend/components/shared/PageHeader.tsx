import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-2xl font-bold text-[var(--fg)]">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--fg-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
