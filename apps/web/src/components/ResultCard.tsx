import { AnalyzeResponse } from "../lib/api";
import ScoreBar from "./ScoreBar";

type Props = {
  result: AnalyzeResponse | null;
};

function ScoreBadge({ label }: { label: string }) {
  let classes = "inline-flex rounded-full px-3 py-1 text-sm font-semibold ";
  if (label === "strong match") classes += "bg-green-500/20 text-green-300";
  else if (label === "potential match") classes += "bg-yellow-500/20 text-yellow-300";
  else classes += "bg-red-500/20 text-red-300";

  return <span className={classes}>{label}</span>;
}

export default function ResultCard({ result }: Props) {
  if (!result) return null;

  const atsScore = result.ats_score ?? Math.round(result.semantic_similarity * 100);
  const skillScore = result.skill_score ?? Math.round((result.matched_skills.length / Math.max(result.matched_skills.length + result.missing_skills.length, 1)) * 100);
  const expScore = result.experience_score ?? 75;

  return (
    <div className="card mt-8 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis Result</h2>
          <p className="text-sm text-muted">
            Candidate: {result.candidate_name || "Unknown"} • File: {result.resume_filename || "N/A"}
          </p>
        </div>
        <ScoreBadge label={result.predicted_label} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white/5 p-4">
          <div className="text-sm text-muted">Fit Score</div>
          <div className="mt-2 text-3xl font-bold">{result.fit_score}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <div className="text-sm text-muted">ATS Score</div>
          <div className="mt-2 text-3xl font-bold">{atsScore}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <div className="text-sm text-muted">Semantic Similarity</div>
          <div className="mt-2 text-3xl font-bold">{result.semantic_similarity}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <div className="text-sm text-muted">Model Version</div>
          <div className="mt-2 text-lg font-semibold">{result.model_version}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ScoreBar label="ATS Alignment" value={atsScore} />
        <ScoreBar label="Skill Coverage" value={skillScore} />
        <ScoreBar label="Experience Match" value={expScore} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Matched Skills</h3>
          <div className="flex flex-wrap gap-2">
            {result.matched_skills.length ? result.matched_skills.map((skill) => (
              <span key={skill} className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">
                {skill}
              </span>
            )) : <p className="text-muted">None</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {result.missing_skills.length ? result.missing_skills.map((skill) => (
              <span key={skill} className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">
                {skill}
              </span>
            )) : <p className="text-muted">None</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Strengths</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            {result.strengths.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Recommendations</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            {result.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
