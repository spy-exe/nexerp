"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, PencilLine, Trash2, UserRound } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { InlineEdit } from "@/components/shared/InlineEdit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BusinessParty } from "@/lib/auth"
import { businessPartySchema } from "@/lib/validations"

type BusinessPartyValues = z.infer<typeof businessPartySchema>

type PartyManagerProps = {
  title: string
  listTitle: string
  subtitle: string
  queryKey: string
  listQuery: () => Promise<BusinessParty[]>
  createMutation: (payload: unknown) => Promise<BusinessParty>
  updateMutation: (partyId: string, payload: unknown) => Promise<BusinessParty>
  archiveMutation: (partyId: string) => Promise<BusinessParty>
}

const defaultValues: BusinessPartyValues = {
  person_kind: "company",
  name: "",
  email: "",
  phone: "",
  document_number: "",
  state_registration: "",
  municipal_registration: "",
  address_zip: "",
  address_state: "",
  address_city: "",
  address_street: "",
  address_number: "",
  address_neighborhood: "",
  notes: ""
}

function toPayload(values: BusinessPartyValues) {
  return {
    ...values,
    email: values.email || null,
    phone: values.phone || null,
    state_registration: values.state_registration || null,
    municipal_registration: values.municipal_registration || null,
    address_zip: values.address_zip || null,
    address_state: values.address_state || null,
    address_city: values.address_city || null,
    address_street: values.address_street || null,
    address_number: values.address_number || null,
    address_neighborhood: values.address_neighborhood || null,
    notes: values.notes || null
  }
}

function mapPartyToValues(party: BusinessParty): BusinessPartyValues {
  return {
    person_kind: party.person_kind,
    name: party.name,
    email: party.email ?? "",
    phone: party.phone ?? "",
    document_number: party.document_number,
    state_registration: party.state_registration ?? "",
    municipal_registration: party.municipal_registration ?? "",
    address_zip: party.address_zip ?? "",
    address_state: party.address_state ?? "",
    address_city: party.address_city ?? "",
    address_street: party.address_street ?? "",
    address_number: party.address_number ?? "",
    address_neighborhood: party.address_neighborhood ?? "",
    notes: party.notes ?? ""
  }
}

export function PartyManager({
  title,
  listTitle,
  subtitle,
  queryKey,
  listQuery,
  createMutation,
  updateMutation,
  archiveMutation
}: PartyManagerProps) {
  const queryClient = useQueryClient()
  const [editingParty, setEditingParty] = useState<BusinessParty | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const partiesQuery = useQuery({ queryKey: [queryKey], queryFn: listQuery })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<BusinessPartyValues>({
    resolver: zodResolver(businessPartySchema),
    defaultValues
  })

  const saveMutation = useMutation({
    mutationFn: async (values: BusinessPartyValues) => {
      const payload = toPayload(values)
      if (editingParty) {
        return updateMutation(editingParty.id, payload)
      }
      return createMutation(payload)
    },
    onSuccess: (savedParty) => {
      setEditingParty(null)
      reset(defaultValues)
      queryClient.setQueryData<BusinessParty[]>([queryKey], (current = []) => {
        const exists = current.some((party) => party.id === savedParty.id)
        if (exists) {
          return current.map((party) => (party.id === savedParty.id ? savedParty : party))
        }
        return [savedParty, ...current]
      })
    },
    onError: (error) => {
      setError("root", { message: error instanceof Error ? error.message : "Falha ao salvar cadastro." })
    }
  })

  const archivePartyMutation = useMutation({
    mutationFn: archiveMutation,
    onSuccess: (archivedParty) => {
      if (editingParty) {
        setEditingParty(null)
        reset(defaultValues)
      }
      queryClient.setQueryData<BusinessParty[]>([queryKey], (current = []) =>
        current.map((party) => (party.id === archivedParty.id ? archivedParty : party))
      )
    }
  })

  async function onSubmit(values: BusinessPartyValues) {
    await saveMutation.mutateAsync(values)
  }

  function handleEdit(party: BusinessParty) {
    setEditingParty(party)
    reset(mapPartyToValues(party))
  }

  function handleCancelEdit() {
    setEditingParty(null)
    reset(defaultValues)
  }

  async function savePartyField(party: BusinessParty, payload: Partial<BusinessParty>) {
    setInlineError(null)
    const previous = queryClient.getQueryData<BusinessParty[]>([queryKey])
    queryClient.setQueryData<BusinessParty[]>([queryKey], (current = []) =>
      current.map((item) => (item.id === party.id ? { ...item, ...payload } : item))
    )
    try {
      const updated = await updateMutation(party.id, payload)
      queryClient.setQueryData<BusinessParty[]>([queryKey], (current = []) =>
        current.map((item) => (item.id === party.id ? updated : item))
      )
    } catch (error) {
      queryClient.setQueryData([queryKey], previous)
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar cadastro.")
      throw error
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">{subtitle}</p>
        <h1 className="mt-3 text-2xl font-semibold">{editingParty ? `Editar ${title.toLowerCase()}` : `Novo ${title.toLowerCase()}`}</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de pessoa</Label>
              <select className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm" {...register("person_kind")}>
                <option value="company">Pessoa jurídica</option>
                <option value="individual">Pessoa física</option>
              </select>
            </div>
            <div>
              <Label>Documento</Label>
              <Input {...register("document_number")} placeholder="CPF ou CNPJ" />
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input {...register("name")} placeholder={title} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>E-mail</Label>
              <Input {...register("email")} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input {...register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inscrição estadual</Label>
              <Input {...register("state_registration")} />
            </div>
            <div>
              <Label>Inscrição municipal</Label>
              <Input {...register("municipal_registration")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CEP</Label>
              <Input {...register("address_zip")} />
            </div>
            <div>
              <Label>UF</Label>
              <Input maxLength={2} {...register("address_state")} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div>
              <Label>Cidade</Label>
              <Input {...register("address_city")} />
            </div>
            <div>
              <Label>Número</Label>
              <Input {...register("address_number")} />
            </div>
          </div>
          <div>
            <Label>Rua</Label>
            <Input {...register("address_street")} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input {...register("address_neighborhood")} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea {...register("notes")} />
          </div>
          {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}
          <div className="flex gap-3">
            <Button className="flex-1" disabled={isSubmitting || saveMutation.isPending} type="submit">
              {saveMutation.isPending ? "Salvando..." : editingParty ? "Atualizar cadastro" : "Criar cadastro"}
            </Button>
            {editingParty && (
              <Button className="flex-1" type="button" variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">{listTitle}</h2>
        {inlineError && <p className="mt-3 text-sm text-rose-600">{inlineError}</p>}
        <div className="mt-5 grid gap-3">
          {partiesQuery.data?.map((party) => {
            const Icon = party.person_kind === "company" ? Building2 : UserRound
            return (
              <div key={party.id} className="rounded-[24px] border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        <InlineEdit value={party.name} onSave={(value) => savePartyField(party, { name: value })} />
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {party.document_number} •{" "}
                        <InlineEdit
                          value={party.email ?? ""}
                          displayValue={party.email || "sem e-mail"}
                          onSave={(value) => savePartyField(party, { email: value || null })}
                        />
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        <InlineEdit
                          value={party.address_city ?? ""}
                          displayValue={party.address_city || "Cidade não informada"}
                          onSave={(value) => savePartyField(party, { address_city: value || null })}
                        />
                        {party.address_state ? ` • ${party.address_state}` : ""}
                      </p>
                    </div>
                  </div>
                  <InlineEdit
                    type="select"
                    value={party.is_active ? "active" : "archived"}
                    displayValue={
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${party.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {party.is_active ? "Ativo" : "Arquivado"}
                      </span>
                    }
                    options={[
                      { value: "active", label: "Ativo" },
                      { value: "archived", label: "Arquivado" }
                    ]}
                    onSave={(value) => savePartyField(party, { is_active: value === "active" })}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => handleEdit(party)}>
                    <PencilLine className="h-4 w-4" />
                    Editar
                  </Button>
                  {party.is_active && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => archivePartyMutation.mutate(party.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Arquivar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {!partiesQuery.data?.length && <p className="text-sm text-slate-500">Nenhum cadastro encontrado.</p>}
        </div>
      </Card>
    </div>
  )
}
