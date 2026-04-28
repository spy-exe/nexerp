"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Boxes,
  ChartColumn,
  FileText,
  LayoutDashboard,
  ListTree,
  Package,
  ReceiptText,
  ShieldCheck,
  Settings2,
  ShoppingBasket,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react"

import { prefetchAppRoute } from "@/lib/app-prefetch"
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
  { href: "/finance", label: "Financeiro", icon: Wallet },
  { href: "/fiscal", label: "Fiscal", icon: FileText },
  { href: "/reports", label: "Relatórios", icon: ChartColumn },
  { href: "/onboarding", label: "Onboarding", icon: ChartColumn },
  { href: "/settings/permissions", label: "Permissões", icon: ShieldCheck },
  { href: "/settings", label: "Configurações", icon: Settings2 }
]

export function AppSidebar({ pathname }: { pathname: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-white/50 bg-[#0f172a] px-6 py-8 text-white lg:flex">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-200/80">NexERP</p>
        <h1 className="mt-3 text-2xl font-semibold">Operação ERP</h1>
        <p className="mt-2 text-sm text-slate-300">Comercial, financeiro, fiscal e governança em uma base multi-tenant.</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.href === "/settings" ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onFocus={() => prefetchAppRoute(router, queryClient, item.href)}
              onMouseEnter={() => prefetchAppRoute(router, queryClient, item.href)}
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
