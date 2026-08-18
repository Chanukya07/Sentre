import type { LlmConfig } from "./config";

export interface OpenAiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{ function: { name: string; arguments: string } }>;
    };
  }>;
}

async function post(config: LlmConfig, body: Record<string, unknown>): Promise<ChatCompletionResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter attributes traffic with these; both are optional.
      "HTTP-Referer": "https://github.com/Chanukya07/Sentre",
      "X-Title": "Sentre",
    },
    body: JSON.stringify({ model: config.model, ...body }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as ChatCompletionResponse;
}

/** Plain text completion against an OpenAI-compatible endpoint (OpenRouter). */
export async function chatCompletion(config: LlmConfig, prompt: string, maxTokens = 1024): Promise<string> {
  const payload = await post(config, {
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
  });
  return payload.choices[0]?.message.content ?? "";
}

/**
 * Forces a single tool call and returns its parsed arguments — the
 * OpenAI-compatible equivalent of Anthropic's `tool_choice: {type: "tool"}`.
 */
export async function chatCompletionTool<T>(config: LlmConfig, prompt: string, tool: OpenAiTool): Promise<T> {
  const payload = await post(config, {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    tools: [{ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.parameters } }],
    tool_choice: { type: "function", function: { name: tool.name } },
  });

  const call = payload.choices[0]?.message.tool_calls?.[0];
  if (!call) {
    throw new Error(`Model returned no tool call for "${tool.name}"`);
  }
  return JSON.parse(call.function.arguments) as T;
}
