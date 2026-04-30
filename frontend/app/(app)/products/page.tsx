"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { InlineEdit } from "@/components/shared/InlineEdit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createProduct, listCategories, listProducts, updateProduct, type Product } from "@/lib/auth"
import { currency } from "@/lib/utils"
import { productSchema } from "@/lib/validations"

type ProductValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const queryClient = useQueryClient()
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
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao criar produto." })
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
    } catch (error) {
      queryClient.setQueryData(["products"], previous)
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar produto.")
      throw error
    }
  }

  const categoryOptions = [
    { value: "", label: "Sem categoria" },
    ...(categoriesQuery.data?.map((category) => ({ value: category.id, label: category.name })) ?? [])
  ]

  return (
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
          <Button className="w-full" disabled={isSubmitting || mutation.isPending} type="submit">
            {mutation.isPending ? "Salvando..." : "Criar produto"}
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Produtos cadastrados</h2>
        {inlineError && <p className="mt-3 text-sm text-rose-600">{inlineError}</p>}
        <div className="mt-5 grid gap-3">
          {productsQuery.data?.map((product) => (
            <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    <InlineEdit
                      value={product.name}
                      onSave={(value) => saveProductField(product, { name: value })}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    SKU {product.sku} • {product.unit} •{" "}
                    <InlineEdit
                      value={product.barcode ?? ""}
                      displayValue={product.barcode || "sem código"}
                      onSave={(value) => saveProductField(product, { barcode: value || null })}
                    />
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Categoria{" "}
                    <InlineEdit
                      type="select"
                      value={product.category_id ?? ""}
                      displayValue={categoryOptions.find((option) => option.value === product.category_id)?.label ?? "Sem categoria"}
                      options={categoryOptions}
                      onSave={(value) => saveProductField(product, { category_id: value || null })}
                    />
                  </p>
                </div>
                <InlineEdit
                  type="select"
                  value={product.is_active ? "active" : "archived"}
                  displayValue={
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {product.is_active ? "Ativo" : "Arquivado"}
                    </span>
                  }
                  options={[
                    { value: "active", label: "Ativo" },
                    { value: "archived", label: "Arquivado" }
                  ]}
                  onSave={(value) => saveProductField(product, { is_active: value === "active" })}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>
                  Custo{" "}
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
                  Venda{" "}
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
                  Mínimo{" "}
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
          ))}
          {!productsQuery.data?.length && <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>}
        </div>
      </Card>
    </div>
  )
}
