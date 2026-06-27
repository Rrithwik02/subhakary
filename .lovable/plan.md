# Subhakary → "Wedding OS" Transformation Audit

Below is a feature-by-feature audit of your vision vs what's already in the codebase. Each item has a **completion %**, what exists, what's missing, and a yes/no decision to implement.

---

## LAYER 1 — Smart Recommendation Engine (Decision)

### 1.1 Natural-language AI search → vendor results — **70%**

- ✅ `AISearch` + `/search` + `ai-recommend` edge function (category + location detection, premium-first ranking, location fallback).
- ❌ No structured intake of **budget / wedding size / style**. AI only parses free text.
- ❌ Results are not capped to "top 3–5"; no "why recommended" explanation per card.     


### 1.2 Guided preference quiz (budget / size / style / location) — **0%**

- ❌ Does not exist. Hero has only service+date+city dropdowns.
- **Build:** A short 4-step onboarding modal/page (`/plan-wedding`) that stores preferences in a new `wedding_preferences` table.  


### 1.3 "Why this vendor?" explanations — **5%**

- ✅ Premium/Verified badges shown.
- ❌ No per-vendor reasoning ("matches your ₹50k decor budget", "did 3 traditional weddings").
- **Build:** Extend `ai-recommend` to return a 1-line reason per provider; show on cards.

---

## LAYER 2 — Transparent Vendor Profiles (Trust)

### 2.1 Portfolio / real wedding examples — **60%**

- ✅ `PortfolioGallery`, `ProviderPortfolioUpload`, portfolio_images on additional_services.
- ❌ No tagging of portfolio items by wedding type/budget/size, no "real wedding stories".

### 2.2 Detailed pricing breakdown (base + add-ons + hidden) — **40%**

- ✅ `base_price`, `service_bundles` with bundle_items, `additional_services` with min/max price.
- ❌ No explicit "what's included vs not included" breakdown UI; no "hidden costs" disclosure field.
- **Build:** Add `inclusions[]`, `exclusions[]`, `extra_charges[]` to bundles and a clean breakdown component on profile.

### 2.3 Availability calendar on profile — **80%**

- ✅ `ProviderAvailabilityCalendar`, `service_provider_availability`, auto-block on booking accepted (just shipped).
- ❌ Customers may not see it prominently on the public profile — verify visibility.

### 2.4 Verified reviews with context (budget, wedding size) — **50%**

- ✅ Reviews with photos, 4 aspect ratings, status='approved' moderation.
- ❌ No budget / wedding-size tags on reviews.
- **Build:** Add `wedding_budget_range`, `wedding_size` columns to reviews + filters.

---

## LAYER 3 — Intelligent Comparison

### 3.1 Side-by-side compare (2–3 vendors) — **85%**

- ✅ `ComparisonProvider`, `CompareBar`, `/compare` with rating, price, experience rows.
- ❌ Missing rows for inclusions, response time, cancellation policy.

### 3.2 AI-generated comparison summary ("Best for budget", "Best for premium decor") — **0%**

- ❌ Not implemented. Compare page is purely tabular.
- **Build:** New edge function `ai-compare` that ingests selected providers + user prefs and returns a verdict + per-vendor tagline.

---

## LAYER 4 — Booking + Workflow Management (Execution)

### 4.1 Booking requests + accept/reject — **100%**

- ✅ Fully working with bookings table, status flow, notifications.

### 4.2 Chat / communication — **100%**

- ✅ Inquiry chat (pre-booking) + booking chat (post-acceptance), realtime, delivery status.

### 4.3 Payment tracking — **90%**

- ✅ payments, payment_schedules, milestones, escrow_payments, payment_reminders, payment history page.
- ❌ No unified "payment timeline" view inside the wedding dashboard.

### 4.4 Wedding Dashboard (single source of truth) — **10%**

- ✅ My Bookings page lists bookings.
- ❌ No consolidated dashboard that shows **all vendors + budget + tasks + reminders** for one wedding event.
- **Build:** New `/wedding-dashboard` page + `wedding_events` table grouping bookings under one event.

### 4.5 Budget tracker (planned vs actual) — **0%**

- ❌ Not implemented.
- **Build:** `wedding_budget` table (category → planned vs actual from accepted bookings) + visual progress bars.

### 4.6 Task checklist with timeline — **0%**

- ❌ Not implemented.
- **Build:** `wedding_tasks` table seeded with a default 8–12 week checklist; UI with due dates, check-offs, reminders.

### 4.7 Vendor status tracker (booked/pending/confirmed) — **30%**

- ✅ Status exists per booking.
- ❌ Not aggregated per category ("Photographer: ✅ booked, Caterer: ⏳ pending, Decorator: ❌ not started").

### 4.8 Important reminders (payments, deadlines) — **40%**

- ✅ payment_reminders table + notifications system + auto-complete-bookings cron.
- ❌ No task-deadline reminders (depends on 4.6).

---

## LAYER 5 — Guided Wedding Journey (Experience)

### 5.1 Step-by-step flow (basics → venue → vendors → tasks) — **0%**

- ❌ Site is open-ended browsing.
- **Build:** A guided wizard at `/journey` that walks the user through stages and unlocks the next.

### 5.2 Progress indicator ("You're 40% done") — **0%**

- ❌ Not implemented. Depends on 4.6 + 5.1.

### 5.3 "What should I do next?" CTA throughout app — **5%**

- ✅ Generic CTAs only.
- **Build:** A persistent "Next step" card on home + dashboard driven by wedding state.

---

## SUPPORTING / EXISTING STRENGTHS (already strong, no work needed)

- Auth + roles + admin approval — **100%**
- Provider onboarding + verification — **95%**
- Favorites — **100%**
- Notifications center — **90%**
- Mobile experience (full mobile views) — **95%**
- AI chatbot (`AIChatbot.tsx`) — **70%** (works, but not wired into planning flow)
- SEO pages, blog, location pages — **90%**

---

## Priority recommendation (my opinion)

If you want maximum impact for the "Wedding OS" positioning, do them in this order:

1. **Wedding Dashboard + wedding_events grouping** (4.4) — foundation for everything else
2. **Guided preference quiz** (1.2) — captures budget/style/size to power smart recommendations
3. **Budget tracker** (4.5) + **Task checklist** (4.6) — biggest competitor gap
4. **AI compare verdict** (3.2) + **"Why this vendor"** (1.3) — quick AI wins on top of existing infra
5. **Pricing breakdown + review context tags** (2.2, 2.4) — trust layer polish
6. **Guided journey wizard + progress %** (5.1, 5.2) — experiential glue

---

## Decision needed from you

Reply with the numbers you want me to implement (e.g. "1.2, 3.2, 4.4, 4.5, 4.6") or say **"all priority 1–3"** / **"all"**. I'll then produce a detailed build plan for the selected items before writing any code.  
  
**Wedding Dashboard + wedding_events grouping** (4.4) — foundation for everything else

1. **Guided preference quiz** (1.2) — captures budget/style/size to power smart recommendations
2. **Budget tracker** (4.5) + **Task checklist** (4.6) — biggest competitor gap
3. **AI compare verdict** (3.2) + **"Why this vendor"** (1.3) — quick AI wins on top of existing infra
4. **Pricing breakdown + review context tags** (2.2, 2.4) — trust layer polish
5. **Guided journey wizard + progress %** (5.1, 5.2) — experiential glue  
  
Go with these if these are completed then we can move with other implementations

Anything I should NOT touch (e.g. don't change Compare page UI)? Let me know.