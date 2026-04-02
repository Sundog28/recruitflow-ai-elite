interface Props {
  score: number
  label: string
  similarity: number
  modelVersion: string
}

export default function ScoreCard({ score, label, similarity, modelVersion }: Props) {
  const tone =
    score >= 80
      ? 'from-emerald-500/25 to-indigo-500/10 border-emerald-500/30'
      : score >= 60
        ? 'from-indigo-500/25 to-sky-500/10 border-indigo-500/30'
        : score >= 45
          ? 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
          : 'from-rose-500/20 to-fuchsia-500/10 border-rose-500/30'

  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-6 ${tone}`}>
      <div className="text-sm uppercase tracking-[0.2em] text-slate-400">RecruitFlow AI score</div>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-6xl font-bold">{score}</span>
        <span className="pb-2 text-xl text-slate-300">/ 100</span>
      </div>
      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400" style={{ width: `${score}%` }} />
        </div>
        <div className="mt-2 text-sm text-slate-300">{score}% match strength</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
        <span className="rounded-full border border-slate-700 px-3 py-1">Label: {label}</span>
        <span className="rounded-full border border-slate-700 px-3 py-1">Similarity: {similarity}</span>
        <span className="rounded-full border border-slate-700 px-3 py-1">Model: {modelVersion}</span>
      </div>
    </div>
  )
}
