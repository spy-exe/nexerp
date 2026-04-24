"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateOnboarding } from "@/lib/auth"
import { onboardingSchema } from "@/lib/validations"
import { useAuthStore } from "@/stores/auth-store"

type OnboardingValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const company = useAuthStore((state) => state.company)
  const setSession = useAuthStore((state) => state.setSession)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      phone: ""
    }
  })

  const mutation = useMutation({
    mutationFn: updateOnboarding,
    onSuccess: (updatedCompany) => {
      const currentState = useAuthStore.getState()
      if (currentState.user && currentState.accessToken) {
        setSession({
          access_token: currentState.accessToken,
          token_type: "bearer",
          expires_in: 0,
          permissions: currentState.permissions,
          user: currentState.user,
          company: updatedCompany
        })
      }
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao concluir onboarding." })
    }
  })

  async function onSubmit(values: OnboardingValues) {
    await mutation.mutateAsync(values)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7f3eb_0%,_#fbfdff_100%)] px-6 py-8">
      <Card className="mx-auto max-w-4xl p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Onboarding</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Completar dados operacionais da empresa</h1>
        <p className="mt-3 text-sm text-slate-500">
          Configure endereço, regime tributário e dados básicos para liberar a operação diária.
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Telefone</Label>
            <Input {...register("phone")} />
          </div>
          <div>
            <Label>CEP</Label>
            <Input {...register("address_zip")} />
          </div>
          <div>
            <Label>Estado</Label>
            <Input {...register("address_state")} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input {...register("address_city")} />
          </div>
          <div>
            <Label>Rua</Label>
            <Input {...register("address_street")} />
          </div>
          <div>
            <Label>Número</Label>
            <Input {...register("address_number")} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input {...register("address_neighborhood")} />
          </div>
          <div>
            <Label>Regime tributário</Label>
            <Input placeholder="Simples Nacional" {...register("tax_regime")} />
          </div>
          <div>
            <Label>CNAE</Label>
            <Input {...register("cnae")} />
          </div>
          <div>
            <Label>Moeda</Label>
            <Input defaultValue="BRL" {...register("currency")} />
          </div>
          {errors.root && <p className="md:col-span-2 text-sm text-rose-600">{errors.root.message}</p>}
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button disabled={isSubmitting || mutation.isPending} type="submit">
              {mutation.isPending ? "Salvando..." : "Concluir onboarding"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
