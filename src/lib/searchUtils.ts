import { supabase } from "@/integrations/supabase/client";

// ─── AI Recommendation (primary for logged-in users) ───────────

const RECOMMEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommend`;

export interface AIRecommendationResult {
  query: string;
  detected_categories: string[];
  summary: string;
  location: string | null;
  total: number;
  results: SearchProvider[];
}

export async function fetchAIRecommendations(
  query: string
): Promise<AIRecommendationResult> {
  const response = await fetch(RECOMMEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// ─── Fallback: client-side keyword search (for anonymous users) ───

// Category slug -> UUID mapping from service_categories table
const CATEGORY_MAP: Record<string, string> = {
  poojari: '7feb9e4f-372c-4430-94b4-7576c3508372',
  photography: 'aa827d7d-aaca-45ba-9420-44453f5a7f58',
  videography: '4e209cfa-ab2a-4f10-b0b5-9533fb63621a',
  makeup: 'a68ebe7c-1a7f-4e26-aceb-d1dfff0de5bf',
  mehandi: 'aea07102-32ce-4a40-ae32-116acd5b1dfd',
  decoration: 'f3ea05d0-c8a7-40bc-8b61-b3bbdc86d5b4',
  catering: '564b322b-7d44-422c-a9fd-bdcc11f9dc14',
  'function-halls': '912180c4-037c-4741-999c-d97744f5811b',
  'event-managers': '65131497-ef92-4971-94a5-ce747ec42fe2',
  'mangala-vadyam': '69eed3d0-bdc4-4822-a3d8-18298ee27beb',
};

// Service keywords -> category slug
const SERVICE_KEYWORD_MAP: Record<string, string> = {
  poojari: 'poojari',
  priest: 'poojari',
  priests: 'poojari',
  pandit: 'poojari',
  panditji: 'poojari',
  pujari: 'poojari',
  purohit: 'poojari',
  guruji: 'poojari',
  pooja: 'poojari',
  puja: 'poojari',
  homam: 'poojari',
  havan: 'poojari',
  vratam: 'poojari',
  japam: 'poojari',
  'ganesh chaturthi': 'poojari',
  'satyanarayana': 'poojari',
  'gruhapravesam': 'poojari',
  'house warming': 'poojari',
  'griha pravesh': 'poojari',
  'temple priest': 'poojari',
  photography: 'photography',
  photographer: 'photography',
  photographers: 'photography',
  'photo shoot': 'photography',
  'wedding photographer': 'photography',
  'wedding photographers': 'photography',
  'wedding photography': 'photography',
  'candid photographer': 'photography',
  'best photographers': 'photography',
  'photographers near me': 'photography',
  'pre-wedding shoot': 'photography',
  videography: 'videography',
  videographer: 'videography',
  videographers: 'videography',
  'video shoot': 'videography',
  'wedding videography': 'videography',
  'wedding film': 'videography',
  'drone videography': 'videography',
  cinematic: 'videography',
  makeup: 'makeup',
  'bridal makeup': 'makeup',
  'makeup artist': 'makeup',
  'makeup artists': 'makeup',
  beautician: 'makeup',
  beauty: 'makeup',
  makeover: 'makeup',
  mua: 'makeup',
  'hair stylist': 'makeup',
  'best makeup': 'makeup',
  mehandi: 'mehandi',
  mehndi: 'mehandi',
  henna: 'mehandi',
  'mehndi artist': 'mehandi',
  'mehndi artists': 'mehandi',
  'henna artist': 'mehandi',
  'bridal mehndi': 'mehandi',
  decoration: 'decoration',
  decorator: 'decoration',
  decorators: 'decoration',
  decorations: 'decoration',
  'flower decoration': 'decoration',
  'floral decoration': 'decoration',
  'stage decoration': 'decoration',
  'wedding decoration': 'decoration',
  'wedding decorations': 'decoration',
  mandap: 'decoration',
  pandal: 'decoration',
  backdrop: 'decoration',
  'balloon decoration': 'decoration',
  catering: 'catering',
  caterer: 'catering',
  caterers: 'catering',
  'food service': 'catering',
  'best caterers': 'catering',
  'catering service': 'catering',
  'wedding food': 'catering',
  food: 'catering',
  buffet: 'catering',
  'veg catering': 'catering',
  'function hall': 'function-halls',
  'function halls': 'function-halls',
  venue: 'function-halls',
  hall: 'function-halls',
  'banquet hall': 'function-halls',
  'convention center': 'function-halls',
  'marriage hall': 'function-halls',
  'wedding venue': 'function-halls',
  'kalyana mandapam': 'function-halls',
  auditorium: 'function-halls',
  'event manager': 'event-managers',
  'event managers': 'event-managers',
  'event management': 'event-managers',
  'wedding planner': 'event-managers',
  'wedding planners': 'event-managers',
  'event planner': 'event-managers',
  'event planners': 'event-managers',
  coordinator: 'event-managers',
  'mangala vadyam': 'mangala-vadyam',
  nadaswaram: 'mangala-vadyam',
  nadhaswaram: 'mangala-vadyam',
  shehnai: 'mangala-vadyam',
  band: 'mangala-vadyam',
  dj: 'mangala-vadyam',
  dhol: 'mangala-vadyam',
  'wedding band': 'mangala-vadyam',
};

// Location aliases
const LOCATION_ALIASES: Record<string, string> = {
  vizag: 'Visakhapatnam',
  hyd: 'Hyderabad',
  blr: 'Bangalore',
  bengaluru: 'Bengaluru',
  sec: 'Secunderabad',
};

// All known locations for extraction
const KNOWN_LOCATIONS = [
  'hyderabad', 'secunderabad', 'madhapur', 'gachibowli', 'hitech city', 'kondapur', 'kukatpally',
  'ameerpet', 'dilsukhnagar', 'lb nagar', 'ecil', 'uppal', 'miyapur', 'bangalore', 'bengaluru',
  'chennai', 'mumbai', 'delhi', 'kolkata', 'pune', 'ahmedabad', 'vijayawada', 'visakhapatnam',
  'vizag', 'tirupati', 'warangal', 'guntur', 'nellore', 'kakinada', 'rajahmundry',
  'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
  'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
  'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar',
  'navi mumbai', 'allahabad', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior',
  'kochi', 'mangalore', 'mysore', 'hubli',
];

export interface SearchParams {
  categoryId: string | null;
  location: string | null;
  keywords: string[];
}

export interface SearchProvider {
  id: string;
  business_name: string;
  service_type: string | null;
  city: string | null;
  rating: number | null;
  total_reviews: number | null;
  base_price: number | null;
  is_premium?: boolean | null;
  is_verified?: boolean | null;
}

export function extractSearchParams(searchQuery: string): SearchParams {
  const q = searchQuery.toLowerCase().trim();

  let categorySlug: string | null = null;
  const sortedKeywords = Object.keys(SERVICE_KEYWORD_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (q.includes(keyword)) {
      categorySlug = SERVICE_KEYWORD_MAP[keyword];
      break;
    }
  }
  const categoryId = categorySlug ? CATEGORY_MAP[categorySlug] ?? null : null;

  let location: string | null = null;
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (q.includes(alias)) {
      location = canonical;
      break;
    }
  }
  if (!location) {
    for (const loc of KNOWN_LOCATIONS) {
      if (q.includes(loc)) {
        location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }
  }

  const stopWords = new Set(['for', 'in', 'at', 'the', 'a', 'an', 'and', 'or', 'near', 'me', 'my', 'i', 'need', 'want', 'looking', 'find', 'best', 'top', 'good']);
  const allMatchedTerms = new Set<string>();
  if (categorySlug) {
    for (const [kw, slug] of Object.entries(SERVICE_KEYWORD_MAP)) {
      if (slug === categorySlug && q.includes(kw)) allMatchedTerms.add(kw);
    }
  }
  if (location) allMatchedTerms.add(location.toLowerCase());
  for (const alias of Object.keys(LOCATION_ALIASES)) {
    if (q.includes(alias)) allMatchedTerms.add(alias);
  }

  const words = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const keywords = words.filter(w => {
    for (const term of allMatchedTerms) {
      if (term.includes(w) || w.includes(term)) return false;
    }
    return true;
  });

  return { categoryId, location, keywords };
}

export async function fetchProviders(params: SearchParams): Promise<SearchProvider[]> {
  const { categoryId, location, keywords } = params;

  let qb = supabase
    .from('public_service_providers')
    .select('id, business_name, service_type, city, rating, total_reviews, base_price')
    .eq('status', 'approved')
    .order('rating', { ascending: false })
    .limit(5);

  if (categoryId) {
    qb = qb.eq('category_id', categoryId);
  }

  if (location) {
    qb = qb.or(`city.ilike.%${location}%,service_cities.cs.{${location}}`);
  }

  if (keywords.length > 0) {
    const keywordFilters = keywords
      .map(kw => `description.ilike.%${kw}%,subcategory.ilike.%${kw}%`)
      .join(',');
    qb = qb.or(keywordFilters);
  }

  const { data, error } = await qb;
  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Location fallback: if no results with location, retry without location
  if ((!data || data.length === 0) && location && categoryId) {
    let fallbackQb = supabase
      .from('public_service_providers')
      .select('id, business_name, service_type, city, rating, total_reviews, base_price')
      .eq('status', 'approved')
      .eq('category_id', categoryId)
      .order('rating', { ascending: false })
      .limit(5);

    const { data: fallbackData, error: fallbackError } = await fallbackQb;
    if (fallbackError) {
      console.error('Fallback query error:', fallbackError);
      return [];
    }
    return fallbackData || [];
  }

  return data || [];
}
