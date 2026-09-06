export type WhatsappRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "CUSTOMER_INTERESTED"
  | "PROVIDER_CONTACTED"
  | "BOOKED"
  | "COMPLETED"
  | "CANCELLED"
  | "NEEDS_MANUAL_MATCHING";

export type WhatsappRequestType = "service_request" | "support" | "recommendation";

export type WhatsappRequestRecord = {
  id: string;
  request_code: string;
  customer_id: string;
  request_type: WhatsappRequestType;
  status: WhatsappRequestStatus;
  source: "whatsapp";
  service_category_id: string | null;
  service_category_name: string | null;
  service_category_slug: string | null;
  location_name: string | null;
  event_type: string | null;
  event_date: string | null;
  guest_count: number | null;
  budget_range: string | null;
  selected_requirement_ids: string[];
  selected_provider_ids: string[];
  service_answers: Record<string, unknown>;
  recommendation_requested: boolean;
  notes: string | null;
  source_whatsapp_message_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsappCustomerRecord = {
  id: string;
  profile_id: string | null;
  whatsapp_phone: string;
  display_name: string | null;
  normalized_phone: string;
  source: "whatsapp";
  created_at: string;
  updated_at: string;
};

export type ConversationState = {
  state: string;
  step?: string | null;
  serviceCategoryId?: string | null;
  selectedRequirementIds?: string[];
  selectedProviderIds?: string[];
  recommendationRequested?: boolean;
  requestId?: string | null;
  draft?: Record<string, unknown>;
};
