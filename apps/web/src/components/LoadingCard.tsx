export default function LoadingCard() {
  return (
    <div className="card mt-8 p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded bg-white/10"></div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="h-24 rounded-xl bg-white/10"></div>
          <div className="h-24 rounded-xl bg-white/10"></div>
          <div className="h-24 rounded-xl bg-white/10"></div>
          <div className="h-24 rounded-xl bg-white/10"></div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="h-20 rounded-xl bg-white/10"></div>
          <div className="h-20 rounded-xl bg-white/10"></div>
          <div className="h-20 rounded-xl bg-white/10"></div>
        </div>
      </div>
    </div>
  );
}
