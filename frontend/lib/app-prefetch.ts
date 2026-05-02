"use client"

import type { QueryClient, QueryKey } from "@tanstack/react-query"

import {
  getAdvancedFinancialReport,
  getAdvancedSalesReport,
  getAdvancedStockReport,
  getDashboardOverview,
  getFinancialSummary,
  listBalances,
  listCategories,
  listCustomers,
  listFinancialAccounts,
  listFinancialCategories,
  listFiscalDocuments,
  listPayables,
  listPermissions,
  listProducts,
  listPurchases,
  listReceivables,
  listRolePermissions,
  listSales,
  listSuppliers,
} from "@/lib/auth"

type PrefetchRouter = {
  prefetch: (href: string) => void
}

type QueryFn<T> = () => Promise<T>

const PREFETCH_STALE_TIME = 120_000
const PREFETCH_DELAY_MS = 140

const warmRoutes = [
  "/dashboard",
  "/customers",
  "/suppliers",
  "/sales",
  "/purchases",
  "/pos",
  "/products",
  "/categories",
  "/stock",
  "/finance",
  "/fiscal",
  "/reports",
] as const

const routePrefetchers: Record<string, (queryClient: QueryClient) => void> = {
  "/dashboard": (queryClient) => {
    prefetchQuery(queryClient, ["dashboard-overview"], getDashboardOverview)
  },
  "/customers": (queryClient) => {
    prefetchQuery(queryClient, ["customers"], listCustomers)
  },
  "/suppliers": (queryClient) => {
    prefetchQuery(queryClient, ["suppliers"], listSuppliers)
  },
  "/sales": (queryClient) => {
    prefetchQuery(queryClient, ["products"], listProducts)
    prefetchQuery(queryClient, ["customers"], listCustomers)
    prefetchQuery(queryClient, ["sales"], listSales)
  },
  "/purchases": (queryClient) => {
    prefetchQuery(queryClient, ["products"], listProducts)
    prefetchQuery(queryClient, ["suppliers"], listSuppliers)
    prefetchQuery(queryClient, ["purchases"], listPurchases)
  },
  "/pos": (queryClient) => {
    prefetchQuery(queryClient, ["products"], listProducts)
    prefetchQuery(queryClient, ["customers"], listCustomers)
    prefetchQuery(queryClient, ["sales"], listSales)
  },
  "/products": (queryClient) => {
    prefetchQuery(queryClient, ["products"], listProducts)
    prefetchQuery(queryClient, ["categories"], listCategories)
  },
  "/categories": (queryClient) => {
    prefetchQuery(queryClient, ["categories"], listCategories)
  },
  "/stock": (queryClient) => {
    prefetchQuery(queryClient, ["balances"], listBalances)
    prefetchQuery(queryClient, ["products"], listProducts)
  },
  "/finance": (queryClient) => {
    prefetchQuery(queryClient, ["finance-summary"], getFinancialSummary)
    prefetchQuery(queryClient, ["finance-accounts"], listFinancialAccounts)
    prefetchQuery(queryClient, ["finance-categories"], listFinancialCategories)
    prefetchQuery(queryClient, ["finance-receivables"], () => listReceivables())
    prefetchQuery(queryClient, ["finance-payables"], () => listPayables())
  },
  "/fiscal": (queryClient) => {
    prefetchQuery(queryClient, ["sales"], listSales)
    prefetchQuery(queryClient, ["fiscal-documents"], listFiscalDocuments)
  },
  "/reports": (queryClient) => {
    prefetchQuery(queryClient, ["advanced-sales-report"], getAdvancedSalesReport)
    prefetchQuery(queryClient, ["advanced-stock-report"], getAdvancedStockReport)
    prefetchQuery(queryClient, ["advanced-financial-report"], getAdvancedFinancialReport)
  },
  "/settings/permissions": (queryClient) => {
    prefetchQuery(queryClient, ["permissions"], listPermissions)
    prefetchQuery(queryClient, ["role-permissions"], listRolePermissions)
  },
}

export function prefetchAppRoute(router: PrefetchRouter, queryClient: QueryClient, href: string) {
  router.prefetch(href)
  routePrefetchers[href]?.(queryClient)
}

export function warmAppNavigation(router: PrefetchRouter, queryClient: QueryClient) {
  if (typeof window === "undefined") {
    return undefined
  }

  let cancelled = false
  let timeoutId: number | undefined
  let routeIndex = 0

  const warmNext = () => {
    if (cancelled || routeIndex >= warmRoutes.length) {
      return
    }
    prefetchAppRoute(router, queryClient, warmRoutes[routeIndex])
    routeIndex += 1
    timeoutId = window.setTimeout(warmNext, PREFETCH_DELAY_MS)
  }

  const scheduleWarmup = () => {
    timeoutId = window.setTimeout(warmNext, PREFETCH_DELAY_MS)
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(scheduleWarmup, { timeout: 2_000 })
  } else {
    scheduleWarmup()
  }

  return () => {
    cancelled = true
    if (timeoutId) {
      window.clearTimeout(timeoutId)
    }
  }
}

function prefetchQuery<T>(queryClient: QueryClient, queryKey: QueryKey, queryFn: QueryFn<T>) {
  void queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: PREFETCH_STALE_TIME,
  })
}
