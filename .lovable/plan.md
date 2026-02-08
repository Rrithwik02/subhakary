

## Enhanced SEO Keywords Implementation Plan

### Current State Analysis

The project has a good SEO foundation with:
- `src/data/seoData.ts` containing basic keywords for each service (5 keywords per service)
- `index.html` with meta tags and JSON-LD structured data
- `src/components/SEOHead.tsx` dynamically setting meta tags per page
- Service pages (`ServiceCategory.tsx`, `ServiceLocation.tsx`) using these keywords

**Gap Identified**: The current keywords are limited (only 5 per service) and miss many high-value search terms that users actually search for.

---

### Proposed Enhanced Keywords for Each Service

Below are the comprehensive keyword lists I will add for each service:

---

#### 1. Poojari / Priest Services
**Current**: poojari, pandit, priest, pujari, purohit

**Enhanced Keywords**:
- poojari near me, pandit near me, priest near me, pujari near me, purohit near me
- hindu priest for wedding, pooja pandit booking, griha pravesh pandit
- satyanarayan puja pandit, wedding pandit, housewarming priest
- vedic pandit, brahmin pandit near me, puja services near me
- navagraha puja pandit, ganesh puja priest, lakshmi puja pandit
- homam pandit, havan pandit, yagya services, temple priest booking
- online pandit booking, pandit for death rituals, shraddh pandit
- naming ceremony pandit, annaprashan pandit, mundan ceremony priest

---

#### 2. Photographer Services
**Current**: photographer, wedding photographer, event photographer, photography

**Enhanced Keywords**:
- photographer near me, wedding photographer near me, event photographer near me
- candid wedding photographer, pre-wedding photoshoot, engagement photographer
- bridal photography, couple photoshoot, maternity photographer near me
- baby photography near me, birthday party photographer, corporate event photographer
- product photographer, portfolio photographer, outdoor photoshoot
- cinematic wedding photography, traditional wedding photography
- drone photography, aerial photography wedding, photo studio near me
- professional photographer booking, best wedding photographer

---

#### 3. Videographer Services
**Current**: videographer, wedding videographer, cinematographer, video coverage, event videography

**Enhanced Keywords**:
- videographer near me, wedding videographer near me, cinematographer near me
- wedding video shooting, cinematic wedding film, drone videography
- pre-wedding video, engagement video shoot, reception video coverage
- live streaming wedding, wedding teaser video, highlight video
- event videographer, corporate video production, documentary wedding
- same day edit video, wedding short film, videography packages
- 4K wedding video, professional video coverage

---

#### 4. Makeup Artist Services
**Current**: makeup artist, bridal makeup, makeup, beautician, beauty artist

**Enhanced Keywords**:
- makeup artist near me, bridal makeup near me, wedding makeup artist near me
- HD bridal makeup, airbrush bridal makeup, party makeup artist
- groom makeup, engagement makeup, reception makeup artist
- south indian bridal makeup, north indian bridal makeup, muslim bridal makeup
- mehendi function makeup, sangeet makeup, haldi makeup artist
- celebrity makeup artist, professional makeup services, freelance makeup artist
- waterproof bridal makeup, natural bridal makeup, dramatic bridal look
- makeup trial, destination wedding makeup, family makeup packages

---

#### 5. Mehandi Artist Services
**Current**: mehandi artist, mehndi, henna artist, mehendi, henna

**Enhanced Keywords**:
- mehandi artist near me, mehndi designer near me, henna artist near me
- bridal mehandi near me, wedding mehndi artist, dulhan mehandi
- arabic mehandi design, indian mehandi design, rajasthani mehandi
- indo-western mehandi, modern mehandi patterns, traditional henna designs
- leg mehandi, full hand bridal mehandi, mehndi for guests
- professional mehandi artist, mehndi artist for wedding, mehandi function artist
- intricate bridal mehndi, peacock mehandi design, floral mehandi
- baby shower mehandi, engagement mehandi, mehendi artist booking

---

#### 6. Mangala Vadyam / Traditional Music
**Current**: mangala vadyam, nadaswaram, traditional music, shehnai, wedding music

**Enhanced Keywords**:
- mangala vadyam near me, nadaswaram near me, shehnai near me
- nadaswaram player for wedding, shehnai player booking, wedding band near me
- traditional wedding music, south indian wedding music, baraat band
- dhol player near me, wedding dhol, punjabi dhol booking
- live band for wedding, orchestra for wedding, sangeet night band
- fusion music wedding, classical music wedding, instrumental wedding music
- melam artists, thavil player, chenda melam
- muhurtham music, auspicious music services

---

#### 7. Decoration Services
**Current**: decorator, decoration, wedding decorator, event decorator, flower decoration

**Enhanced Keywords**:
- decorator near me, wedding decorator near me, event decorator near me
- mandap decoration, wedding stage decoration, reception stage design
- flower decoration for wedding, floral arrangement services, rose petal decoration
- balloon decoration, birthday party decoration, baby shower decoration
- haldi decoration, mehendi decoration, sangeet decoration theme
- outdoor wedding decoration, destination wedding decor, tent house decoration
- theme party decoration, anniversary decoration, naming ceremony decoration
- entrance decoration, car decoration wedding, backdrop decoration

---

#### 8. Catering Services
**Current**: caterer, catering, wedding catering, event catering, food service

**Enhanced Keywords**:
- caterer near me, catering services near me, wedding caterer near me
- south indian catering, north indian catering, multi-cuisine catering
- vegetarian catering, pure veg caterers, non-veg catering services
- outdoor catering, live counter catering, buffet catering
- birthday party catering, corporate event catering, house party catering
- brahmin catering, iyer catering, andhra catering, telugu catering
- rajasthani catering, gujarati catering, punjabi catering
- bulk food order, party food delivery, catering packages wedding

---

#### 9. Function Halls / Venues
**Current**: function hall, banquet hall, wedding venue, event venue, marriage hall

**Enhanced Keywords**:
- function hall near me, banquet hall near me, wedding venue near me
- marriage hall near me, convention center, kalyana mandapam
- party hall near me, event space booking, reception venue
- ac banquet hall, outdoor wedding venue, garden wedding venue
- farmhouse for wedding, resort wedding venue, budget function hall
- small party hall, corporate event venue, conference hall
- engagement hall, birthday party venue, baby shower venue
- rooftop venue, terrace party hall, poolside wedding venue

---

#### 10. Event Managers / Wedding Planners
**Current**: event manager, wedding planner, event planner, coordinator, event management

**Enhanced Keywords**:
- event manager near me, wedding planner near me, event planner near me
- destination wedding planner, wedding coordinator, day-of coordinator
- complete wedding planning, budget wedding planner, luxury wedding planner
- corporate event manager, birthday party organizer, baby shower planner
- sangeet organizer, mehendi function planner, haldi ceremony planner
- reception event manager, engagement party planner, anniversary event planner
- vendor coordination services, wedding timeline planning, event decoration coordinator
- themed wedding planner, traditional wedding coordinator, modern wedding planner

---

### Implementation Details

| File | Changes |
|------|---------|
| `src/data/seoData.ts` | Expand `keywords` array for each service from 5 to 20+ targeted keywords including "near me" variations, event-specific terms, and regional variations |
| `src/pages/Services.tsx` | Update `searchTerms` array with expanded keywords and implement proper SEOHead component usage |
| `index.html` | Update meta keywords tag to include comprehensive service keywords |
| `src/components/SEOHead.tsx` | Ensure keywords meta tag is properly being set (already implemented) |

---

### Technical Implementation

```text
seoData.ts Structure Update
+----------------------------------+
|  ServiceSEO Interface            |
|  - slug: string                  |
|  - name: string                  |
|  - pluralName: string            |
|  - keywords: string[] (expanded) |
|  - longTailKeywords: string[]    | <-- NEW: "near me" variations
|  - eventKeywords: string[]       | <-- NEW: ceremony-specific terms
|  - regionalKeywords: string[]    | <-- NEW: regional variations
|  - description: string           |
|  - filter: string                |
+----------------------------------+
```

---

### Summary

This update will:
1. Expand keyword coverage from ~50 total keywords to 200+ targeted search terms
2. Add "near me" variations for local SEO
3. Include event-specific keywords (wedding, engagement, reception, etc.)
4. Add regional and cultural variations
5. Improve search visibility across all service categories

