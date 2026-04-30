function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-slate-200 bg-white ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-36" />)}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Block className="h-72" />
        <Block className="h-72" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Block className="h-72" />
        <Block className="h-72" />
      </section>
    </div>
  )
}

export function FormListSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <Block className="h-[520px]" />
      <div className="space-y-3">
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
    </div>
  )
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Block className="h-[430px]" />
        <Block className="h-[430px]" />
      </section>
      <Block className="h-80" />
    </div>
  )
}

export function FinanceSkeleton() {
  return (
    <div className="space-y-6">
      <Block className="h-20" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-28" />)}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Block className="h-96" />
        <Block className="h-96" />
      </section>
      <Block className="h-[420px]" />
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Block className="h-20" />
      <section className="grid gap-4 lg:grid-cols-3">
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Block className="h-80" />
        <Block className="h-80" />
      </section>
    </div>
  )
}
