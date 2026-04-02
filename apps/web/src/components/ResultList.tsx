interface Props {
  title: string
  items: string[]
}

export default function ResultList({ title, items }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
