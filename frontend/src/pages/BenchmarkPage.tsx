import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import type { BenchmarkRunInput } from "../api/types";
import { ErrorState, LoadingState } from "../components/common/AsyncState";

type Provider = BenchmarkRunInput["provider"];

export function BenchmarkPage() {
  const client = useQueryClient();
  const [search] = useSearchParams();
  const [provider, setProvider] = useState<Provider>("ollama-local");
  const [model, setModel] = useState(search.get("model") ?? "");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const runtime = useQuery({ queryKey: ["runtime-models"], queryFn: apiClient.runtimeModels, refetchInterval: 15000, retry: false });
  const showcase = useQuery({ queryKey: ["showcase-models"], queryFn: apiClient.showcaseModels, retry: false });
  const jobs = useQuery({ queryKey: ["benchmark-jobs"], queryFn: apiClient.jobs, refetchInterval: 2500, retry: false });
  const running = jobs.data?.items.some((job) => job.status === "running") ?? false;
  const installed = useMemo(() => new Set(runtime.data?.items.map((item) => item.name) ?? []), [runtime.data]);
  const start = useMutation({
    mutationFn: apiClient.startRun,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["benchmark-jobs"] }); },
  });

  useEffect(() => {
    const requested = search.get("model");
    if (requested) setModel(requested);
  }, [search]);

  function chooseShowcase(name: string) {
    setProvider("ollama-local");
    setModel(name);
    setEndpoint("");
    setApiKey("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: BenchmarkRunInput = provider === "ollama-local"
      ? { provider, model }
      : { provider, model, endpoint, api_key: apiKey || undefined };
    start.mutate(input);
  }

  const canSubmit = Boolean(model.trim()) && runtime.data?.execution_enabled && !running && !start.isPending &&
    (provider === "ollama-local" ? installed.has(model) : Boolean(endpoint.trim()) && Boolean(showcase.data?.remote_execution_enabled));

  return <section className="benchmark-workspace">
    <div className="eyebrow">Benchmark workspace</div>
    <h1>Run a traceable benchmark</h1>
    <p className="lede">Choose a local showcase model or connect an OpenAI-compatible endpoint. The three existing repository cases are executed as a pilot; results become persisted benchmark records for dashboard review.</p>
    <div className="notice"><h2>What this run measures</h2><p>Actual responses, latency, configured Layer 1 detector evidence, descriptive records, and provenance. It does not produce validated attack success, calibrated risk, or a scientific model ranking.</p></div>

    <div className="benchmark-grid">
      <div className="benchmark-panel"><h2>1. Choose a showcase model</h2>
        {showcase.isLoading && <LoadingState />}{showcase.isError && <ErrorState error={showcase.error} />}
        {showcase.data && <><p className="muted">{showcase.data.note}</p><div className="showcase-list">{showcase.data.items.map((item) => {
          const isInstalled = installed.has(item.ollama_model);
          return <article className={model === item.ollama_model && provider === "ollama-local" ? "showcase-card selected" : "showcase-card"} key={item.id}>
            <div><span className="status status-unspecified">Showcase preset</span><h3>{item.name}</h3><p>{item.description}</p><small>{isInstalled ? "Installed locally and ready to configure" : item.access}</small></div>
            <button type="button" onClick={() => chooseShowcase(item.ollama_model)}>{isInstalled ? "Select" : "Select preset"}</button>
          </article>;
        })}</div></>}
      </div>

      <form className="benchmark-panel run-form" onSubmit={submit}>
        <h2>2. Configure a model</h2>
        <label><span>Provider</span><select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
          <option value="ollama-local">Local Ollama</option><option value="openai-compatible">OpenAI-compatible endpoint</option>
        </select></label>
        <label><span>Model identifier</span><input value={model} onChange={(event) => setModel(event.target.value)} placeholder={provider === "ollama-local" ? "e.g. gemma3:4b" : "e.g. your-model-id"} required /></label>
        {provider === "ollama-local" && <p className="muted">Only models discovered from the local Ollama service can run. No model is downloaded by this application.</p>}
        {provider === "openai-compatible" && <><label><span>HTTPS endpoint</span><input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://provider.example/v1" required /></label>
          <label><span>API key (optional)</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Sent only for this run" /></label>
          <p className="muted">Remote execution must be enabled by the server operator. API keys are used only by the active job and are excluded from job responses, persistence, logs, and dashboard records.</p></>}
        {!runtime.data?.execution_enabled && runtime.data && <p className="notice">Benchmark execution is disabled. Start the backend with local execution enabled.</p>}
        {provider === "openai-compatible" && showcase.data && !showcase.data.remote_execution_enabled && <p className="notice">Remote endpoint execution is disabled on this server.</p>}
        <button className="primary-button" type="submit" disabled={!canSubmit}>{start.isPending ? "Submitting…" : running ? "A benchmark is running" : "Run pilot benchmark"}</button>
        {start.isError && <ErrorState error={start.error} />}
        {start.data && <p className="success-message" role="status">Benchmark submitted for <strong>{start.data.model}</strong>. The live job is shown below.</p>}
      </form>
    </div>

    <div className="benchmark-panel job-panel"><h2>3. Review execution and evidence</h2>
      {jobs.isLoading && <LoadingState />}{jobs.isError && <ErrorState error={jobs.error} />}
      {jobs.data?.items.length === 0 && <p className="muted">No live jobs in this server session. Completed runs remain in the dashboard.</p>}
      {jobs.data?.items.map((job) => <div className="job-row" key={job.id}><div><strong>{job.model}</strong><small>{job.provider} · {job.id}</small></div><span className={`status status-${job.status}`}>{job.status}</span>{job.error && <p>{job.error}</p>}{job.status !== "running" && <Link to={`/evaluations?filter_by=benchmark_run_id&value=${job.id}`}>Open evaluation results →</Link>}</div>)}
      <p><Link to="/runs">Browse persisted benchmark runs →</Link> · <Link to="/comparison">Compare saved model evidence →</Link></p>
    </div>
  </section>;
}
