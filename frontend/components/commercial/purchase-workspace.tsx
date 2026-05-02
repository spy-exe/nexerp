"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardPlus, Plus, ShoppingBasket, Trash2, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createPurchase,
  listProducts,
  listPurchases,
  listSuppliers,
  type Product,
  type PurchaseSummary
} from "@/lib/auth"
import { currency, formatDateTime, quantity } from "@/lib/utils"

type DraftPurchaseItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
}

export function PurchaseWorkspace() {
  const queryClient = useQueryClient()
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts })
  const suppliersQuery = useQuery({ queryKey: ["suppliers"], queryFn: listSuppliers })
  const purchasesQuery = useQuery({ queryKey: ["purchases"], queryFn: listPurchases })

  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productQuantity, setProductQuantity] = useState("1")
  const [productCost, setProductCost] = useState("")
  const [items, setItems] = useState<DraftPurchaseItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0), [items])

  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: async () => {
      setSupplierId("")
      setNotes("")
      setSelectedProductId("")
      setProductQuantity("1")
      setProductCost("")
      setItems([])
      setFormError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["purchases"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["balances"] })
      ])
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Falha ao registrar compra.")
    }
  })

  function handleAddItem() {
    setFormError(null)
    const product = productsQuery.data?.find((item) => item.id === selectedProductId)
    if (!product) {
      setFormError("Selecione um produto para adicionar à compra.")
      return
    }
    const qty = Number(productQuantity)
    const unitCost = Number(productCost || product.cost_price)
    if (qty <= 0 || unitCost < 0) {
      setFormError("Quantidade e custo unitário devem ser válidos.")
      return
    }
    setItems((current) => [
      ...current,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_cost: unitCost
      }
    ])
    setSelectedProductId("")
    setProductQuantity("1")
    setProductCost("")
  }

  async function handleSubmit() {
    setFormError(null)
    if (!supplierId) {
      setFormError("Selecione um fornecedor.")
      return
    }
    if (!items.length) {
      setFormError("Adicione pelo menos um item à compra.")
      return
    }
    await createPurchaseMutation.mutateAsync({
      supplier_id: supplierId,
      notes: notes || null,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      }))
    })
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Abastecimento</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Registrar compra</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Centralize as entradas do estoque por fornecedor, mantendo histórico detalhado de custo, volume e impacto na
            operação.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_180px_160px_auto]">
            <div>
              <Label>Produto</Label>
              <select
                className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm"
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(event.target.value)
                  const product = productsQuery.data?.find((item) => item.id === event.target.value)
                  if (product) {
                    setProductCost(String(product.cost_price))
                  }
                }}
              >
                <option value="">Selecione</option>
                {productsQuery.data?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min="1" step="0.001" value={productQuantity} onChange={(event) => setProductQuantity(event.target.value)} />
            </div>
            <div>
              <Label>Custo unitário</Label>
              <Input type="number" min="0" step="0.01" value={productCost} onChange={(event) => setProductCost(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" type="button" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div>
              <Label>Fornecedor</Label>
              <select className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                <option value="">Selecione</option>
                {suppliersQuery.data?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Resumo</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Entrada planejada</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ShoppingBasket className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {items.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {quantity(item.quantity)} x {currency(item.unit_cost)}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={() => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!items.length && <p className="text-sm text-slate-500">Nenhum item adicionado.</p>}
          </div>

          <div className="mt-6 rounded-lg bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Total previsto</span>
              <span>{currency(total)}</span>
            </div>
          </div>

          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
          <Button className="mt-6 w-full gap-2" disabled={createPurchaseMutation.isPending} type="button" onClick={handleSubmit}>
            <ClipboardPlus className="h-4 w-4" />
            {createPurchaseMutation.isPending ? "Registrando..." : "Registrar compra"}
          </Button>
        </Card>
      </section>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Histórico</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Últimas compras</h2>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Truck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {purchasesQuery.data?.map((purchase) => (
            <PurchaseRow key={purchase.id} purchase={purchase} />
          ))}
          {!purchasesQuery.data?.length && <p className="text-sm text-slate-500">Nenhuma compra registrada.</p>}
        </div>
      </Card>
    </div>
  )
}

function PurchaseRow({ purchase }: { purchase: PurchaseSummary }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{purchase.purchase_number}</p>
          <p className="mt-1 text-sm text-slate-500">
            {purchase.supplier_name} • {formatDateTime(purchase.issued_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-900">{currency(purchase.total_amount)}</p>
          <Link className="mt-2 inline-flex text-sm font-medium text-teal-700 hover:text-teal-800" href={`/purchases/${purchase.id}`}>
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  )
}
