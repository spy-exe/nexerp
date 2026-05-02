"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & {
  id: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variants: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  error: { icon: XCircle, className: "border-red-200 bg-red-50 text-red-900" },
  info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-900" },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: (input) => {
        const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        const item = { ...input, id, variant: input.variant ?? "info" }
        setItems((current) => [...current, item])
        window.setTimeout(() => {
          setItems((current) => current.filter((toast) => toast.id !== id))
        }, 3_000)
      },
    }),
    []
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
            {items.map((item) => {
              const variant = variants[item.variant]
              const Icon = variant.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    "animate-[toast-in_120ms_ease-out] rounded-2xl border px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)]",
                    variant.className
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.description && <p className="mt-1 text-xs opacity-80">{item.description}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.")
  }
  return context
}
