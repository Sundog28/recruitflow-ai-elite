interface Props {
  title: string
  skills: string[]
  tone?: 'green' | 'amber'
}

export default function SkillPills({ title, skills, tone = 'green' }: Props) {
  const color = tone === 'green' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span key={skill} className={`rounded-full border px-3 py-1 text-sm ${color}`}>
              {skill}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">None</span>
        )}
      </div>
    </div>
  )
}
