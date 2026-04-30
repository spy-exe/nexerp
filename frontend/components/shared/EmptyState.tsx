import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <svg aria-hidden="true" className="h-20 w-20 text-blue-100" viewBox="0 0 120 120" fill="none">
        <rect x="24" y="30" width="72" height="60" rx="12" fill="currentColor" />
        <path d="M39 48h42M39 60h30M39 72h20" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <h3 className="mt-4 font-display text-lg font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
