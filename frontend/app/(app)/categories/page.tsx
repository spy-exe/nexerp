"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PencilLine, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { createCategory, listCategories, updateCategory, type Category } from "@/lib/auth"
import { categorySchema } from "@/lib/validations"

type CategoryValues = z.infer<typeof categorySchema>

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [pendingArchive, setPendingArchive] = useState<Category | null>(null)

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema)
  })

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryValues) => {
      if (editingCategory) return updateCategory(editingCategory.id, values)
      return createCategory(values)
    },
    onSuccess: (saved) => {
      reset()
      queryClient.setQueryData<Category[]>(["categories"], (current = []) => {
        const exists = current.some((c) => c.id === saved.id)
        if (exists) return current.map((c) => (c.id === saved.id ? saved : c))
        return [saved, ...current]
      })
      toast({ title: editingCategory ? "Categoria atualizada" : "Categoria criada", variant: "success" })
      setEditingCategory(null)
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao salvar categoria." })
      toast({ title: "Erro ao salvar categoria", description: error instanceof Error ? error.message : undefined, variant: "error" })
    }
  })

  const archiveMutation = useMutation({
    mutationFn: (category: Category) => updateCategory(category.id, { is_active: false }),
    onSuccess: (archived) => {
      queryClient.setQueryData<Category[]>(["categories"], (current = []) =>
        current.map((c) => (c.id === archived.id ? archived : c))
      )
      setPendingArchive(null)
      toast({ title: "Categoria arquivada", variant: "success" })
    },
    onError: (error) => {
      toast({ title: "Erro ao arquivar", description: error instanceof Error ? error.message : undefined, variant: "error" })
    }
  })

  function handleEdit(category: Category) {
    setEditingCategory(category)
    reset({ name: category.name, description: category.description ?? "" })
  }

  function handleCancelEdit() {
    setEditingCategory(null)
    reset()
  }

  async function onSubmit(values: CategoryValues) {
    await saveMutation.mutateAsync(values)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card className="p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Categorias</p>
        <h1 className="mt-3 text-xl font-bold text-[var(--fg)]">
          {editingCategory ? "Editar categoria" : "Nova categoria"}
        </h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Nome</Label>
            <Input {...register("name")} />
            {errors.name && <p className="mt-1.5 text-xs text-[#ff4444]">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Descrição</Label>
            <Input {...register("description")} />
          </div>
          {errors.root && <p className="text-sm text-[#ff4444]">{errors.root.message}</p>}
          <div className="flex gap-3">
            <Button className="flex-1" disabled={isSubmitting || saveMutation.isPending} type="submit">
              {saveMutation.isPending ? "Salvando..." : editingCategory ? "Atualizar" : "Criar categoria"}
            </Button>
            {editingCategory && (
              <Button type="button" variant="outline" size="icon" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-[var(--fg)]">Categorias cadastradas</h2>
        <div className="mt-5 grid gap-3">
          {categoriesQuery.data?.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-muted)] px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--fg)]">{category.name}</p>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">{category.description || "Sem descrição"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      category.is_active
                        ? "bg-[#00ff88]/10 text-[#00ff88]"
                        : "bg-white/5 text-[var(--fg-muted)]"
                    }`}
                  >
                    {category.is_active ? "Ativa" : "Arquivada"}
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  {category.is_active && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-[#ff4444] hover:bg-[#ff4444]/10"
                      onClick={() => setPendingArchive(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!categoriesQuery.data?.length && (
            <p className="text-sm text-[var(--fg-muted)]">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title="Arquivar categoria"
        description={`Arquivar "${pendingArchive?.name}"?`}
        confirmLabel="Arquivar"
        isConfirming={archiveMutation.isPending}
        onClose={() => setPendingArchive(null)}
        onConfirm={() => {
          if (pendingArchive) archiveMutation.mutate(pendingArchive)
        }}
      />
    </div>
  )
}
