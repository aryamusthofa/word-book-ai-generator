import i18n from "./i18n";

const t = i18n.t.bind(i18n);

// ===== AI PROVIDER CONFIG =====
export const PROVIDERS = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    models: [
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", tag: "fast", tokens: 16000 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tag: "smart", tokens: 16000 },
      { id: "gpt-4o", name: "GPT-4o", tag: "powerful", tokens: 16000 },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", tag: "powerful", tokens: 16000 },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", tag: "fast", tokens: 4096 },
    ],
  },
  gemini: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "fast", tokens: 8192 },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "fast", tokens: 8192 },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "powerful", tokens: 8192 },
      { id: "gemini-2.0-flash-thinking", name: "Gemini 2.0 Thinking", tag: "smart", tokens: 8192 },
    ],
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tag: "fast", tokens: 32768 },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", tag: "fast", tokens: 8192 },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", tag: "smart", tokens: 32768 },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", tag: "fast", tokens: 8192 },
    ],
  },
  perplexity: {
    name: "Perplexity",
    baseUrl: "https://api.perplexity.ai/chat/completions",
    models: [
      { id: "sonar", name: "Sonar", tag: "fast", tokens: 12000 },
      { id: "sonar-pro", name: "Sonar Pro", tag: "smart", tokens: 12000 },
      { id: "sonar-reasoning", name: "Sonar Reasoning", tag: "powerful", tokens: 8000 },
    ],
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3", tag: "smart", tokens: 32000 },
      { id: "deepseek-reasoner", name: "DeepSeek R1", tag: "powerful", tokens: 32000 },
    ],
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1/messages",
    models: [
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", tag: "fast", tokens: 200000 },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", tag: "smart", tokens: 200000 },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", tag: "powerful", tokens: 200000 },
    ],
  },
  cohere: {
    name: "Cohere",
    baseUrl: "https://api.cohere.com/v1/chat",
    models: [
      { id: "command-r", name: "Command R", tag: "smart", tokens: 128000 },
      { id: "command-r-plus", name: "Command R+", tag: "powerful", tokens: 128000 },
    ],
  },
  mistral: {
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    models: [
      { id: "mistral-small-latest", name: "Mistral Small", tag: "fast", tokens: 32000 },
      { id: "mistral-medium-latest", name: "Mistral Medium", tag: "smart", tokens: 32000 },
      { id: "mistral-large-latest", name: "Mistral Large", tag: "powerful", tokens: 32000 },
    ],
  },
  xai: {
    name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1/chat/completions",
    models: [
      { id: "grok-3-mini", name: "Grok 3 Mini", tag: "fast", tokens: 131072 },
      { id: "grok-3", name: "Grok 3", tag: "smart", tokens: 131072 },
      { id: "grok-3-fast", name: "Grok 3 Fast", tag: "fast", tokens: 131072 },
      { id: "grok-2-1212", name: "Grok 2", tag: "powerful", tokens: 131072 },
    ],
  },
  together: {
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    models: [
      { id: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", name: "Llama 3.1 8B Turbo", tag: "fast", tokens: 131072 },
      { id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", name: "Llama 3.1 70B Turbo", tag: "smart", tokens: 131072 },
      { id: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", name: "Llama 3.1 405B", tag: "powerful", tokens: 131072 },
      { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B", tag: "smart", tokens: 32768 },
      { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", name: "Qwen2.5 72B Turbo", tag: "smart", tokens: 32768 },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (OR)", tag: "fast", tokens: 128000 },
      { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku (OR)", tag: "fast", tokens: 200000 },
      { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5 (OR)", tag: "fast", tokens: 1000000 },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (OR)", tag: "smart", tokens: 131072 },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (OR)", tag: "powerful", tokens: 163840 },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B (OR)", tag: "smart", tokens: 131072 },
    ],
  },
  cerebras: {
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    models: [
      { id: "llama3.1-8b", name: "Llama 3.1 8B (Ultra Fast)", tag: "fast", tokens: 8192 },
      { id: "llama3.1-70b", name: "Llama 3.1 70B (Fast)", tag: "smart", tokens: 8192 },
      { id: "llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", tag: "smart", tokens: 8192 },
    ],
  },
  fireworks: {
    name: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    models: [
      { id: "accounts/fireworks/models/llama-v3p1-8b-instruct", name: "Llama 3.1 8B", tag: "fast", tokens: 131072 },
      { id: "accounts/fireworks/models/llama-v3p1-70b-instruct", name: "Llama 3.1 70B", tag: "smart", tokens: 131072 },
      { id: "accounts/fireworks/models/llama-v3p1-405b-instruct", name: "Llama 3.1 405B", tag: "powerful", tokens: 131072 },
      { id: "accounts/fireworks/models/mixtral-8x22b-instruct", name: "Mixtral 8x22B", tag: "powerful", tokens: 65536 },
      { id: "accounts/fireworks/models/qwen2p5-72b-instruct", name: "Qwen 2.5 72B", tag: "smart", tokens: 32768 },
    ],
  },
  novita: {
    name: "Novita AI",
    baseUrl: "https://api.novita.ai/v3/openai/chat/completions",
    models: [
      { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", tag: "fast", tokens: 131072 },
      { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", tag: "smart", tokens: 131072 },
      { id: "deepseek/deepseek-v3", name: "DeepSeek V3", tag: "smart", tokens: 65536 },
      { id: "qwen/qwen2.5-72b-instruct", name: "Qwen 2.5 72B", tag: "smart", tokens: 32768 },
    ],
  },
};

export const AUTO_FALLBACK_ORDER = [
  { provider: "openai", model: "gpt-4o-mini" },
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "deepseek", model: "deepseek-chat" },
  { provider: "perplexity", model: "sonar" },
  { provider: "openai", model: "gpt-3.5-turbo" },
  { provider: "gemini", model: "gemini-1.5-flash" },
  { provider: "groq", model: "llama-3.1-8b-instant" },
];

export const WRITING_STYLES = [
  { id: "narrative", label: { en: "Narrative", id: "Naratif", es: "Narrativo", fr: "Narratif", de: "Narrativ", ja: "叙事", ko: "서술형", pt: "Narrativo", ar: "سردي" } },
  { id: "academic", label: { en: "Academic", id: "Akademis", es: "Académico", fr: "Académique", de: "Akademisch", ja: "学術", ko: "학술", pt: "Acadêmico", ar: "أكاديمي" } },
  { id: "educational", label: { en: "Educational", id: "Edukatif", es: "Educativo", fr: "Éducatif", de: "Bildung", ja: "教育", ko: "교육", pt: "Educacional", ar: "تعليمي" } },
  { id: "journalistic", label: { en: "Journalistic", id: "Jurnalistik", es: "Periodístico", fr: "Journalistique", de: "Journalistisch", ja: "報道", ko: "저널리즘", pt: "Jornalístico", ar: "صحفي" } },
  { id: "technical", label: { en: "Technical", id: "Teknis", es: "Técnico", fr: "Technique", de: "Technisch", ja: "技術", ko: "기술", pt: "Técnico", ar: "تقني" } },
  { id: "popular", label: { en: "Popular Sci", id: "Sains Populer", es: "Ciencia Popular", fr: "Science Populaire", de: "Populärwiss.", ja: "一般科学", ko: "대중과학", pt: "Ciência Popular", ar: "علم شعبي" } },
];

export const AUDIENCES = [
  { id: "elementary", label: { en: "Elementary (Ages 7-11)", id: "SD (Usia 7-11)", es: "Primaria (7-11)", fr: "Élémentaire (7-11)", de: "Grundschule (7-11)", ja: "小学校 (7-11)", ko: "초등학교 (7-11)", pt: "Fundamental (7-11)", ar: "ابتدائي (7-11)" } },
  { id: "middle_school", label: { en: "Middle School (12-14)", id: "SMP (12-14)", es: "Secundaria (12-14)", fr: "Collège (12-14)", de: "Mittelschule (12-14)", ja: "中学校 (12-14)", ko: "중학교 (12-14)", pt: "Ensino Médio (12-14)", ar: "متوسط (12-14)" } },
  { id: "high_school", label: { en: "High School (15-18)", id: "SMA (15-18)", es: "Bachillerato (15-18)", fr: "Lycée (15-18)", de: "Oberschule (15-18)", ja: "高校 (15-18)", ko: "고등학교 (15-18)", pt: "Ensino Médio (15-18)", ar: "ثانوي (15-18)" } },
  { id: "college", label: { en: "College / Adult", id: "Kuliah / Dewasa", es: "Universidad / Adulto", fr: "Université / Adulte", de: "Studium / Erwachsene", ja: "大学 / 成人", ko: "대학 / 성인", pt: "Faculdade / Adulto", ar: "جامعة / بالغ" } },
  { id: "professional", label: { en: "Professional", id: "Profesional", es: "Profesional", fr: "Professionnel", de: "Professionell", ja: "専門家", ko: "전문가", pt: "Profissional", ar: "محترف" } },
];

// ===== API CALL FUNCTIONS =====
const API_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error(t("errors.timeout"));
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function classifyError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("401") || m.includes("403") || m.includes("invalid_api_key") || m.includes("invalid api key") || m.includes("api key") || m.includes("authentication") || m.includes("unauthorized") || m.includes("permission")) return "auth";
  if (m.includes("content_policy") || m.includes("content policy") || m.includes("safety") || m.includes("moderation")) return "content";
  if (m.includes("429") || m.includes("quota") || m.includes("rate_limit") || m.includes("rate limit") || m.includes("overload") || m.includes("capacity") || m.includes("too many requests") || m.includes("resource_exhausted")) return "ratelimit";
  if (m.includes("timed out") || m.includes("timeout")) return "timeout";
  if (m.includes("500") || m.includes("502") || m.includes("503") || m.includes("504")) return "server";
  return "unknown";
}

// ---- OpenAI-compatible providers ----
async function callOpenAICompatible({
  url,
  apiKey,
  model,
  messages,
  systemPrompt,
  maxTokens = 1200,
}: {
  url: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  maxTokens?: number;
}) {
  const body: any = {
    model,
    temperature: 0.4,
    max_tokens: maxTokens,
    messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), ...messages],
  };

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${e?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ---- Gemini ----
async function callGemini({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  const contents: any[] = [];
  if (systemPrompt) {
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I will follow these guidelines strictly." }] });
  }
  for (const m of messages) {
    contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] });
  }
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${e?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ---- Anthropic ----
async function callAnthropic({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.4,
      system: systemPrompt,
      messages: messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Anthropic ${res.status}: ${e?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || "";
}

// ---- Cohere ----
async function callCohere({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  const res = await fetchWithTimeout("https://api.cohere.com/v1/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      message: messages[messages.length - 1]?.content || "",
      preamble: systemPrompt,
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Cohere ${res.status}: ${e?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.text?.trim() || "";
}

// ---- Perplexity ----
async function callPerplexity({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  return callOpenAICompatible({
    url: "https://api.perplexity.ai/chat/completions",
    apiKey,
    model,
    messages,
    systemPrompt,
    maxTokens,
  });
}

// ---- Mistral ----
async function callMistral({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  return callOpenAICompatible({
    url: "https://api.mistral.ai/v1/chat/completions",
    apiKey,
    model,
    messages,
    systemPrompt,
    maxTokens,
  });
}

// ---- DeepSeek ----
async function callDeepSeek({ apiKey, model, messages, systemPrompt, maxTokens = 1200 }: any) {
  return callOpenAICompatible({
    url: "https://api.deepseek.com/v1/chat/completions",
    apiKey,
    model,
    messages,
    systemPrompt,
    maxTokens,
  });
}

// ---- Provider dispatcher ----
async function callProvider({ provider, model, apiKey, messages, systemPrompt, maxTokens }: any) {
  const config = (PROVIDERS as any)[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  if (provider === "gemini") return callGemini({ apiKey, model, messages, systemPrompt, maxTokens });
  if (provider === "anthropic") return callAnthropic({ apiKey, model, messages, systemPrompt, maxTokens });
  if (provider === "cohere") return callCohere({ apiKey, model, messages, systemPrompt, maxTokens });
  if (provider === "perplexity") return callPerplexity({ apiKey, model, messages, systemPrompt, maxTokens });
  if (provider === "mistral") return callMistral({ apiKey, model, messages, systemPrompt, maxTokens });
  if (provider === "deepseek") return callDeepSeek({ apiKey, model, messages, systemPrompt, maxTokens });

  // OpenAI-compatible (openai, groq, xai, together, openrouter, cerebras, fireworks, novita, etc.)
  return callOpenAICompatible({ url: config.baseUrl, apiKey, model, messages, systemPrompt, maxTokens });
}

// apiKeys supports both legacy Record<string,string> and new multi-key Record<string, {key:string}[]>
type ApiKeysInput = Record<string, string | string[] | Array<{key: string; id?: string; label?: string; addedAt?: number}>>;

function resolveKeys(apiKeys: ApiKeysInput, provider: string): string[] {
  const val = apiKeys[provider];
  if (!val) return [];
  if (typeof val === "string") return val ? [val] : [];
  if (Array.isArray(val)) {
    return (val as any[]).map((v) => (typeof v === "string" ? v : v.key)).filter(Boolean);
  }
  return [];
}

let _lastUsedModel: string | null = null;
export function getLastUsedModel() {
  return _lastUsedModel;
}

export async function callAI({
  messages,
  systemPrompt,
  maxTokens = 1200,
  selectedModel = "auto:auto",
  apiKeys,
}: {
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  maxTokens?: number;
  selectedModel?: string;
  apiKeys: ApiKeysInput;
}) {
  const isAuto = !selectedModel || selectedModel === "auto:auto";
  if (isAuto) return callWithAutoFallback({ messages, systemPrompt, maxTokens, apiKeys });

  const colonIdx = selectedModel.indexOf(":");
  const provider = selectedModel.slice(0, colonIdx);
  const model = selectedModel.slice(colonIdx + 1);
  const keys = resolveKeys(apiKeys, provider);
  if (keys.length === 0) throw new Error(t("noKey"));

  const errors: string[] = [];
  for (const key of keys) {
    try {
      _lastUsedModel = `${provider}:${model}`;
      return await callProvider({ provider, model, apiKey: key, messages, systemPrompt, maxTokens });
    } catch (err: any) {
      if (classifyError(err.message) === "auth") { errors.push(err.message); continue; }
      throw err;
    }
  }
  throw new Error(`All keys for ${provider} failed: ${errors.join("; ")}`);
}

async function callWithAutoFallback({ messages, systemPrompt, maxTokens, apiKeys }: { messages: any[]; systemPrompt?: string; maxTokens?: number; apiKeys: ApiKeysInput }) {
  const errors: string[] = [];
  for (const { provider, model } of AUTO_FALLBACK_ORDER) {
    const keys = resolveKeys(apiKeys, provider);
    if (keys.length === 0) continue;
    for (const key of keys) {
      try {
        const result = await callProvider({ provider, model, apiKey: key, messages, systemPrompt, maxTokens });
        _lastUsedModel = `${provider}:${model}`;
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ai:modelUsed", { detail: { provider, model } }));
        return result;
      } catch (err: any) {
        const errType = classifyError(err.message);
        errors.push(`${provider}:${model} → [${errType}] ${err.message}`);
        if (errType === "content") throw new Error(`${t("errors.contentPolicy")} for ${provider}. ${err.message}`);
        if (errType === "auth") continue;
        console.warn(`[Auto] Fallback from ${provider}:${model} [${errType}]`);
        break;
      }
    }
  }
  throw new Error(`${t("errors.allFailed")}:\n${errors.join("\n")}`);
}

export async function validateApiKey(provider: string, apiKey: string) {
  try {
    const models = (PROVIDERS as any)[provider]?.models || [];
    const model = models[0]?.id || "gpt-4o-mini";
    await callProvider({ provider, model, apiKey, messages: [{ role: "user", content: "Hi" }], maxTokens: 5 });
    return true;
  } catch (err: any) {
    const msg = err.message || "";
    const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("rate") || msg.includes("limit");
    const isBadKey = msg.includes("401") || msg.includes("403") || msg.includes("API key") || msg.includes("invalid");
    if (isRateLimit && !isBadKey) return true;
    return false;
  }
}

// ---- Structure Calculator ----
export function calcBookStructure(targetPages: number) {
  const PAGES_PER_SUB = 1.25;
  const subs = Math.max(5, Math.round(targetPages / PAGES_PER_SUB));
  const chapters = Math.max(3, Math.round(subs / 5));
  const subsPerChap = Math.ceil(subs / chapters);
  const totalWords = chapters * subsPerChap * 400;
  return { chapters, subsPerChap, totalSubs: chapters * subsPerChap, totalWords };
}

// ---- Prompt Builders ----
export function buildSystemPrompt(settings: any) {
  const isID = settings.bookLang === "id";
  const audienceMap: Record<string, string> = {
    elementary: isID ? "anak SD (usia 7-11 tahun)" : "elementary school children (ages 7-11)",
    middle_school: isID ? "siswa SMP (usia 12-14 tahun)" : "middle school students (ages 12-14)",
    high_school: isID ? "siswa SMA (usia 15-18 tahun)" : "high school students (ages 15-18)",
    college: isID ? "mahasiswa dan dewasa umum" : "college students and general adults",
    professional: isID ? "pembaca profesional dan akademisi" : "professional readers and academics",
  };
  const styleMap: Record<string, string> = {
    narrative: isID ? "naratif informatif" : "informative narrative",
    academic: isID ? "akademis formal" : "formal academic",
    educational: isID ? "edukatif dan komunikatif" : "educational and communicative",
    journalistic: isID ? "jurnalistik populer" : "popular journalistic",
    technical: isID ? "teknis dan presisi" : "technical and precise",
    popular: isID ? "sains populer yang menarik" : "engaging popular science",
  };
  const audience = audienceMap[settings.audience] || audienceMap.high_school;
  const style = styleMap[settings.writingStyle] || styleMap.educational;
  const author = settings.authorName ? (isID ? `Ditulis oleh ${settings.authorName}.` : `Written by ${settings.authorName}.`) : "";

  if (isID) {
    return `Kamu adalah penulis buku nonfiksi profesional berpengalaman dengan spesialisasi konten edukatif berkualitas tinggi. ${author}
MISI: Tulis konten buku yang faktual, akurat, dan bernilai tinggi untuk ${audience} dengan gaya ${style}.
ATURAN KONTEN WAJIB:
1. Setiap pernyataan HARUS berdasarkan fakta nyata dan terverifikasi
2. Gunakan data spesifik, penelitian nyata, institusi nyata, dan tokoh nyata bila relevan
3. Tulis dengan otoritas dan kepercayaan diri — bukan opini samar
4. Berikan contoh konkret dari dunia nyata, bukan skenario hipotetis
5. Gunakan Bahasa Indonesia baku sesuai KBBI dan PUEBI
DILARANG KERAS: "Bayangkan...", "Coba kamu...", "Pikirkan...", "Seandainya...", "Mungkin kamu pernah...", "Seperti yang kita tahu...", pertanyaan retoris, skenario fiktif, menyebut proses penulisan AI`;
  }
  return `You are a professional non-fiction author specializing in high-quality educational content. ${author}
MISSION: Write factual, accurate, high-value book content for ${audience} in a ${style} writing style.
MANDATORY CONTENT RULES:
1. Every statement MUST be based on real, verifiable facts
2. Use specific data, real research, real institutions, and real figures where relevant
3. Write with authority and confidence — not vague opinions
4. Provide concrete real-world examples, not hypothetical scenarios
5. Use clear, precise English appropriate for the target audience
STRICTLY FORBIDDEN: "Imagine...", "Picture this...", "Think about...", "What if...", "Suppose...", "As everyone knows...", rhetorical questions, fictional scenarios, mentioning AI writing process`;
}

export function buildStructurePrompt(topic: string, chapters: number, subsPerChap: number, lang: string, settings: any) {
  const isID = lang === "id";
  const subLabels = ["A", "B", "C", "D", "E", "F", "G"].slice(0, subsPerChap);
  if (isID) {
    return `Tema buku: "${topic}"\nTarget pembaca: ${settings.audience}\nGaya penulisan: ${settings.writingStyle}\n\nBuat struktur lengkap buku nonfiksi edukatif dengan ketentuan:\n- Tepat ${chapters} bab\n- Setiap bab memiliki tepat ${subsPerChap} subbab (berlabel ${subLabels.join(", ")})\n- Alur logis dari dasar ke advanced\n- Judul bab dan subbab harus spesifik dan informatif\n- HINDARI judul generik\n\nFormat output JSON MURNI (tanpa teks lain):\n[{"bab":1,"judul":"Judul Bab Spesifik","subbab":[{"kode":"A","judul":"Judul Subbab Spesifik"}]}]`;
  }
  return `Book topic: "${topic}"\nTarget audience: ${settings.audience}\nWriting style: ${settings.writingStyle}\n\nCreate a complete non-fiction book structure with:\n- Exactly ${chapters} chapters\n- Each chapter has exactly ${subsPerChap} sections (labeled ${subLabels.join(", ")})\n- Logical progression from foundational to advanced\n- Titles must be specific and informative\n- AVOID generic titles\n\nOutput PURE JSON only (no other text):\n[{"chapter":1,"title":"Specific Chapter Title","sections":[{"code":"A","title":"Specific Section Title"}]}]`;
}

export function buildContentPrompt(topic: string, chapterTitle: string, sectionCode: string, sectionTitle: string, wordTarget: number, lang: string, chapterNum: number) {
  const isID = lang === "id";
  if (isID) {
    return `Tulis satu subbab buku nonfiksi dengan standar kualitas tertinggi.\n\nKONTEKS:\n- Buku: "${topic}"\n- Bab ${chapterNum}: ${chapterTitle}\n- Subbab ${sectionCode}: ${sectionTitle}\n\nFORMAT OUTPUT:\nLangsung tulis isi subbab tanpa mencantumkan judul di awal.\nTulis ${wordTarget}-${wordTarget + 80} kata dalam 4-6 paragraf.\n\nSTANDAR ISI:\n- Setiap paragraf dimulai dengan inden\n- Mulai dengan pernyataan fakta yang kuat\n- Sertakan data, angka, nama peneliti, institusi, atau tahun yang relevan dan nyata\n- Contoh harus diambil dari kasus nyata yang terdokumentasi\n\nDILARANG: bayangkan, pikirkan, coba, seandainya, mungkin kamu, pertanyaan retoris, skenario fiktif`;
  }
  return `Write one book section with the highest quality standards.\n\nCONTEXT:\n- Book: "${topic}"\n- Chapter ${chapterNum}: ${chapterTitle}\n- Section ${sectionCode}: ${sectionTitle}\n\nOUTPUT FORMAT:\nWrite the section content directly without including the title.\nWrite ${wordTarget}-${wordTarget + 80} words in 4-6 paragraphs.\n\nCONTENT STANDARDS:\n- Each paragraph starts with an indent\n- Open with a strong factual statement\n- Include real data, figures, researcher names, institutions, or years where relevant\n- Examples must be drawn from real, documented cases\n\nFORBIDDEN: imagine, think about, picture this, what if, you may have experienced, rhetorical questions, fictional scenarios`;
}
