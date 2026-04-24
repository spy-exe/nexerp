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
import { register as registerCompany } from "@/lib/auth"
import { registerSchema } from "@/lib/validations"
import { useAuthStore } from "@/stores/auth-store"

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  })

  async function onSubmit(values: RegisterValues) {
    try {
      const session = await registerCompany(values)
      setSession(session)
      router.push("/onboarding")
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Falha ao cadastrar empresa."
      })
    }
  }

  return (
    <Card className="w-full max-w-3xl p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Onboarding Inicial</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Cadastrar empresa e administrador</h1>
      <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label>Nome fantasia</Label>
          <Input {...register("company.trade_name")} />
          {errors.company?.trade_name && <p className="mt-2 text-sm text-rose-600">{errors.company.trade_name.message}</p>}
        </div>
        <div>
          <Label>Razão social</Label>
          <Input {...register("company.legal_name")} />
          {errors.company?.legal_name && <p className="mt-2 text-sm text-rose-600">{errors.company.legal_name.message}</p>}
        </div>
        <div>
          <Label>CNPJ</Label>
          <Input placeholder="00000000000000" {...register("company.cnpj")} />
          {errors.company?.cnpj && <p className="mt-2 text-sm text-rose-600">{errors.company.cnpj.message}</p>}
        </div>
        <div>
          <Label>E-mail da empresa</Label>
          <Input {...register("company.email")} />
          {errors.company?.email && <p className="mt-2 text-sm text-rose-600">{errors.company.email.message}</p>}
        </div>
        <div>
          <Label>Telefone</Label>
          <Input {...register("company.phone")} />
        </div>
        <div>
          <Label>Nome do administrador</Label>
          <Input {...register("user.name")} />
          {errors.user?.name && <p className="mt-2 text-sm text-rose-600">{errors.user.name.message}</p>}
        </div>
        <div>
          <Label>E-mail do administrador</Label>
          <Input {...register("user.email")} />
          {errors.user?.email && <p className="mt-2 text-sm text-rose-600">{errors.user.email.message}</p>}
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" {...register("user.password")} />
          {errors.user?.password && <p className="mt-2 text-sm text-rose-600">{errors.user.password.message}</p>}
        </div>
        {errors.root && <p className="md:col-span-2 text-sm text-rose-600">{errors.root.message}</p>}
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
          <Link href="/login" className="text-sm text-teal-700 hover:underline">
            Já tenho acesso
          </Link>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando ambiente..." : "Criar empresa"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
