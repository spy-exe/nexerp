"use client"

import { EntityModal } from "@/components/shared/EntityModal"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  isConfirming?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  isConfirming,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <EntityModal
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      isConfirming={isConfirming}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-slate-600">Esta ação pode alterar a operação visível para todos os usuários da empresa.</p>
    </EntityModal>
  )
}
