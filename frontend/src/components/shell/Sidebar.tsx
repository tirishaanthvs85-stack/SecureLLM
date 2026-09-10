import { NavLink } from "react-router-dom";

const navigation = [
  ["/", "Overview"], ["/models", "Models"], ["/datasets", "Datasets"], ["/runs", "Benchmark runs"], ["/evaluations", "Evaluation results"], ["/security", "Security analysis"],
  ["/dataset-versions", "Dataset versions"], ["/layer2", "Layer 2 evidence"], ["/reviews", "Scientific reviews"],
  ["/metrics/bsda", "BSDA"], ["/metrics/recovery", "Recovery capability"], ["/metrics/saea", "SAEA"], ["/metrics/draa", "DRAA"], ["/metrics/pri", "PRI"], ["/metrics/dqi", "DQI"],
  ["/ml", "ML prediction"], ["/statistics", "Statistical analysis"], ["/comparison", "Model comparison"], ["/records", "Experiment details"],
] as const;

export function Sidebar() {
  return <nav className="sidebar" aria-label="Primary navigation"><div className="brand">SecureLLMBench<span>Research dashboard</span></div>{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}</nav>;
}
