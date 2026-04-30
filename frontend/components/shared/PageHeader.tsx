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
        {eyebrow && <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
