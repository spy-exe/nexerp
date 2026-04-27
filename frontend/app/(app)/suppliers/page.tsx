"use client"

import { PartyManager } from "@/components/commercial/party-manager"
import { archiveSupplier, createSupplier, listSuppliers, updateSupplier } from "@/lib/auth"

export default function SuppliersPage() {
  return (
    <PartyManager
      title="Fornecedor"
      listTitle="Fornecedores cadastrados"
      subtitle="Abastecimento"
      queryKey="suppliers"
      listQuery={listSuppliers}
      createMutation={createSupplier}
      updateMutation={updateSupplier}
      archiveMutation={archiveSupplier}
    />
  )
}
