import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../../../whatsapp-bot/services/supabase/client.ts";
import type { SupabaseService } from "../../../whatsapp-bot/services/supabase/client.ts";
import { toJson } from "../../../whatsapp-bot/types/database.ts";
import { BOT_CONFIG } from "../../../whatsapp-bot/config/bot-config.ts";
import { MESSAGES } from "../../../whatsapp-bot/config/messages.ts";
import { renderRequestReview } from "../../../whatsapp-bot/flows/request.ts";
import { renderMyRequests } from "../../../whatsapp-bot/flows/my-requests.ts";
import { renderSupportMessage } from "../../../whatsapp-bot/flows/support.ts";
import { renderHelpMessage } from "../../../whatsapp-bot/flows/help.ts";
import { listRequestsByCustomer, createWhatsappRequest, addRequestProviders } from "../../../whatsapp-bot/services/request-management/index.ts";
import { searchProviders, listServiceCategories } from "../../../whatsapp-bot/services/provider-search/index.ts";
import { sendWhatsAppMessage } from "../../../whatsapp-bot/services/whatsapp/send-message.ts";
import { listWhatsappQuestions, listWhatsappRequirements } from "../../../whatsapp-bot/services/catalog/index.ts";
import { appendWhatsappEvent, extractIncomingMessage, nextState, updateWhatsappConversationIfUnchanged, upsertWhatsappConversation, upsertWhatsappCustomer, type WhatsappConversationRecord } from "../../../whatsapp-bot/services/whatsapp/index.ts";
import { verifyMetaWebhookSignature } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import type { ConversationState } from "../../../whatsapp-bot/types/request.ts";
import type { ServiceCategoryRecord } from "../../../whatsapp-bot/types/service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-whatsapp-bot-secret, x-hub-signature-256, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getConversationState(raw: unknown): ConversationState {
  if (!raw || typeof raw !== "object") return { state: "welcome", draft: {} };
  const value = raw as Partial<ConversationState>;
  return {
    state: value.state ?? "welcome",
    step: value.step ?? null,
    serviceCategoryId: value.serviceCategoryId ?? null,
    selectedRequirementIds: value.selectedRequirementIds ?? [],
    selectedProviderIds: value.selectedProviderIds ?? [],
    recommendationRequested: value.recommendationRequested ?? false,
    requestId: value.requestId ?? null,
    draft: value.draft ?? {},
  };
}

async function questionSequence(supabase: SupabaseService, categorySlug: string | null | undefined) {
  return listWhatsappQuestions(supabase, categorySlug);
}

function questionPrompt(question: { label: string; type: string; options?: string[] }) {
  if (question.options?.length) {
    return `${question.label}\n${question.options.map((option, index) => `${index + 1}. ${option}`).join("\n")}`;
  }
  return question.label;
}

type BotRoute = {
  nextState: ConversationState;
  replyText: string;
  replyInteractive?: Record<string, unknown>;
};

function listInteractive(body: string, buttonText: string, rows: Array<{ id: string; title: string; description?: string }>) {
  return {
    type: "list",
    body: { text: body },
    action: {
      button: buttonText,
      sections: [{ title: "Options", rows: rows.slice(0, 10) }],
    },
  };
}

function buttonsInteractive(body: string, buttons: Array<{ id: string; title: string }>) {
  return {
    type: "button",
    body: { text: body },
    action: { buttons: buttons.slice(0, 3).map((button) => ({ type: "reply", reply: button })) },
  };
}

function formatCategoryList(categories: ServiceCategoryRecord[]) {
  return [
    "Please choose a service category:",
    "",
    ...categories.map((category, index) => `${index + 1}. ${category.name} (${category.id})`),
  ].join("\n");
}

async function selectedRequirementsText(supabase: SupabaseService, categorySlug: string | null | undefined, ids: string[]) {
  const requirements = categorySlug ? await listWhatsappRequirements(supabase, categorySlug) : [];
  const lookup = new Map(requirements.map((item) => [item.requirement_id, item.label]));
  return ids.map((id) => lookup.get(id) ?? id).filter(Boolean);
}

async function resolveRequirementIds(supabase: SupabaseService, categorySlug: string | null | undefined, input: string): Promise<string[]> {
  const options = categorySlug ? await listWhatsappRequirements(supabase, categorySlug) : [];
  const normalized = normalizeText(input).replace(/^requirement:/, "");
  if (!normalized) return [];

  const tokens = normalized
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const resolved = new Set<string>();
  for (const token of tokens.length ? tokens : [normalized]) {
    for (const option of options) {
      const label = option.label.toLowerCase();
      if (token === option.requirement_id.toLowerCase() || token === label || token.includes(label) || label.includes(token)) {
        resolved.add(option.requirement_id);
      }
    }
  }

  return Array.from(resolved);
}

function resolveCategorySelection(categories: ServiceCategoryRecord[], rawSelection: string | null | undefined) {
  const selection = normalizeText(rawSelection).replace(/^category:/, "");
  if (!selection) return null;
  return categories.find(
    (category) =>
      category.id.toLowerCase() === selection ||
      category.slug.toLowerCase() === selection ||
      category.name.toLowerCase() === selection ||
      category.name.toLowerCase().includes(selection) ||
      selection.includes(category.slug.toLowerCase()),
  ) ?? null;
}

function mergeUnique(values: string[], additions: string[]) {
  return Array.from(new Set([...values, ...additions]));
}

async function getCustomerProfileByPhone(supabase: SupabaseService, phone: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("phone", phone)
    .maybeSingle();
  return data as { id: string; full_name: string | null; phone: string | null } | null;
}

async function loadConversation(
  supabase: SupabaseService,
  customerId: string,
): Promise<WhatsappConversationRecord | null> {
  const { data } = await supabase
    .from("whatsapp_conversations")
    .select("id, customer_id, conversation_state, current_step, state_payload, updated_at")
    .eq("customer_id", customerId)
    .maybeSingle();
  return data as WhatsappConversationRecord | null;
}

async function storeInboundMessage(
  supabase: SupabaseService,
  conversationId: string,
  incoming: { messageId: string; text: string | null; raw: unknown },
) : Promise<boolean> {
  const { data, error } = await supabase.from("whatsapp_messages").insert(
    {
      conversation_id: conversationId,
      whatsapp_message_id: incoming.messageId,
      direction: "inbound",
      message_type: "text",
      body: incoming.text,
      payload: toJson(incoming.raw),
      delivery_status: "received",
    },
  ).select("id").maybeSingle();

  if (error) {
    if (error.code === "23505") return false;
    throw new Error("Failed to claim inbound WhatsApp event");
  }
  return Boolean(data?.id);
}

async function storeOutboundMessage(
  supabase: SupabaseService,
  conversationId: string,
  messageId: string,
  text: string,
) {
  await supabase.from("whatsapp_messages").upsert(
    {
      conversation_id: conversationId,
      whatsapp_message_id: messageId,
      direction: "outbound",
      message_type: "text",
      body: text,
      payload: { text },
      delivery_status: "sent",
    },
    { onConflict: "whatsapp_message_id" },
  );
}

async function buildProviderResponse(
  supabase: SupabaseService,
  state: ConversationState,
  page: number,
  limit: number,
) {
  const categories = await listServiceCategories(supabase);
  const category = categories.find((item) => item.id === state.serviceCategoryId || item.slug === state.draft?.serviceCategorySlug) ?? null;
  const searchResult = await searchProviders(supabase, {
    categoryId: state.serviceCategoryId ?? null,
    categorySlug: category?.slug ?? null,
    location: typeof state.draft?.location === "string" ? String(state.draft.location) : null,
    budgetMax: typeof state.draft?.budget_max === "number" ? Number(state.draft.budget_max) : undefined,
    budgetMin: typeof state.draft?.budget_min === "number" ? Number(state.draft.budget_min) : undefined,
    page,
    limit,
  });

  return { category, searchResult };
}

async function resolveReviewText(
  supabase: SupabaseService,
  state: ConversationState,
  categorySlug: string | null,
) {
  const providers = state.selectedProviderIds ?? [];
  let providerNames: string[] = [];
  if (providers.length) {
    const { data } = await supabase
      .from("service_providers")
      .select("id, business_name")
      .in("id", providers);
    providerNames = (data ?? []).map((provider) => `${provider.business_name}`);
  }

  const requirementLabels = await selectedRequirementsText(supabase, categorySlug, state.selectedRequirementIds ?? []);
  const reviewRequest = {
    id: state.requestId ?? "",
    request_code: state.requestId ?? "Preview",
    customer_id: "",
    request_type: "service_request" as const,
    status: "NEW" as const,
    source: "whatsapp" as const,
    service_category_id: state.serviceCategoryId ?? null,
    service_category_name: typeof state.draft?.serviceCategoryName === "string" ? String(state.draft.serviceCategoryName) : null,
    service_category_slug: categorySlug,
    location_name: typeof state.draft?.location === "string" ? String(state.draft.location) : null,
    event_type: typeof state.draft?.event_type === "string" ? String(state.draft.event_type) : null,
    event_date: typeof state.draft?.event_date === "string" ? String(state.draft.event_date) : null,
    guest_count: typeof state.draft?.guest_count === "number" ? Number(state.draft.guest_count) : null,
    budget_range: typeof state.draft?.budget_range === "string" ? String(state.draft.budget_range) : null,
    selected_requirement_ids: state.selectedRequirementIds ?? [],
    selected_provider_ids: state.selectedProviderIds ?? [],
    recommendation_requested: Boolean(state.recommendationRequested),
    service_answers: state.draft ?? {},
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const request = renderRequestReview(reviewRequest);
  return [
    "📋 Please review your request",
    "",
    `Service: ${state.draft?.serviceCategoryName ?? "Service"}`,
    `Requirements: ${requirementLabels.length ? requirementLabels.map((item) => `✓ ${item}`).join("\n") : "None"}`,
    `Event: ${typeof state.draft?.event_type === "string" ? String(state.draft.event_type) : "Not set"}`,
    `Date: ${typeof state.draft?.event_date === "string" ? String(state.draft.event_date) : "Not set"}`,
    `Location: ${typeof state.draft?.location === "string" ? String(state.draft.location) : "Not set"}`,
    `Budget: ${typeof state.draft?.budget_range === "string" ? String(state.draft.budget_range) : "Not set"}`,
    "",
    `Selected Providers:\n${providerNames.length ? providerNames.map((name, index) => `${index + 1}. ${name}`).join("\n") : "None"}`,
    "",
    `${request.text}`,
  ].join("\n");
}

function providerRows(providers: Array<{ id: string; business_name: string; city?: string | null; rating?: number | null }>, selectedIds: string[], hasMore: boolean) {
  const rows = providers.map((provider) => ({
    id: `provider:${provider.id}`,
    title: `${selectedIds.includes(provider.id) ? "✓ " : ""}${provider.business_name}`.slice(0, 24),
    description: `⭐ ${Number(provider.rating ?? 0).toFixed(1)} • ${provider.city ?? "Location unavailable"}`.slice(0, 72),
  }));
  if (hasMore && rows.length < 10) rows.push({ id: "providers:more", title: "View more providers", description: "Show the next matches" });
  if (rows.length < 10) rows.push({ id: "providers:recommend", title: "Let Subhakary recommend", description: "Choose the best matches for me" });
  if (selectedIds.length && rows.length < 10) rows.push({ id: "providers:continue", title: "Continue", description: "Review selected providers" });
  return rows;
}

async function handleMainMenuSelection(
  supabase: SupabaseService,
  customerId: string,
  conversation: ConversationState,
  incomingText: string,
  incomingSelection: string | null,
) {
  const selection = normalizeText(incomingSelection ?? incomingText);

  if (selection.includes("find_service") || selection.includes("find a service")) {
    const categories = await listServiceCategories(supabase);
    return {
      nextState: nextState(conversation, { state: "service_category", step: "choose_category" }),
      replyText: formatCategoryList(categories),
      replyInteractive: listInteractive("Choose the service you need", "View services", categories.map((category) => ({ id: `category:${category.id}`, title: category.name, description: category.description ?? undefined }))),
    };
  }

  if (selection.includes("my_requests")) {
    const requests = await listRequestsByCustomer(supabase, customerId);
    return {
      nextState: nextState(conversation, { state: "my_requests", step: "main_menu" }),
      replyText: renderMyRequests(requests).text,
    };
  }

  if (selection.includes("talk_to_subhakary") || selection.includes("talk to subhakary")) {
    return {
      nextState: nextState(conversation, { state: "support", step: "support" }),
      replyText: renderSupportMessage().text,
      replyInteractive: buttonsInteractive("What would you like to do next?", [
        { id: "find_service", title: "Find a service" },
        { id: "my_requests", title: "My requests" },
        { id: "help", title: "Help" },
      ]),
    };
  }

  if (selection.includes("help")) {
    return {
      nextState: nextState(conversation, { state: "help", step: "help" }),
      replyText: renderHelpMessage().text,
      replyInteractive: buttonsInteractive("Choose an option", [
        { id: "find_service", title: "Find a service" },
        { id: "my_requests", title: "My requests" },
        { id: "talk_to_subhakary", title: "Talk to Subhakary" },
      ]),
    };
  }

  return {
    nextState: nextState(conversation, { state: "main_menu", step: "main_menu" }),
    replyText: MESSAGES.invalidChoice,
    replyInteractive: buttonsInteractive(MESSAGES.welcome, [
      { id: "find_service", title: "Find a service" },
      { id: "my_requests", title: "My requests" },
      { id: "talk_to_subhakary", title: "Talk to Subhakary" },
    ]),
  };
}

async function routeMessage(
  supabase: SupabaseService,
  customerId: string,
  displayName: string | null,
  state: ConversationState,
  incomingText: string | null,
  selectionId: string | null,
  sourceWhatsappMessageId: string,
) {
  const text = normalizeText(incomingText);
  const selection = normalizeText(selectionId ?? incomingText);

  if (selection.includes("restart")) {
    const categories = await listServiceCategories(supabase);
    return {
      nextState: { state: "service_category", step: "choose_category" } as ConversationState,
      replyText: formatCategoryList(categories),
      replyInteractive: listInteractive("Choose the service you need", "View services", categories.map((category) => ({ id: `category:${category.id}`, title: category.name, description: category.description ?? undefined }))),
    };
  }

  if (state.state === "welcome" || state.state === "main_menu") {
    return handleMainMenuSelection(supabase, customerId, state, text, selection);
  }

  if (state.step === "choose_category" || state.state === "service_category") {
    const categories = await listServiceCategories(supabase);
    const category = resolveCategorySelection(categories, selection);
    if (!category) {
      return {
        nextState: nextState(state, { state: "service_category", step: "choose_category" }),
        replyText: formatCategoryList(categories),
        replyInteractive: listInteractive("Choose the service you need", "View services", categories.map((item) => ({ id: `category:${item.id}`, title: item.name, description: item.description ?? undefined }))),
      };
    }

    const requirements = await listWhatsappRequirements(supabase, category.slug);
    const requirementRows = requirements.map((item) => ({
      id: `requirement:${item.requirement_id}`,
      title: item.label,
      description: item.description ?? undefined,
    }));
    requirementRows.push({ id: "requirements:continue", title: "Continue", description: "Continue to event details" });
    return {
      nextState: nextState(state, {
        state: "requirements",
        step: "select_requirements",
        serviceCategoryId: category.id,
        draft: {
          ...(state.draft ?? {}),
          serviceCategoryName: category.name,
          serviceCategorySlug: category.slug,
        },
      }),
      replyText: requirements.length
        ? [
            `Great choice: ${category.name}`,
            "",
            "Please select the requirements you need. You can choose more than one, then tap Continue.",
            "",
            requirements.map((item) => `☐ ${item.label} (${item.requirement_id})`).join("\n"),
            "",
            "Continue",
          ].join("\n")
        : "Please tell us what you need for this service.",
      replyInteractive: requirements.length
        ? listInteractive(`Select requirements for ${category.name}`, "Choose", requirementRows)
        : undefined,
    };
  }

  if (state.step === "select_requirements" || state.state === "requirements") {
    const categorySlug = typeof state.draft?.serviceCategorySlug === "string" ? String(state.draft.serviceCategorySlug) : null;
    const added = await resolveRequirementIds(supabase, categorySlug, incomingText ?? selectionId ?? "");
    const selectedRequirementIds = mergeUnique(state.selectedRequirementIds ?? [], added);

    if (selection.includes("continue")) {
      const sequence = await questionSequence(supabase, categorySlug);
      const firstQuestion = sequence[0];
      return {
        nextState: nextState(state, {
          state: "event_details",
          step: firstQuestion?.key ?? "customer_name",
          selectedRequirementIds,
          draft: {
            ...(state.draft ?? {}),
            selectedRequirementIds,
          },
        }),
        replyText: firstQuestion ? questionPrompt(firstQuestion) : MESSAGES.askName,
        replyInteractive: firstQuestion?.type === "select" && firstQuestion.options?.length
          ? listInteractive(firstQuestion.label, "Choose", firstQuestion.options.map((option, index) => ({ id: `answer:${firstQuestion.key}:${index}`, title: option })))
          : undefined,
      };
    }

    const requirementLabels = await selectedRequirementsText(supabase, categorySlug, selectedRequirementIds);
    return {
      nextState: nextState(state, {
        state: "requirements",
        step: "select_requirements",
        selectedRequirementIds,
        draft: {
          ...(state.draft ?? {}),
          selectedRequirementIds,
        },
      }),
      replyText: [
        `${selectedRequirementIds.length} requirement${selectedRequirementIds.length === 1 ? "" : "s"} selected`,
        requirementLabels.length ? requirementLabels.map((item) => `✓ ${item}`).join("\n") : "No requirements selected yet.",
        "",
        "Tap Continue when ready.",
      ].join("\n"),
      replyInteractive: listInteractive("Update your requirements", "Choose", [
        ...(categorySlug ? (await listWhatsappRequirements(supabase, categorySlug)).map((item) => ({ id: `requirement:${item.requirement_id}`, title: `${selectedRequirementIds.includes(item.requirement_id) ? "✓ " : ""}${item.label}` })) : []),
        { id: "requirements:continue", title: "Continue" },
      ]),
    };
  }

  const categorySlug = typeof state.draft?.serviceCategorySlug === "string" ? String(state.draft.serviceCategorySlug) : null;
  const sequence = await questionSequence(supabase, categorySlug);
  const currentQuestion = sequence.find((question) => question.key === state.step);

  if (currentQuestion) {
    let answer = incomingText?.trim() || selectionId || "";
    const answerMatch = normalizeText(selectionId).match(/^answer:[^:]+:(\d+)$/);
    if (answerMatch && currentQuestion.options?.[Number(answerMatch[1])]) {
      answer = currentQuestion.options[Number(answerMatch[1])];
    }
    const updatedDraft = {
      ...(state.draft ?? {}),
      [currentQuestion.key]: answer,
    };
    const currentIndex = sequence.findIndex((question) => question.key === currentQuestion.key);
    const nextQuestion = sequence[currentIndex + 1];
    if (nextQuestion) {
      return {
        nextState: nextState(state, {
          state: "event_details",
          step: nextQuestion.key,
          draft: updatedDraft,
        }),
        replyText: questionPrompt(nextQuestion),
        replyInteractive: nextQuestion.type === "select" && nextQuestion.options?.length
          ? listInteractive(nextQuestion.label, "Choose", nextQuestion.options.map((option, index) => ({ id: `answer:${nextQuestion.key}:${index}`, title: option })))
          : undefined,
      };
    }

    return {
      nextState: nextState(state, {
        state: "customer_name",
        step: "customer_name",
        draft: updatedDraft,
      }),
      replyText: MESSAGES.askName,
    };
  }

  if (state.step === "customer_name") {
    const updatedDraft = {
      ...(state.draft ?? {}),
      customer_name: incomingText?.trim() || displayName || "Customer",
    };

    const providerBatch = await buildProviderResponse(supabase, {
      ...state,
      draft: updatedDraft,
    }, 1, BOT_CONFIG.defaultPageSize);

    const providerLines = providerBatch.searchResult.providers.length
      ? providerBatch.searchResult.providers.map((provider) => [
          provider.is_premium ? "🏆" : "📸",
          provider.business_name,
          `⭐ ${Number(provider.rating ?? 0).toFixed(1)}`,
          `📍 ${provider.city ?? "Location not listed"}`,
          provider.matched_services.length ? provider.matched_services.join(" • ") : "Matched services",
        ].join("\n")).join("\n\n")
      : MESSAGES.noExactMatch;

    return {
      nextState: nextState(state, {
        state: "provider_results",
        step: "provider_results",
        draft: {
          ...updatedDraft,
          providerPage: 1,
        },
      }),
      replyText: [
        MESSAGES.loadingProviders,
        "",
        providerLines,
        "",
        providerBatch.searchResult.hasMore ? "View More Providers" : "",
        "🤝 Let Subhakary Recommend",
        "👀 Browse Providers",
      ]
        .filter(Boolean)
        .join("\n"),
      replyInteractive: listInteractive(
        "Choose providers to include in your request. You can select up to 3.",
        "Select providers",
        providerRows(providerBatch.searchResult.providers, [], providerBatch.searchResult.hasMore),
      ),
    };
  }

  if (state.step === "provider_results") {
    const providerPage = Number(state.draft?.providerPage ?? 1);
    const selectionText = normalizeText(selectionId ?? incomingText);

    if (selectionText === "providers:more" || selectionText.includes("view_more_providers") || selectionText.includes("view more providers")) {
      const nextPage = providerPage + 1;
      const providerBatch = await buildProviderResponse(supabase, {
        ...state,
        draft: {
          ...(state.draft ?? {}),
          providerPage: nextPage,
        },
      }, nextPage, BOT_CONFIG.defaultPageSize);

      return {
        nextState: nextState(state, {
          state: "provider_results",
          step: "provider_results",
          draft: {
            ...(state.draft ?? {}),
            providerPage: nextPage,
          },
        }),
        replyText: [
          `Showing recommended providers ${((nextPage - 1) * BOT_CONFIG.defaultPageSize) + 1}-${((nextPage - 1) * BOT_CONFIG.defaultPageSize) + providerBatch.searchResult.providers.length}`,
          "",
          providerBatch.searchResult.providers.map((provider) => [
            provider.is_premium ? "🏆" : "📸",
            provider.business_name,
            `⭐ ${Number(provider.rating ?? 0).toFixed(1)}`,
            `📍 ${provider.city ?? "Location not listed"}`,
          ].join("\n")).join("\n\n"),
          providerBatch.searchResult.hasMore ? "View More Providers" : "",
        ]
          .filter(Boolean)
          .join("\n"),
        replyInteractive: listInteractive(
          "Choose providers to include in your request. You can select up to 3.",
          "Select providers",
          providerRows(providerBatch.searchResult.providers, state.selectedProviderIds ?? [], providerBatch.searchResult.hasMore),
        ),
      };
    }

    if (selectionText === "providers:recommend" || selectionText.includes("let subhakary recommend") || selectionText.includes("recommend")) {
      const providerBatch = await buildProviderResponse(supabase, state, 1, BOT_CONFIG.maxSelectedProviders);
      const selectedProviders = providerBatch.searchResult.providers.slice(0, 3).map((provider) => provider.id);

      return {
        nextState: nextState(state, {
          state: "request_review",
          step: "request_review",
          requestId: null,
          selectedProviderIds: selectedProviders,
          recommendationRequested: true,
        }),
        replyText: await resolveReviewText(supabase, {
          ...state,
          requestId: null,
          selectedProviderIds: selectedProviders,
          recommendationRequested: true,
        }, categorySlug),
        replyInteractive: buttonsInteractive("Submit this request?", [
          { id: "request:submit", title: "Submit request" },
          { id: "request:change", title: "Change details" },
          { id: "request:cancel", title: "Cancel" },
        ]),
      };
    }

    if (selectionText === "providers:continue") {
      return {
        nextState: nextState(state, { state: "request_review", step: "request_review" }),
        replyText: await resolveReviewText(supabase, state, categorySlug),
        replyInteractive: buttonsInteractive("Submit this request?", [
          { id: "request:submit", title: "Submit request" },
          { id: "request:change", title: "Change details" },
          { id: "request:cancel", title: "Cancel" },
        ]),
      };
    }

    if (selectionText.startsWith("provider:")) {
      const providerId = selectionText.slice("provider:".length);
      const selectedProviderIds = state.selectedProviderIds ?? [];
      const updatedProviderIds = selectedProviderIds.includes(providerId)
        ? selectedProviderIds.filter((id) => id !== providerId)
        : selectedProviderIds.length < BOT_CONFIG.maxSelectedProviders
          ? [...selectedProviderIds, providerId]
          : selectedProviderIds;
      const providerBatch = await buildProviderResponse(supabase, state, providerPage, BOT_CONFIG.defaultPageSize);
      return {
        nextState: nextState(state, { state: "provider_results", step: "provider_results", selectedProviderIds: updatedProviderIds }),
        replyText: `${updatedProviderIds.length} provider${updatedProviderIds.length === 1 ? "" : "s"} selected. Select more or continue.`,
        replyInteractive: listInteractive(
          "Select providers to include in your request. You can select up to 3.",
          "Select providers",
          providerRows(providerBatch.searchResult.providers, updatedProviderIds, providerBatch.searchResult.hasMore),
        ),
      };
    }

    const category = typeof state.draft?.serviceCategoryName === "string" ? String(state.draft.serviceCategoryName) : "Service";
    const selectedProviderIds = state.selectedProviderIds ?? [];

    const reviewText = await resolveReviewText(supabase, {
      ...state,
      selectedProviderIds,
    }, categorySlug);

    return {
      nextState: nextState(state, {
        state: "request_review",
        step: "request_review",
        selectedProviderIds,
        draft: {
          ...(state.draft ?? {}),
          serviceCategoryName: category,
          selectedProviderIds,
        },
      }),
      replyText: reviewText,
      replyInteractive: buttonsInteractive("Submit this request?", [
        { id: "request:submit", title: "Submit request" },
        { id: "request:change", title: "Change details" },
        { id: "request:cancel", title: "Cancel" },
      ]),
    };
  }

  if (state.step === "request_review") {
    if (selection.includes("request:submit") || selection.includes("submit_request") || selection.includes("submit request")) {
      const request = await createWhatsappRequest(supabase, {
        customerId,
        requestType: state.recommendationRequested ? "recommendation" : "service_request",
        status: "NEW",
        serviceCategoryId: state.serviceCategoryId ?? null,
        serviceCategoryName: typeof state.draft?.serviceCategoryName === "string" ? String(state.draft.serviceCategoryName) : null,
        serviceCategorySlug: categorySlug,
        locationName: typeof state.draft?.location === "string" ? String(state.draft.location) : null,
        eventType: typeof state.draft?.event_type === "string" ? String(state.draft.event_type) : null,
        eventDate: typeof state.draft?.event_date === "string" ? String(state.draft.event_date) : null,
        guestCount: typeof state.draft?.guest_count === "number" ? Number(state.draft.guest_count) : null,
        budgetRange: typeof state.draft?.budget_range === "string" ? String(state.draft.budget_range) : null,
        selectedRequirementIds: state.selectedRequirementIds ?? [],
        selectedProviderIds: state.selectedProviderIds ?? [],
        recommendationRequested: Boolean(state.recommendationRequested),
        serviceAnswers: state.draft ?? {},
        sourceWhatsappMessageId,
      });

      await addRequestProviders(supabase, request.id, state.selectedProviderIds ?? [], Boolean(state.recommendationRequested));
      await appendWhatsappEvent(supabase, {
        customerId,
        requestId: request.id,
        eventName: "request_submitted",
        eventPayload: {
          request_code: request.request_code,
          provider_count: state.selectedProviderIds?.length ?? 0,
        },
      });

      return {
        nextState: nextState(state, {
          state: "main_menu",
          step: "main_menu",
          requestId: request.id,
        }),
        replyText: [
          MESSAGES.requestSuccess,
          "",
          `Your Subhakary request ID is: ${request.request_code}`,
          "",
          state.selectedProviderIds?.length
            ? `You've selected ${state.selectedProviderIds.length} provider${state.selectedProviderIds.length === 1 ? "" : "s"}.`
            : "You've requested help from the Subhakary team.",
        ].join("\n"),
        replyInteractive: buttonsInteractive("What would you like to do next?", [
          { id: "find_service", title: "Find a service" },
          { id: "my_requests", title: "My requests" },
          { id: "talk_to_subhakary", title: "Talk to Subhakary" },
        ]),
      };
    }

    if (selection.includes("request:change") || selection.includes("change_details")) {
      const categories = await listServiceCategories(supabase);
      return {
        nextState: nextState(state, {
          state: "service_category",
          step: "choose_category",
          draft: {
            ...(state.draft ?? {}),
          },
        }),
        replyText: MESSAGES.changeDetails,
        replyInteractive: listInteractive("Choose the service you need", "View services", categories.map((category) => ({ id: `category:${category.id}`, title: category.name, description: category.description ?? undefined }))),
      };
    }

    if (selection.includes("request:cancel") || selection.includes("cancel")) {
      return {
        nextState: nextState(state, {
          state: "main_menu",
          step: "main_menu",
          selectedProviderIds: [],
          selectedRequirementIds: [],
          draft: {},
        }),
        replyText: MESSAGES.cancel,
      };
    }
  }

  if (state.state === "my_requests") {
    const requests = await listRequestsByCustomer(supabase, customerId);
    return {
      nextState: nextState(state, { state: "main_menu", step: "main_menu" }),
      replyText: renderMyRequests(requests).text,
      replyInteractive: buttonsInteractive("What would you like to do next?", [
        { id: "find_service", title: "Find a service" },
        { id: "my_requests", title: "My requests" },
        { id: "talk_to_subhakary", title: "Talk to Subhakary" },
      ]),
    };
  }

  if (state.state === "support") {
    return {
      nextState: nextState(state, { state: "main_menu", step: "main_menu" }),
      replyText: MESSAGES.supportReply,
      replyInteractive: buttonsInteractive("Choose an option", [
        { id: "find_service", title: "Find a service" },
        { id: "my_requests", title: "My requests" },
        { id: "help", title: "Help" },
      ]),
    };
  }

  if (state.state === "help") {
    return {
      nextState: nextState(state, { state: "main_menu", step: "main_menu" }),
      replyText: renderHelpMessage().text,
      replyInteractive: buttonsInteractive("Choose an option", [
        { id: "find_service", title: "Find a service" },
        { id: "my_requests", title: "My requests" },
        { id: "talk_to_subhakary", title: "Talk to Subhakary" },
      ]),
    };
  }

  return {
    nextState: nextState(state, { state: "main_menu", step: "main_menu" }),
    replyText: MESSAGES.invalidChoice,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const expected = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (challenge && expected && verifyToken === expected) {
      return new Response(challenge, { headers: corsHeaders });
    }

    return json({ error: "Verification failed" }, 403);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!(await verifyMetaWebhookSignature(rawBody, signature))) {
    return json({ error: "Invalid webhook signature" }, 401);
  }

  const envelope = JSON.parse(rawBody);
  const incomingMessages = extractIncomingMessage(envelope);

  if (!incomingMessages.length) {
    return json({ ok: true, processed: 0 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return json({ error: "Missing Supabase configuration" }, 500);
  }

  let supabase: SupabaseService;
  try {
    supabase = createServiceClient();
  } catch {
    return json({ error: "Missing Supabase configuration" }, 500);
  }

  const outcomes: Array<{ messageId: string; status: string }> = [];

  for (const incoming of incomingMessages) {
    const customerProfile = await getCustomerProfileByPhone(supabase, incoming.from);
    const customer = await upsertWhatsappCustomer(
      supabase,
      incoming.from,
      incoming.name ?? customerProfile?.full_name ?? null,
      customerProfile?.id ?? null,
    );

    let conversationRecord = await loadConversation(supabase, customer.id);
    const currentState = getConversationState(conversationRecord?.state_payload ?? null);

    if (!conversationRecord) {
      await appendWhatsappEvent(supabase, {
        customerId: customer.id,
        eventName: "conversation_started",
        eventPayload: { phone: incoming.from },
      });
    }

    if (!conversationRecord) {
      const initialState = nextState(currentState, { state: "welcome", step: "main_menu" });
      conversationRecord = await upsertWhatsappConversation(supabase, customer.id, initialState);
    }

    const claimed = await storeInboundMessage(supabase, conversationRecord.id, {
      messageId: incoming.messageId,
      text: incoming.text,
      raw: incoming.raw,
    });
    if (!claimed) {
      outcomes.push({ messageId: incoming.messageId, status: "duplicate" });
      continue;
    }

    const route = await routeMessage(
      supabase,
      customer.id,
      incoming.name ?? customerProfile?.full_name ?? null,
      currentState,
      incoming.text,
      incoming.buttonId ?? incoming.listId,
      incoming.messageId,
    );

    const nextConversation = await updateWhatsappConversationIfUnchanged(
      supabase,
      conversationRecord.id,
      conversationRecord.updated_at,
      route.nextState,
    );

    const outboundResult = await sendWhatsAppMessage({
      to: incoming.from,
      text: route.replyText,
      interactive: route.replyInteractive,
    });

    const outboundId = outboundResult.messageId ?? crypto.randomUUID();

    await storeOutboundMessage(supabase, nextConversation.id, outboundId, route.replyText);
    await appendWhatsappEvent(supabase, {
      customerId: customer.id,
      conversationId: nextConversation.id,
      eventName: "message_routed",
      eventPayload: {
        from: incoming.from,
        text: incoming.text,
        selection: incoming.buttonId ?? incoming.listId,
        state: route.nextState.state,
        step: route.nextState.step,
      },
    });

    outcomes.push({ messageId: incoming.messageId, status: outboundResult.ok ? "sent" : "queued" });
  }

  return json({
    ok: true,
    processed: incomingMessages.length,
    outcomes,
  });
});
