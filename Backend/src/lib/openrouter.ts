const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL?.replace(/\/$/, "") || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChatOptions {
  model?: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterChatResponse {
  choices?: Array<{
    message?: { role: string; content?: string };
    finish_reason?: string;
  }>;
  error?: { message: string };
}

export async function openRouterChat(options: OpenRouterChatOptions): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const url = `${OPENROUTER_BASE}/chat/completions`;
  const body = {
    model: options.model || OPENROUTER_MODEL,
    messages: options.messages,
    max_tokens: options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0.5,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as OpenRouterChatResponse;

  if (!res.ok) {
    const msg = data.error?.message || data?.toString() || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const content = data.choices?.[0]?.message?.content;
  if (content != null) return content.trim();
  throw new Error("Empty response from OpenRouter");
}
