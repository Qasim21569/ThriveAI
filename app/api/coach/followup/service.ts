const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * One-shot follow-up generator for the onboarding interview. Returns a
 * single short question when the answer leaves an obvious gap, or null
 * when the answer already covers the essentials — the caller then moves
 * to the next life area. Kept tool-free and tiny: one question maximum
 * per area keeps the interview under ~5 minutes.
 */
export async function getFollowupQuestion(
  area: string,
  question: string,
  answer: string,
): Promise<string | null> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const system =
    'You are a life mentor conducting a brief onboarding interview, currently on the ' +
    `"${area}" area of the user's life. You asked a question and got an answer. If the ` +
    'answer already covers the essentials (their current situation plus at least one goal ' +
    'or concern), reply with exactly the single word DONE. Otherwise reply with exactly ' +
    'one short, warm follow-up question (one sentence, no preamble) that fills the ' +
    'biggest gap. Never ask more than one question. Never comment on the answer.';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Question asked: ${question}\n\nUser's answer: ${answer}` },
      ],
      temperature: 0.4,
      max_tokens: 80,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq followup error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text: string | undefined = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq returned an empty follow-up');

  return text.toUpperCase() === 'DONE' || text.toUpperCase().startsWith('DONE') ? null : text;
}
