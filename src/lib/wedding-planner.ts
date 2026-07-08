export type EventType =
  | "wedding"
  | "engagement"
  | "housewarming"
  | "baby-shower"
  | "naming-ceremony"
  | "upanayanam"
  | "birthday"
  | "anniversary"
  | "religious-function"
  | "corporate-event"
  | "other-celebration";

export type WeddingType = "traditional" | "destination" | "simple" | "grand";

export type WeddingEventType = EventType;

export interface EventServiceRequirement {
  slug: string;
  name: string;
  requiredCount: number;
  requiredFields: string[];
  description: string;
}

export interface EventTimelineItem {
  weeksBefore: number;
  title: string;
  description: string;
}

export interface EventTemplate {
  type: EventType;
  label: string;
  description: string;
  budgetPercent: number;
  guestProfile: string;
  defaultCategories: EventServiceRequirement[];
  defaultTasks: string[];
  defaultDocuments: string[];
  defaultTimeline: EventTimelineItem[];
  milestones: string[];
  recommendedReminders: string[];
}

export const EVENT_TYPES: Array<{ label: string; value: EventType; description: string }> = [
  { label: "Wedding", value: "wedding", description: "Bride and groom ceremonies" },
  { label: "Engagement", value: "engagement", description: "Ring ceremony and engagement celebrations" },
  { label: "Housewarming", value: "housewarming", description: "Gruhapravesam" },
  { label: "Baby Shower", value: "baby-shower", description: "Seemantham" },
  { label: "Naming Ceremony", value: "naming-ceremony", description: "Namakaranam" },
  { label: "Upanayanam", value: "upanayanam", description: "Sacred thread ceremony" },
  { label: "Birthday Celebration", value: "birthday", description: "Milestone birthdays and family parties" },
  { label: "Anniversary", value: "anniversary", description: "Intimate or grand anniversary celebrations" },
  { label: "Religious Function", value: "religious-function", description: "Pooja, homam, vratam, and ritual events" },
  { label: "Corporate Event", value: "corporate-event", description: "Launches, retreats, conferences, and team events" },
  { label: "Other Celebration", value: "other-celebration", description: "Any custom celebration or gathering" },
];

export const WEDDING_BUDGET_RANGES = [
  { label: "Under INR 5L", value: "under-5l", amount: 500000 },
  { label: "INR 5L - 10L", value: "5l-10l", amount: 1000000 },
  { label: "INR 10L - 20L", value: "10l-20l", amount: 2000000 },
  { label: "INR 20L - 35L", value: "20l-35l", amount: 3500000 },
  { label: "INR 35L+", value: "35l-plus", amount: 5000000 },
] as const;

export const WEDDING_TYPES: Array<{ label: string; value: WeddingType }> = [
  { label: "Traditional", value: "traditional" },
  { label: "Destination", value: "destination" },
  { label: "Simple", value: "simple" },
  { label: "Grand", value: "grand" },
];

const SERVICE_LIBRARY: Record<string, Omit<EventServiceRequirement, "requiredCount">> = {
  photographer: {
    slug: "photographer",
    name: "Photographer",
    requiredFields: ["Event date", "Location", "Coverage hours", "Output style", "Key moments"],
    description: "Still photography for ceremony and candid coverage.",
  },
  videographer: {
    slug: "videographer",
    name: "Videographer",
    requiredFields: ["Event date", "Location", "Coverage hours", "Highlight reel", "Livestream need"],
    description: "Video coverage, teasers, and long-form edits.",
  },
  venue: {
    slug: "venue",
    name: "Venue",
    requiredFields: ["Guest count", "Indoor or outdoor", "Budget", "Preferred area", "Event date"],
    description: "Hall, lawn, temple, banquet, or destination venue.",
  },
  decorator: {
    slug: "decorator",
    name: "Decorator",
    requiredFields: ["Theme", "Color palette", "Venue size", "Stage requirement", "Budget"],
    description: "Backdrop, floral, and ambience design.",
  },
  catering: {
    slug: "catering",
    name: "Catering",
    requiredFields: ["Guest count", "Meal type", "Dietary preferences", "Service style", "Per-plate budget"],
    description: "Food service, menu planning, and buffet or plated setup.",
  },
  priest: {
    slug: "priest",
    name: "Priest / Poojari",
    requiredFields: ["Event date", "Location", "Religion or tradition", "Language", "Ritual list"],
    description: "Ritual guidance and ceremony execution.",
  },
  makeup: {
    slug: "makeup",
    name: "Makeup Artist",
    requiredFields: ["Number of people", "Event time", "Look preference", "Travel location", "Budget"],
    description: "Bridal, family, and guest styling services.",
  },
  mehendi: {
    slug: "mehendi",
    name: "Mehendi Artist",
    requiredFields: ["Number of people", "Event date", "Design style", "Duration", "Travel location"],
    description: "Henna artists for ceremonies and celebrations.",
  },
  invitation: {
    slug: "invitation",
    name: "Invitation Design",
    requiredFields: ["Event name", "Language", "Theme", "Delivery format", "Guest count"],
    description: "Digital or printed invitation design.",
  },
  gifts: {
    slug: "gifts",
    name: "Return Gifts",
    requiredFields: ["Guest count", "Budget per guest", "Occasion", "Delivery date", "Packaging style"],
    description: "Favours and return gift sourcing.",
  },
  entertainment: {
    slug: "entertainment",
    name: "Entertainment",
    requiredFields: ["Audience size", "Duration", "Age group", "Theme", "Budget"],
    description: "Games, hosts, artists, performers, or emcees.",
  },
  music: {
    slug: "music",
    name: "Music Band",
    requiredFields: ["Event date", "Ceremony timing", "Set list", "Indoor or outdoor", "Sound setup"],
    description: "Live band, dhol, bhajan, or ceremony music.",
  },
  "mangala-vadyam": {
    slug: "mangala-vadyam",
    name: "Mangala Vadyam",
    requiredFields: ["Event date", "Ritual timing", "Venue", "Language", "Duration"],
    description: "Traditional ceremonial music support.",
  },
  transportation: {
    slug: "transportation",
    name: "Transportation",
    requiredFields: ["Guest count", "Pickup points", "Route timing", "Vehicle type", "Budget"],
    description: "Guest shuttle, airport transfers, and logistics.",
  },
  accommodation: {
    slug: "accommodation",
    name: "Accommodation",
    requiredFields: ["Number of rooms", "Check-in dates", "Guest split", "City", "Budget"],
    description: "Stay planning for destination or family events.",
  },
  planner: {
    slug: "planner",
    name: "Event Planner",
    requiredFields: ["Event type", "Budget", "Support scope", "Milestones", "Onsite coverage"],
    description: "End-to-end planning support and coordination.",
  },
  rentals: {
    slug: "rentals",
    name: "Rental Services",
    requiredFields: ["Venue", "Required items", "Delivery window", "Setup time", "Budget"],
    description: "Furniture, lighting, props, and event equipment.",
  },
  florist: {
    slug: "florist",
    name: "Florist",
    requiredFields: ["Theme", "Color palette", "Venue size", "Budget", "Fresh or artificial"],
    description: "Flower decor, garlands, and entrance styling.",
  },
  streaming: {
    slug: "streaming",
    name: "Live Streaming",
    requiredFields: ["Platform", "Camera angles", "Internet availability", "Privacy level", "Duration"],
    description: "Remote viewing and hybrid event coverage.",
  },
  cake: {
    slug: "cake",
    name: "Cake / Dessert Table",
    requiredFields: ["Guest count", "Theme", "Flavour preference", "Delivery time", "Budget"],
    description: "Birthday or anniversary dessert planning.",
  },
  lighting: {
    slug: "lighting",
    name: "Lighting",
    requiredFields: ["Venue size", "Indoor or outdoor", "Theme", "Setup duration", "Budget"],
    description: "Ambience lighting and stage effects.",
  },
  staging: {
    slug: "staging",
    name: "Stage Setup",
    requiredFields: ["Guest count", "Stage size", "Theme", "Sound needs", "Budget"],
    description: "Stage, podium, seating, and backdrops.",
  },
  other: {
    slug: "other",
    name: "Other",
    requiredFields: ["Scope", "Budget", "Deadline", "Location", "Owner"],
    description: "Custom or niche service requests.",
  },
};

const sharedDocs = [
  "Venue agreement",
  "Guest list",
  "Vendor contracts",
  "Identity or ritual documents",
  "Payment receipts",
];

const sharedTimeline = [
  { weeksBefore: 24, title: "Define scope", description: "Lock the event type, budget, and guest profile." },
  { weeksBefore: 20, title: "Shortlist vendors", description: "Review venues and priority service categories." },
  { weeksBefore: 12, title: "Confirm essentials", description: "Book the venue, core vendors, and key rituals." },
  { weeksBefore: 8, title: "Finalize details", description: "Close menu, decor, invite flow, and travel." },
  { weeksBefore: 2, title: "Freeze the plan", description: "Confirm payments, logistics, and contingency plans." },
];

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: "wedding",
    label: "Wedding",
    description: "Bride and groom ceremonies with rituals, guests, and celebrations.",
    budgetPercent: 100,
    guestProfile: "Extended family and friends",
    defaultCategories: [
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.videographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.priest, requiredCount: 1 },
      { ...SERVICE_LIBRARY.makeup, requiredCount: 2 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.gifts, requiredCount: 1 },
      { ...SERVICE_LIBRARY.transportation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.rentals, requiredCount: 1 },
      { ...SERVICE_LIBRARY.florist, requiredCount: 1 },
      { ...SERVICE_LIBRARY.streaming, requiredCount: 1 },
      { ...SERVICE_LIBRARY.planner, requiredCount: 1 },
    ],
    defaultTasks: [
      "Confirm muhurat and venue",
      "Shortlist vendors by priority",
      "Freeze guest list and invitations",
      "Review rituals and seating plan",
      "Prepare payment milestones",
    ],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Venue locked", "Core vendors locked", "Invites sent", "Final payment plan ready"],
    recommendedReminders: ["Follow up on venue advance", "Collect guest confirmations", "Review travel support"],
  },
  {
    type: "engagement",
    label: "Engagement",
    description: "Ring ceremony and intimate celebration before the wedding.",
    budgetPercent: 100,
    guestProfile: "Close family and friends",
    defaultCategories: [
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.florist, requiredCount: 1 },
      { ...SERVICE_LIBRARY.streaming, requiredCount: 1 },
    ],
    defaultTasks: ["Reserve venue", "Design rings ceremony invite", "Confirm photo shot list", "Plan welcome flow"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Venue selected", "Invite design approved", "Event flow ready"],
    recommendedReminders: ["Check ring exchange timing", "Confirm family speeches"],
  },
  {
    type: "housewarming",
    label: "Housewarming",
    description: "Gruhapravesam with puja, family gathering, and home blessings.",
    budgetPercent: 100,
    guestProfile: "Family, neighbours, and elders",
    defaultCategories: [
      { ...SERVICE_LIBRARY.priest, requiredCount: 1 },
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.florist, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
    ],
    defaultTasks: ["Confirm auspicious time", "Arrange puja materials", "Book catering", "Prepare home access plan"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Puja timing fixed", "Home readiness checked", "Guest list finalized"],
    recommendedReminders: ["Keep puja samagri list ready", "Confirm power and water backups"],
  },
  {
    type: "baby-shower",
    label: "Baby Shower",
    description: "Seemantham and family celebration with a warm, festive tone.",
    budgetPercent: 100,
    guestProfile: "Family and close friends",
    defaultCategories: [
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.makeup, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.gifts, requiredCount: 1 },
      { ...SERVICE_LIBRARY.florist, requiredCount: 1 },
    ],
    defaultTasks: ["Finalize theme", "Prepare blessing ritual list", "Lock menu", "Plan games and seating"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Theme approved", "Guest list ready", "Decor booked"],
    recommendedReminders: ["Check mom-to-be comfort needs", "Plan seating and shade"],
  },
  {
    type: "naming-ceremony",
    label: "Naming Ceremony",
    description: "Namakaranam with rituals, family blessings, and photos.",
    budgetPercent: 100,
    guestProfile: "Family elders and close guests",
    defaultCategories: [
      { ...SERVICE_LIBRARY.priest, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.gifts, requiredCount: 1 },
    ],
    defaultTasks: ["Confirm naming ritual", "Invite elders", "Design announcement invite", "Plan meal service"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Name shortlist locked", "Ritual timing fixed", "Guest communications sent"],
    recommendedReminders: ["Prepare baby-friendly setup", "Keep ceremony items together"],
  },
  {
    type: "upanayanam",
    label: "Upanayanam",
    description: "Sacred thread ceremony with traditional rituals and hospitality.",
    budgetPercent: 100,
    guestProfile: "Extended family and ritual participants",
    defaultCategories: [
      { ...SERVICE_LIBRARY.priest, requiredCount: 1 },
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.rentals, requiredCount: 1 },
      { ...SERVICE_LIBRARY.transportation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
    ],
    defaultTasks: ["Book priest and muhurat", "List ritual items", "Plan hospitality", "Confirm venue and seating"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Ritual sequence approved", "Puja items ready", "Family logistics confirmed"],
    recommendedReminders: ["Check chanting language preferences", "Reserve extra seating for elders"],
  },
  {
    type: "birthday",
    label: "Birthday Celebration",
    description: "A warm party or milestone birthday with family and friends.",
    budgetPercent: 100,
    guestProfile: "Friends, family, and children",
    defaultCategories: [
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.entertainment, requiredCount: 1 },
      { ...SERVICE_LIBRARY.cake, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
    ],
    defaultTasks: ["Choose birthday theme", "Confirm cake and menu", "Plan games", "Finalize invite list"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Theme approved", "Cake ordered", "Entertainment locked"],
    recommendedReminders: ["Keep child-friendly activities ready", "Check cake delivery timing"],
  },
  {
    type: "anniversary",
    label: "Anniversary",
    description: "Celebrate a milestone with close family, friends, or a getaway.",
    budgetPercent: 100,
    guestProfile: "Couple, family, and invited guests",
    defaultCategories: [
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.entertainment, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.gifts, requiredCount: 1 },
    ],
    defaultTasks: ["Confirm celebration style", "Shortlist venue", "Plan music and gifts", "Schedule photography"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Venue chosen", "Menu finalized", "Invite sent"],
    recommendedReminders: ["Plan couple portraits", "Prepare anniversary messages"],
  },
  {
    type: "religious-function",
    label: "Religious Function",
    description: "Pooja, homam, vratam, or temple-led ritual events.",
    budgetPercent: 100,
    guestProfile: "Family elders and devotees",
    defaultCategories: [
      { ...SERVICE_LIBRARY.priest, requiredCount: 1 },
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.mangala-vadyam, requiredCount: 1 },
      { ...SERVICE_LIBRARY.invitation, requiredCount: 1 },
      { ...SERVICE_LIBRARY.florist, requiredCount: 1 },
    ],
    defaultTasks: ["Confirm ritual list", "Check priest availability", "Arrange samagri", "Prepare guest seating"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Rituals fixed", "Prasad flow planned", "Venue or temple confirmed"],
    recommendedReminders: ["Check language and tradition details", "Keep ceremonial items ready"],
  },
  {
    type: "corporate-event",
    label: "Corporate Event",
    description: "Launches, conferences, retreats, town halls, and team gatherings.",
    budgetPercent: 100,
    guestProfile: "Team members, clients, or attendees",
    defaultCategories: [
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.videographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.planner, requiredCount: 1 },
      { ...SERVICE_LIBRARY.staging, requiredCount: 1 },
      { ...SERVICE_LIBRARY.lighting, requiredCount: 1 },
      { ...SERVICE_LIBRARY.streaming, requiredCount: 1 },
    ],
    defaultTasks: ["Confirm agenda", "Plan registrations", "Lock venue and AV", "Prepare attendee flow"],
    defaultDocuments: ["Agenda deck", "Speaker list", "Vendor contracts", "Brand guidelines", "Attendance sheet"],
    defaultTimeline: sharedTimeline,
    milestones: ["Agenda ready", "Venue booked", "AV confirmed"],
    recommendedReminders: ["Plan stage rehearsal", "Share attendee communication"],
  },
  {
    type: "other-celebration",
    label: "Other Celebration",
    description: "A custom event with flexible planning modules and services.",
    budgetPercent: 100,
    guestProfile: "Custom audience",
    defaultCategories: [
      { ...SERVICE_LIBRARY.planner, requiredCount: 1 },
      { ...SERVICE_LIBRARY.venue, requiredCount: 1 },
      { ...SERVICE_LIBRARY.photographer, requiredCount: 1 },
      { ...SERVICE_LIBRARY.catering, requiredCount: 1 },
      { ...SERVICE_LIBRARY.decorator, requiredCount: 1 },
    ],
    defaultTasks: ["Define the event brief", "Set priorities", "Choose core vendors", "Track all reminders"],
    defaultDocuments: sharedDocs,
    defaultTimeline: sharedTimeline,
    milestones: ["Brief approved", "Core services selected", "Execution plan created"],
    recommendedReminders: ["Review missing services", "Set contingency buffer"],
  },
];

export function getBudgetRangeByValue(value: string) {
  return WEDDING_BUDGET_RANGES.find((range) => range.value === value) ?? WEDDING_BUDGET_RANGES[0];
}

export function getEventTemplate(type: string) {
  return EVENT_TEMPLATES.find((event) => event.type === type) ?? EVENT_TEMPLATES[EVENT_TEMPLATES.length - 1];
}

export function getEventServiceRequirement(slug: string) {
  return Object.values(SERVICE_LIBRARY).find((service) => service.slug === slug);
}

export function getServiceRequirementsForEvent(type: string) {
  return getEventTemplate(type).defaultCategories.map((category) => ({
    ...category,
    requiredFields: category.requiredFields.length > 0 ? category.requiredFields : ["Scope", "Budget", "Timing", "Location"],
  }));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function createEventTitle(eventType: string, eventName?: string) {
  if (eventName?.trim()) return eventName.trim();
  const template = getEventTemplate(eventType);
  return template.label;
}

export function createWeddingTitle(brideName: string, groomName: string) {
  const bride = brideName.trim().split(" ")[0] || "Bride";
  const groom = groomName.trim().split(" ")[0] || "Groom";
  return `${bride} & ${groom}'s Wedding`;
}

export function getEventTypeLabel(type: string) {
  return getEventTemplate(type).label;
}
