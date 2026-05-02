"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { EmptyState } from "@/components/shared/EmptyState"
import { InlineEdit } from "@/components/shared/InlineEdit"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { createProduct, listCategories, listProducts, updateProduct, type Product } from "@/lib/auth"
import { currency } from "@/lib/utils"
import { productSchema } from "@/lib/validations"

type ProductValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [inlineError, setInlineError] = useState<string | null>(null)
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts })
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories })
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: "UN",
      cost_price: 0,
      sale_price: 0,
      min_stock: 0
    }
  })

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      reset()
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({ title: "Produto criado", variant: "success" })
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao criar produto." })
      toast({ title: "Erro ao criar produto", description: error instanceof Error ? error.message : undefined, variant: "error" })
    }
  })

  async function onSubmit(values: ProductValues) {
    await mutation.mutateAsync({
      ...values,
      category_id: values.category_id || null
    })
  }

  async function saveProductField(product: Product, payload: Partial<Product>) {
    setInlineError(null)
    const previous = queryClient.getQueryData<Product[]>(["products"])
    queryClient.setQueryData<Product[]>(["products"], (current = []) =>
      current.map((item) => (item.id === product.id ? { ...item, ...payload } : item))
    )
    try {
      const updated = await updateProduct(product.id, payload)
      queryClient.setQueryData<Product[]>(["products"], (current = []) =>
        current.map((item) => (item.id === product.id ? updated : item))
      )
      toast({ title: "Produto atualizado", variant: "success" })
    } catch (error) {
      queryClient.setQueryData(["products"], previous)
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar produto.")
      toast({ title: "Erro ao atualizar produto", description: error instanceof Error ? error.message : undefined, variant: "error" })
      throw error
    }
  }

  const categoryOptions = [
    { value: "", label: "Sem categoria" },
    ...(categoriesQuery.data?.map((category) => ({ value: category.id, label: category.name })) ?? [])
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        subtitle="Produtos, preços, categorias, códigos de barras e estoque mínimo editáveis sem sair da listagem."
      />
      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <Card className="p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Catálogo</p>
        <h1 className="mt-3 text-xl font-bold text-[var(--fg)]">Novo produto</h1>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SKU</Label>
              <Input {...register("sku")} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input {...register("unit")} />
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input {...register("name")} />
          </div>
          <div>
            <Label>Código de barras</Label>
            <Input {...register("barcode")} />
          </div>
          <div>
            <Label>Categoria</Label>
            <select className="h-9 w-full rounded-lg border border-[color:var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--fg)] outline-none transition focus:ring-2 focus:ring-[#00ff88]/30" {...register("category_id")}>
              <option value="">Sem categoria</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Custo</Label>
              <Input type="number" step="0.01" {...register("cost_price")} />
            </div>
            <div>
              <Label>Venda</Label>
              <Input type="number" step="0.01" {...register("sale_price")} />
            </div>
            <div>
              <Label>Estoque mínimo</Label>
              <Input type="number" step="0.001" {...register("min_stock")} />
            </div>
          </div>
          {errors.root && <p className="text-sm text-[#ff4444]">{errors.root.message}</p>}
          <Button className="w-full" disabled={isSubmitting} isLoading={mutation.isPending} type="submit">
            {mutation.isPending ? "Salvando..." : "Criar produto"}
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-bold text-[var(--fg)]">Produtos cadastrados</h2>
        {inlineError && <p className="mt-3 text-sm text-[#ff4444]">{inlineError}</p>}
        <div className="mt-5 space-y-3">
          {!productsQuery.data?.length && (
            <EmptyState title="Nenhum produto cadastrado" description="Crie o primeiro produto para começar a controlar preço e estoque." />
          )}
          {productsQuery.data?.map((product) => (
            <div key={product.id} className="rounded-xl border border-[color:var(--border)] bg-[var(--bg-muted)] p-4 transition hover:border-[color:var(--border-hover)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <InlineEdit value={product.name} onSave={(value) => saveProductField(product, { name: value })} />
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                    SKU {product.sku} • {product.unit} •{" "}
                    <InlineEdit
                      value={product.barcode ?? ""}
                      displayValue={product.barcode ? `cód. ${product.barcode}` : "sem código de barras"}
                      onSave={(value) => saveProductField(product, { barcode: value || null })}
                    />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--fg-muted)]">
                    <span>
                      Cat:{" "}
                      <InlineEdit
                        type="select"
                        value={product.category_id ?? ""}
                        displayValue={categoryOptions.find((o) => o.value === product.category_id)?.label ?? "sem categoria"}
                        options={categoryOptions}
                        onSave={(value) => saveProductField(product, { category_id: value || null })}
                      />
                    </span>
                    <span>
                      Custo:{" "}
                      <InlineEdit
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.cost_price}
                        displayValue={currency(product.cost_price)}
                        onSave={(value) => saveProductField(product, { cost_price: value })}
                      />
                    </span>
                    <span>
                      Venda:{" "}
                      <InlineEdit
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.sale_price}
                        displayValue={currency(product.sale_price)}
                        onSave={(value) => saveProductField(product, { sale_price: value })}
                      />
                    </span>
                    <span>
                      Mín:{" "}
                      <InlineEdit
                        type="number"
                        min="0"
                        step="0.001"
                        value={product.min_stock}
                        onSave={(value) => saveProductField(product, { min_stock: value })}
                      />
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <InlineEdit
                    type="select"
                    value={product.is_active ? "active" : "archived"}
                    displayValue={<StatusBadge status={product.is_active ? "active" : "archived"} />}
                    options={[
                      { value: "active", label: "Ativo" },
                      { value: "archived", label: "Arquivado" }
                    ]}
                    onSave={(value) => saveProductField(product, { is_active: value === "active" })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </div>
    </div>
  )
}
