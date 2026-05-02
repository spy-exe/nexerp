"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createProduct, listCategories, listProducts } from "@/lib/auth"
import { currency } from "@/lib/utils"
import { productSchema } from "@/lib/validations"

type ProductValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const queryClient = useQueryClient()
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

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Catálogo</p>
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
            <select className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm" {...register("category_id")}>
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
        <div className="mt-5 grid gap-3">
          {productsQuery.data?.map((product) => (
            <div key={product.id} className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    SKU {product.sku} • {product.unit} • {product.barcode || "sem código"}
                  </p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  Mínimo {product.min_stock}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>Custo {currency(product.cost_price)}</span>
                <span>Venda {currency(product.sale_price)}</span>
              </div>
            </div>
          ))}
          {!productsQuery.data?.length && <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>}
        </div>
      </Card>
    </div>
  )
}
