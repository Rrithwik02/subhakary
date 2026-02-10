import { supabase } from "@/integrations/supabase/client";

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
  pandit: 'poojari',
  pujari: 'poojari',
  purohit: 'poojari',
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
  photography: 'photography',
  photographer: 'photography',
  'photo shoot': 'photography',
  videography: 'videography',
  videographer: 'videography',
  'video shoot': 'videography',
  makeup: 'makeup',
  'bridal makeup': 'makeup',
  'makeup artist': 'makeup',
  mehandi: 'mehandi',
  mehndi: 'mehandi',
  henna: 'mehandi',
  decoration: 'decoration',
  decorator: 'decoration',
  decorations: 'decoration',
  'flower decoration': 'decoration',
  catering: 'catering',
  caterer: 'catering',
  'food service': 'catering',
  'function hall': 'function-halls',
  'function halls': 'function-halls',
  venue: 'function-halls',
  hall: 'function-halls',
  'banquet hall': 'function-halls',
  'convention center': 'function-halls',
  'event manager': 'event-managers',
  'event management': 'event-managers',
  'wedding planner': 'event-managers',
  'event planner': 'event-managers',
  'mangala vadyam': 'mangala-vadyam',
  nadaswaram: 'mangala-vadyam',
  nadhaswaram: 'mangala-vadyam',
  shehnai: 'mangala-vadyam',
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
}

export function extractSearchParams(searchQuery: string): SearchParams {
  const q = searchQuery.toLowerCase().trim();

  // Find category by matching service keywords (longest match first)
  let categorySlug: string | null = null;
  const sortedKeywords = Object.keys(SERVICE_KEYWORD_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (q.includes(keyword)) {
      categorySlug = SERVICE_KEYWORD_MAP[keyword];
      break;
    }
  }
  const categoryId = categorySlug ? CATEGORY_MAP[categorySlug] ?? null : null;

  // Find location
  let location: string | null = null;
  // Check aliases first
  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (q.includes(alias)) {
      location = canonical;
      break;
    }
  }
  // Then check known locations
  if (!location) {
    for (const loc of KNOWN_LOCATIONS) {
      if (q.includes(loc)) {
        location = loc.charAt(0).toUpperCase() + loc.slice(1);
        break;
      }
    }
  }

  // Extract remaining keywords for description/subcategory search
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

  // If we have extra keywords, search description and subcategory
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
  return data || [];
}
