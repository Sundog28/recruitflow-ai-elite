import { HistoryItem } from "../lib/api";

type Props = {
  items: HistoryItem[];
};

export default function HistoryPanel({ items }: Props) {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">Recent Analyses</h2>
      {items.length === 0 ? (
        <div className="card p-6 text-muted">No history yet.</div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="card p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{item.candidate_name || "Unknown Candidate"}</div>
                  <div className="text-sm text-muted">{item.resume_filename || "N/A"}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.fit_score}</div>
                  <div className="text-sm text-muted">{item.predicted_label}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted">
                Matched: {item.matched_skills.join(", ") || "None"}
              </div>
              <div className="mt-1 text-sm text-muted">
                Missing: {item.missing_skills.join(", ") || "None"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
