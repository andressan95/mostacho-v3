export default function RootLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6">
      <div className="h-5 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="h-16 w-3/4 animate-pulse rounded-[2rem] bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="glass-panel h-40 animate-pulse rounded-3xl bg-white/5"
          />
        ))}
      </div>
    </main>
  );
}
