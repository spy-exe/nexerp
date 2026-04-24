"use client"

import { apiFetch } from "@/lib/api"

export type SessionPayload = {
  access_token: string
  token_type: string
  expires_in: number
  permissions: string[]
  user: {
    id: string
    company_id: string
    name: string
    email: string
    is_active: boolean
    roles: Array<{ id: string; name: string; permissions: string[] }>
  }
  company: {
    id: string
    trade_name: string
    legal_name: string
    cnpj: string
    email: string
    onboarding_completed: boolean
    timezone: string
    currency: string
  }
}

export type Product = {
  id: string
  sku: string
  name: string
  barcode?: string | null
  description?: string | null
  category_id?: string | null
  unit: string
  cost_price: string
  sale_price: string
  min_stock: string
  is_active: boolean
}

export type Category = {
  id: string
  name: string
  description?: string | null
  parent_id?: string | null
  is_active: boolean
}

export type StockBalance = {
  product_id: string
  product_name: string
  warehouse_id: string
  warehouse_name: string
  quantity: string
  min_stock: string
}

export type BusinessParty = {
  id: string
  company_id: string
  kind: "customer" | "supplier"
  person_kind: "individual" | "company"
  name: string
  email?: string | null
  phone?: string | null
  document_number: string
  state_registration?: string | null
  municipal_registration?: string | null
  address_zip?: string | null
  address_state?: string | null
  address_city?: string | null
  address_street?: string | null
  address_number?: string | null
  address_neighborhood?: string | null
  notes?: string | null
  is_active: boolean
}

export type DashboardRankingItem = {
  id: string
  label: string
  value: string
}

export type DashboardAlertItem = {
  product_id: string
  product_name: string
  quantity: string
  min_stock: string
}

export type DashboardOverview = {
  revenue_today: string
  revenue_month: string
  purchases_month: string
  average_ticket: string
  sales_count_today: number
  open_low_stock_alerts: number
  top_products: DashboardRankingItem[]
  top_customers: DashboardRankingItem[]
  low_stock_alerts: DashboardAlertItem[]
}

export type SaleItem = {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  unit: string
  quantity: string
  unit_price: string
  discount_amount: string
  total_amount: string
}

export type SalePayment = {
  id: string
  method: "cash" | "card" | "pix" | "credit"
  amount: string
  note?: string | null
}

export type SaleSummary = {
  id: string
  company_id: string
  sale_number: string
  customer_id?: string | null
  user_id: string
  warehouse_id: string
  status: string
  channel: "sales" | "pos"
  issued_at: string
  subtotal: string
  discount_amount: string
  total_amount: string
  change_amount: string
  notes?: string | null
  customer_name?: string | null
}

export type SaleDetail = SaleSummary & {
  items: SaleItem[]
  payments: SalePayment[]
}

export type PurchaseItem = {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  unit: string
  quantity: string
  unit_cost: string
  total_cost: string
}

export type PurchaseSummary = {
  id: string
  company_id: string
  purchase_number: string
  supplier_id: string
  user_id: string
  warehouse_id: string
  status: string
  issued_at: string
  subtotal: string
  total_amount: string
  notes?: string | null
  supplier_name?: string | null
}

export type PurchaseDetail = PurchaseSummary & {
  items: PurchaseItem[]
}

export async function register(payload: unknown) {
  return apiFetch<SessionPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function login(payload: unknown) {
  return apiFetch<SessionPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST"
  })
}

export async function forgotPassword(payload: unknown) {
  return apiFetch<{ message: string; debug_token?: string | null }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function resetPassword(payload: unknown) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function refreshSession() {
  return apiFetch<SessionPayload>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({})
  })
}

export async function getMe() {
  return apiFetch<{
    permissions: string[]
    user: SessionPayload["user"]
    company: SessionPayload["company"]
  }>("/auth/me")
}

export async function getCompany() {
  return apiFetch<SessionPayload["company"]>("/companies/me")
}

export async function updateOnboarding(payload: unknown) {
  return apiFetch<SessionPayload["company"]>("/companies/me/onboarding", {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function listCategories() {
  return apiFetch<Category[]>("/categories")
}

export async function createCategory(payload: unknown) {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listProducts() {
  return apiFetch<Product[]>("/products")
}

export async function createProduct(payload: unknown) {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listBalances() {
  return apiFetch<StockBalance[]>("/stock/balances")
}

export async function createMovement(payload: unknown) {
  return apiFetch("/stock/movements", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listCustomers() {
  return apiFetch<BusinessParty[]>("/customers")
}

export async function createCustomer(payload: unknown) {
  return apiFetch<BusinessParty>("/customers", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateCustomer(customerId: string, payload: unknown) {
  return apiFetch<BusinessParty>(`/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function archiveCustomer(customerId: string) {
  return apiFetch<BusinessParty>(`/customers/${customerId}/archive`, {
    method: "POST"
  })
}

export async function listSuppliers() {
  return apiFetch<BusinessParty[]>("/suppliers")
}

export async function createSupplier(payload: unknown) {
  return apiFetch<BusinessParty>("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateSupplier(supplierId: string, payload: unknown) {
  return apiFetch<BusinessParty>(`/suppliers/${supplierId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function archiveSupplier(supplierId: string) {
  return apiFetch<BusinessParty>(`/suppliers/${supplierId}/archive`, {
    method: "POST"
  })
}

export async function getDashboardOverview() {
  return apiFetch<DashboardOverview>("/dashboard/overview")
}

export async function listSales() {
  return apiFetch<SaleSummary[]>("/sales")
}

export async function getSale(saleId: string) {
  return apiFetch<SaleDetail>(`/sales/${saleId}`)
}

export async function createSale(payload: unknown) {
  return apiFetch<SaleDetail>("/sales", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listPurchases() {
  return apiFetch<PurchaseSummary[]>("/purchases")
}

export async function getPurchase(purchaseId: string) {
  return apiFetch<PurchaseDetail>(`/purchases/${purchaseId}`)
}

export async function createPurchase(payload: unknown) {
  return apiFetch<PurchaseDetail>("/purchases", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}
