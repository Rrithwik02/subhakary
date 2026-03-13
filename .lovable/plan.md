

# Plan: Improve AI Search Term Coverage & Location Fallback

## Problem 1: Missing term mappings
The AI system prompt has limited "Common mappings." Terms like "makeup artists," "makeup artist in vizag," "wedding photographers," "best caterers" etc. aren't explicitly listed. While the LLM *should* handle these, adding more explicit mappings in the prompt will make detection more reliable.

**Fix:** Expand the system prompt's common mappings section with more variations — plurals, "artist/artists" suffixes, compound terms, and colloquial phrases.

## Problem 2: No location fallback
When providers exist for a category but not in the searched location, the user sees zero results with no guidance.

**Fix:** Add a two-pass query in the edge function:
1. First query: filter by category + location (current behavior)
2. If zero results: re-query with category only (no location filter), and update the summary to say "No [service] providers found in [location]. Here are top providers in other cities."

## Changes

### 1. Update `supabase/functions/ai-recommend/index.ts`
- Expand AI system prompt with more keyword mappings:
  - "makeup artist", "makeup artists", "MUA", "beautician" → makeup
  - "wedding photographer", "photographers near me" → photographers  
  - "best caterers", "food" → catering
  - "pandal", "stage decoration", "floral" → decorations
  - "DJ", "band", "music" → mangalavaadhyams
  - etc.
- After the first DB query, if results are empty AND a location was detected:
  - Re-query without the location filter (same categories)
  - Prepend the summary with a note like "No providers found in [location]. Showing results from other cities."

### 2. Update `src/pages/SearchResults.tsx`
- Display a subtle info banner when results are from a fallback (different location than searched)
- No structural changes needed — the edge function returns the updated summary

### Files changed
- `supabase/functions/ai-recommend/index.ts` — expanded prompt + location fallback logic
- `src/pages/SearchResults.tsx` — minor: show fallback location note from summary

