import "server-only";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface Turn {
  role: "user" | "model";
  text: string;
}

interface GeminiOpts {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

async function callGemini(system: string, turns: Turn[], opts: GeminiOpts & { responseSchema?: unknown }): Promise<string> {
  const model = DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.6,
    maxOutputTokens: opts.maxTokens ?? 700,
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (opts.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = opts.responseSchema;
  }

  const body = {
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    systemInstruction: { parts: [{ text: system }] },
    generationConfig,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Free-text Gemini reply. */
export async function geminiGenerate(system: string, turns: Turn[], opts: GeminiOpts = {}): Promise<string> {
  return callGemini(system, turns, opts);
}

/** Structured JSON Gemini reply, parsed against the given response schema. */
export async function geminiJSON<T>(system: string, turns: Turn[], schema: unknown, opts: GeminiOpts = {}): Promise<T> {
  const text = await callGemini(system, turns, { ...opts, responseSchema: schema });
  return JSON.parse(text) as T;
}
