import { NavLink } from "react-router-dom";

const workspace = [["/", "Dashboard"], ["/benchmark", "Test LLM"]] as const;
const metrics = [
  ["/reviews", "Scientific reviews"], ["/metrics/bsda", "BSDA"], ["/metrics/recovery", "Recovery capability"], ["/metrics/saea", "SAEA"],
  ["/metrics/draa", "DRAA"], ["/metrics/pri", "PRI"], ["/metrics/dqi", "DQI"], ["/ml", "ML prediction"], ["/statistics", "Statistical analysis"],
] as const;

function NavigationLinks({ items }: { items: readonly (readonly [string, string])[] }) {
  return <>{items.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}</>;
}

export function Sidebar() {
  return <nav className="sidebar" aria-label="Primary navigation">
    <div className="brand">SecureLLMBench<span>Research dashboard</span></div>
    <div className="nav-group"><span className="nav-label">Workspace</span><NavigationLinks items={workspace} /></div>
    <div className="nav-group"><span className="nav-label">Metrics & review</span><NavigationLinks items={metrics} /></div>
    <div className="sidebar-note"><strong>Evidence first</strong><span>Catalogues, saved runs, reports, and comparisons are on the Dashboard.</span></div>
  </nav>;
}
