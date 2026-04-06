type Props = {
  label: string;
  value: number;
};

export default function ScoreBar({ label, value }: Props) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-xl bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold">{safeValue}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
