const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const DEFAULT_TIMEOUT_MS = 30000;
const API_VERSIONS = ['v1beta2', 'v1beta', 'v1'];
const REQUEST_METHODS = ['generateText', 'generateContent'];

function getGeminiApiKey() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local');
  }
  return apiKey;
}

function buildGeminiEndpoints(model, apiKey) {
  return API_VERSIONS.flatMap((version) =>
    REQUEST_METHODS.map(
      (method) =>
        `https://generativelanguage.googleapis.com/${version}/models/${model}:${method}?key=${apiKey}`
    )
  );
}

function extractTextFromCandidate(candidate) {
  if (!candidate) return '';
  const content = candidate.content;
  if (!content) return '';

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        if (item.text) return item.text;
        if (Array.isArray(item.parts)) {
          return item.parts.map((part) => part?.text || '').join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (Array.isArray(content.parts)) {
    return content.parts.map((part) => part?.text || '').filter(Boolean).join('\n');
  }
  return '';
}

function parseGeminiResponse(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (Array.isArray(body.candidates) && body.candidates.length > 0) {
    return body.candidates.map(extractTextFromCandidate).filter(Boolean).join('\n');
  }
  if (Array.isArray(body.output)) {
    return body.output
      .map((item) => {
        if (!item) return '';
        if (item.text) return item.text;
        if (Array.isArray(item.content)) {
          return item.content.map((c) => c?.text || '').filter(Boolean).join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (typeof body.outputText === 'string') {
    return body.outputText;
  }
  return '';
}

async function fetchJson(url, payload, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message = body?.error?.message || body?.error?.status || `${response.status} ${response.statusText}`;
      throw new Error(message || 'Gemini API request failed');
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGeminiWithRetries(prompt, isJson) {
  const apiKey = getGeminiApiKey();
  const model = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL;
  const endpoints = buildGeminiEndpoints(model, apiKey);

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: DEFAULT_TEMPERATURE,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  const errors = [];

  for (const endpoint of endpoints) {
    try {
      const body = await fetchJson(endpoint, payload, DEFAULT_TIMEOUT_MS);
      const text = parseGeminiResponse(body).trim();
      if (text) return text;
      errors.push(`Empty response from ${endpoint}`);
    } catch (error) {
      errors.push(`${endpoint}: ${error.message}`);
      if (/quota exceeded|billing|permission|api key/i.test(error.message)) {
        throw new Error(error.message);
      }
    }
  }

  throw new Error(`Gemini API failed: ${errors.join(' | ')}`);
}

export async function fetchGemini(prompt, isJson = false) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt must be a non-empty string');
  }
  try {
    return await fetchGeminiWithRetries(prompt.trim(), isJson);
  } catch (error) {
    console.error('❌ Gemini service error:', error.message);
    throw error;
  }
}
