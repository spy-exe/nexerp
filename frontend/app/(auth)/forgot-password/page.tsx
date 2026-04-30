"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/auth"
import { forgotPasswordSchema } from "@/lib/validations"

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      const response = await forgotPassword(values)
      setError("root", {
        type: "manual",
        message: response.debug_token
          ? `${response.message} Token de desenvolvimento: ${response.debug_token}`
          : response.message
      })
    } catch (error) {
      setError("root", {
        type: "manual",
        message: error instanceof Error ? error.message : "Falha ao solicitar reset."
      })
    }
  }

  return (
    <Card className="w-full max-w-xl p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Recuperação</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Solicitar redefinição de senha</h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label>E-mail</Label>
          <Input {...register("email")} />
          {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>}
        </div>
        {errors.root && <p className="text-sm text-slate-600">{errors.root.message}</p>}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Solicitando..." : "Enviar instruções"}
        </Button>
      </form>
      <div className="mt-6">
        <Link href="/login" className="text-sm text-blue-700 hover:underline">
          Voltar para login
        </Link>
      </div>
    </Card>
  )
}
