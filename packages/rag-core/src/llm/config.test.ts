import { describe, expect, it } from "vitest";
import { DEFAULT_ANTHROPIC_MODEL, OPENROUTER_BASE_URL, resolveLlmConfig } from "./config";

describe("resolveLlmConfig", () => {
  it("defaults to Anthropic with the documented model when LLM_PROVIDER is unset", () => {
    const config = resolveLlmConfig({ ANTHROPIC_API_KEY: "sk-ant-test" });

    expect(config).toEqual({
      provider: "anthropic",
      apiKey: "sk-ant-test",
      model: DEFAULT_ANTHROPIC_MODEL,
    });
  });

  it("does not set a baseUrl for Anthropic, so the native SDK is used", () => {
    expect(resolveLlmConfig({ ANTHROPIC_API_KEY: "k" }).baseUrl).toBeUndefined();
  });

  it("resolves OpenRouter with its OpenAI-compatible base URL", () => {
    const config = resolveLlmConfig({
      LLM_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "sk-or-test",
      LLM_MODEL: "anthropic/claude-3.5-haiku",
    });

    expect(config).toEqual({
      provider: "openrouter",
      apiKey: "sk-or-test",
      model: "anthropic/claude-3.5-haiku",
      baseUrl: OPENROUTER_BASE_URL,
    });
  });

  it("lets LLM_MODEL override the Anthropic default", () => {
    const config = resolveLlmConfig({ ANTHROPIC_API_KEY: "k", LLM_MODEL: "claude-sonnet-4-5" });

    expect(config.model).toBe("claude-sonnet-4-5");
  });

  it("requires an explicit model for OpenRouter rather than guessing a slug", () => {
    // OpenRouter hosts thousands of vendor/model slugs; a wrong default would
    // surface as a confusing upstream 404 instead of a clear setup error.
    expect(() =>
      resolveLlmConfig({ LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "k" }),
    ).toThrow(/LLM_MODEL/);
  });

  it("fails loudly when the selected provider's key is missing", () => {
    expect(() => resolveLlmConfig({})).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => resolveLlmConfig({ LLM_PROVIDER: "openrouter", LLM_MODEL: "x/y" })).toThrow(
      /OPENROUTER_API_KEY/,
    );
  });

  it("rejects an unknown provider instead of silently falling back", () => {
    expect(() => resolveLlmConfig({ LLM_PROVIDER: "ollama", ANTHROPIC_API_KEY: "k" })).toThrow(
      /Unknown LLM_PROVIDER/,
    );
  });
});
