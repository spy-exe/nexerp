"use client"

import { Check, Loader2, Pencil, X } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type InlineEditOption = {
  value: string
  label: string
}

type InlineEditProps = {
  value: string
  displayValue?: ReactNode
  label?: string
  type?: "text" | "number" | "date" | "select"
  options?: InlineEditOption[]
  className?: string
  disabled?: boolean
  step?: string
  min?: string
  onSave: (value: string) => Promise<void> | void
}

export function InlineEdit({
  value,
  displayValue,
  label = "Editar valor",
  type = "text",
  options = [],
  className,
  disabled,
  step,
  min,
  onSave,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const blurTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraft(value)
    }
  }, [isEditing, value])

  function cancel() {
    clearBlurTimer()
    setDraft(value)
    setIsEditing(false)
  }

  async function confirm(nextValue = draft) {
    clearBlurTimer()
    const normalized = nextValue.trim()
    if (normalized === String(value).trim()) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(normalized)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  function scheduleConfirm() {
    clearBlurTimer()
    blurTimer.current = window.setTimeout(() => {
      void confirm()
    }, 300)
  }

  function clearBlurTimer() {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
  }

  if (!isEditing) {
    return (
      <button
        aria-label={label}
        className={cn(
          "group inline-flex min-h-8 items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        disabled={disabled || isSaving}
        type="button"
        onClick={() => setIsEditing(true)}
      >
        <span>{displayValue ?? value}</span>
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
        ) : (
          <Pencil className="h-3.5 w-3.5 text-slate-400 opacity-0 transition group-hover:opacity-100" />
        )}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      {type === "select" ? (
        <select
          autoFocus
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          disabled={isSaving}
          value={draft}
          onBlur={scheduleConfirm}
          onChange={(event) => {
            setDraft(event.target.value)
            void confirm(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancel()
            }
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          autoFocus
          className="h-9 min-w-32"
          disabled={isSaving}
          min={min}
          step={step}
          type={type}
          value={draft}
          onBlur={scheduleConfirm}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancel()
            }
            if (event.key === "Enter") {
              void confirm()
            }
          }}
        />
      )}
      <Button
        aria-label="Confirmar edição"
        className="h-8 w-8 p-0"
        disabled={isSaving}
        type="button"
        variant="ghost"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => void confirm()}
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button
        aria-label="Cancelar edição"
        className="h-8 w-8 p-0"
        disabled={isSaving}
        type="button"
        variant="ghost"
        onMouseDown={(event) => event.preventDefault()}
        onClick={cancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </span>
  )
}
