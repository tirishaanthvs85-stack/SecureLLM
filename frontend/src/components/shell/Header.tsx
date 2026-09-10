import { useHealth, useReadiness } from "../../api/hooks";

function label(loading: boolean, error: unknown, status?: string) {
  if (loading) return "API CHECKING";
  if (error) return "API UNREACHABLE";
  return status === "ready" ? "API READY" : status?.toUpperCase() ?? "API STATUS UNKNOWN";
}

export function Header() {
  const health = useHealth();
  const readiness = useReadiness();
  return <header><div><strong>Evidence browser</strong><p>Measurements are shown as source-native records, not conclusions.</p></div><div className="api-status" aria-live="polite"><span>{label(health.isLoading || readiness.isLoading, health.error ?? readiness.error, readiness.data?.status)}</span><small>liveness: {health.isLoading ? "checking" : health.isError ? "connection failed" : health.data?.status ?? "not reported"}</small>{(health.isError || readiness.isError) && <button onClick={() => { void health.refetch(); void readiness.refetch(); }}>Retry connection</button>}</div></header>;
}
