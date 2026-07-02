# ThriveAI — Architecture

A stateful AI coaching app. This document describes how it's built, why it's built that
way, and what was deliberately left out.

## System overview

Four systems talk to each other on every meaningful user action:

```
Browser (Next.js client components)
   │
   ├── Firebase Auth        — identity (ID tokens)
   ├── Firestore             — all persistent data (client SDK, no Admin SDK)
   └── Next.js API routes    — thin proxies to Groq (the only place secrets live)
                                    │
                                    └── Groq API — LLM inference (streaming, tool calling)
```

The defining architectural choice is **client-orchestrated, server-proxied**: the browser
holds every Firestore read and write via the client SDK; Next.js API routes exist purely
to keep the Groq API key off the client and to run request validation. No Firebase Admin
SDK, no service account key, no background jobs. This was a deliberate trade — see
[No Admin SDK](#why-no-admin-sdk) below.

## Data model

```
users/{uid}
  displayName, email, settings

users/{uid}/plans/{planId}
  type: 'fitness' | 'mental'
  title, data (the generated plan JSON), createdAt, isActive

users/{uid}/coachMessages/{messageId}
  role: 'user' | 'assistant'
  content, createdAt

users/{uid}/checkins/{checkinId}
  type: 'workout' | 'mood' | 'note'
  summary, createdAt

users/{uid}/memory/summary   (single doc)
  summary: string             — rolling compression of older check-ins
  summarizedCount: number     — how many "old" check-ins this summary covers
  lastUpdated
```

Security: one Firestore rule (`firestore.rules`) covers a user's entire document tree —
`request.auth.uid == userId`, applied recursively via `{document=**}`. New subcollections
never need a new rule.

## The context pipeline

Every coach chat message is preceded by a system prompt assembled from four layers:

| Layer | Built where | Content | Budget |
|---|---|---|---|
| 1. Identity | `app/api/coach/chat/service.ts` | Fixed persona + safety rules | ~500 chars, no data dependency |
| 2. Active plan | `lib/coach/context.ts` | Summarized (not raw JSON) plan | 500 chars |
| 3. Recent check-ins | `lib/coach/context.ts` | Last 5 check-ins, verbatim | 600 chars |
| 4. Rolling memory | `lib/coach/context.ts` + `/api/coach/summarize` | Compressed summary of check-ins beyond the recent window | 400 chars |

Layers 2–4 are assembled **client-side** by `buildCoachContext(uid, idToken)`, because
that's where the Firestore reads happen. The API route receives a fully-built
`contextBlock` string and only prepends the fixed identity layer — it never queries
Firestore itself.

Budgets are character-count approximations of token counts (~4 chars/token for English),
not a real tokenizer. Accurate enough to bound prompt size at this app's scale; a real
tokenizer (`tiktoken` or similar) would be the next step if prompt cost became a concern.

### Rolling summarization

Check-ins older than the most recent 5 are folded into one paragraph instead of growing
the prompt forever. The summary is cached on `summarizedCount`: if the number of "old"
check-ins hasn't changed since the last summary was built, the stored summary is reused
with zero extra Groq calls. If new check-ins have aged past the recent window, the *entire*
older set is re-summarized from scratch — not merged incrementally.

That's a deliberate simplification. At this app's scale (tens of check-ins per user),
re-summarizing the full older set on each boundary shift is cheap and simple. Incremental
merge-summarization (keep the old summary, append only the newly-aged-out entries) would
only start paying for its added complexity in the thousands-of-entries range, where
re-summarizing everything each time becomes genuinely expensive.

## Tool calling

One tool: `log_checkin`. Definition lives in `lib/coach/tools.ts` — a JSON schema the
model reads (`COACH_TOOLS`) paired with a zod schema (`logCheckinArgsSchema`) the app
uses to validate what the model proposes. Two different audiences for the same shape.

The model never writes to Firestore. The full path:

```
Model streams tool_calls deltas (JSON fragments)
   → service.ts accumulates them silently until the stream ends
   → validates with logCheckinArgsSchema (boundary #1 — untrusted AI output)
   → appends one sentinel line to the text stream: __TOOL_CALL__:{...}
   → client parses the sentinel, re-validates with the same schema (boundary #2 — crossed HTTP)
   → client calls saveCheckin(uid, type, summary) — the actual Firestore write
   → client renders a distinct confirmation chip, built from the validated
     arguments, not from the model's own words
```

Two validation boundaries because the payload crosses two untrusted hops: the model
(probabilistic, can emit malformed output) and the HTTP response body (another network
hop even though "our own" server is talking to "our own" client).

**Scope note:** only `log_checkin` (a write) is implemented. `adjust_plan` and
`get_progress` (a read) would each require a second round-trip — feed the tool's result
back to the model so it can phrase a natural-language response — which is a materially
different pattern from fire-and-forget writes. Deferred rather than half-built.

## Structured outputs

The three plan/assessment generators (`app/api/llm`, `app/api/fitness/assessment`,
`app/api/mental/assessment`) all send `response_format: { type: 'json_object' }` to Groq,
guaranteeing syntactically valid JSON. This replaced a regex-based "repair" function that
used to patch malformed JSON syntax (missing quotes, unbalanced brackets, trailing
commas) — a real but brittle workaround for a problem `response_format` solves at the
source.

`response_format` guarantees valid *syntax*, not valid *shape* — the model can still
return JSON that's missing fields the app needs. That's what `lib/validation/aiOutputs.ts`
catches: each generator now does `JSON.parse` → zod `.safeParse` → falls back to a
hardcoded plan only on a genuine shape mismatch, not on every hiccup.

## Why no Admin SDK

`lib/auth/verifyAuth.ts` verifies Firebase ID tokens via the Identity Toolkit REST API,
not the Admin SDK. No service account key to manage, no extra dependency. The cost: API
routes can't independently query Firestore, so every route that needs data (the coach
chat, the plan generators) receives it in the request body, built client-side first. This
is why `buildCoachContext` lives in `lib/coach/context.ts` and runs in the browser, not
in `app/api/coach/chat`.

## Why no vector database

No Supabase, no pgvector, no embeddings. The data this app's context pipeline draws on —
a user's own plans and check-ins — is small (tens to low hundreds of entries per user),
personal (never searched across users), and already has clean IDs and timestamps.
Structured Firestore queries (`orderBy('createdAt', 'desc').limit(n)`) retrieve exactly
what's needed with no ambiguity.

Semantic search earns its complexity when you need to find *relevant* content in a corpus
too large to fit in a prompt and too unstructured to query directly — a knowledge base,
a large document set, cross-user pattern matching. This app has none of that. The
threshold where it would: if check-in history per user regularly exceeded what a rolling
summary can reasonably compress (low thousands of entries), or if search needed to span
unstructured free text rather than typed, dated records.

## Evals

`evals/run-evals.ts` — not a unit test suite. The coach calls a real, non-deterministic
LLM, so exact-match assertions would be flaky by construction. Ten scripted scenarios run
against the live Groq API and assert on *properties* of the response: did the right tool
fire (or correctly not fire), did the response stay in scope, did it avoid unsafe medical/
financial claims. Run with `npx tsx evals/run-evals.ts` (requires `GROQ_API_KEY` in
`.env.local`).

This mirrors how production eval harnesses actually work (see OpenAI's own `evals`
framework) — heuristic checks on live model behavior, not deterministic unit tests.

## Known simplifications

- **Rolling memory re-summarizes fully rather than incrementally** — see above.
- **Token budgets are character-count approximations**, not a real tokenizer.
- **Only one tool is implemented** (`log_checkin`); read-tools requiring a second
  model round-trip are scoped out.
- **Tool call confirmation text is synthesized by the app**, not generated by the model —
  a consequence of not doing the second round-trip a full tool-call loop would use.
- **"Active plan" means "most recently created plan"** — there's no explicit
  plan-switching UI yet; `isActive` exists on plan documents but isn't used as a toggle.
