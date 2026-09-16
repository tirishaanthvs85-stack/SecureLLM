import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useModelScores } from "../api/hooks";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { ModelScoreboard } from "../components/common/ModelScoreboard";

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
export function Overview() {
  const query = useQuery({ queryKey: ["dashboard-summary"], queryFn: apiClient.summary, retry: false });
  const scores = useModelScores(5);
  return <section><div className="eyebrow">SecureLLMBench / Research workspace</div><h1>Evidence, in perspective.</h1><p className="lede">Test an installed model, inspect every persisted result, and keep operational observations separate from validated scientific conclusions.</p><p><Link className="primary-button inline-action" to="/benchmark">Test an LLM</Link></p>
    {query.isLoading && <LoadingState />}{query.isError && <ErrorState error={query.error} />}
    {query.data && <div className="stat-grid">{cards.map(([key, label, path]) => <Link to={path} key={key}><article><span>{label}</span><strong>{query.data.counts[key]}</strong><small>Explore records →</small></article></Link>)}</div>}
    <div className="section-divider" />
    <h2>Latest Tested Model Scores</h2>
    {scores.isLoading && <LoadingState />}{scores.isError && <ErrorState error={scores.error} />}{scores.data && <ModelScoreboard scores={scores.data.items} />}
    <div className="section-divider" />
    <div className="catalogue-heading"><div><div className="eyebrow">Evidence catalogue</div><h2>Explore saved data and reports</h2></div><p>These pages are grouped here to keep the sidebar focused on testing and metrics.</p></div>
    <div className="catalogue-grid">{catalogue.map(([path, title, description]) => <Link key={path} to={path}><article><h3>{title}</h3><p>{description}</p><span>Open →</span></article></Link>)}</div>
    <div className="research-note"><div className="eyebrow">Reading this workspace</div><h2>Availability is not validation.</h2><p>These are database counts, not quality or security scores. Example datasets remain labelled in provenance. Scientific results appear only when persisted from an identified source.</p><Link to="/records">Browse scientific evidence →</Link></div>
  </section>;
}
