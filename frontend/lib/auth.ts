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
