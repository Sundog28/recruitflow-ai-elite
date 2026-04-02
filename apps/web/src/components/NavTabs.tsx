const tabs = [
  { key: 'analyze', label: 'Analyze' },
  { key: 'rank', label: 'Rank Jobs' },
  { key: 'bullets', label: 'Improve Bullets' },
  { key: 'ats', label: 'ATS Optimizer' },
  { key: 'report', label: 'Recruiter Report' },
  { key: 'history', label: 'History' },
] as const

export type TabKey = (typeof tabs)[number]['key']

export default function NavTabs({ value, onChange }: { value: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${value === tab.key ? 'border-indigo-400 bg-indigo-500/15 text-indigo-200' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
