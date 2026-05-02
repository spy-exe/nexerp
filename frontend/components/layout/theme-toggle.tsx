"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = window.localStorage.getItem("nexerp-theme")
    const initialTheme = saved === "light" ? "light" : "dark"
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    window.localStorage.setItem("nexerp-theme", nextTheme)
    applyTheme(nextTheme)
  }

  const Icon = theme === "dark" ? Sun : Moon
  const label = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} title={label} aria-label={label}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}
