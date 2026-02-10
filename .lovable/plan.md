
# Dynamic "Trending Services" Chips on Mobile Search

## What Changes

Replace the current **hardcoded** quick chips ("Catering", "Nadaswaram", "Weddings") below the mobile AI search bar with **dynamically loaded chips** showing the most-booked service categories from the past few weeks.

## How It Works

1. On page load, query the `bookings` table joined with `service_providers` and `service_categories` to count bookings per category over the last 4 weeks
2. Sort by count descending, take the top 3-5 results
3. Display those as the quick-action chips with appropriate emoji mapping
4. Fall back to the current static chips if the query returns no data (e.g., no bookings yet)

## Technical Details

### New Query (runs via `useQuery` in `MobileAISearch.tsx`)

Fetches trending categories by joining bookings with providers and categories, counting bookings created in the last 4 weeks, and ordering by popularity.

Since RLS on `bookings` restricts access to own bookings, we will use a **database function** (security definer) that returns aggregated counts without exposing individual booking data.

### New Database Function

A `get_trending_service_categories()` function that:
- Joins `bookings`, `service_providers`, and `service_categories`
- Filters to bookings from the last 4 weeks
- Groups by category and returns name, slug, and count
- Runs as `SECURITY DEFINER` so it can read across all bookings
- Returns only aggregated, non-sensitive data (category name + count)

### Emoji Mapping

A static map from category slug to emoji:
- poojari: "🙏"
- photography: "📸"
- videography: "🎥"
- makeup: "💄"
- mehandi: "🎨"
- decoration: "🎊"
- catering: "🍽️"
- function-halls: "🏛️"
- event-managers: "📋"
- mangala-vadyam: "🎵"

### Fallback

If the query returns fewer than 3 results (e.g., new platform with few bookings), pad with hardcoded defaults so the UI never looks empty.

### Files Changed

1. **New migration** -- Create `get_trending_service_categories()` database function
2. **`src/components/mobile/MobileAISearch.tsx`** -- Replace static `quickChips` array with a `useQuery` call to the new function, add emoji mapping, add fallback logic
