import { endpoints } from "./endpoints";
import { ApiError, type HealthStatus, type PaginatedScientificRecords, type ReadinessStatus } from "./types";

const baseUrl = import.meta.env.VITE_SECURELLM_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(undefined, message);
  }

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed with HTTP ${response.status}`, response.headers.get("X-Request-ID") ?? undefined);
  }
  return (await response.json()) as T;
}

export const apiClient = {
  runtimeModels: () => request<{ available: boolean; execution_enabled: boolean; reason?: string; items: { name: string; digest: string; details?: { parameter_size?: string; quantization_level?: string } }[] }>("/runtime-models"),
  jobs: () => request<{ items: { id: string; model: string; status: string; error?: string }[] }>("/benchmark-jobs"),
  startRun: (model: string) => request<{ id: string; status: string }>("/internal/benchmark-jobs", { method: "POST", headers: { "Content-Type": "application/json", "X-SecureLLM-Local": "1" }, body: JSON.stringify({ model }) }),
  resources: (resource: string, offset = 0, filterBy?: string, value?: string) => {
    const query = new URLSearchParams({ limit: "25", offset: String(offset) });
    if (filterBy && value !== undefined) { query.set("filter_by", filterBy); query.set("value", value); }
    return request<{ items: Record<string, unknown>[]; total: number; limit: number; offset: number }>(`/${resource}?${query}`);
  },
  summary: () => request<{ counts: Record<string, number> }>("/dashboard-summary"),
  health: () => request<HealthStatus>(endpoints.health),
  ready: () => request<ReadinessStatus>(endpoints.ready),
  scientificRecords: (options: { family?: string; limit: number; offset: number }) => {
    const query = new URLSearchParams({ limit: String(options.limit), offset: String(options.offset) });
    if (options.family) query.set("family", options.family);
    return request<PaginatedScientificRecords>(`${endpoints.scientificRecords}?${query.toString()}`);
  },
};
