

# AI-Powered Mobile Search

## What This Does
When a customer types something like "Ganesh pooja in Vizag" in the mobile search bar, instead of just navigating to the providers page with a text filter, the app will:

1. Use AI to understand the intent and extract the service type + location
2. Search the database for matching providers (e.g., Poojari/Priest providers in Visakhapatnam)
3. Show matching providers inline with an AI suggestion, right below the search bar
4. Let users tap on a provider to view their profile, or "View All" to see filtered results

## How It Works

The search experience will show results in an expandable panel below the search bar on the home screen itself -- no page navigation needed for quick discovery.

- **Logged-in users**: Get full AI-powered suggestions + database provider results
- **Not logged-in users**: Get database provider results only (AI chat requires authentication)

## Technical Plan

### Step 1: Upgrade MobileAISearch Component

**File: `src/components/mobile/MobileAISearch.tsx`**

Rewrite to include:
- Same `extractSearchParams` logic from the desktop `AISearch.tsx` (maps natural language to service types and locations)
- Database query against `public_service_providers` view to find matching providers
- If user is logged in, also stream an AI suggestion from the `ai-chat` edge function
- Results panel showing:
  - AI suggestion bubble (for logged-in users)
  - List of top 3-5 matching providers with name, rating, city
  - "View All Providers" button linking to the full providers page
- Close/dismiss button to hide results
- Loading state with animated dots

### Step 2: No Backend Changes Needed

The existing `ai-chat` edge function with `type: "search"` already supports this use case. The `public_service_providers` view is publicly accessible for anonymous provider lookups.

### What Changes
- **Modified**: `src/components/mobile/MobileAISearch.tsx` -- complete upgrade from simple search bar to AI-powered search with inline results

### No Other Files Affected
The component is self-contained and already used in `MobileHome.tsx`.

