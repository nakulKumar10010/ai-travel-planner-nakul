// npm i @google/genai mime
import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
if (!apiKey) console.warn('Missing VITE_GOOGLE_GEMINI_AI_API_KEY');

const ai = new GoogleGenAI({ apiKey });

// Pick a current fast JSON-capable model
const modelName = 'gemini-2.5-flash';

// JSON schema you already designed
const responseSchema = {
  type: 'object',
  properties: {
    hotel_options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
          price: { type: 'string' },
          image_url: { type: 'string' },
          geo_coordinates: { type: 'string' },
          rating: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name', 'address']
      }
    },
    itinerary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'string' },
          plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                place: { type: 'string' },
                details: { type: 'string' },
                image_url: { type: 'string' },
                geo_coordinates: { type: 'string' },
                ticket_pricing: { type: 'string' },
                rating: { type: 'string' }
              },
              required: ['time', 'place']
            }
          }
        },
        required: ['day', 'plan']
      }
    }
  },
  required: ['hotel_options', 'itinerary']
};

const baseConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
  responseSchema,
};

/**
 * Non-streaming: returns a parsed JSON object (or throws with .message)
 */
export async function generateTrip(prompt, configOverride = {}) {
  const res = await ai.models.generateContent({
    model: modelName,
    config: { ...baseConfig, ...configOverride },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  // The SDK exposes a unified .text for convenience even with JSON mime
  const text = res.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    // If model returned something non-JSON, surface it for debugging
    throw new Error(`Model did not return valid JSON. Raw: ${text.slice(0, 400)}…`);
  }
}

/**
 * Optional streaming helper if you want typewriter UX later.
 * Calls onChunk with text chunks; returns final parsed JSON.
 */
export async function streamTrip(prompt, onChunk, configOverride = {}) {
  const stream = await ai.models.generateContentStream({
    model: modelName,
    config: { ...baseConfig, ...configOverride },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  for await (const chunk of stream) {
    const t = chunk.text || '';
    if (t) onChunk?.(t);
  }
  const full = await stream.response;
  const text = full.text ?? '';
  return JSON.parse(text);
}

// ⚠️ IMPORTANT:
// Remove any top-level IIFEs that iterate a stream on import.
// Do NOT export a stream instance. Always export functions like above.
