import type { RankResponse } from '../types/analysis'

export default function RankResults({ data }: { data: RankResponse }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-100">
        Best match: <span className="font-semibold">{data.best_match_title}</span>
      </div>
      {data.jobs.map((job, index) => (
        <div key={job.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Rank #{index + 1}</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{job.title}</h3>
            </div>
            <div className="text-3xl font-bold text-white">{job.fit_score}</div>
          </div>
          <div className="mt-3 text-sm text-slate-300">Confidence: {job.confidence} · Similarity: {job.semantic_similarity}</div>
          <div className="mt-4 text-sm text-slate-200">{job.recruiter_summary}</div>
          <div className="mt-4 text-sm text-amber-200">Missing: {job.missing_skills.join(', ') || 'none'}</div>
        </div>
      ))}
    </div>
  )
}
