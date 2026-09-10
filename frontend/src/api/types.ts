export interface HealthStatus {
  service: string;
  status: string;
  [key: string]: unknown;
}

export interface ReadinessStatus {
  status: "ready" | "unavailable";
}

export interface ScientificRecord {
  id: string;
  family: string;
  schema_version: string;
  scope: string;
  status: string | null;
  payload: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface PaginatedScientificRecords {
  items: ScientificRecord[];
  limit: number;
  offset: number;
}

export interface ModelScore {
  id: string;
  run_id: string;
  model_name: string;
  status: string;
  model_score: number | null;
  mean_threat_score: number | null;
  worst_case_threat_score: number | null;
  coverage: number;
  completed_evaluations: number;
  total_evaluations: number;
  formula_version: string;
  formula: Record<string, string>;
  warnings: string[];
  provenance: Record<string, unknown>;
}

export interface PaginatedModelScores {
  items: ModelScore[];
  total: number;
  limit: number;
  offset: number;
}

export type ApiState = "loading" | "success" | "not_found" | "failure";

export class ApiError extends Error {
  constructor(
    public readonly status: number | undefined,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
