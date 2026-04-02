import type { PropsWithChildren } from 'react'

export default function Panel({ children }: PropsWithChildren) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">{children}</div>
}
