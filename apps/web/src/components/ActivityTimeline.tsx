import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type ActivityItem = {
  id: string | number;
  candidate_name?: string | null;
  fit_score?: number | null;
  status?: string | null;
  created_at: string;
  event_type: string;
  message: string;
};

type ActivityResponse = {
  count: number;
  activities: ActivityItem[];
};

function eventColor(eventType: string) {
  switch (eventType) {
    case "candidate_bookmarked":
      return "border-yellow-400 bg-yellow-500/10";

    case "candidate_analysis":
      return "border-cyan-400 bg-cyan-500/10";

    default:
      return "border-white/10 bg-white/5";
  }
}

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivity() {
    try {
      setLoading(true);
      setError("");

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/activity/feed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activity.");
      }

      const data: ActivityResponse =
        await response.json();

      setActivities(data.activities || []);
    } catch (err) {
      console.error(err);

      setError("Failed to load activity timeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Loading AI activity timeline...
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">
            Recruiter Intelligence
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            AI Activity Timeline
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Recruiter actions and AI-generated recruiting events.
          </p>
        </div>

        <button
          type="button"
          onClick={loadActivity}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
            No activity yet.
          </div>
        ) : (
          activities.map((activity) => (
            <article
              key={activity.id}
              className={`rounded-2xl border p-5 ${eventColor(
                activity.event_type
              )}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-300">
                    {activity.event_type.replaceAll(
                      "_",
                      " "
                    )}
                  </div>

                  <div className="mt-2 text-white font-semibold">
                    {activity.message}
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(
                      activity.created_at
                    ).toLocaleString()}
                  </div>
                </div>

                {activity.fit_score ? (
                  <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-emerald-300 font-black">
                    {activity.fit_score}%
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}