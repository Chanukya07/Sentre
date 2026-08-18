export type LlmProvider = "anthropic" | "openrouter";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Matches the model the engines used before the provider layer existed. */
export const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  /** Provider-native model id (Anthropic model id, or an OpenRouter `vendor/model` slug). */
  model: string;
  /** OpenAI-compatible base URL. Set for OpenRouter, absent for the native Anthropic SDK. */
  baseUrl?: string;
}

/**
 * Resolves which LLM backs generation, from the environment.
 *
 * Retrieval is unaffected: embeddings always come from Voyage, so switching
 * provider changes only the generation layer — the same property that makes
 * the four-engine comparison fair also makes the provider swap safe.
 */
export function resolveLlmConfig(env: Record<string, string | undefined> = process.env): LlmConfig {
  const provider = (env.LLM_PROVIDER ?? "anthropic") as LlmProvider;

  if (provider === "openrouter") {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("LLM_PROVIDER=openrouter requires OPENROUTER_API_KEY to be set.");
    }
    // OpenRouter hosts thousands of models under `vendor/model` slugs and has
    // no meaningful default, so this is required rather than guessed.
    const model = env.LLM_MODEL;
    if (!model) {
      throw new Error(
        "LLM_PROVIDER=openrouter requires LLM_MODEL to be set to an OpenRouter model slug " +
          '(e.g. "anthropic/claude-3.5-haiku"). Browse slugs at https://openrouter.ai/models.',
      );
    }
    return { provider, apiKey, model, baseUrl: OPENROUTER_BASE_URL };
  }

  if (provider !== "anthropic") {
    throw new Error(`Unknown LLM_PROVIDER: ${provider}. Use "anthropic" or "openrouter".`);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set.");
  }

  return { provider, apiKey, model: env.LLM_MODEL ?? DEFAULT_ANTHROPIC_MODEL };
}
