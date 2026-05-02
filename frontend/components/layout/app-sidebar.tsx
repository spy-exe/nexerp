"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Boxes,
  ChartColumn,
  ClipboardCheck,
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
  Zap
} from "lucide-react"

import { prefetchAppRoute } from "@/lib/app-prefetch"
import { cn } from "@/lib/utils"

const items = [
  [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
  ],
  [
    { href: "/customers",  label: "Clientes",     icon: Users },
    { href: "/suppliers",  label: "Fornecedores",  icon: Truck },
    { href: "/sales",      label: "Vendas",        icon: ReceiptText },
    { href: "/purchases",  label: "Compras",       icon: ShoppingBasket },
    { href: "/pos",        label: "PDV",           icon: ShoppingCart }
  ],
  [
    { href: "/products",   label: "Produtos",      icon: Package },
    { href: "/categories", label: "Categorias",    icon: ListTree },
    { href: "/stock",      label: "Estoque",       icon: Boxes }
  ],
  [
    { href: "/finance",    label: "Financeiro",    icon: Wallet },
    { href: "/fiscal",     label: "Fiscal",        icon: FileText },
    { href: "/reports",    label: "Relatórios",    icon: ChartColumn }
  ],
  [
    { href: "/onboarding",           label: "Onboarding",     icon: ClipboardCheck },
    { href: "/settings/permissions", label: "Permissões",     icon: ShieldCheck },
    { href: "/settings",             label: "Configurações",  icon: Settings2 }
  ]
]

export function AppSidebar({ pathname }: { pathname: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d0d] px-3 py-5 lg:flex">
      {/* Logo */}
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00ff88]">
          <Zap className="h-4 w-4 text-[#0a0a0a]" />
        </div>
        <span className="font-display text-base font-semibold text-[#f0f0f0]">NexERP</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto">
        {items.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={cn(groupIndex > 0 && "border-t border-white/[0.05] pt-4")}
          >
            <div className="space-y-0.5">
              {group.map((item) => {
                const Icon = item.icon
                const active =
                  item.href === "/settings"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onFocus={() => prefetchAppRoute(router, queryClient, item.href)}
                    onMouseEnter={() => prefetchAppRoute(router, queryClient, item.href)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150",
                      active
                        ? "bg-[#00ff88]/10 font-semibold text-[#00ff88]"
                        : "text-[#888888] hover:bg-white/[0.04] hover:text-[#cccccc]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-[#00ff88]" : "text-[#555555]"
                      )}
                    />
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
