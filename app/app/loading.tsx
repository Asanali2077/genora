/** Instant skeleton while an app section loads, so navigation responds immediately. */
export default function AppLoading() {
  return (
    <div className="px-5 pt-8 md:px-10 md:pt-12" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-32 animate-pulse rounded bg-ink/[0.08]" />
      <div className="mt-4 h-10 w-full max-w-xl animate-pulse rounded-lg bg-ink/[0.08]" />
      <div className="mt-3 h-5 w-72 animate-pulse rounded bg-ink/[0.06]" />
      <div className="mt-10 grid max-w-6xl gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="panel h-80 animate-pulse" />
        <div className="space-y-6">
          <div className="panel h-48 animate-pulse" />
          <div className="panel h-28 animate-pulse" />
        </div>
      </div>
    </div>
  );
}