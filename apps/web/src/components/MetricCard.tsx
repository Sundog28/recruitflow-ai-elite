import type { ReactNode } from 'react'

export default function MetricCard({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_0_0_1px_rgba(99,102,241,0.05)]">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      {helper ? <div className="mt-2 text-sm text-slate-400">{helper}</div> : null}
    </div>
  )
}
