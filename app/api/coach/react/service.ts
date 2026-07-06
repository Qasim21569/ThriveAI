const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * One-shot mentor reaction to a daily check-in. Deliberately tool-free and
 * short: the check-in is already persisted by the client, and the ritual's
 * promise is "under two minutes" — a reaction, not a conversation.
 */
export async function reactToCheckin(checkinText: string, contextBlock?: string): Promise<string> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const system =
    'You are the ThriveAI mentor reacting to the user\'s daily check-in. Reply in 2-3 ' +
    'sentences: acknowledge specifically what they shared, connect it to their goals or ' +
    'open threads when context is provided, and end with one encouraging or gently ' +
    'accountable note. No questions, no lists, no advice dumps. Never use em dashes; ' +
    'use commas or periods instead.' +
    (contextBlock ? `\n\nContext about this user:\n\n${contextBlock}` : '');

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Today's check-in:\n${checkinText}` },
      ],
      temperature: 0.6,
      max_tokens: 160,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq react error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const reaction = data.choices?.[0]?.message?.content?.trim();
  if (!reaction) throw new Error('Groq returned an empty reaction');
  return reaction;
}
