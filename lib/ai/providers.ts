import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type AIRequest = { system: string; user: string; imageDataUrl?: string; timeoutMs: number };
export type Provider = (req: AIRequest) => Promise<string>;

function parseDataUrl(url?: string): { mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string } | null {
  const m = url?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  return m ? { mime: m[1] as "image/jpeg", data: m[2] } : null;
}

export const anthropicProvider: Provider = async ({ system, user, imageDataUrl, timeoutMs }) => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  const img = parseDataUrl(imageDataUrl);
  const res = await client.messages.create(
    {
      model: process.env.AI_MODEL || "claude-sonnet-5-5",
      max_tokens: 2000,
      system,
      messages: [
        {
          role: "user",
          content: [
            ...(img ? [{ type: "image" as const, source: { type: "base64" as const, media_type: img.mime, data: img.data } }] : []),
            { type: "text" as const, text: user },
          ],
        },
      ],
    },
    { timeout: timeoutMs },
  );
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
};

export const geminiProvider: Provider = async ({ system, user, imageDataUrl, timeoutMs }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const img = parseDataUrl(imageDataUrl);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [...(img ? [{ inlineData: { mimeType: img.mime, data: img.data } }] : []), { text: user }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
};
