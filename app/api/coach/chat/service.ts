const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Assemble the system prompt: coach identity (layer 1) + plan summary
 * (layer 2). This is the context pipeline in its minimal form — Phase 4
 * adds check-in history and a token budget on top of this.
 */
function buildSystemPrompt(planSummary?: string): string {
  const identity =
    'You are the ThriveAI coach — warm, direct, and encouraging. You help with fitness ' +
    'and general wellbeing. Keep replies short (2-4 sentences) unless asked for detail. ' +
    'Never give medical diagnoses; suggest professional help for anything beyond general ' +
    'wellness. Stay in character as a supportive coach, not a generic assistant.';

  if (!planSummary) {
    return `${identity}\n\nThe user has not generated a fitness plan yet. If relevant, encourage them to create one.`;
  }

  return `${identity}\n\nThe user's current plan:\n${planSummary}\n\nUse this plan when giving advice — reference specific workouts or goals from it where relevant.`;
}

/**
 * Stream a coach reply from Groq as plain UTF-8 text chunks.
 *
 * Groq's API is OpenAI-compatible: with `stream: true` it returns
 * Server-Sent Events where each line looks like `data: {...json...}` and
 * the token text lives at `choices[0].delta.content`. We parse that here
 * and re-emit just the plain text — the client never needs to know the
 * OpenAI wire format exists.
 */
export async function streamCoachReply(
  message: string,
  history: ChatTurn[],
  planSummary?: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const messages = [
    { role: 'system', content: buildSystemPrompt(planSummary) },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const groqResponse = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      stream: true,
    }),
  });

  if (!groqResponse.ok || !groqResponse.body) {
    const errorText = await groqResponse.text().catch(() => '');
    console.error('Groq stream error:', groqResponse.status, errorText);
    throw new Error(`Groq API error: ${groqResponse.status}`);
  }

  const reader = groqResponse.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep the last, possibly-incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice('data:'.length).trim();
            if (payload === '[DONE]') continue;

            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // Ignore malformed SSE lines (keep-alive comments etc.)
            }
          }
        }
      } catch (error) {
        console.error('Error reading Groq stream:', error);
      } finally {
        controller.close();
      }
    },
  });
}
