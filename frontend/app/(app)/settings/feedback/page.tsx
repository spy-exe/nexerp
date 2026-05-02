"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { MessageSquareText, Send, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createFeedback } from "@/lib/auth"

export default function FeedbackPage() {
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState<number | null>(5)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      setStatusMessage("Feedback enviado para o time NexERP.")
      setMessage("")
      setRating(5)
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "Falha ao enviar feedback.")
    }
  })

  function submit() {
    mutation.mutate({ message, rating })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Feedback</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Melhoria contínua</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Envie problemas, oportunidades e percepções de operação. O superadmin acompanha os retornos no painel SaaS.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-5">
          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              maxLength={2000}
              placeholder="Descreva o que pode melhorar no fluxo, na interface ou no produto."
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-400">{message.length}/2000 caracteres</p>
          </div>

          <div>
            <Label>Nota</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`flex h-10 items-center gap-1 rounded-full border px-4 text-sm font-semibold transition ${
                    rating === value ? "border-amber-300 bg-amber-50 text-amber-800" : "border-line bg-white text-slate-500 hover:border-amber-200"
                  }`}
                  onClick={() => setRating(value)}
                >
                  <Star className="h-4 w-4" />
                  {value}
                </button>
              ))}
            </div>
          </div>

          {statusMessage && <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{statusMessage}</p>}

          <div className="flex justify-end">
            <Button className="gap-2" disabled={message.trim().length < 3 || mutation.isPending} onClick={submit}>
              <Send className="h-4 w-4" />
              {mutation.isPending ? "Enviando..." : "Enviar feedback"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
