"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Barcode, CreditCard, Plus, ReceiptText, ShoppingCart, Trash2, Wallet } from "lucide-react"

import { InlineEdit } from "@/components/shared/InlineEdit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import {
  createSale,
  listCustomers,
  listProducts,
  listSales,
  updateSale,
  type Product,
  type SaleSummary
} from "@/lib/auth"
import { currency, formatDateTime, quantity } from "@/lib/utils"

type SalesWorkspaceProps = {
  channel: "sales" | "pos"
  title: string
  subtitle: string
  description: string
}

type DraftSaleItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

type DraftPayment = {
  method: "cash" | "card" | "pix" | "credit"
  amount: number
}

const paymentLabels: Record<DraftPayment["method"], string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
  credit: "Crediário"
}

export function SalesWorkspace({ channel, title, subtitle, description }: SalesWorkspaceProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts })
  const customersQuery = useQuery({ queryKey: ["customers"], queryFn: listCustomers })
  const salesQuery = useQuery({ queryKey: ["sales"], queryFn: listSales })

  const [customerId, setCustomerId] = useState("")
  const [notes, setNotes] = useState("")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productQuantity, setProductQuantity] = useState("1")
  const [productPrice, setProductPrice] = useState("")
  const [barcodeValue, setBarcodeValue] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<DraftPayment["method"]>("pix")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [items, setItems] = useState<DraftSaleItem[]>([])
  const [payments, setPayments] = useState<DraftPayment[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items])
  const discount = Number(discountAmount || 0)
  const total = Math.max(subtotal - discount, 0)
  const paidAmount = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments])
  const changeAmount = Math.max(paidAmount - total, 0)

  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async (sale) => {
      setCustomerId("")
      setNotes("")
      setDiscountAmount("0")
      setSelectedProductId("")
      setProductQuantity("1")
      setProductPrice("")
      setSelectedPaymentMethod("pix")
      setPaymentAmount("")
      setItems([])
      setPayments([])
      setFormError(null)
      queryClient.setQueryData<SaleSummary[]>(["sales"], (current = []) => [sale, ...current])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["balances"] })
      ])
      toast({ title: "Venda registrada", variant: "success" })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Falha ao registrar venda.")
      toast({ title: "Erro ao registrar venda", description: error instanceof Error ? error.message : undefined, variant: "error" })
    }
  })

  function handleAddItem() {
    setFormError(null)
    const product = productsQuery.data?.find((item) => item.id === selectedProductId)
    if (!product) {
      setFormError("Selecione um produto para adicionar ao carrinho.")
      return
    }

    const qty = Number(productQuantity)
    const unitPrice = Number(productPrice || product.sale_price)
    if (qty <= 0 || unitPrice < 0) {
      setFormError("Quantidade e preço devem ser válidos.")
      return
    }

    addProductToCart(product, qty, unitPrice)
    setSelectedProductId("")
    setProductQuantity("1")
    setProductPrice("")
  }

  function handleBarcodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const code = barcodeValue.trim()
    if (!code) {
      return
    }
    const product = productsQuery.data?.find((item) => item.barcode === code || item.sku === code)
    if (!product) {
      setFormError(`Produto não encontrado para o código ${code}.`)
      return
    }
    addProductToCart(product, 1, Number(product.sale_price))
    setBarcodeValue("")
  }

  function addProductToCart(product: Product, qty: number, unitPrice: number) {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.product_id === product.id && item.unit_price === unitPrice)
      if (existingIndex === -1) {
        return [
          ...current,
          {
            product_id: product.id,
            product_name: product.name,
            quantity: qty,
            unit_price: unitPrice
          }
        ]
      }
      return current.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + qty } : item
      )
    })
  }

  function handleAddPayment() {
    setFormError(null)
    const amount = Number(paymentAmount)
    if (amount <= 0) {
      setFormError("Informe um valor de pagamento válido.")
      return
    }
    setPayments((current) => [...current, { method: selectedPaymentMethod, amount }])
    setPaymentAmount("")
  }

  async function handleSubmit() {
    setFormError(null)
    if (!items.length) {
      setFormError("Adicione pelo menos um item à venda.")
      return
    }
    if (!payments.length) {
      setFormError("Adicione ao menos uma forma de pagamento.")
      return
    }
    await createSaleMutation.mutateAsync({
      customer_id: customerId || null,
      channel,
      discount_amount: discount,
      notes: notes || null,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0
      })),
      payments
    })
  }

  async function saveSaleField(sale: SaleSummary, payload: Partial<SaleSummary>) {
    setInlineError(null)
    const previous = queryClient.getQueryData<SaleSummary[]>(["sales"])
    queryClient.setQueryData<SaleSummary[]>(["sales"], (current = []) =>
      current.map((item) => (item.id === sale.id ? { ...item, ...payload } : item))
    )
    try {
      const updated = await updateSale(sale.id, payload)
      queryClient.setQueryData<SaleSummary[]>(["sales"], (current = []) =>
        current.map((item) => (item.id === sale.id ? { ...item, ...updated } : item))
      )
      toast({ title: "Venda atualizada", variant: "success" })
    } catch (error) {
      queryClient.setQueryData(["sales"], previous)
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar venda.")
      toast({ title: "Erro ao atualizar venda", description: error instanceof Error ? error.message : undefined, variant: "error" })
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">{subtitle}</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>

          {channel === "pos" && (
            <form className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4" onSubmit={handleBarcodeSubmit}>
              <Label className="flex items-center gap-2 text-blue-900">
                <Barcode className="h-4 w-4" />
                Leitor USB / código de barras
              </Label>
              <div className="mt-3 flex gap-3">
                <Input
                  autoFocus
                  inputMode="numeric"
                  placeholder="Bipe o produto ou digite SKU/código"
                  value={barcodeValue}
                  onChange={(event) => setBarcodeValue(event.target.value)}
                />
                <Button type="submit" className="shrink-0">
                  Adicionar
                </Button>
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Leitores USB funcionam como teclado: o Enter finaliza a leitura e adiciona 1 unidade ao carrinho.
              </p>
            </form>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_180px_160px_auto]">
            <div>
              <Label>Produto</Label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(event.target.value)
                  const product = productsQuery.data?.find((item) => item.id === event.target.value)
                  if (product) {
                    setProductPrice(String(product.sale_price))
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
              <Label>Preço unitário</Label>
              <Input type="number" min="0" step="0.01" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" type="button" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_180px_160px_auto]">
            <div>
              <Label>Cliente</Label>
              <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">Consumidor final</option>
                {customersQuery.data?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                value={selectedPaymentMethod}
                onChange={(event) => setSelectedPaymentMethod(event.target.value as DraftPayment["method"])}
              >
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="credit">Crediário</option>
              </select>
            </div>
            <div>
              <Label>Valor pago</Label>
              <Input type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" type="button" variant="outline" onClick={handleAddPayment}>
                <CreditCard className="h-4 w-4" />
                Pagar
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <Label>Desconto global</Label>
              <Input type="number" min="0" step="0.01" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
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
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Resumo</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Carrinho atual</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {items.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {quantity(item.quantity)} x {currency(item.unit_price)}
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

          <div className="mt-6 space-y-2 rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Desconto</span>
              <span>{currency(discount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Pago</span>
              <span>{currency(paidAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{currency(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-300">
              <span>Troco</span>
              <span>{currency(changeAmount)}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {payments.map((payment, index) => (
              <div key={`${payment.method}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <span>{paymentLabels[payment.method]}</span>
                <span className="font-semibold text-slate-900">{currency(payment.amount)}</span>
              </div>
            ))}
          </div>

          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
          <Button className="mt-6 w-full gap-2" isLoading={createSaleMutation.isPending} type="button" onClick={handleSubmit}>
            <Wallet className="h-4 w-4" />
            {createSaleMutation.isPending ? "Finalizando..." : channel === "pos" ? "Fechar venda no PDV" : "Registrar venda"}
          </Button>
        </Card>
      </section>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Histórico</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Últimas vendas</h2>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <ReceiptText className="h-5 w-5" />
          </div>
        </div>
        {inlineError && <p className="mt-3 text-sm text-rose-600">{inlineError}</p>}
        <div className="mt-6 grid gap-3">
          {salesQuery.data?.map((sale) => (
            <SaleRow key={sale.id} sale={sale} onSave={(payload) => saveSaleField(sale, payload)} />
          ))}
          {!salesQuery.data?.length && <p className="text-sm text-slate-500">Nenhuma venda registrada.</p>}
        </div>
      </Card>
    </div>
  )
}

function SaleRow({ sale, onSave }: { sale: SaleSummary; onSave: (payload: Partial<SaleSummary>) => Promise<void> }) {
  const statusOptions = [
    { value: "draft", label: "Rascunho" },
    { value: "confirmed", label: "Confirmada" },
    { value: "cancelled", label: "Cancelada" }
  ]
  const statusLabel = statusOptions.find((item) => item.value === sale.status)?.label ?? sale.status
  const canEditStatus = ["draft", "confirmed"].includes(sale.status)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{sale.sale_number}</p>
          <p className="mt-1 text-sm text-slate-500">
            {sale.customer_name || "Consumidor final"} • {formatDateTime(sale.issued_at)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{sale.channel === "pos" ? "PDV" : "Venda assistida"}</p>
          <p className="mt-2 text-sm text-slate-500">
            Status{" "}
            <InlineEdit
              disabled={!canEditStatus}
              type="select"
              value={sale.status}
              displayValue={statusLabel}
              options={statusOptions}
              onSave={(value) => onSave({ status: value })}
            />
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Obs.{" "}
            <InlineEdit
              value={sale.notes ?? ""}
              displayValue={sale.notes || "sem observação"}
              onSave={(value) => onSave({ notes: value || null })}
            />
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-900">{currency(sale.total_amount)}</p>
          <Link className="mt-2 inline-flex text-sm font-medium text-blue-700 hover:text-blue-700" href={`/sales/${sale.id}`}>
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  )
}
