

# Analysis: Current AI Search vs. Proposed Recommendation Engine

## Build Error Fix (Unrelated)
`src/hooks/useChatPresence.tsx` line 26 uses `NodeJS.Timeout` which fails in the browser TypeScript config. Fix: change to `ReturnType<typeof setTimeout>`.

---

## Comparison

| Aspect | Current Implementation | Proposed Logic |
|---|---|---|
| **Category detection** | Hardcoded keyword map in `searchUtils.ts` (client-side) | AI-powered detection via LLM prompt |
| **DB query** | Direct Supabase query from client using `public_service_providers` view | Server-side DB fetch by category |
| **Ranking** | Sort by `rating` descending only | **Subscribed/premium first**, then by rating |
| **AI role** | Optional text suggestion (cosmetic) — doesn't affect results | Core — detects categories from natural language |
| **Backend** | Edge function only for chat suggestions | Express.js (needs conversion to edge function) |

## What the Proposed Logic Does Better

1. **AI-powered category detection** — handles ambiguous queries like "pandit for griha pravesh" or "full wedding planning" without maintaining a keyword map. The current hardcoded map misses edge cases and needs manual updates.

2. **Monetization-ready ranking** — the `subscribed` (premium) first ranking is a solid business model. Your current DB already has `is_premium` on `service_providers`, so this maps directly.

3. **Cleaner separation** — category detection on the server means the client doesn't need to ship keyword maps.

## What Needs Adaptation

1. **No Express.js** — this project uses edge functions (Deno). The logic needs to be an edge function, not Express.
2. **No Anthropic SDK** — Lovable Cloud provides AI via `ai.gateway.lovable.dev`. We'll use a supported model (e.g., `google/gemini-2.5-flash`) instead of Claude.
3. **No mock data** — we query `public_service_providers` (or `service_providers`) with `is_premium` for the subscribed/premium ranking.
4. **Category keys** — your proposed keys (`photographers`, `priests`, etc.) need to map to the existing `service_categories` table UUIDs.

## Proposed Plan

### 1. Fix build error in `useChatPresence.tsx`
Change `NodeJS.Timeout` to `ReturnType<typeof setTimeout>`.

### 2. Create new edge function `supabase/functions/ai-recommend/index.ts`
- Accepts `{ query: string }` 
- Calls Lovable AI gateway with a system prompt to detect categories (same prompt logic as the proposed code, returning JSON with `categories` array and `summary`)
- Maps detected category keys to `service_categories` UUIDs
- Queries `service_providers` (status=approved), joining category info
- Ranks results: `is_premium=true` first, then by `rating` descending
- Returns `{ detected_categories, summary, results }` 

### 3. Update `src/lib/searchUtils.ts`
- Remove hardcoded keyword detection logic
- Add `fetchAIRecommendations(query, accessToken)` that calls the new edge function
- Keep `extractSearchParams` as a fallback for non-logged-in users

### 4. Update `src/components/AISearch.tsx` and `MobileAISearch.tsx`
- For logged-in users: call the new AI recommendation endpoint
- Display results with premium providers highlighted (badge/star)
- Fallback to current keyword-based search for anonymous users

### Files changed
- `src/hooks/useChatPresence.tsx` — fix `NodeJS.Timeout` type
- `supabase/functions/ai-recommend/index.ts` — new edge function
- `supabase/config.toml` — register new function
- `src/lib/searchUtils.ts` — add AI recommendation fetcher
- `src/components/AISearch.tsx` — use new endpoint
- `src/components/mobile/MobileAISearch.tsx` — use new endpoint

