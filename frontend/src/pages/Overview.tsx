import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { ErrorState, LoadingState } from "../components/common/AsyncState";

const cards = [["datasets", "Datasets", "/datasets"], ["models", "Model configurations", "/models"], ["benchmark-runs", "Benchmark runs", "/runs"], ["evaluations", "Evaluations", "/evaluations"], ["scientific-records", "Scientific records", "/records"], ["scientific-reviews", "Explicit reviews", "/reviews"]];
export function Overview() {
  const query = useQuery({ queryKey: ["dashboard-summary"], queryFn: apiClient.summary, retry: false });
  return <section><div className="eyebrow">SecureLLMBench / Research workspace</div><h1>Evidence, in perspective.</h1><p className="lede">Explore the datasets, experiments and source evidence behind your research.</p>
    {query.isLoading && <LoadingState />}{query.isError && <ErrorState error={query.error} />}
    {query.data && <div className="stat-grid">{cards.map(([key, label, path]) => <Link to={path} key={key}><article><span>{label}</span><strong>{query.data.counts[key]}</strong><small>Explore records →</small></article></Link>)}</div>}
    <div className="research-note"><div className="eyebrow">Reading this workspace</div><h2>Availability is not validation.</h2><p>These are database counts, not quality or security scores. Example datasets remain labelled in provenance. Scientific results appear only when persisted from an identified source.</p><Link to="/records">Browse scientific evidence →</Link></div>
  </section>;
}
