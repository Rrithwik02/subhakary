

## Plan: AI Search Bar + Search Results Page

### What we're building
Add an AI search bar (the `AISearch` component) to the hero section below the existing form-based search. When a user submits a query, they get redirected to a new `/search` page that shows the AI-recommended results.

### Changes

**1. Create `src/pages/SearchResults.tsx`**
- New page that reads `?q=` from URL query params
- On mount, calls `fetchAIRecommendations` (logged-in) or `fetchProviders` (anonymous) with the query
- Displays AI suggestion summary + ranked provider cards (premium badge for `is_premium`)
- Includes the AI search bar at the top so users can refine their search
- Uses `Navbar` and `Footer` for desktop, mobile layout for mobile

**2. Add route in `App.tsx`**
- Add `<Route path="/search" element={<SearchResults />} />`

**3. Update `AISearch.tsx`**
- Instead of showing inline results, redirect to `/search?q=<query>` on submit
- Remove the inline results panel (AnimatePresence section)
- Accept an optional `initialQuery` prop for pre-filling on the search page

**4. Update `MobileAISearch.tsx`**
- Same redirect behavior: navigate to `/search?q=<query>` on submit
- Remove inline results panel

**5. Add AI search bar to `HeroSection.tsx`**
- Place the `AISearch` component below the existing service/date/location search form
- Add a subtle "or" divider between them

**6. Add AI search bar to `MobileHome.tsx`**
- Already uses `MobileAISearch` — confirm it's present, ensure redirect behavior works

### Flow
1. User types in AI search bar on homepage → presses search
2. Redirected to `/search?q=photographer+for+wedding+in+hyderabad`
3. Search results page loads, calls AI recommendation edge function
4. Shows AI summary + ranked providers (premium first, then by rating)
5. User can click a provider to go to their profile, or refine the search

