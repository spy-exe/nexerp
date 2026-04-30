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
  [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
  [
    { href: "/customers", label: "Clientes", icon: Users },
    { href: "/suppliers", label: "Fornecedores", icon: Truck },
    { href: "/sales", label: "Vendas", icon: ReceiptText },
    { href: "/purchases", label: "Compras", icon: ShoppingBasket },
    { href: "/pos", label: "PDV", icon: ShoppingCart },
  ],
  [
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/categories", label: "Categorias", icon: ListTree },
    { href: "/stock", label: "Estoque", icon: Boxes },
  ],
  [
    { href: "/finance", label: "Financeiro", icon: Wallet },
    { href: "/fiscal", label: "Fiscal", icon: FileText },
    { href: "/reports", label: "Relatórios", icon: ChartColumn },
  ],
  [
    { href: "/onboarding", label: "Onboarding", icon: ChartColumn },
    { href: "/settings/permissions", label: "Permissões", icon: ShieldCheck },
    { href: "/settings", label: "Configurações", icon: Settings2 },
  ],
]

export function AppSidebar({ pathname }: { pathname: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 text-slate-700 lg:flex">
      <div className="mb-6 px-2">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-blue-700">NexERP</p>
        <h1 className="font-display mt-3 text-xl font-semibold text-slate-950">Operação ERP</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Comercial, financeiro, fiscal e governança multi-tenant.</p>
      </div>
      <nav className="space-y-4">
        {items.map((group, groupIndex) => (
          <div key={groupIndex} className={cn(groupIndex > 0 && "border-t border-slate-100 pt-4")}>
            <div className="space-y-1">
              {group.map((item) => {
                const Icon = item.icon
                const active = item.href === "/settings" ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onFocus={() => prefetchAppRoute(router, queryClient, item.href)}
                    onMouseEnter={() => prefetchAppRoute(router, queryClient, item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition",
                      active
                        ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                        : "border-transparent text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
