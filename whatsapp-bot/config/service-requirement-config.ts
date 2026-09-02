export type ServiceRequirementOption = {
  id: string;
  label: string;
  description?: string;
};

export const SERVICE_REQUIREMENT_CONFIG: Record<string, ServiceRequirementOption[]> = {
  photography: [
    { id: "photography-wedding", label: "Wedding Photography" },
    { id: "photography-candid", label: "Candid Photography" },
    { id: "photography-traditional", label: "Traditional Photography" },
    { id: "photography-prewedding", label: "Pre-Wedding Photography" },
    { id: "photography-cinematic", label: "Cinematic Video" },
    { id: "photography-drone", label: "Drone Photography" },
    { id: "photography-videography", label: "Wedding Videography" },
  ],
  videography: [
    { id: "videography-cinematic", label: "Cinematic Video" },
    { id: "videography-drone", label: "Drone Videography" },
    { id: "videography-highlights", label: "Highlight Film" },
    { id: "videography-full-coverage", label: "Full Event Coverage" },
  ],
  catering: [
    { id: "catering-veg", label: "Vegetarian Menu" },
    { id: "catering-nonveg", label: "Non-Vegetarian Menu" },
    { id: "catering-buffet", label: "Buffet Service" },
    { id: "catering-plated", label: "Plated Service" },
    { id: "catering-sweets", label: "Sweets and Desserts" },
  ],
  makeup: [
    { id: "makeup-bridal", label: "Bridal Makeup" },
    { id: "makeup-groom", label: "Groom Makeup" },
    { id: "makeup-hd", label: "HD Makeup" },
    { id: "makeup-party", label: "Party Makeup" },
    { id: "makeup-hair", label: "Hair Styling" },
  ],
  decorations: [
    { id: "decor-stage", label: "Stage Decoration" },
    { id: "decor-floral", label: "Floral Decoration" },
    { id: "decor-entrance", label: "Entrance Decoration" },
    { id: "decor-mandap", label: "Mandap Decoration" },
    { id: "decor-theme", label: "Theme Decoration" },
  ],
  functionhalls: [
    { id: "venue-indoor", label: "Indoor Hall" },
    { id: "venue-outdoor", label: "Outdoor Lawn" },
    { id: "venue-banquet", label: "Banquet Hall" },
    { id: "venue-convention", label: "Convention Center" },
    { id: "venue-ac", label: "AC Hall" },
  ],
  priests: [
    { id: "priest-vedic", label: "Vedic Rituals" },
    { id: "priest-marriage", label: "Wedding Ceremony" },
    { id: "priest-homam", label: "Homam / Havan" },
    { id: "priest-grihapravesh", label: "Griha Pravesh" },
  ],
};

export function getServiceRequirements(categorySlug: string | null | undefined): ServiceRequirementOption[] {
  if (!categorySlug) return [];
  return SERVICE_REQUIREMENT_CONFIG[categorySlug.toLowerCase()] ?? [];
}

