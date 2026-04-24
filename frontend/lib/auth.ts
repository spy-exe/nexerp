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
