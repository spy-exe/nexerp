"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Inbox, MessageSquareText, RefreshCw, Star } from "lucide-react"

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
            <p className="mt-2 text-sm text-slate-500">Sinais recentes enviados por usuários para priorizar atendimento e produto.</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => feedbacksQuery.refetch()} aria-label="Atualizar feedbacks">
            <RefreshCw className={`h-4 w-4 ${feedbacksQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        {feedbacksQuery.error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{feedbacksQuery.error instanceof Error ? feedbacksQuery.error.message : "Falha ao carregar feedbacks."}</span>
          </div>
        )}
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {feedbacksQuery.isLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-5">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          {feedbacksQuery.data?.map((feedback, index) => (
            <div key={feedback.id ?? index} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold leading-6 text-slate-900">{feedback.message ?? "Feedback sem mensagem"}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {feedback.company_id ?? "Empresa não informada"} · {feedback.user_id ?? "Usuário não informado"}
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
          {!feedbacksQuery.isLoading && !feedbacksQuery.data?.length && (
            <div className="px-4 py-10 text-center">
              <Inbox className="mx-auto h-5 w-5 text-slate-400" />
              <p className="mt-3 font-medium text-slate-800">Nenhum feedback registrado</p>
              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">Quando a base enviar avaliações, elas ficam listadas aqui com nota e origem.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
