// SEO Data for location-based pages
export interface ServiceSEO {
  slug: string;
  name: string;
  pluralName: string;
  keywords: string[];
  longTailKeywords: string[];
  eventKeywords: string[];
  regionalKeywords: string[];
  description: string;
  filter: string;
}

// Helper to get all keywords for a service
export const getAllKeywords = (service: ServiceSEO): string[] => {
  return [
    ...service.keywords,
    ...service.longTailKeywords,
    ...service.eventKeywords,
    ...service.regionalKeywords
  ];
};

// Helper to get keywords string for meta tag
export const getKeywordsString = (service: ServiceSEO): string => {
  return getAllKeywords(service).join(", ");
};

export const servicesSEO: ServiceSEO[] = [
  {
    slug: "poojari",
    name: "Poojari",
    pluralName: "Poojaris",
    keywords: [
      "poojari", "pandit", "priest", "pujari", "purohit",
      "hindu priest", "vedic pandit", "brahmin pandit", "temple priest",
      "puja services", "pooja pandit", "online pandit booking"
    ],
    longTailKeywords: [
      "poojari near me", "pandit near me", "priest near me", "pujari near me", "purohit near me",
      "brahmin pandit near me", "puja services near me", "hindu priest near me",
      "pooja pandit booking", "book pandit online"
    ],
    eventKeywords: [
      "hindu priest for wedding", "griha pravesh pandit", "satyanarayan puja pandit",
      "wedding pandit", "housewarming priest", "navagraha puja pandit",
      "ganesh puja priest", "lakshmi puja pandit", "homam pandit", "havan pandit",
      "yagya services", "pandit for death rituals", "shraddh pandit",
      "naming ceremony pandit", "annaprashan pandit", "mundan ceremony priest",
      "vastu puja pandit", "gruhapravesam priest", "seemantham pandit"
    ],
    regionalKeywords: [
      "telugu pandit", "tamil priest", "kannada purohit", "malayalam pandit",
      "north indian pandit", "south indian priest", "bengali purohit",
      "marathi pandit", "gujarati priest", "hindi pandit"
    ],
    description: "Book experienced poojaris and pandits for Hindu ceremonies, weddings, griha pravesh, satyanarayan puja, and all traditional rituals",
    filter: "priest"
  },
  {
    slug: "photographer",
    name: "Photographer",
    pluralName: "Photographers",
    keywords: [
      "photographer", "wedding photographer", "event photographer", "photography",
      "professional photographer", "candid photographer", "photo studio",
      "photography services", "best photographer"
    ],
    longTailKeywords: [
      "photographer near me", "wedding photographer near me", "event photographer near me",
      "photo studio near me", "professional photographer booking", "best wedding photographer",
      "candid photographer near me", "photography services near me"
    ],
    eventKeywords: [
      "candid wedding photographer", "pre-wedding photoshoot", "engagement photographer",
      "bridal photography", "couple photoshoot", "maternity photographer",
      "baby photography", "birthday party photographer", "corporate event photographer",
      "product photographer", "portfolio photographer", "outdoor photoshoot",
      "cinematic wedding photography", "traditional wedding photography",
      "drone photography", "aerial photography wedding", "reception photography"
    ],
    regionalKeywords: [
      "south indian wedding photographer", "north indian wedding photographer",
      "telugu wedding photography", "tamil wedding photographer",
      "punjabi wedding photography", "gujarati wedding photographer",
      "maharashtrian wedding photography", "bengali wedding photographer"
    ],
    description: "Find professional photographers for weddings, pre-wedding shoots, events, and ceremonies with stunning portfolios",
    filter: "photography"
  },
  {
    slug: "videographer",
    name: "Videographer",
    pluralName: "Videographers",
    keywords: [
      "videographer", "wedding videographer", "cinematographer", "video coverage",
      "event videography", "video production", "professional videographer"
    ],
    longTailKeywords: [
      "videographer near me", "wedding videographer near me", "cinematographer near me",
      "event videographer near me", "professional video coverage",
      "videography services near me", "video production near me"
    ],
    eventKeywords: [
      "wedding video shooting", "cinematic wedding film", "drone videography",
      "pre-wedding video", "engagement video shoot", "reception video coverage",
      "live streaming wedding", "wedding teaser video", "highlight video",
      "corporate video production", "documentary wedding", "same day edit video",
      "wedding short film", "4K wedding video", "wedding reel video"
    ],
    regionalKeywords: [
      "south indian wedding videographer", "north indian wedding video",
      "telugu wedding cinematography", "tamil wedding videographer",
      "punjabi wedding video", "gujarati wedding videography"
    ],
    description: "Find professional videographers for wedding cinematography, event coverage, and ceremony documentation",
    filter: "videography"
  },
  {
    slug: "makeup-artist",
    name: "Makeup Artist",
    pluralName: "Makeup Artists",
    keywords: [
      "makeup artist", "bridal makeup", "makeup", "beautician", "beauty artist",
      "professional makeup", "makeup services", "HD makeup", "airbrush makeup"
    ],
    longTailKeywords: [
      "makeup artist near me", "bridal makeup near me", "wedding makeup artist near me",
      "party makeup artist near me", "professional makeup services near me",
      "freelance makeup artist near me", "celebrity makeup artist"
    ],
    eventKeywords: [
      "HD bridal makeup", "airbrush bridal makeup", "party makeup artist",
      "groom makeup", "engagement makeup", "reception makeup artist",
      "mehendi function makeup", "sangeet makeup", "haldi makeup artist",
      "waterproof bridal makeup", "natural bridal makeup", "dramatic bridal look",
      "makeup trial", "destination wedding makeup", "family makeup packages"
    ],
    regionalKeywords: [
      "south indian bridal makeup", "north indian bridal makeup", "muslim bridal makeup",
      "telugu bridal makeup", "tamil bridal makeup", "punjabi bridal makeup",
      "bengali bridal makeup", "maharashtrian bridal makeup", "kerala bridal makeup",
      "sabyasachi bride makeup", "traditional bridal makeup"
    ],
    description: "Book skilled makeup artists for bridal makeup, party makeup, HD makeup, and airbrush makeup services",
    filter: "makeup"
  },
  {
    slug: "mehandi-artist",
    name: "Mehandi Artist",
    pluralName: "Mehandi Artists",
    keywords: [
      "mehandi artist", "mehndi", "henna artist", "mehendi", "henna",
      "mehndi designer", "professional mehandi", "bridal mehandi"
    ],
    longTailKeywords: [
      "mehandi artist near me", "mehndi designer near me", "henna artist near me",
      "bridal mehandi near me", "wedding mehndi artist near me",
      "professional mehandi artist near me", "mehendi artist booking"
    ],
    eventKeywords: [
      "dulhan mehandi", "arabic mehandi design", "indian mehandi design",
      "rajasthani mehandi", "indo-western mehandi", "modern mehandi patterns",
      "traditional henna designs", "leg mehandi", "full hand bridal mehandi",
      "mehndi for guests", "mehndi artist for wedding", "mehandi function artist",
      "intricate bridal mehndi", "peacock mehandi design", "floral mehandi",
      "baby shower mehandi", "engagement mehandi", "karva chauth mehandi"
    ],
    regionalKeywords: [
      "rajasthani mehndi artist", "marwari mehandi", "arabic henna designer",
      "south indian mehandi", "north indian bridal mehndi", "gujarati mehandi",
      "pakistani mehndi design", "moroccan henna"
    ],
    description: "Hire talented mehandi artists for bridal mehandi, Arabic designs, traditional patterns, and event henna services",
    filter: "mehandi"
  },
  {
    slug: "mangala-vadyam",
    name: "Mangala Vadyam",
    pluralName: "Mangala Vadyam Artists",
    keywords: [
      "mangala vadyam", "nadaswaram", "traditional music", "shehnai", "wedding music",
      "auspicious music", "temple music", "classical wedding music"
    ],
    longTailKeywords: [
      "mangala vadyam near me", "nadaswaram near me", "shehnai near me",
      "wedding band near me", "nadaswaram player for wedding",
      "shehnai player booking", "traditional wedding music near me"
    ],
    eventKeywords: [
      "south indian wedding music", "baraat band", "dhol player",
      "wedding dhol", "punjabi dhol booking", "live band for wedding",
      "orchestra for wedding", "sangeet night band", "fusion music wedding",
      "classical music wedding", "instrumental wedding music",
      "muhurtham music", "reception music band"
    ],
    regionalKeywords: [
      "melam artists", "thavil player", "chenda melam", "panchavadyam",
      "kerala traditional music", "tamil nadaswaram", "telugu mangala vadyam",
      "carnatic music wedding", "hindustani wedding music",
      "rajasthani band", "punjabi dhol wala"
    ],
    description: "Book authentic mangala vadyam and nadaswaram artists for weddings and auspicious ceremonies",
    filter: "music"
  },
  {
    slug: "decoration",
    name: "Decorator",
    pluralName: "Decorators",
    keywords: [
      "decorator", "decoration", "wedding decorator", "event decorator", "flower decoration",
      "stage decoration", "mandap decoration", "venue decoration"
    ],
    longTailKeywords: [
      "decorator near me", "wedding decorator near me", "event decorator near me",
      "flower decoration near me", "stage decoration near me",
      "mandap decoration near me", "party decorator near me"
    ],
    eventKeywords: [
      "mandap decoration", "wedding stage decoration", "reception stage design",
      "flower decoration for wedding", "floral arrangement services", "rose petal decoration",
      "balloon decoration", "birthday party decoration", "baby shower decoration",
      "haldi decoration", "mehendi decoration", "sangeet decoration theme",
      "outdoor wedding decoration", "destination wedding decor", "tent house decoration",
      "theme party decoration", "anniversary decoration", "naming ceremony decoration",
      "entrance decoration", "car decoration wedding", "backdrop decoration"
    ],
    regionalKeywords: [
      "south indian wedding decoration", "north indian mandap design",
      "telugu wedding decoration", "tamil kalyana mandapam decoration",
      "punjabi wedding decor", "gujarati wedding decoration",
      "bengali wedding decoration", "marathi wedding mandap"
    ],
    description: "Find creative decorators for wedding mandaps, stage decoration, flower arrangements, and event theming",
    filter: "decoration"
  },
  {
    slug: "catering",
    name: "Caterer",
    pluralName: "Caterers",
    keywords: [
      "caterer", "catering", "wedding catering", "event catering", "food service",
      "catering services", "party catering", "bulk food order"
    ],
    longTailKeywords: [
      "caterer near me", "catering services near me", "wedding caterer near me",
      "party catering near me", "event catering near me",
      "bulk food order near me", "outdoor catering near me"
    ],
    eventKeywords: [
      "vegetarian catering", "pure veg caterers", "non-veg catering services",
      "outdoor catering", "live counter catering", "buffet catering",
      "birthday party catering", "corporate event catering", "house party catering",
      "catering packages wedding", "party food delivery", "function catering"
    ],
    regionalKeywords: [
      "south indian catering", "north indian catering", "multi-cuisine catering",
      "brahmin catering", "iyer catering", "andhra catering", "telugu catering",
      "tamil catering", "rajasthani catering", "gujarati catering", "punjabi catering",
      "bengali catering", "maharashtrian catering", "kerala catering",
      "hyderabadi biryani catering", "chettinad catering"
    ],
    description: "Book trusted caterers offering multi-cuisine menus, live counters, and customized catering packages",
    filter: "catering"
  },
  {
    slug: "function-halls",
    name: "Function Hall",
    pluralName: "Function Halls",
    keywords: [
      "function hall", "banquet hall", "wedding venue", "event venue", "marriage hall",
      "party hall", "convention center", "event space"
    ],
    longTailKeywords: [
      "function hall near me", "banquet hall near me", "wedding venue near me",
      "marriage hall near me", "party hall near me", "event space booking near me",
      "reception venue near me", "convention center near me"
    ],
    eventKeywords: [
      "kalyana mandapam", "ac banquet hall", "outdoor wedding venue",
      "garden wedding venue", "farmhouse for wedding", "resort wedding venue",
      "budget function hall", "small party hall", "corporate event venue",
      "conference hall", "engagement hall", "birthday party venue",
      "baby shower venue", "rooftop venue", "terrace party hall",
      "poolside wedding venue", "destination wedding venue"
    ],
    regionalKeywords: [
      "kalyana mandapam near me", "marriage garden", "wedding lawns",
      "five star wedding venue", "heritage wedding venue",
      "palace wedding venue", "beach wedding venue",
      "temple wedding hall", "community hall wedding"
    ],
    description: "Discover function halls and banquet venues for weddings, receptions, and grand celebrations",
    filter: "venue"
  },
  {
    slug: "event-managers",
    name: "Event Manager",
    pluralName: "Event Managers",
    keywords: [
      "event manager", "wedding planner", "event planner", "coordinator", "event management",
      "wedding coordinator", "party planner", "event organizer"
    ],
    longTailKeywords: [
      "event manager near me", "wedding planner near me", "event planner near me",
      "wedding coordinator near me", "party planner near me",
      "event organizer near me", "event management company near me"
    ],
    eventKeywords: [
      "destination wedding planner", "day-of coordinator", "complete wedding planning",
      "budget wedding planner", "luxury wedding planner", "corporate event manager",
      "birthday party organizer", "baby shower planner", "sangeet organizer",
      "mehendi function planner", "haldi ceremony planner", "reception event manager",
      "engagement party planner", "anniversary event planner",
      "vendor coordination services", "wedding timeline planning",
      "event decoration coordinator"
    ],
    regionalKeywords: [
      "south indian wedding planner", "north indian wedding coordinator",
      "telugu wedding organizer", "tamil wedding planner",
      "punjabi wedding planner", "gujarati wedding coordinator",
      "destination wedding india", "royal wedding planner",
      "traditional wedding coordinator", "modern wedding planner"
    ],
    description: "Hire professional event managers and wedding planners for seamless ceremony coordination",
    filter: "event-planning"
  }
];

// Top cities for SEO focus (prioritized by population and demand)
export const topCitiesSEO = [
  // Tier 1 - Metro cities
  { name: "Hyderabad", state: "Telangana", priority: 1 },
  { name: "Bengaluru", state: "Karnataka", priority: 1 },
  { name: "Chennai", state: "Tamil Nadu", priority: 1 },
  { name: "Mumbai", state: "Maharashtra", priority: 1 },
  { name: "New Delhi", state: "Delhi", priority: 1 },
  { name: "Kolkata", state: "West Bengal", priority: 1 },
  { name: "Pune", state: "Maharashtra", priority: 1 },
  { name: "Ahmedabad", state: "Gujarat", priority: 1 },
  
  // Tier 2 - Major cities
  { name: "Vijayawada", state: "Andhra Pradesh", priority: 2 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", priority: 2 },
  { name: "Jaipur", state: "Rajasthan", priority: 2 },
  { name: "Lucknow", state: "Uttar Pradesh", priority: 2 },
  { name: "Kochi", state: "Kerala", priority: 2 },
  { name: "Coimbatore", state: "Tamil Nadu", priority: 2 },
  { name: "Indore", state: "Madhya Pradesh", priority: 2 },
  { name: "Nagpur", state: "Maharashtra", priority: 2 },
  { name: "Surat", state: "Gujarat", priority: 2 },
  { name: "Vadodara", state: "Gujarat", priority: 2 },
  { name: "Patna", state: "Bihar", priority: 2 },
  { name: "Bhopal", state: "Madhya Pradesh", priority: 2 },
  
  // Tier 3 - Growing cities
  { name: "Warangal", state: "Telangana", priority: 3 },
  { name: "Guntur", state: "Andhra Pradesh", priority: 3 },
  { name: "Tirupati", state: "Andhra Pradesh", priority: 3 },
  { name: "Nellore", state: "Andhra Pradesh", priority: 3 },
  { name: "Rajahmundry", state: "Andhra Pradesh", priority: 3 },
  { name: "Madurai", state: "Tamil Nadu", priority: 3 },
  { name: "Mysore", state: "Karnataka", priority: 3 },
  { name: "Mangalore", state: "Karnataka", priority: 3 },
  { name: "Thiruvananthapuram", state: "Kerala", priority: 3 },
  { name: "Nashik", state: "Maharashtra", priority: 3 },
  { name: "Kanpur", state: "Uttar Pradesh", priority: 3 },
  { name: "Varanasi", state: "Uttar Pradesh", priority: 3 },
  { name: "Agra", state: "Uttar Pradesh", priority: 3 },
  { name: "Amritsar", state: "Punjab", priority: 3 },
  { name: "Ludhiana", state: "Punjab", priority: 3 },
  { name: "Ranchi", state: "Jharkhand", priority: 3 },
  { name: "Bhubaneswar", state: "Odisha", priority: 3 },
  { name: "Guwahati", state: "Assam", priority: 3 },
  { name: "Chandigarh", state: "Chandigarh", priority: 3 },
  { name: "Dehradun", state: "Uttarakhand", priority: 3 }
];

// Helper to create URL-friendly slug
export const createCitySlug = (cityName: string): string => {
  return cityName.toLowerCase().replace(/\s+/g, "-");
};

// Helper to get city from slug
export const getCityFromSlug = (slug: string): string => {
  const city = topCitiesSEO.find(c => createCitySlug(c.name) === slug);
  return city?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// Helper to get service from slug
export const getServiceFromSlug = (slug: string): ServiceSEO | undefined => {
  return servicesSEO.find(s => s.slug === slug);
};

// Generate all service+city URL combinations
export const generateAllServiceCityURLs = (): { service: string; city: string; url: string }[] => {
  const urls: { service: string; city: string; url: string }[] = [];
  
  for (const service of servicesSEO) {
    for (const city of topCitiesSEO) {
      urls.push({
        service: service.slug,
        city: createCitySlug(city.name),
        url: `/services/${service.slug}/${createCitySlug(city.name)}`
      });
    }
  }
  
  return urls;
};

// Get all keywords for global SEO
export const getAllGlobalKeywords = (): string => {
  const allKeywords = new Set<string>();
  
  servicesSEO.forEach(service => {
    getAllKeywords(service).forEach(keyword => allKeywords.add(keyword));
  });
  
  return Array.from(allKeywords).join(", ");
};
