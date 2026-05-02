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
    phone?: string | null
    address_zip?: string | null
    address_state?: string | null
    address_city?: string | null
    address_street?: string | null
    address_number?: string | null
    address_neighborhood?: string | null
    logo_url?: string | null
    tax_regime?: string | null
    cnae?: string | null
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
  warehouse_location?: string | null
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

export async function updateCategory(categoryId: string, payload: unknown) {
  return apiFetch<Category>(`/categories/${categoryId}`, {
    method: "PATCH",
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

export async function updateProduct(productId: string, payload: unknown) {
  return apiFetch<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function listBalances() {
  return apiFetch<StockBalance[]>("/stock/balances")
}

export async function updateWarehouse(warehouseId: string, payload: unknown) {
  return apiFetch<{ id: string; name: string; location?: string | null; is_default: boolean }>(`/stock/warehouses/${warehouseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
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

export async function updateSale(saleId: string, payload: unknown) {
  return apiFetch<SaleDetail>(`/sales/${saleId}`, {
    method: "PATCH",
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

export async function updatePurchase(purchaseId: string, payload: unknown) {
  return apiFetch<PurchaseDetail>(`/purchases/${purchaseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

// ── Finance types ──────────────────────────────────────────────────────────────

export type FinancialAccount = {
  id: string
  name: string
  type: "bank" | "cash" | "digital"
  balance: string
  bank_name: string | null
  agency: string | null
  account_number: string | null
  notes: string | null
  is_active: boolean
}

export type FinancialCategory = {
  id: string
  name: string
  type: "income" | "expense"
  parent_id: string | null
  is_active: boolean
}

export type FinancialTransaction = {
  id: string
  account_id: string
  account_name: string
  category_id: string | null
  category_name: string | null
  person_id: string | null
  person_name: string | null
  type: "income" | "expense"
  amount: string
  date: string
  description: string
  reconciled: boolean
  notes: string | null
}

export type Installment = {
  id: string
  person_id: string | null
  person_name: string | null
  type: "income" | "expense"
  description: string
  total_amount: string
  paid_amount: string
  remaining_amount: string
  due_date: string
  status: "open" | "partial" | "paid" | "overdue" | "cancelled"
  notes: string | null
}

export type FinancialSummary = {
  total_accounts_balance: string
  receivables_open: string
  payables_open: string
  overdue_receivables: string
  overdue_payables: string
  income_month: string
  expense_month: string
  net_month: string
}

export type CashFlowEntry = {
  date: string
  income: string
  expense: string
  balance: string
}

export type CashFlow = {
  entries: CashFlowEntry[]
  total_income: string
  total_expense: string
  net: string
}

// ── Finance API ────────────────────────────────────────────────────────────────

export async function getFinancialSummary() {
  return apiFetch<FinancialSummary>("/finance/summary")
}

export async function getCashFlow(dateFrom: string, dateTo: string) {
  return apiFetch<CashFlow>(`/finance/cashflow?date_from=${dateFrom}&date_to=${dateTo}`)
}

export async function listFinancialAccounts() {
  return apiFetch<FinancialAccount[]>("/finance/accounts")
}

export async function createFinancialAccount(payload: unknown) {
  return apiFetch<FinancialAccount>("/finance/accounts", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateFinancialAccount(id: string, payload: unknown) {
  return apiFetch<FinancialAccount>(`/finance/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function listFinancialCategories() {
  return apiFetch<FinancialCategory[]>("/finance/categories")
}

export async function createFinancialCategory(payload: unknown) {
  return apiFetch<FinancialCategory>("/finance/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listTransactions(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<FinancialTransaction[]>(`/finance/transactions${qs}`)
}

export async function createTransaction(payload: unknown) {
  return apiFetch<FinancialTransaction>("/finance/transactions", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateTransaction(id: string, payload: unknown) {
  return apiFetch<FinancialTransaction>(`/finance/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function listReceivables(statusFilter?: string) {
  const qs = statusFilter ? `?status=${statusFilter}` : ""
  return apiFetch<Installment[]>(`/finance/receivables${qs}`)
}

export async function createReceivable(payload: unknown) {
  return apiFetch<Installment>("/finance/receivables", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function payReceivable(id: string, payload: unknown) {
  return apiFetch<Installment>(`/finance/receivables/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function listPayables(statusFilter?: string) {
  const qs = statusFilter ? `?status=${statusFilter}` : ""
  return apiFetch<Installment[]>(`/finance/payables${qs}`)
}

export async function createPayable(payload: unknown) {
  return apiFetch<Installment>("/finance/payables", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function payPayable(id: string, payload: unknown) {
  return apiFetch<Installment>(`/finance/payables/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateInstallment(id: string, payload: unknown) {
  return apiFetch<Installment>(`/finance/installments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

// ── Fiscal, Audit, Permissions and Reports ───────────────────────────────────

export type FiscalDocument = {
  id: string
  company_id: string
  sale_id: string
  user_id: string
  model: string
  series: string
  number: number
  environment: "homologation"
  status: string
  access_key: string
  protocol: string | null
  sefaz_endpoint: string | null
  total_amount: string
  issued_at: string
  authorized_at: string | null
  response_message: string | null
  xml_content?: string
}

export type AuditLog = {
  id: string
  company_id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  note: string | null
  created_at: string
}

export type PermissionDefinition = {
  code: string
  module: string
  description: string
}

export type RolePermission = {
  id: string
  name: string
  description: string | null
  permissions: string[]
  is_system: boolean
}

export type SalesReportItem = {
  id: string
  label: string
  quantity: string
  total: string
}

export type AdvancedSalesReport = {
  total_revenue: string
  total_sales: number
  average_ticket: string
  top_products: SalesReportItem[]
  top_customers: SalesReportItem[]
}

export type AdvancedStockReport = {
  total_products: number
  low_stock_count: number
  items: Array<{
    product_id: string
    product_name: string
    sku: string
    warehouse_id: string
    warehouse_name: string
    quantity: string
    min_stock: string
    status: "ok" | "low_stock"
  }>
}

export type AdvancedFinancialReport = {
  income: string
  expense: string
  net: string
  receivables_open: string
  payables_open: string
}

export async function listFiscalDocuments() {
  return apiFetch<FiscalDocument[]>("/fiscal/invoices")
}

export async function issueHomologationNfe(saleId: string) {
  return apiFetch<FiscalDocument>(`/fiscal/nfe/homologation/sales/${saleId}`, {
    method: "POST",
    body: JSON.stringify({ environment: "homologation" })
  })
}

export async function listAuditLogs(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<AuditLog[]>(`/audit/logs${qs}`)
}

export async function listPermissions() {
  return apiFetch<PermissionDefinition[]>("/permissions")
}

export async function listRolePermissions() {
  return apiFetch<RolePermission[]>("/permissions/roles")
}

export async function updateRolePermissions(roleId: string, permissions: string[]) {
  return apiFetch<RolePermission>(`/permissions/roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify({ permissions })
  })
}

export async function getAdvancedSalesReport() {
  return apiFetch<AdvancedSalesReport>("/reports/advanced/sales")
}

export async function getAdvancedStockReport() {
  return apiFetch<AdvancedStockReport>("/reports/advanced/stock")
}

export async function getAdvancedFinancialReport() {
  return apiFetch<AdvancedFinancialReport>("/reports/advanced/financial")
}
