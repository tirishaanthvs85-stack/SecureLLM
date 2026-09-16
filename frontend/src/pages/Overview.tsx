import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { apiClient } from "../api/client";
import { useModelScores } from "../api/hooks";
import type { ModelScore } from "../api/types";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { ModelScoreboard } from "../components/common/ModelScoreboard";
import { LiveProgress } from "../components/benchmark/LiveProgress";
import { CalibrationResults } from "../components/metrics/CalibrationResults";
import { MetricStatusBoard } from "../components/metrics/MetricStatusBoard";

const cards = [["datasets", "Datasets", "/datasets"], ["models", "Model configurations", "/models"], ["benchmark-runs", "Benchmark runs", "/runs"], ["evaluations", "Evaluations", "/evaluations"], ["model-scores", "Detector summaries", "/models"], ["scientific-records", "Scientific records", "/records"], ["scientific-reviews", "Scientific reviews", "/reviews"]];
const catalogue = [
  ["/models", "Model library", "Installed models and saved model configurations"],
  ["/runs", "Benchmark runs", "Execution status and run provenance"],
  ["/evaluations", "Evaluation results", "Responses, latency, and execution records"],
  ["/security", "Layer 1 analysis", "Detector-native observations"],
  ["/layer2", "Layer 2 evidence", "Source-native judge dimensions"],
  ["/datasets", "Datasets & versions", "Source inputs and immutable snapshots"],
  ["/comparison", "Configuration comparison", "Saved settings side by side"],
  ["/records", "Experiment details", "Raw scientific-record families"],
] as const;

function percent(value: number | null | undefined) { return typeof value === "number" ? Math.round(value * 100) : 0; }

function CoverageRing({ score }: { score: ModelScore }) {
  const coverage = percent(score.coverage);
  return <article className="visual-card coverage-card">
    <div className="coverage-ring" style={{ "--coverage": `${coverage * 3.6}deg` } as CSSProperties}><strong>{coverage}%</strong><span>coverage</span></div>
    <div><span className="visual-label">Latest completed run</span><h3>{score.model_name}</h3><p>{score.completed_evaluations}/{score.total_evaluations} cases recorded</p><Link to={`/results/${encodeURIComponent(score.run_id)}`}>Open report →</Link></div>
  </article>;
}

function DetectorBars({ scores }: { scores: ModelScore[] }) {
  return <article className="visual-card detector-bars"><div className="card-heading"><div><span className="visual-label">Detector-summary trend</span><h3>Observed run summaries</h3></div><span className="status status-uncalibrated">Engineering only</span></div>
    {scores.length === 0 ? <p>No completed summaries yet. Test a local model to populate this chart.</p> : <div className="bar-list">{scores.map(score => { const value = percent(score.model_score); return <div className="bar-row" key={score.id}><div><strong>{score.model_name}</strong><small>{new Date(score.created_at).toLocaleString()}</small></div><div className="bar-track"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>; })}</div>}
    <p className="chart-note">Higher means fewer signals from the configured Layer 1 detectors in completed repository-example evaluations. It is not a safety rating or model recommendation.</p>
  </article>;
}

function RunTimeline({ scores }: { scores: ModelScore[] }) {
  return <article className="visual-card activity-card"><div className="card-heading"><div><span className="visual-label">Recent activity</span><h3>Persisted testing events</h3></div><Link to="/runs">View runs →</Link></div>
    <div className="activity-list">{scores.length === 0 ? <p>No persisted test event yet.</p> : scores.slice(0, 4).map(score => <div className="activity-row" key={score.id}><span className="activity-dot" /><div><strong>{score.model_name} benchmark completed</strong><small>{new Date(score.created_at).toLocaleString()} · {score.completed_evaluations}/{score.total_evaluations} cases</small></div><Link to={`/results/${encodeURIComponent(score.run_id)}`}>Report</Link></div>)}</div>
  </article>;
}
export function Overview() {
  const query = useQuery({ queryKey: ["dashboard-summary"], queryFn: apiClient.summary, retry: false });
  const scores = useModelScores(5);
  const jobs = useQuery({ queryKey: ["benchmark-jobs"], queryFn: apiClient.jobs, refetchInterval: 1000, retry: false });
  const activeJob = jobs.data?.items.find(job => job.status === "running");
  return <section><div className="eyebrow">SecureLLMBench / Research workspace</div><h1>Evidence, in perspective.</h1><p className="lede">Test an installed model, inspect every persisted result, and keep operational observations separate from validated scientific conclusions.</p><p><Link className="primary-button inline-action" to="/benchmark">Test an LLM</Link></p>
    {query.isLoading && <LoadingState />}{query.isError && <ErrorState error={query.error} />}
    {query.data && <div className="stat-grid dashboard-counts">{cards.map(([key, label, path]) => <Link to={path} key={key}><article><span>{label}</span><strong>{query.data.counts[key]}</strong><small>Explore records →</small></article></Link>)}</div>}
    {activeJob && <section className="active-test"><div className="section-title"><div><div className="eyebrow">Active benchmark</div><h2>{activeJob.model} is being tested</h2></div><span className="status status-running">Live</span></div><LiveProgress runId={activeJob.id} /></section>}
    {scores.data && <div className="dashboard-visuals"><div className="visual-primary">{scores.data.items[0] ? <CoverageRing score={scores.data.items[0]} /> : <article className="visual-card coverage-card"><div className="coverage-ring empty-ring"><strong>—</strong><span>coverage</span></div><div><span className="visual-label">Latest completed run</span><h3>Awaiting a benchmark</h3><p>Run an installed model to generate a persisted report.</p><Link to="/benchmark">Test an LLM →</Link></div></article>}<RunTimeline scores={scores.data.items} /></div><DetectorBars scores={scores.data.items} /></div>}
    <div className="section-divider" />
    <CalibrationResults />
    <MetricStatusBoard />
    <div className="section-divider" />
    <h2>Detailed detector summaries</h2>
    {scores.isLoading && <LoadingState />}{scores.isError && <ErrorState error={scores.error} />}{scores.data && <ModelScoreboard scores={scores.data.items} />}
    <div className="section-divider" />
    <div className="catalogue-heading"><div><div className="eyebrow">Evidence catalogue</div><h2>Explore saved data and reports</h2></div><p>These pages are grouped here to keep the sidebar focused on testing and metrics.</p></div>
    <div className="catalogue-grid">{catalogue.map(([path, title, description]) => <Link key={path} to={path}><article><h3>{title}</h3><p>{description}</p><span>Open →</span></article></Link>)}</div>
    <div className="research-note"><div className="eyebrow">Reading this workspace</div><h2>Availability is not validation.</h2><p>These are database counts, not quality or security scores. Example datasets remain labelled in provenance. Scientific results appear only when persisted from an identified source.</p><Link to="/records">Browse scientific evidence →</Link></div>
  </section>;
}
