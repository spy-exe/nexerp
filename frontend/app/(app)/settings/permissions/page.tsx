"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { listPermissions, listRolePermissions, updateRolePermissions, type RolePermission } from "@/lib/auth"

export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const permissionsQuery = useQuery({ queryKey: ["permissions"], queryFn: listPermissions })
  const rolesQuery = useQuery({ queryKey: ["role-permissions"], queryFn: listRolePermissions })
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const permissionDefinitions = permissionsQuery.data

  useEffect(() => {
    if (!rolesQuery.data) {
      return
    }
    setDrafts((current) => {
      if (Object.keys(current).length) {
        return current
      }
      return Object.fromEntries(rolesQuery.data.map((role) => [role.id, role.permissions]))
    })
  }, [rolesQuery.data])

  const groupedPermissions = useMemo(() => {
    const permissions = permissionDefinitions ?? []
    const groups = new Map<string, typeof permissions>()
    permissions.forEach((permission) => {
      groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission])
    })
    return [...groups.entries()]
  }, [permissionDefinitions])

  const updateMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) => updateRolePermissions(roleId, permissions),
    onSuccess: async () => {
      setMessage("Permissões atualizadas.")
      await queryClient.invalidateQueries({ queryKey: ["role-permissions"] })
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar permissões.")
    }
  })

  function togglePermission(role: RolePermission, permission: string) {
    setDrafts((current) => {
      const existing = new Set(current[role.id] ?? role.permissions)
      if (existing.has(permission)) {
        existing.delete(permission)
      } else {
        existing.add(permission)
      }
      return { ...current, [role.id]: [...existing].sort() }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Permissões</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Controle granular por módulo</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Papéis podem receber permissões específicas sem alterar o isolamento multi-tenant. O Admin permanece imutável.
        </p>
        {message && <p className="mt-4 text-sm text-teal-700">{message}</p>}
      </Card>

      <div className="grid gap-6">
        {rolesQuery.data?.map((role) => {
          const roleDraft = drafts[role.id] ?? role.permissions
          const locked = role.name === "Admin"
          return (
            <Card key={role.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{role.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                </div>
                <Button
                  disabled={locked || updateMutation.isPending}
                  type="button"
                  onClick={() => updateMutation.mutate({ roleId: role.id, permissions: roleDraft })}
                >
                  {locked ? "Protegido" : "Salvar permissões"}
                </Button>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {groupedPermissions.map(([module, permissions]) => (
                  <div key={`${role.id}-${module}`} className="rounded-[24px] border border-line bg-white p-4">
                    <p className="font-semibold text-slate-900">{module}</p>
                    <div className="mt-3 space-y-2">
                      {permissions?.map((permission) => (
                        <label key={permission.code} className="flex items-start gap-2 text-sm text-slate-600">
                          <input
                            checked={roleDraft.includes("*") || roleDraft.includes(permission.code)}
                            className="mt-1"
                            disabled={locked || roleDraft.includes("*")}
                            type="checkbox"
                            onChange={() => togglePermission(role, permission.code)}
                          />
                          <span>
                            <span className="font-medium text-slate-800">{permission.code}</span>
                            <span className="block text-xs text-slate-500">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
