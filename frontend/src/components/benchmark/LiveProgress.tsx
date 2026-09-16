import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";

export function LiveProgress({ runId }: { runId: string }) {
  const job = useQuery({ queryKey: ["benchmark-job", runId], queryFn: () => apiClient.job(runId), refetchInterval: 1000, retry: false });
  if (!job.data) return <div className="progress-container"><span>Connecting to benchmark job…</span></div>;
  const total = job.data.total_cases ?? 0;
  const completed = job.data.completed_cases ?? 0;
  const percentage = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  return <div className="progress-container" aria-live="polite"><div className="progress-text"><strong>{job.data.status === "running" ? `Running case ${completed}/${total || "…"}` : "Benchmark complete"}</strong><span>{percentage}% complete</span></div><div className="progress-bar"><i className={job.data.status === "running" ? "progress-fill active" : "progress-fill"} style={{ width: `${percentage}%` }} /></div><div className="stage-indicator"><span>{job.data.stage ?? "Preparing"}</span>{job.data.last_case_id && <span>Latest case: {job.data.last_case_id}</span>}{typeof job.data.last_latency_ms === "number" && <span>Latest latency: {job.data.last_latency_ms.toFixed(0)} ms</span>}</div></div>;
}
