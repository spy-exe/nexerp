const skeletonCards = Array.from({ length: 4 }, (_, index) => index)

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {skeletonCards.map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-[28px] border border-line bg-white/75" />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-80 animate-pulse rounded-[28px] border border-line bg-white/75" />
        <div className="h-80 animate-pulse rounded-[28px] border border-line bg-white/75" />
      </section>
      <div className="h-64 animate-pulse rounded-[28px] border border-line bg-white/75" />
    </div>
  )
}
