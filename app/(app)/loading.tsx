export default function AppLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 pb-28 pt-8">
      <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="h-12 w-1/2 animate-pulse rounded-[2rem] bg-white/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="glass-panel h-36 animate-pulse rounded-3xl bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
