"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EntityModalProps = {
  open: boolean
  title: string
  description?: string
  children?: React.ReactNode
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-xl animate-[modal-in_120ms_ease-out] rounded-xl border border-white/10 bg-[#111111] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        )}
      >
        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#f0f0f0]">{title}</h2>
            {description && <p className="mt-1 text-sm text-[#888888]">{description}</p>}
          </div>
          <Button aria-label="Fechar modal" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
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
