import type { ConversationState } from "../../types/request.ts";
import type { WhatsappIncomingMessage } from "../../types/whatsapp.ts";
import { normalizePhone } from "../../utils/validation.ts";
import type { SupabaseService } from "../supabase/client.ts";
import { toJson } from "../../types/database.ts";

export type WhatsappConversationRecord = {
  id: string;
  customer_id: string;
  state_payload: unknown;
  updated_at: string;
};

export function extractIncomingMessage(envelope: unknown): WhatsappIncomingMessage[] {
  const payload = envelope as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            id: string;
            from: string;
            timestamp?: string;
            text?: { body?: string };
            interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } };
          }>;
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        };
      }>;
    }>;
  };

  const messages: WhatsappIncomingMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue;
      const contact = value.contacts?.[0];
      for (const message of value.messages) {
        const buttonId = message.interactive?.button_reply?.id ?? null;
        const listId = message.interactive?.list_reply?.id ?? null;
        messages.push({
          messageId: message.id,
          from: normalizePhone(message.from),
          name: contact?.profile?.name ?? null,
          timestamp: message.timestamp ?? String(Date.now()),
          text: message.text?.body ?? null,
          buttonId,
          listId,
          raw: message,
        });
      }
    }
  }

  return messages;
}

export function nextState(current: ConversationState, patch: Partial<ConversationState>): ConversationState {
  return {
    ...current,
    ...patch,
    draft: {
      ...(current.draft ?? {}),
      ...(patch.draft ?? {}),
    },
  };
}

export async function upsertWhatsappCustomer(
  supabase: SupabaseService,
  phone: string,
  displayName?: string | null,
  profileId?: string | null,
): Promise<{ id: string }> {
  const normalizedPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from("whatsapp_customers")
    .upsert(
      {
        whatsapp_phone: phone,
        normalized_phone: normalizedPhone,
        display_name: displayName ?? null,
        profile_id: profileId ?? null,
        source: "whatsapp",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "normalized_phone" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert WhatsApp customer: ${error.message}`);
  }

  return data;
}

export async function upsertWhatsappConversation(
  supabase: SupabaseService,
  customerId: string,
  state: ConversationState,
): Promise<WhatsappConversationRecord> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .upsert(
      {
        customer_id: customerId,
        conversation_state: state.state,
        current_step: state.step ?? null,
        state_payload: toJson(state),
        source: "whatsapp",
        last_inbound_at: new Date().toISOString(),
      },
      { onConflict: "customer_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert WhatsApp conversation: ${error.message}`);
  }

  return data;
}

export async function updateWhatsappConversationIfUnchanged(
  supabase: SupabaseService,
  conversationId: string,
  expectedUpdatedAt: string,
  state: ConversationState,
): Promise<WhatsappConversationRecord> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .update({
      conversation_state: state.state,
      current_step: state.step ?? null,
      state_payload: toJson(state),
      last_inbound_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error) throw new Error("Failed to update WhatsApp conversation");
  if (!data) throw new Error("Conversation changed while processing another WhatsApp event");
  return data;
}

export async function appendWhatsappEvent(
  supabase: SupabaseService,
  payload: {
    customerId?: string | null;
    conversationId?: string | null;
    requestId?: string | null;
    eventName: string;
    eventPayload?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("whatsapp_events").insert({
    customer_id: payload.customerId ?? null,
    conversation_id: payload.conversationId ?? null,
    request_id: payload.requestId ?? null,
    event_name: payload.eventName,
    payload: toJson(payload.eventPayload ?? {}),
    source: "whatsapp",
  });

  if (error) {
    throw new Error(`Failed to append WhatsApp event: ${error.message}`);
  }
}
