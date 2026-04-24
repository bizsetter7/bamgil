export default function Loading() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="h-10 w-48 bg-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-5 w-64 bg-zinc-900 rounded-xl animate-pulse" />
        </div>
        <div className="h-12 w-40 bg-zinc-900 rounded-2xl animate-pulse" />
      </header>

      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 bg-zinc-900 rounded-full shrink-0 animate-pulse" />
        ))}
      </div>

      <section className="w-full h-[450px] bg-zinc-900 rounded-[2.5rem] animate-pulse" />

      <section className="space-y-6">
        <div className="h-8 w-40 bg-zinc-900 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-zinc-900 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}
