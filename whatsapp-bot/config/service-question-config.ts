import type { ServiceQuestionConfig } from "../types/service.ts";

const genericQuestions: ServiceQuestionConfig[] = [
  {
    key: "location",
    label: "Event location",
    type: "text",
    required: true,
    order: 1,
  },
  {
    key: "event_type",
    label: "Event type",
    type: "select",
    required: true,
    order: 2,
    options: ["Wedding", "Reception", "Engagement", "Haldi", "Mehendi", "Other"],
  },
  {
    key: "event_date",
    label: "Event date",
    type: "date",
    required: true,
    order: 3,
  },
  {
    key: "budget_range",
    label: "Budget",
    type: "text",
    required: false,
    order: 4,
  },
];

export const SERVICE_QUESTION_CONFIG: Record<string, ServiceQuestionConfig[]> = {
  photography: [
    ...genericQuestions,
    { key: "event_days", label: "Number of event days", type: "number", required: false, order: 5 },
  ],
  videography: [
    ...genericQuestions,
    { key: "event_days", label: "Number of event days", type: "number", required: false, order: 5 },
  ],
  catering: [
    ...genericQuestions,
    { key: "guest_count", label: "Guest count", type: "number", required: true, order: 5 },
    { key: "food_preference", label: "Food preference", type: "text", required: false, order: 6 },
  ],
  makeup: [
    ...genericQuestions,
    { key: "people_count", label: "Number of people", type: "number", required: false, order: 5 },
    { key: "makeup_type", label: "Makeup type", type: "text", required: false, order: 6 },
  ],
  decorations: [
    ...genericQuestions,
    { key: "venue_type", label: "Venue type", type: "text", required: false, order: 5 },
  ],
  functionhalls: [
    ...genericQuestions,
    { key: "guest_count", label: "Guest count", type: "number", required: true, order: 5 },
  ],
  priests: [
    ...genericQuestions,
    { key: "ceremony_type", label: "Ceremony type", type: "text", required: false, order: 5 },
  ],
};

export function getServiceQuestions(categorySlug: string | null | undefined): ServiceQuestionConfig[] {
  if (!categorySlug) return genericQuestions;
  const slug = categorySlug.toLowerCase();
  return SERVICE_QUESTION_CONFIG[slug] ?? genericQuestions;
}
