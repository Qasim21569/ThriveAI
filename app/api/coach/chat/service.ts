import { COACH_TOOLS, logCheckinArgsSchema } from '@/lib/coach/tools';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Assemble the system prompt: coach identity + safety rules (fixed, no
 * data dependency) followed by the pre-assembled context block (plan
 * summary + recent check-ins + rolling memory of older history). The
 * context block itself is built client-side by buildMentorContext() in
 * lib/coach/context.ts, since that's where the Firestore reads happen —
 * this function just prepends the fixed identity layer to whatever
 * data-dependent context arrives in the request.
 */
function buildSystemPrompt(contextBlock?: string): string {
  const identity =
    'You are the ThriveAI mentor — a personal life mentor who knows this user deeply and ' +
    'guides them across their whole life: career, health, mental wellbeing, finances, and ' +
    'social life. You are warm but direct: reference their actual history, hold them ' +
    'accountable to their stated goals, and connect the dots between life areas (e.g. poor ' +
    'sleep before an interview week). Keep replies short (2-4 sentences) unless asked for ' +
    'detail. Never give medical or financial-professional diagnoses; suggest professional ' +
    'help for anything beyond general guidance. When the user reports something concrete — ' +
    'a workout, a mood, an event worth remembering — call the log_checkin tool rather than ' +
    'only acknowledging it in text.';

  if (!contextBlock) {
    return `${identity}\n\nYou are meeting this user for the first time and know nothing about them yet. Ask about their current situation to start building the picture.`;
  }

  return `${identity}\n\nContext about this user:\n\n${contextBlock}\n\nGround every reply in this context — reference their goals, open threads, and recent events where relevant, and never contradict it.`;
}

/**
 * Stream a coach reply from Groq as plain UTF-8 text chunks.
 *
 * Groq's API is OpenAI-compatible: with `stream: true` it returns
 * Server-Sent Events where each line looks like `data: {...json...}`.
 * Two kinds of deltas can arrive on `choices[0].delta`:
 *   - `content`      — a fragment of normal reply text
 *   - `tool_calls`    — a fragment of a function-call the model wants to make
 *
 * Tool call fragments arrive as pieces of a JSON string (the `arguments`
 * field) that must be concatenated across many chunks before they're
 * valid JSON — you cannot act on a half-received tool call. We buffer
 * fragments silently and only validate + emit once the stream ends.
 *
 * The client only ever receives plain text. If a tool call completes and
 * passes validation, we append one sentinel line at the very end:
 *   \n__TOOL_CALL__:{"name":"log_checkin","arguments":{...}}
 * This keeps the wire format dead simple — one channel, not two — at the
 * cost of the client needing to strip that line before displaying text.
 */
export async function streamCoachReply(
  message: string,
  history: ChatTurn[],
  contextBlock?: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiToken = process.env.GROQ_API_KEY?.trim();
  if (!apiToken) throw new Error('Groq API key is missing');

  const model = process.env.GROQ_MODEL?.trim() || GROQ_MODEL;

  const messages = [
    { role: 'system', content: buildSystemPrompt(contextBlock) },
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
      tools: COACH_TOOLS,
      tool_choice: 'auto',
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
      // Accumulates one tool call's name + argument fragments (index 0 only —
      // this app only ever proposes a single tool call per turn).
      let toolCallName: string | null = null;
      let toolCallArgsBuffer = '';

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
              const delta = json.choices?.[0]?.delta;

              const token = delta?.content;
              if (token) controller.enqueue(encoder.encode(token));

              const toolCallDelta = delta?.tool_calls?.[0];
              if (toolCallDelta) {
                if (toolCallDelta.function?.name) {
                  toolCallName = toolCallDelta.function.name;
                }
                if (toolCallDelta.function?.arguments) {
                  toolCallArgsBuffer += toolCallDelta.function.arguments;
                }
              }
            } catch {
              // Ignore malformed SSE lines (keep-alive comments etc.)
            }
          }
        }

        // Stream is done — if a tool call was accumulated, validate it now
        // (the boundary where untrusted model output enters our system)
        // before ever telling the client about it.
        if (toolCallName === 'log_checkin' && toolCallArgsBuffer) {
          try {
            const rawArgs = JSON.parse(toolCallArgsBuffer);
            const parsed = logCheckinArgsSchema.safeParse(rawArgs);
            if (parsed.success) {
              const marker = `\n__TOOL_CALL__:${JSON.stringify({
                name: 'log_checkin',
                arguments: parsed.data,
              })}`;
              controller.enqueue(encoder.encode(marker));
            } else {
              console.error('Tool call failed validation:', parsed.error.flatten());
            }
          } catch (error) {
            console.error('Tool call arguments were not valid JSON:', error);
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
