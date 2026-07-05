import { extractionDiffSchema, type ExtractionDiff } from '@/lib/lifemodel/extraction';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const EXTRACTOR_SYSTEM_PROMPT = `You are the memory extractor for a life-mentor app. You read a conversation (or check-in) and the user's current Life Model, then return a JSON diff of what changed. You never chat — you only output JSON.

The Life Model has five areas: career, health, mental, financial, social.

Return a JSON object with this exact shape (all top-level keys required, use empty arrays when nothing applies):
{
  "events": [{ "area": "...", "type": "milestone|setback|activity|decision|feeling|fact", "content": "short dated-fact, max 300 chars" }],
  "areas": [{
    "area": "...",
    "status": "optional: refreshed 2-3 sentence current situation for this area",
    "summary": "optional: refreshed short narrative of this area's history",
    "addGoals": [{ "text": "...", "targetDate": "YYYY-MM-DD or null" }],
    "closeGoalIds": ["existing goal id"],
    "addThreads": ["new open loop, e.g. 'interviewing at TCS'"],
    "closeThreadIds": ["existing thread id"]
  }],
  "profile": { "identity": "optional", "personality": "optional", "coachingStyle": "optional" }
}

Rules:
- Extract only what the text actually says. Never invent facts.
- Record concrete happenings as events. Skip small talk entirely — an empty diff is a valid, common answer.
- Update an area's status only when the new information genuinely changes the picture.
- Close a thread/goal ONLY by an id that exists in the provided Life Model.
- Set profile.coachingStyle only on clear signals about how the user wants to be coached (e.g. "stop sugarcoating").
- Do not restate things already present in the Life Model.
- Omit optional fields entirely when you have nothing for them — never output empty strings.`;

/**
 * Models sometimes emit "" for optional fields instead of omitting them.
 * An empty optional is semantically absent, so strip these before schema
 * validation rather than failing the whole extraction on them.
 */
export function stripEmptyOptionals(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const diff = raw as Record<string, unknown>;

  if (Array.isArray(diff.areas)) {
    for (const area of diff.areas as Record<string, unknown>[]) {
      if (!area || typeof area !== 'object') continue;
      for (const key of ['status', 'summary']) {
        if (typeof area[key] === 'string' && (area[key] as string).trim() === '') delete area[key];
      }
      if (Array.isArray(area.addThreads)) {
        area.addThreads = (area.addThreads as unknown[]).filter(
          (t) => typeof t === 'string' && t.trim() !== '',
        );
      }
      if (Array.isArray(area.addGoals)) {
        area.addGoals = (area.addGoals as Record<string, unknown>[]).filter(
          (g) => typeof g?.text === 'string' && (g.text as string).trim() !== '',
        );
      }
    }
  }
  if (Array.isArray(diff.events)) {
    diff.events = (diff.events as Record<string, unknown>[]).filter(
      (e) => typeof e?.content === 'string' && (e.content as string).trim() !== '',
    );
  }
  if (diff.profile && typeof diff.profile === 'object') {
    const profile = diff.profile as Record<string, unknown>;
    for (const key of ['identity', 'personality', 'coachingStyle']) {
      if (typeof profile[key] === 'string' && (profile[key] as string).trim() === '') delete profile[key];
    }
    if (Object.keys(profile).length === 0) delete diff.profile;
  }
  return diff;
}

/**
 * One-shot, non-streamed Groq call that turns conversation text into a
 * validated ExtractionDiff. Separate from the chat call by design (spec
 * section 2): logging accuracy never competes with conversational quality.
 */
export async function extractLifeModelDiff(
  conversationText: string,
  lifeModelJson: string,
): Promise<ExtractionDiff> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current Life Model:\n${lifeModelJson}\n\nNew conversation:\n${conversationText}\n\nReturn the JSON diff.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Groq extract error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Groq returned an empty extraction');

  const parsed = extractionDiffSchema.safeParse(stripEmptyOptionals(JSON.parse(raw)));
  if (!parsed.success) {
    console.error('Extraction failed schema validation:', parsed.error.flatten());
    throw new Error('Extraction output did not match schema');
  }
  return parsed.data;
}
