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

export interface RuntimeModel {
  name: string;
  digest: string;
  details?: { parameter_size?: string; quantization_level?: string };
}

export interface RuntimeModelsResponse {
  available: boolean;
  execution_enabled: boolean;
  reason?: string;
  items: RuntimeModel[];
}

export interface ShowcaseModel {
  id: string;
  name: string;
  ollama_model: string;
  description: string;
  access: string;
}

export interface ShowcaseModelsResponse {
  items: ShowcaseModel[];
  remote_execution_enabled: boolean;
  note: string;
}

export interface BenchmarkJob {
  id: string;
  model: string;
  provider: "ollama-local" | "openai-compatible";
  status: string;
  error?: string;
}

export interface BenchmarkRunInput {
  model: string;
  provider: "ollama-local" | "openai-compatible";
  endpoint?: string;
  api_key?: string;
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
