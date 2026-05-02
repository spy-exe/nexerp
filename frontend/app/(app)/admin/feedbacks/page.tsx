"use client"

import { useQuery } from "@tanstack/react-query"
import { MessageSquareText, RefreshCw, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { listAdminFeedbacks } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"

export default function AdminFeedbacksPage() {
  const feedbacksQuery = useQuery({ queryKey: ["admin-feedbacks"], queryFn: listAdminFeedbacks })

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Feedbacks</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Retornos da base</h1>
          </div>
          <Button variant="outline" size="icon" onClick={() => feedbacksQuery.refetch()} aria-label="Atualizar feedbacks">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-3">
          {feedbacksQuery.data?.map((feedback, index) => (
            <div key={feedback.id ?? index} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{feedback.message ?? "Feedback sem mensagem"}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {feedback.company_id ?? "Empresa não informada"} • {feedback.user_id ?? "Usuário não informado"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    <Star className="h-4 w-4" />
                    {feedback.rating ?? "-"}
                  </div>
                  {feedback.created_at && <p className="mt-2 text-xs text-slate-500">{formatDateTime(feedback.created_at)}</p>}
                </div>
              </div>
            </div>
          ))}
          {!feedbacksQuery.data?.length && <p className="text-sm text-slate-500">Nenhum feedback registrado.</p>}
        </div>
      </Card>
    </div>
  )
}
