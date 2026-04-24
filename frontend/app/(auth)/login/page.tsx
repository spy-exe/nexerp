"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <Card className="w-full max-w-xl p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Acesso</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Entrar no NexERP</h1>
      <p className="mt-3 text-sm text-slate-500">Use o usuário administrador criado no cadastro inicial da empresa.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label>E-mail</Label>
          <Input placeholder="admin@empresa.com.br" {...register("email")} />
          {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" placeholder="Sua senha" {...register("password")} />
          {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <Link href="/forgot-password" className="text-teal-700 hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/register" className="text-teal-700 hover:underline">
          Criar empresa
        </Link>
      </div>
    </Card>
  )
}
