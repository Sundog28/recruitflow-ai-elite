import { useState } from "react";

type LocalJob = {
  id: number;
  title: string;
  description: string;
};

type LocalCandidate = {
  id: number;
  name: string;
  resume: string;
  score: number;
  status: string;
};

const rankedCandidates: LocalCandidate[] = [
  {
    id: 1,
    name: "Sarah Smith",
    resume: "sarah_ai_resume.pdf",
    score: 91,
    status: "interview",
  },
  {
    id: 2,
    name: "John Test",
    resume: "john_resume.pdf",
    score: 88,
    status: "screening",
  },
  {
    id: 3,
    name: "Mike Johnson",
    resume: "mike_fullstack_resume.pdf",
    score: 82,
    status: "offer",
  },
];

export default function JobRequisitionWorkspace() {
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rankedJobId, setRankedJobId] = useState<number | null>(null);

  function createJob() {
    if (!title.trim() || !description.trim()) {
      alert("Please enter both a job title and job description.");
      return;
    }

    const newJob: LocalJob = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
    };

    setJobs((current) => [newJob, ...current]);
    setTitle("");
    setDescription("");
    setRankedJobId(null);
  }

  function rankCandidates(jobId: number) {
    setRankedJobId(jobId);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
        Job Requisitions
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        Hiring Pipeline Management
      </h2>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input
          className="rounded-xl bg-zinc-950 p-3"
          placeholder="Job Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <input
          className="rounded-xl bg-zinc-950 p-3"
          placeholder="Job Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <button
          type="button"
          onClick={createJob}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-bold text-black"
        >
          Create Job
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5"
          >
            <h3 className="text-xl font-black">{job.title}</h3>

            <p className="mt-2 text-sm text-slate-300">
              {job.description}
            </p>

            <button
              type="button"
              onClick={() => rankCandidates(job.id)}
              className="mt-4 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black"
            >
              AI Rank Candidates
            </button>

            {rankedJobId === job.id ? (
              <div className="mt-5 space-y-3">
                <p className="font-bold">
                  Ranked Candidate Shortlist
                </p>

                {rankedCandidates.map((candidate, index) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-xl bg-black/40 p-4"
                  >
                    <div>
                      <div className="font-semibold">
                        #{index + 1} {candidate.name}
                      </div>

                      <div className="text-xs text-slate-400">
                        {candidate.resume}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Ranked against this job using RecruitFlow AI.
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-emerald-300">
                        {candidate.score}%
                      </div>

                      <div className="text-xs text-slate-400">
                        {candidate.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}