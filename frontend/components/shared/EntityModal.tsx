"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EntityModalProps = {
  open: boolean
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  confirmLabel?: string
  isConfirming?: boolean
  onClose: () => void
  onConfirm?: () => void
}

export function EntityModal({
  open,
  title,
  description,
  children,
  footer,
  confirmLabel = "Confirmar",
  isConfirming,
  onClose,
  onConfirm,
}: EntityModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div
        className={cn(
          "w-full max-w-xl animate-[modal-in_120ms_ease-out] rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <Button aria-label="Fechar modal" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          {footer ?? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {onConfirm && (
                <Button isLoading={isConfirming} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
