"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register as registerCompany } from "@/lib/auth"
import { useAuthStore } from "@/stores/auth-store"

const schema = z
  .object({
    name: z.string().min(2, "Nome obrigatório (mín. 2 caracteres)."),
    email: z.string().email("E-mail inválido."),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
      .regex(/[a-z]/, "Inclua uma letra minúscula.")
      .regex(/[0-9]/, "Inclua um número.")
      .regex(/[^\w\s]/, "Inclua um caractere especial."),
    confirmPassword: z.string(),
    company: z.string().min(2, "Nome da empresa obrigatório."),
    cnpj: z.string().optional(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Aceite os termos para continuar." })
    })
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"]
  })

type Values = z.infer<typeof schema>

function getStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^\w\s]/.test(pw)) score++
  return score
}

const strengthMeta = [
  { label: "Muito fraca", color: "#ff4444" },
  { label: "Fraca",       color: "#ff7744" },
  { label: "Razoável",    color: "#ffd700" },
  { label: "Boa",         color: "#88ff44" },
  { label: "Forte",       color: "#00ff88" }
]

export default function RegisterPage() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const [pwValue, setPwValue] = useState("")

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    resolver: zodResolver(schema)
  })

  const watchedPw = watch("password", "")

  async function onSubmit(values: Values) {
    try {
      const session = await registerCompany({
        company: {
          trade_name: values.company,
          legal_name: values.company,
          cnpj: values.cnpj ?? "00000000000000",
          email: values.email
        },
        user: {
          name: values.name,
          email: values.email,
          password: values.password
        }
      })
      setSession(session)
      router.push("/onboarding")
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Falha ao cadastrar empresa."
      })
    }
  }

  const strength = getStrength(watchedPw)
  const meta = watchedPw.length > 0 ? strengthMeta[strength - 1] : null

  return (
    <div className="w-full max-w-md">
      {/* Logo mobile */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00ff88]">
          <span className="text-xs font-bold text-[#0a0a0a]">N</span>
        </div>
        <span className="font-display font-semibold text-[#f0f0f0]">NexERP</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Começar</p>
      <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#f0f0f0]">
        Criar conta grátis
      </h1>
      <p className="mt-2 text-sm text-[#888888]">
        Sem cartão de crédito. Acesso completo durante o beta.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Nome completo */}
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            placeholder="Maria Silva"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.name.message}</p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="maria@empresa.com.br"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.email.message}</p>
          )}
        </div>

        {/* Senha com medidor */}
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mín. 8 caracteres"
            autoComplete="new-password"
            {...register("password", {
              onChange: (e) => setPwValue(e.target.value)
            })}
          />
          {watchedPw.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < strength ? (meta?.color ?? "#555") : "rgba(255,255,255,0.08)"
                    }}
                  />
                ))}
              </div>
              {meta && (
                <p className="text-xs" style={{ color: meta.color }}>
                  {meta.label}
                </p>
              )}
            </div>
          )}
          {errors.password && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.password.message}</p>
          )}
        </div>

        {/* Confirmar senha */}
        <div>
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Nome da empresa */}
        <div>
          <Label htmlFor="company">Nome da empresa</Label>
          <Input
            id="company"
            placeholder="Minha Empresa Ltda."
            autoComplete="organization"
            {...register("company")}
          />
          {errors.company && (
            <p className="mt-1.5 text-xs text-[#ff4444]">{errors.company.message}</p>
          )}
        </div>

        {/* CNPJ opcional */}
        <div>
          <Label htmlFor="cnpj">
            CNPJ{" "}
            <span className="ml-1 text-xs font-normal text-[#555555]">(opcional)</span>
          </Label>
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            autoComplete="off"
            {...register("cnpj")}
          />
        </div>

        {/* Aceite */}
        <div className="flex items-start gap-3 pt-1">
          <input
            id="terms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-white/20 bg-white/5 accent-[#00ff88]"
            {...register("terms")}
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-[#888888]">
            Li e aceito os{" "}
            <Link href="/" className="text-[#00d4ff] hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/" className="text-[#00d4ff] hover:underline">
              Política de Privacidade
            </Link>
            .
          </label>
        </div>
        {errors.terms && (
          <p className="-mt-2 text-xs text-[#ff4444]">{errors.terms.message}</p>
        )}

        {errors.root && (
          <div className="rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/10 px-4 py-3 text-sm text-[#ff4444]">
            {errors.root.message}
          </div>
        )}

        <Button
          className="mt-2 w-full"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Criando conta..." : "Criar conta grátis"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#888888]">
        Já tem conta?{" "}
        <Link href="/login" className="text-[#00d4ff] transition-colors hover:text-[#00b8e6]">
          Entrar
        </Link>
      </p>
    </div>
  )
}
