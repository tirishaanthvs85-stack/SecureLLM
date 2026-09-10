import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { EntityPage } from "./EntityPage";

export function ModelsPage() {
  const client = useQueryClient();
  const runtime = useQuery({ queryKey: ["runtime-models"], queryFn: apiClient.runtimeModels, refetchInterval: 15000, retry: false });
  const jobs = useQuery({ queryKey: ["benchmark-jobs"], queryFn: apiClient.jobs, refetchInterval: 3000, retry: false });
  const start = useMutation({ mutationFn: apiClient.startRun, onSuccess: () => { void client.invalidateQueries(); } });
  const running = jobs.data?.items.some(job => job.status === "running");
  return <><section><div className="eyebrow">Local execution / Installed models</div><h1>Test your models</h1><p>Run the existing three-case example dataset against an installed model. Each run saves actual responses, timings, detector evidence, descriptive PRI profiles and latency statistics.</p><p className="notice">Pilot data only. The example corpus and existing smoke-rule detectors are not validated security assessments. No model downloads or cloud requests are made.</p>
    {runtime.isLoading && <LoadingState />}{runtime.isError && <ErrorState error={runtime.error} />}
    {runtime.data && <>{!runtime.data.available && <p>{runtime.data.reason}</p>}{runtime.data.available && runtime.data.items.length === 0 && <p>No models are installed in the local Ollama service.</p>}
      {!runtime.data.execution_enabled && <p>Execution is disabled on this server. Start the local workspace using scripts/start_local.ps1.</p>}
      <div className="stat-grid">{runtime.data.items.map(model => <article key={model.digest}><h2>{model.name}</h2><p>{model.details?.parameter_size} · {model.details?.quantization_level}</p><small>Installed locally · digest {model.digest.slice(0, 12)}</small><p><button disabled={!runtime.data.execution_enabled || running || start.isPending || jobs.isError || jobs.isLoading} onClick={() => start.mutate(model.name)}>Run example benchmark</button></p></article>)}</div>
    </>}{start.isError && <ErrorState error={start.error} />}{start.isSuccess && <p role="status">Run submitted. Progress appears below.</p>}
    {jobs.isError && <ErrorState error={jobs.error} />}{jobs.data && jobs.data.items.length > 0 && <div className="research-note"><h2>Session execution jobs</h2><p>Completed evidence is retained under Benchmark runs. This live job list resets when the server restarts.</p>{jobs.data.items.map(job => <p key={job.id}><strong>{job.model}</strong> · {job.status} {job.error ?? ""} {job.status !== "running" && <Link to={`/evaluations?filter_by=benchmark_run_id&value=${job.id}`}>View results →</Link>}</p>)}</div>}
  </section><div className="section-divider" /><EntityPage title="Saved model configurations" resource="models" description="Exact model digests and generation settings used in persisted benchmark runs." /></>;
}
