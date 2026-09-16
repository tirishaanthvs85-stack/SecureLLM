import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ErrorState, LoadingState } from "../components/common/AsyncState";

function percent(value: number | null | undefined) {
  return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "Not computed";
}

export function RunReportPage() {
  const { runId } = useParams();
  const report = useQuery({ queryKey: ["benchmark-run-report", runId], queryFn: () => apiClient.runReport(runId ?? ""), enabled: Boolean(runId), retry: false });
  return <section>
    <div className="eyebrow">Benchmark results / persisted evidence</div>
    <h1>Run report</h1>
    {report.isLoading && <LoadingState />}{report.isError && <ErrorState error={report.error} />}
    {report.data && <>
      <p className="lede"><strong>{report.data.run.model_name ?? "Model"}</strong> · run {report.data.run.id}</p>
      <div className="notice"><h2>{report.data.selection.label}</h2><p>{report.data.selection.reason}</p></div>
      <div className="stat-grid run-report-stats">
        <article><span>Completed cases</span><strong>{report.data.execution.completed_cases}/{report.data.execution.total_cases}</strong><small>{percent(report.data.execution.coverage)} coverage</small></article>
        <article><span>Mean latency</span><strong>{report.data.execution.mean_latency_ms === null ? "—" : `${report.data.execution.mean_latency_ms.toFixed(0)} ms`}</strong><small>Observed client elapsed time</small></article>
        <article><span>Detector summary</span><strong>{percent(report.data.model_score.value)}</strong><small>Engineering-only formula</small></article>
      </div>
      <div className="research-note"><h2>How to read this result</h2><p>{report.data.interpretation.observed_detector_signals}</p><p>{report.data.interpretation.model_score}</p></div>
      <h2>Observed detector signals</h2>
      {report.data.detector_summary.length === 0 ? <p className="empty">No Layer 1 detector records were persisted for this run.</p> : <div className="table-wrap"><table className="entity-table"><thead><tr><th>Detector</th><th>Maximum observed score</th><th>Signals observed</th></tr></thead><tbody>{report.data.detector_summary.map(item => <tr key={item.detector}><td>{item.detector}</td><td>{item.max_score.toFixed(3)}</td><td>{item.observed_signal_count}</td></tr>)}</tbody></table></div>}
      <h2>Case execution</h2>
      <div className="table-wrap"><table className="entity-table"><thead><tr><th>Case</th><th>Execution</th><th>Latency</th><th>Observed signals</th></tr></thead><tbody>{report.data.cases.map(item => <tr key={item.id}><td><code>{item.case_id ?? item.id}</code></td><td>{item.execution_status}{item.finish_reason ? ` · ${item.finish_reason}` : ""}</td><td>{item.latency_ms === null ? "—" : `${item.latency_ms.toFixed(1)} ms`}</td><td>{item.observed_detector_signals.length ? item.observed_detector_signals.map(signal => `${signal.detector} (${signal.score.toFixed(2)})`).join(", ") : "None recorded"}</td></tr>)}</tbody></table></div>
      <p><Link to={`/evaluations?filter_by=benchmark_run_id&value=${encodeURIComponent(report.data.run.id)}`}>Inspect full evaluation responses →</Link> · <Link to="/benchmark">Run another benchmark →</Link></p>
    </>}
  </section>;
}
