"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/auth"
import { resetPasswordSchema } from "@/lib/validations"

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordTokenPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema)
  })

  async function onSubmit(values: ResetPasswordValues) {
    try {
      await resetPassword({
        token: params.token,
        new_password: values.new_password
      })
      router.push("/login")
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Falha ao redefinir senha."
      })
    }
  }

  return (
    <Card className="w-full max-w-xl p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Nova senha</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Definir nova senha</h1>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label>Nova senha</Label>
          <Input type="password" {...register("new_password")} />
          {errors.new_password && <p className="mt-2 text-sm text-rose-600">{errors.new_password.message}</p>}
        </div>
        {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Salvando..." : "Atualizar senha"}
        </Button>
      </form>
    </Card>
  )
}
