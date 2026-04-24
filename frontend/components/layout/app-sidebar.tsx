"use client"

import Link from "next/link"
import {
  Boxes,
  ChartColumn,
  LayoutDashboard,
  ListTree,
  Package,
  ReceiptText,
  Settings2,
  ShoppingBasket,
  ShoppingCart,
  Truck,
  Users
} from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/suppliers", label: "Fornecedores", icon: Truck },
  { href: "/sales", label: "Vendas", icon: ReceiptText },
  { href: "/purchases", label: "Compras", icon: ShoppingBasket },
  { href: "/pos", label: "PDV", icon: ShoppingCart },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/categories", label: "Categorias", icon: ListTree },
  { href: "/stock", label: "Estoque", icon: Boxes },
  { href: "/onboarding", label: "Onboarding", icon: ChartColumn },
  { href: "/settings", label: "Configurações", icon: Settings2 }
]

export function AppSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-white/50 bg-[#0f172a] px-6 py-8 text-white lg:flex">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-200/80">NexERP</p>
        <h1 className="mt-3 text-2xl font-semibold">Core Comercial</h1>
        <p className="mt-2 text-sm text-slate-300">Clientes, fornecedores, vendas, compras, PDV e inteligência operacional.</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
