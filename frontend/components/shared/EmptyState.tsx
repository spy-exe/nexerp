import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <svg aria-hidden="true" className="h-20 w-20 text-[#1a1a1a]" viewBox="0 0 120 120" fill="none">
        <rect x="24" y="30" width="72" height="60" rx="12" fill="currentColor" />
        <path d="M39 48h42M39 60h30M39 72h20" stroke="#00ff88" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <h3 className="mt-4 font-display text-lg font-semibold text-[#f0f0f0]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[#888888]">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
