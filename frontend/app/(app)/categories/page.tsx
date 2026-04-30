"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCategory, listCategories } from "@/lib/auth"
import { categorySchema } from "@/lib/validations"

type CategoryValues = z.infer<typeof categorySchema>

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories })
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema)
  })

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      reset()
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao criar categoria." })
    }
  })

  async function onSubmit(values: CategoryValues) {
    await mutation.mutateAsync(values)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Categorias</p>
        <h1 className="mt-3 text-2xl font-semibold">Nova categoria</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nome</Label>
            <Input {...register("name")} />
            {errors.name && <p className="mt-2 text-sm text-rose-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Descrição</Label>
            <Input {...register("description")} />
          </div>
          {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
          <Button className="w-full" disabled={isSubmitting || mutation.isPending} type="submit">
            {mutation.isPending ? "Salvando..." : "Criar categoria"}
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Categorias cadastradas</h2>
        <div className="mt-5 grid gap-3">
          {categoriesQuery.data?.map((category) => (
            <div key={category.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{category.description || "Sem descrição"}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {category.is_active ? "Ativa" : "Arquivada"}
                </span>
              </div>
            </div>
          ))}
          {!categoriesQuery.data?.length && <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>}
        </div>
      </Card>
    </div>
  )
}
