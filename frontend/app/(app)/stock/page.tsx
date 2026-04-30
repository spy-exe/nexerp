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
import { useToast } from "@/components/ui/toast"
import { createMovement, listBalances, listProducts, updateProduct, updateWarehouse, type StockBalance } from "@/lib/auth"
import { movementSchema } from "@/lib/validations"

type MovementValues = z.infer<typeof movementSchema>

export default function StockPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [inlineError, setInlineError] = useState<string | null>(null)
  const balancesQuery = useQuery({ queryKey: ["balances"], queryFn: listBalances })
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: listProducts })
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<MovementValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "inbound",
      quantity: 1
    }
  })

  const mutation = useMutation({
    mutationFn: createMovement,
    onSuccess: async () => {
      reset()
      await queryClient.invalidateQueries({ queryKey: ["balances"] })
      toast({ title: "Movimentação registrada", variant: "success" })
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao registrar movimentação." })
      toast({ title: "Erro no estoque", description: error instanceof Error ? error.message : undefined, variant: "error" })
    }
  })

  async function onSubmit(values: MovementValues) {
    await mutation.mutateAsync(values)
  }

  async function saveBalanceField(balance: StockBalance, payload: Partial<StockBalance>) {
    setInlineError(null)
    const previousBalances = queryClient.getQueryData<StockBalance[]>(["balances"])
    queryClient.setQueryData<StockBalance[]>(["balances"], (current = []) =>
      current.map((item) =>
        item.product_id === balance.product_id && item.warehouse_id === balance.warehouse_id
          ? { ...item, ...payload }
          : item
      )
    )
    try {
      if ("min_stock" in payload) {
        await updateProduct(balance.product_id, { min_stock: payload.min_stock })
      }
      if ("warehouse_location" in payload) {
        await updateWarehouse(balance.warehouse_id, { location: payload.warehouse_location || null })
      }
      toast({ title: "Estoque atualizado", variant: "success" })
    } catch (error) {
      queryClient.setQueryData(["balances"], previousBalances)
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar estoque.")
      toast({ title: "Erro ao atualizar estoque", description: error instanceof Error ? error.message : undefined, variant: "error" })
      throw error
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Movimentação</p>
        <h1 className="mt-3 text-2xl font-semibold">Ajuste de estoque</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label>Produto</Label>
            <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" {...register("product_id")}>
              <option value="">Selecione</option>
              {productsQuery.data?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {errors.product_id && <p className="mt-2 text-sm text-rose-600">{errors.product_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" {...register("type")}>
                <option value="inbound">Entrada</option>
                <option value="outbound">Saída</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" step="0.001" {...register("quantity")} />
            </div>
          </div>
          <div>
            <Label>Observação</Label>
            <Input {...register("notes")} />
          </div>
          {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
          <Button className="w-full" disabled={isSubmitting} isLoading={mutation.isPending} type="submit">
            {mutation.isPending ? "Gravando..." : "Registrar movimentação"}
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Saldos atuais</h2>
        {inlineError && <p className="mt-3 text-sm text-rose-600">{inlineError}</p>}
        <div className="mt-5 grid gap-3">
          {balancesQuery.data?.map((balance) => (
            <div key={`${balance.product_id}:${balance.warehouse_id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{balance.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {balance.warehouse_name} •{" "}
                    <InlineEdit
                      value={balance.warehouse_location ?? ""}
                      displayValue={balance.warehouse_location || "sem localização"}
                      onSave={(value) => saveBalanceField(balance, { warehouse_location: value || null })}
                    />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-900">{balance.quantity}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    mínimo{" "}
                    <InlineEdit
                      type="number"
                      min="0"
                      step="0.001"
                      value={balance.min_stock}
                      onSave={(value) => saveBalanceField(balance, { min_stock: value })}
                    />
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!balancesQuery.data?.length && <p className="text-sm text-slate-500">Nenhum saldo encontrado.</p>}
        </div>
      </Card>
    </div>
  )
}
