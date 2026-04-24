"use client"

import { useAuthStore } from "@/stores/auth-store"

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
export const API_BASE_URL = `${rawApiUrl.replace(/\/$/, "")}/api/v1`

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {})
    }
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: string }).detail)
        : "Erro inesperado na API."
    throw new ApiError(detail, response.status, data)
  }

  return data as T
}
