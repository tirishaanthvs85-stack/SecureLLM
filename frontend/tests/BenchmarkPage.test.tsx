import { fireEvent, screen } from "@testing-library/react";
import App from "../src/App";
import { renderWithProviders } from "./test-utils";

const response = (payload: unknown) => Promise.resolve(new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } }));

describe("benchmark workspace", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows three presets as untested choices and only enables an installed local model", async () => {
    vi.stubGlobal("fetch", vi.fn((input: string) => {
      if (input.includes("showcase-models")) return response({ items: [
        { id: "gemma3:4b", name: "Gemma 3 4B", ollama_model: "gemma3:4b", description: "Preset", access: "Install locally" },
        { id: "qwen3.5:2b", name: "Qwen 3.5 2B", ollama_model: "qwen3.5:2b", description: "Preset", access: "Install locally" },
        { id: "llama3.2:3b", name: "Llama 3.2 3B", ollama_model: "llama3.2:3b", description: "Preset", access: "Install locally" },
      ], remote_execution_enabled: false, note: "Presets are not tested." });
      if (input.includes("runtime-models")) return response({ available: true, execution_enabled: true, items: [{ name: "gemma3:4b", digest: "a" }] });
      if (input.includes("benchmark-jobs")) return response({ items: [] });
      return response({ status: "ready" });
    }));
    renderWithProviders(<App />, "/benchmark");
    expect(await screen.findByText("Gemma 3 4B")).toBeInTheDocument();
    expect(screen.getAllByText("Showcase preset")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Run pilot benchmark" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getByRole("button", { name: "Run pilot benchmark" })).toBeEnabled();
  });

  it("requires an enabled server before allowing a remote endpoint run", async () => {
    vi.stubGlobal("fetch", vi.fn((input: string) => {
      if (input.includes("showcase-models")) return response({ items: [], remote_execution_enabled: false, note: "Remote disabled." });
      if (input.includes("runtime-models")) return response({ available: true, execution_enabled: true, items: [] });
      if (input.includes("benchmark-jobs")) return response({ items: [] });
      return response({ status: "ready" });
    }));
    renderWithProviders(<App />, "/benchmark");
    await screen.findByText("Remote disabled.");
    fireEvent.change(screen.getByLabelText("Provider"), { target: { value: "openai-compatible" } });
    fireEvent.change(screen.getByLabelText("Model identifier"), { target: { value: "external-model" } });
    fireEvent.change(screen.getByLabelText("HTTPS endpoint"), { target: { value: "https://provider.example/v1" } });
    expect(screen.getByText("Remote endpoint execution is disabled on this server.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run pilot benchmark" })).toBeDisabled();
  });
});
