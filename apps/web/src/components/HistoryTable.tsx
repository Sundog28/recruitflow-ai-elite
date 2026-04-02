import type { HistoryItem } from '../types/analysis'

export default function HistoryTable({ items }: { items: HistoryItem[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-950/70 text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Missing skills</th>
            <th className="px-4 py-3">Model</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.analysis_id} className="border-t border-slate-800">
              <td className="px-4 py-3">{item.analysis_id}</td>
              <td className="px-4 py-3">{item.created_at}</td>
              <td className="px-4 py-3">{item.fit_score}</td>
              <td className="px-4 py-3">{item.predicted_label}</td>
              <td className="px-4 py-3">{item.top_missing_skills.join(', ') || '—'}</td>
              <td className="px-4 py-3">{item.model_version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
