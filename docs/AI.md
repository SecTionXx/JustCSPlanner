# AI (OpenRouter)

`src/lib/ai/` is the **AI seam** — the only place in the app that talks to an
external LLM provider. It targets [OpenRouter](https://openrouter.ai)'s
OpenAI-compatible chat completions API by default; `AI_BASE_URL` can point it
at any other OpenAI-compatible endpoint.

## Strictly opt-in (off by default)

AI is **disabled unless `AI_API_KEY` is set**. `isAiEnabled()`
(`src/lib/ai/client.ts`) returns `false` with no key, and every AI feature
must check it first and hide itself. A deployment with no AI config behaves
exactly as before — nothing ever errors from AI being unset. When a call does
run and fails (timeout, HTTP error, bad JSON), the seam throws a typed
`AiError` with a Thai-friendly message that callers catch — a page never
crashes because of AI.

## How to enable

1. Create an account at <https://openrouter.ai> and generate an API key.
2. In `.env.local` set:
   ```env
   AI_API_KEY=sk-or-your-key
   AI_MODEL=anthropic/claude-sonnet-5
   ```
   `AI_MODEL` is an OpenRouter model slug (e.g. `anthropic/claude-sonnet-5`,
   `openai/gpt-5.2`). Set it explicitly — the code falls back to
   `anthropic/claude-sonnet-5` when unset, but the default can change.
3. Optional: `AI_BASE_URL` (defaults to `https://openrouter.ai/api/v1`) and
   `AI_APP_URL` (sent as the OpenRouter `HTTP-Referer` attribution header).

See `.env.example` for the full list.

## Data boundary — what is sent

`completeJson(system, user, parse)` sends to the provider:

- the `system` prompt (from `src/lib/ai/prompts.ts`), and
- the `user` text the caller chose to include.

Nothing else. It **never** sends Google Sheet credentials, the spreadsheet
ID, or the dataset — only the message text for that one request. Keep new
callers minimal: send the smallest snippet that answers the question
(impl guide §8.2).

Sending **real customer data** through AI requires the owner's explicit
exact-scope authorization — until then AI stays off. The prompts themselves
enforce "facts only, never guess", and the seam validates every response
against typed contracts (`JobDraft`, `JobAnswer` in `src/lib/ai/schema.ts`)
before anything reaches the UI. AI output is always a *draft* for a human to
confirm (guide §8.4) — nothing AI produces is written to the Sheet without
confirmation.

## Consuming the seam (later tasks)

| Export                       | File                    | Used by        |
| ---------------------------- | ----------------------- | -------------- |
| `isAiEnabled()`              | `src/lib/ai/client.ts`  | gate every feature |
| `completeJson<T>()`, `AiError` | `src/lib/ai/client.ts` | all AI calls   |
| `jobExtractionSystemPrompt()` | `src/lib/ai/prompts.ts` | P3.1 email/message → Job Card draft |
| `jobQaSystemPrompt()`        | `src/lib/ai/prompts.ts` | P3.4 job Q&A   |
| `JobDraft`, `validateJobDraft` | `src/lib/ai/schema.ts` | P3.1 (extraction contract, guide §8.3) |
| `JobAnswer`, `validateJobAnswer` | `src/lib/ai/schema.ts` | P3.4 (Q&A contract) |

P3.1 (draft extraction) and P3.3/P3.4 (Q&A / summaries) build on these — no
other module should call the provider directly.
