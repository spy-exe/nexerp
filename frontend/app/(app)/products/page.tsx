"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DataTable, type DataTableColumn } from "@/components/shared/DataTable"
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

  const columns: Array<DataTableColumn<Product>> = [
    {
      key: "name",
      label: "Produto",
      render: (product) => (
        <div>
          <InlineEdit value={product.name} onSave={(value) => saveProductField(product, { name: value })} />
          <p className="mt-1 text-xs text-slate-500">SKU {product.sku} • {product.unit}</p>
        </div>
      )
    },
    {
      key: "barcode",
      label: "Código",
      render: (product) => (
        <InlineEdit
          value={product.barcode ?? ""}
          displayValue={product.barcode || "sem código"}
          onSave={(value) => saveProductField(product, { barcode: value || null })}
        />
      )
    },
    {
      key: "category_id",
      label: "Categoria",
      render: (product) => (
        <InlineEdit
          type="select"
          value={product.category_id ?? ""}
          displayValue={categoryOptions.find((option) => option.value === product.category_id)?.label ?? "Sem categoria"}
          options={categoryOptions}
          onSave={(value) => saveProductField(product, { category_id: value || null })}
        />
      )
    },
    {
      key: "cost_price",
      label: "Custo",
      render: (product) => (
        <InlineEdit
          type="number"
          min="0"
          step="0.01"
          value={product.cost_price}
          displayValue={currency(product.cost_price)}
          onSave={(value) => saveProductField(product, { cost_price: value })}
        />
      )
    },
    {
      key: "sale_price",
      label: "Venda",
      render: (product) => (
        <InlineEdit
          type="number"
          min="0"
          step="0.01"
          value={product.sale_price}
          displayValue={currency(product.sale_price)}
          onSave={(value) => saveProductField(product, { sale_price: value })}
        />
      )
    },
    {
      key: "min_stock",
      label: "Mínimo",
      render: (product) => (
        <InlineEdit
          type="number"
          min="0"
          step="0.001"
          value={product.min_stock}
          onSave={(value) => saveProductField(product, { min_stock: value })}
        />
      )
    },
    {
      key: "actions",
      label: "Status",
      render: (product) => (
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
      )
    }
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
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Catálogo</p>
        <h1 className="mt-3 text-2xl font-semibold">Novo produto</h1>
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
            <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" {...register("category_id")}>
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
          {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
          <Button className="w-full" disabled={isSubmitting} isLoading={mutation.isPending} type="submit">
            {mutation.isPending ? "Salvando..." : "Criar produto"}
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Produtos cadastrados</h2>
        {inlineError && <p className="mt-3 text-sm text-rose-600">{inlineError}</p>}
        <div className="mt-5">
          <DataTable
            columns={columns}
            rows={productsQuery.data ?? []}
            getRowKey={(product) => product.id}
            emptyState={<EmptyState title="Nenhum produto cadastrado" description="Crie o primeiro produto para começar a controlar preço e estoque." />}
          />
        </div>
      </Card>
      </div>
    </div>
  )
}
