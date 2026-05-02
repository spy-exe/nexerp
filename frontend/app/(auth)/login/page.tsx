"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/auth"
import { loginSchema } from "@/lib/validations"
import { useAuthStore } from "@/stores/auth-store"

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  })

  async function onSubmit(values: LoginValues) {
    try {
      const session = await login(values)
      setSession(session)
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar."
      setError("root", { message })
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo mobile */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00ff88]">
          <span className="text-xs font-bold text-[#0a0a0a]">N</span>
        </div>
        <span className="font-display font-semibold text-[#f0f0f0]">NexERP</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Acesso</p>
      <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#f0f0f0]">
        Entrar na plataforma
      </h1>
      <p className="mt-2 text-sm text-[#888888]">
        Use o e-mail do administrador cadastrado na empresa.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@empresa.com.br"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#00d4ff] transition-colors hover:text-[#00b8e6]"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.password.message}</p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/10 px-4 py-3 text-sm text-[#ff4444]">
            {errors.root.message}
          </div>
        )}

        <Button className="mt-2 w-full" disabled={isSubmitting} isLoading={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#888888]">
        Não tem conta?{" "}
        <Link href="/register" className="text-[#00d4ff] transition-colors hover:text-[#00b8e6]">
          Criar empresa grátis
        </Link>
      </p>
    </div>
  )
}
