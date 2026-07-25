import { compareAsc, eachDayOfInterval, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type CalendarEventType =
  | "subhakary_booking"
  | "external_booking"
  | "personal_event"
  | "vacation"
  | "holiday"
  | "leave"
  | "blocked_date";

export interface ProviderCalendarItem {
  id: string;
  providerId: string;
  type: CalendarEventType;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  bookingId?: string | null;
  bookingStatus?: string | null;
  source?: string;
  capacityLimit?: number;
  bookingsCount?: number;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlotConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isEnabled: boolean;
  slotKind: "morning" | "afternoon" | "evening" | "custom";
  sortOrder: number;
}

export interface CapacityConfig {
  id?: string;
  providerId?: string;
  categorySlug: string;
  serviceLabel: string;
  maxDailyBookings: number;
  updatedAt?: string;
}

export interface NotificationSettings {
  emailReminders: boolean;
  emailTiming: "1h" | "24h" | "48h";
  pushNotifications: boolean;
  bookingUpdates: boolean;
  scheduleSummaries: "daily" | "weekly" | "off";
  summaryTime: string;
}

export interface GoogleCalendarState {
  isConnected: boolean;
  accountEmail?: string;
  lastSyncedAt?: string;
  autoSync: boolean;
  syncOption: "all" | "bookings_only";
  importExternal: boolean;
}

const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: "slot-morning", name: "Morning", slotKind: "morning", startTime: "08:00", endTime: "12:00", maxCapacity: 1, isEnabled: true, sortOrder: 1 },
  { id: "slot-afternoon", name: "Afternoon", slotKind: "afternoon", startTime: "12:00", endTime: "16:00", maxCapacity: 1, isEnabled: true, sortOrder: 2 },
  { id: "slot-evening", name: "Evening", slotKind: "evening", startTime: "16:00", endTime: "20:00", maxCapacity: 1, isEnabled: true, sortOrder: 3 },
];

const mapCalendarRow = (row: any): ProviderCalendarItem => ({
  id: row.id,
  providerId: row.provider_id,
  type: (row.event_type ?? "personal_event") as CalendarEventType,
  title: row.title,
  startDate: row.event_date,
  endDate: row.event_type === "vacation" || row.event_type === "leave" || row.event_type === "holiday"
    ? row.event_date
    : undefined,
  startTime: row.start_time ?? undefined,
  endTime: row.end_time ?? undefined,
  isAllDay: Boolean(row.all_day),
  location: row.location ?? undefined,
  notes: row.notes ?? undefined,
  customerName: row.customer_name ?? undefined,
  customerPhone: row.customer_phone ?? undefined,
  bookingId: row.booking_id ?? null,
  bookingStatus: row.booking_status ?? null,
  source: row.source ?? undefined,
  capacityLimit: row.capacity_limit ?? undefined,
  bookingsCount: row.bookings_count ?? undefined,
  isBlocked: row.is_blocked ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

const expandRecurringBlocks = (rows: any[], startDate: string, endDate: string) => {
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  return rows.flatMap((row) => {
    if (row.specific_date) {
      return [row];
    }

    return days
      .filter((day) => day.getDay() === Number(row.day_of_week))
      .map((day) => ({
        ...row,
        event_date: format(day, "yyyy-MM-dd"),
        title: row.source === "recurring" ? "Recurring Block" : row.title,
      }));
  });
};

const sortCalendarItems = (a: ProviderCalendarItem, b: ProviderCalendarItem) =>
  compareAsc(parseISO(a.startDate), parseISO(b.startDate)) ||
  String(a.startTime ?? "00:00").localeCompare(String(b.startTime ?? "00:00")) ||
  String(a.createdAt).localeCompare(String(b.createdAt));

export async function fetchProviderCalendar(providerId: string, startDate?: string, endDate?: string) {
  const rangeStart = startDate ?? format(new Date(), "yyyy-MM-dd");
  const rangeEnd = endDate ?? rangeStart;

  const [{ data: bookingRows, error: bookingError }, { data: blockedRows, error: blockedError }, capacity] = await Promise.all([
    supabase
      .from("provider_events" as any)
      .select("*")
      .eq("provider_id", providerId)
      .gte("event_date", rangeStart)
      .lte("event_date", rangeEnd)
      .order("event_date", { ascending: true }),
    supabase
      .from("service_provider_availability" as any)
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_blocked", true)
      .in("source", ["manual", "recurring"]),
    fetchCapacityConfig(providerId),
  ]);

  if (bookingError) throw bookingError;
  if (blockedError) throw blockedError;

  const bookingIds = Array.from(
    new Set(((bookingRows ?? []) as any[]).map((row) => row.booking_id).filter(Boolean))
  ) as string[];

  const bookingMetadata = bookingIds.length
    ? await supabase
        .from("bookings" as any)
        .select("id,user_id")
        .in("id", bookingIds)
    : { data: [], error: null };

  if (bookingMetadata.error) throw bookingMetadata.error;

  const userIds = Array.from(
    new Set(((bookingMetadata.data ?? []) as any[]).map((row) => row.user_id).filter(Boolean))
  ) as string[];

  const profileMetadata = userIds.length
    ? await supabase
        .from("profiles" as any)
        .select("user_id,full_name,phone")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (profileMetadata.error) throw profileMetadata.error;

  const customerByBookingId = new Map<string, { full_name?: string; phone?: string }>();
  const profileByUserId = new Map(
    ((profileMetadata.data ?? []) as any[]).map((row) => [row.user_id, { full_name: row.full_name, phone: row.phone }])
  );
  ((bookingMetadata.data ?? []) as any[]).forEach((row) => {
    customerByBookingId.set(row.id, profileByUserId.get(row.user_id) ?? {});
  });

  const bookingItems = ((bookingRows ?? []) as any[])
    .map((row) => ({
      ...mapCalendarRow(row),
      capacityLimit: capacity.maxDailyBookings,
      bookingsCount: row.booking_status === "accepted" ? 1 : 0,
      customerName: customerByBookingId.get(row.booking_id)?.full_name,
      customerPhone: customerByBookingId.get(row.booking_id)?.phone,
    }))
    .filter((row) => row.source !== "booking" || row.type === "subhakary_booking");

  const bookingCountByDate = bookingItems.reduce<Record<string, number>>((acc, item) => {
    if (item.source === "booking" && item.bookingStatus === "accepted") {
      acc[item.startDate] = (acc[item.startDate] ?? 0) + 1;
    }
    return acc;
  }, {});

  const blockedItems = expandRecurringBlocks((blockedRows ?? []) as any[], rangeStart, rangeEnd)
    .filter((row) => row.source !== "booking")
    .map((row) =>
      mapCalendarRow({
        ...row,
        event_type: "blocked_date",
        event_date: row.event_date,
        all_day: true,
        is_blocked: true,
        capacity_limit: capacity.maxDailyBookings,
        bookings_count: 0,
      })
    );

  return [...bookingItems.map((item) => ({
    ...item,
    bookingsCount: bookingCountByDate[item.startDate] ?? item.bookingsCount ?? 0,
  })), ...blockedItems].sort(sortCalendarItems);
}

export async function fetchTodayEvents(providerId: string) {
  const date = format(new Date(), "yyyy-MM-dd");
  return fetchProviderCalendar(providerId, date, date);
}

export async function fetchTomorrowEvents(providerId: string) {
  const date = format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  return fetchProviderCalendar(providerId, date, date);
}

export async function fetchUpcomingEvents(providerId: string, limit = 10) {
  const events = await fetchProviderCalendar(providerId, format(new Date(), "yyyy-MM-dd"), format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  return events.slice(0, limit);
}

export async function fetchAvailabilitySummary(providerId: string, date = format(new Date(), "yyyy-MM-dd")) {
  const { data, error } = await supabase.rpc("get_availability_summary" as any, {
    p_provider_id: providerId,
    p_for_date: date,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as any;
}

export async function validateBookingRequest(args: {
  providerId: string;
  serviceDate: string;
  serviceTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  timeSlot?: string | null;
  status?: string;
  bookingId?: string | null;
}) {
  const { data, error } = await supabase.rpc("validate_booking_request" as any, {
    p_provider_id: args.providerId,
    p_service_date: args.serviceDate,
    p_service_time: args.serviceTime ?? null,
    p_start_date: args.startDate ?? null,
    p_end_date: args.endDate ?? null,
    p_time_slot: args.timeSlot ?? null,
    p_status: args.status ?? "pending",
    p_booking_id: args.bookingId ?? null,
  });
  if (error) throw error;
  return (data?.[0] ?? { valid: true }) as any;
}

export async function validateProviderEventRequest(args: {
  providerId: string;
  eventType: CalendarEventType;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  eventId?: string | null;
}) {
  const { data, error } = await supabase.rpc("validate_provider_event_request" as any, {
    p_provider_id: args.providerId,
    p_event_type: args.eventType,
    p_event_date: args.eventDate,
    p_start_time: args.startTime ?? null,
    p_end_time: args.endTime ?? null,
    p_all_day: args.allDay ?? false,
    p_provider_event_id: args.eventId ?? null,
  });
  if (error) throw error;
  return (data?.[0] ?? { valid: true }) as any;
}

export async function fetchProviderTimeSlots(providerId: string) {
  const { data, error } = await supabase
    .from("provider_time_slots" as any)
    .select("*")
    .eq("provider_id", providerId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  return rows.length
    ? rows.map((row) => ({
        id: row.id,
        name: row.slot_name,
        slotKind: row.slot_kind,
        startTime: row.start_time,
        endTime: row.end_time,
        maxCapacity: row.max_capacity,
        isEnabled: row.is_enabled,
        sortOrder: row.sort_order,
      })) as TimeSlotConfig[]
    : DEFAULT_TIME_SLOTS;
}

export async function saveProviderTimeSlots(providerId: string, slots: TimeSlotConfig[]) {
  const { error: deleteError } = await supabase
    .from("provider_time_slots" as any)
    .delete()
    .eq("provider_id", providerId);
  if (deleteError) throw deleteError;

  if (!slots.length) return;

  const { error } = await supabase
    .from("provider_time_slots" as any)
    .insert(
      slots.map((slot, index) => ({
        provider_id: providerId,
        slot_name: slot.name,
        slot_kind: slot.slotKind,
        start_time: slot.startTime,
        end_time: slot.endTime,
        max_capacity: slot.maxCapacity,
        is_enabled: slot.isEnabled,
        sort_order: slot.sortOrder ?? index + 1,
      }))
    );

  if (error) throw error;
}

export async function fetchCapacityConfig(providerId: string): Promise<CapacityConfig> {
  const { data: providerData, error: providerError } = await supabase
    .from("service_providers" as any)
    .select("id, category:service_categories(slug, name)")
    .eq("id", providerId)
    .single();
  if (providerError) throw providerError;

  const categorySlug = providerData?.category?.slug ?? "general";
  const serviceLabel = providerData?.category?.name ?? "Service";

  const { data: providerRule, error: providerRuleError } = await supabase
    .from("booking_capacity_rules" as any)
    .select("*")
    .eq("provider_id", providerId)
    .eq("category_slug", categorySlug)
    .maybeSingle();

  if (providerRuleError && providerRuleError.code !== "PGRST116") throw providerRuleError;

  const { data: defaultRule, error: defaultRuleError } = await supabase
    .from("booking_capacity_rules" as any)
    .select("*")
    .is("provider_id", null)
    .eq("category_slug", categorySlug)
    .maybeSingle();

  if (defaultRuleError && defaultRuleError.code !== "PGRST116") throw defaultRuleError;

  const data = providerRule ?? defaultRule ?? null;

  return {
    id: data?.id,
    providerId,
    categorySlug,
    serviceLabel: data?.service_label ?? serviceLabel,
    maxDailyBookings: data?.max_bookings_per_day ?? 1,
    updatedAt: data?.updated_at ?? undefined,
  };
}

export async function saveCapacityConfig(providerId: string, config: CapacityConfig) {
  const { data: providerData, error: providerError } = await supabase
    .from("service_providers" as any)
    .select("id, category:service_categories(slug, name)")
    .eq("id", providerId)
    .single();
  if (providerError) throw providerError;

  const categorySlug = providerData?.category?.slug ?? config.categorySlug;
  const serviceLabel = config.serviceLabel || providerData?.category?.name || "Service";

  const { error: deleteError } = await supabase
    .from("booking_capacity_rules" as any)
    .delete()
    .eq("provider_id", providerId)
    .eq("category_slug", categorySlug);
  if (deleteError) throw deleteError;

  const { error } = await supabase
    .from("booking_capacity_rules" as any)
    .insert({
      provider_id: providerId,
      category_slug: categorySlug,
      service_label: serviceLabel,
      max_bookings_per_day: config.maxDailyBookings,
    });
  if (error) throw error;
}

export async function fetchNotificationSettings(providerId: string): Promise<NotificationSettings> {
  const { data: providerData, error: providerError } = await supabase
    .from("service_providers" as any)
    .select("user_id")
    .eq("id", providerId)
    .single();
  if (providerError) throw providerError;

  const { data, error } = await supabase
    .from("notification_preferences" as any)
    .select("*")
    .eq("user_id", providerData.user_id)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;

  return {
    emailReminders: data?.email_enabled ?? true,
    emailTiming: (data?.schedule_email_timing ?? "24h") as "1h" | "24h" | "48h",
    pushNotifications: data?.push_enabled ?? true,
    bookingUpdates: data?.booking_updates ?? true,
    scheduleSummaries: (data?.frequency === "weekly" ? "weekly" : data?.frequency === "off" ? "off" : "daily") as "daily" | "weekly" | "off",
    summaryTime: data?.schedule_summary_time ?? "08:00",
  };
}

export async function saveNotificationSettings(providerId: string, settings: NotificationSettings) {
  const { data: providerData, error: providerError } = await supabase
    .from("service_providers" as any)
    .select("user_id")
    .eq("id", providerId)
    .single();
  if (providerError) throw providerError;

  const { error } = await supabase
    .from("notification_preferences" as any)
    .upsert(
      {
        user_id: providerData.user_id,
        email_enabled: settings.emailReminders,
        push_enabled: settings.pushNotifications,
        booking_updates: settings.bookingUpdates,
        frequency: settings.scheduleSummaries,
        schedule_email_timing: settings.emailTiming,
        schedule_summary_time: settings.summaryTime,
        schedule_reminders: settings.emailReminders || settings.pushNotifications,
        reminder_day_before: true,
        reminder_event_day: true,
      },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}

export async function fetchGoogleCalendarState(providerId: string): Promise<GoogleCalendarState> {
  const { data, error } = await supabase
    .from("provider_calendar_integrations" as any)
    .select("*")
    .eq("provider_id", providerId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;

  return {
    isConnected: data?.sync_status === "connected",
    accountEmail: data?.google_account_email ?? undefined,
    lastSyncedAt: data?.last_synced_at ?? undefined,
    autoSync: data?.auto_sync ?? true,
    syncOption: (data?.sync_scope ?? "all") as "all" | "bookings_only",
    importExternal: data?.import_external ?? false,
  };
}

export async function saveGoogleCalendarState(providerId: string, state: GoogleCalendarState) {
  const { error } = await supabase
    .from("provider_calendar_integrations" as any)
    .upsert(
      {
        provider_id: providerId,
        google_account_email: state.accountEmail ?? null,
        sync_status: state.isConnected ? "connected" : "disconnected",
        sync_scope: state.syncOption,
        auto_sync: state.autoSync,
        import_external: state.importExternal,
        last_synced_at: state.lastSyncedAt ?? null,
      },
      { onConflict: "provider_id" }
    );
  if (error) throw error;
}

export async function saveProviderEvent(
  providerId: string,
  event: {
    id?: string;
    type: CalendarEventType;
    title: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    location?: string;
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    source?: string;
    bookingId?: string | null;
    bookingStatus?: string | null;
  }
) {
  if (event.type === "blocked_date") {
    const payload = {
      provider_id: providerId,
      specific_date: event.startDate,
      day_of_week: null,
      start_time: event.startTime ?? "00:00",
      end_time: event.endTime ?? "23:59",
      is_blocked: true,
      is_available: false,
      source: "manual",
      booking_id: null,
    };

    const query = event.id
      ? supabase.from("service_provider_availability" as any).update(payload).eq("id", event.id)
      : supabase.from("service_provider_availability" as any).insert(payload);

    const { data, error } = await query.select("*").maybeSingle();
    if (error) throw error;

    return {
      id: data?.id ?? event.id ?? "",
      providerId,
      type: "blocked_date" as const,
      title: "Blocked Date",
      startDate: event.startDate,
      isAllDay: true,
      source: "manual",
      createdAt: new Date().toISOString(),
    };
  }

  const payload = {
    provider_id: providerId,
    title: event.title,
    event_type: event.type,
    event_date: event.startDate,
    start_time: event.isAllDay ? null : event.startTime ?? null,
    end_time: event.isAllDay ? null : event.endTime ?? null,
    all_day: event.isAllDay,
    notes: event.notes ?? null,
    location: event.location ?? null,
    source: event.source ?? "manual",
    booking_id: event.bookingId ?? null,
    booking_status: event.bookingStatus ?? null,
  };

  const query = event.id
    ? supabase.from("provider_events" as any).update(payload).eq("id", event.id)
    : supabase.from("provider_events" as any).insert(payload);

  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteProviderEvent(providerId: string, id: string, source?: string) {
  if (source === "booking") return;

  const { error } = await supabase
    .from("provider_events" as any)
    .delete()
    .eq("id", id)
    .eq("provider_id", providerId);
  if (error) throw error;
}

export async function deleteBlockedDate(providerId: string, id: string) {
  const { error } = await supabase
    .from("service_provider_availability" as any)
    .delete()
    .eq("id", id)
    .eq("provider_id", providerId)
    .eq("source", "manual");
  if (error) throw error;
}
