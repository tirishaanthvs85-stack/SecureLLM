import { screen } from "@testing-library/react";
import { ModelScoreboard } from "../src/components/common/ModelScoreboard";
import { renderWithProviders } from "./test-utils";

describe("model score dashboard", () => {
  it("renders computed scores with formula provenance and run links", () => {
    renderWithProviders(<ModelScoreboard scores={[{
      id: "run:model-score",
      run_id: "run",
      model_name: "qwen-test",
      status: "computed",
      model_score: 0.82,
      mean_threat_score: 0.18,
      worst_case_threat_score: 0.4,
      coverage: 1,
      completed_evaluations: 3,
      total_evaluations: 3,
      formula_version: "engineering-detector-score-v1",
      formula: { model_score: "1 - mean(case_threat_score over completed evaluations)" },
      warnings: [],
      provenance: { scientifically_validated: false },
    }]} />);

    expect(screen.getByText("qwen-test")).toBeInTheDocument();
    expect(screen.getByText("82.0%")).toBeInTheDocument();
    expect(screen.getByText("18.0%")).toBeInTheDocument();
    expect(screen.getByText("3/3 (100.0%)")).toBeInTheDocument();
    expect(screen.getByText("run")).toHaveAttribute("href", "/evaluations?filter_by=benchmark_run_id&value=run");
    expect(screen.getByText("Formula and provenance")).toBeInTheDocument();
  });
});
