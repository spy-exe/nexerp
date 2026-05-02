"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const frame = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return (
    <div className={cn("opacity-0 transition-opacity duration-150", visible && "opacity-100")}>
      {children}
    </div>
  )
}
