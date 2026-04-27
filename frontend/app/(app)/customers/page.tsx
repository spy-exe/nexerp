"use client"

import { PartyManager } from "@/components/commercial/party-manager"
import { archiveCustomer, createCustomer, listCustomers, updateCustomer } from "@/lib/auth"

export default function CustomersPage() {
  return (
    <PartyManager
      title="Cliente"
      listTitle="Clientes cadastrados"
      subtitle="Relacionamento"
      queryKey="customers"
      listQuery={listCustomers}
      createMutation={createCustomer}
      updateMutation={updateCustomer}
      archiveMutation={archiveCustomer}
    />
  )
}
