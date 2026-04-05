/**
 * Direct browser-side Claude API calls.
 * API key is baked in at build time via VITE_ANTHROPIC_API_KEY.
 */

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const BASE_URL = 'https://api.anthropic.com/v1'
const MODEL = 'claude-sonnet-4-6'
const HEADERS = {
  'x-api-key': API_KEY,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
  'anthropic-dangerous-direct-browser-access': 'true',
}

/**
 * Non-streaming message — returns full text string.
 */
export async function generateMessage(prompt) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text
}

/**
 * Streaming chat — calls onChunk(text) for each delta, returns when done.
 * Pass an AbortSignal to cancel mid-stream.
 */
export async function streamChat({ system, messages, onChunk, signal }) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: HEADERS,
    signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      stream: true,
      system,
      messages,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          onChunk(parsed.delta.text)
        }
      } catch {}
    }
  }
}
