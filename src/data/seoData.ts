// SEO Data for location-based pages
export interface ServiceSEO {
  slug: string;
  name: string;
  pluralName: string;
  keywords: string[];
  description: string;
  filter: string;
}

export const servicesSEO: ServiceSEO[] = [
  {
    slug: "poojari",
    name: "Poojari",
    pluralName: "Poojaris",
    keywords: ["poojari", "pandit", "priest", "pujari", "purohit"],
    description: "Book experienced poojaris and pandits for Hindu ceremonies, weddings, griha pravesh, satyanarayan puja, and all traditional rituals",
    filter: "priest"
  },
  {
    slug: "photographer",
    name: "Photographer",
    pluralName: "Photographers",
    keywords: ["photographer", "wedding photographer", "event photographer", "photography"],
    description: "Find professional photographers for weddings, pre-wedding shoots, events, and ceremonies with stunning portfolios",
    filter: "photography"
  },
  {
    slug: "makeup-artist",
    name: "Makeup Artist",
    pluralName: "Makeup Artists",
    keywords: ["makeup artist", "bridal makeup", "makeup", "beautician", "beauty artist"],
    description: "Book skilled makeup artists for bridal makeup, party makeup, HD makeup, and airbrush makeup services",
    filter: "makeup"
  },
  {
    slug: "mehandi-artist",
    name: "Mehandi Artist",
    pluralName: "Mehandi Artists",
    keywords: ["mehandi artist", "mehndi", "henna artist", "mehendi", "henna"],
    description: "Hire talented mehandi artists for bridal mehandi, Arabic designs, traditional patterns, and event henna services",
    filter: "mehandi"
  },
  {
    slug: "mangala-vadyam",
    name: "Mangala Vadyam",
    pluralName: "Mangala Vadyam Artists",
    keywords: ["mangala vadyam", "nadaswaram", "traditional music", "shehnai", "wedding music"],
    description: "Book authentic mangala vadyam and nadaswaram artists for weddings and auspicious ceremonies",
    filter: "music"
  },
  {
    slug: "decoration",
    name: "Decorator",
    pluralName: "Decorators",
    keywords: ["decorator", "decoration", "wedding decorator", "event decorator", "flower decoration"],
    description: "Find creative decorators for wedding mandaps, stage decoration, flower arrangements, and event theming",
    filter: "decoration"
  },
  {
    slug: "catering",
    name: "Caterer",
    pluralName: "Caterers",
    keywords: ["caterer", "catering", "wedding catering", "event catering", "food service"],
    description: "Book trusted caterers offering multi-cuisine menus, live counters, and customized catering packages",
    filter: "catering"
  },
  {
    slug: "function-halls",
    name: "Function Hall",
    pluralName: "Function Halls",
    keywords: ["function hall", "banquet hall", "wedding venue", "event venue", "marriage hall"],
    description: "Discover function halls and banquet venues for weddings, receptions, and grand celebrations",
    filter: "venue"
  },
  {
    slug: "event-managers",
    name: "Event Manager",
    pluralName: "Event Managers",
    keywords: ["event manager", "wedding planner", "event planner", "coordinator", "event management"],
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
