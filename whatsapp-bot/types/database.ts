import type { Database as GeneratedDatabase, Json as SupabaseJson } from "../../src/integrations/supabase/types.ts";

export type Json = SupabaseJson;

export function toJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => toJson(item));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJson(item)]));
  }
  return String(value);
}

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type WhatsappTables = {
  whatsapp_services: Table<{
    id: string;
    category_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  whatsapp_service_questions: Table<{
    id: string;
    service_slug: string;
    key: string;
    label: string;
    type: string;
    required: boolean;
    sort_order: number;
    options: Json | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  whatsapp_service_requirements: Table<{
    id: string;
    service_slug: string;
    requirement_id: string;
    label: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
  }>;
  whatsapp_customers: Table<{
    id: string;
    profile_id: string | null;
    whatsapp_phone: string;
    normalized_phone: string;
    display_name: string | null;
    source: string;
    created_at: string;
    updated_at: string;
    last_seen_at: string | null;
  }>;
  whatsapp_conversations: Table<{
    id: string;
    customer_id: string;
    conversation_state: string;
    current_step: string | null;
    state_payload: Json;
    source: string;
    last_inbound_at: string | null;
    last_outbound_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  whatsapp_messages: Table<{
    id: string;
    conversation_id: string;
    whatsapp_message_id: string;
    direction: string;
    message_type: string;
    body: string | null;
    payload: Json;
    delivery_status: string;
    created_at: string;
  }>;
  whatsapp_requests: Table<{
    id: string;
    request_code: string;
    customer_id: string;
    request_type: string;
    status: string;
    source: string;
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
    recommendation_requested: boolean;
    service_answers: Json;
    notes: string | null;
    source_whatsapp_message_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  whatsapp_request_providers: Table<{
    request_id: string;
    provider_id: string;
    selection_rank: number;
    is_recommended: boolean;
    created_at: string;
  }>;
  whatsapp_events: Table<{
    id: string;
    customer_id: string | null;
    conversation_id: string | null;
    request_id: string | null;
    event_name: string;
    payload: Json;
    source: string;
    created_at: string;
  }>;
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: GeneratedDatabase["public"]["Tables"] & WhatsappTables;
  };
};
