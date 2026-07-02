const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Compress a batch of older check-ins into a short paragraph. This is the
 * rolling-summary half of the context pipeline: instead of keeping every
 * check-in in the prompt forever (unbounded growth), older entries get
 * folded into one summary that the coach can still reference.
 *
 * Not streamed — this is a short, internal, one-shot completion, not a
 * user-facing reply.
 */
export async function summarizeCheckins(checkinsText: string): Promise<string> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const prompt =
    'Summarize these check-ins into 2-3 short sentences capturing patterns and ' +
    "notable events — not a list, a brief narrative a coach could recall from memory. " +
    `Check-ins:\n${checkinsText}`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq summarize error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error('Groq returned an empty summary');

  return summary;
}
