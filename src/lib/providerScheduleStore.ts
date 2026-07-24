import { format, isSameDay, parseISO, addDays, isAfter, isBefore, isWithinInterval, startOfDay, endOfDay, differenceInMinutes, differenceInHours } from "date-fns";

export type EventType = 
  | "subhakary_booking"
  | "external_booking"
  | "personal_event"
  | "vacation"
  | "holiday"
  | "leave"
  | "blocked_date";

export interface ScheduleEvent {
  id: string;
  providerId: string;
  type: EventType;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD for multiday (vacation, leave, etc)
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  isAllDay: boolean;
  location?: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  serviceType?: string;
  status?: "confirmed" | "pending" | "tentative" | "blocked";
  capacityUsed?: number;
  createdAt: string;
}

export interface TimeSlotConfig {
  id: string;
  name: string; // Morning, Afternoon, Evening, Custom
  startTime: string; // "08:00"
  endTime: string;   // "12:00"
  maxCapacity: number; // e.g. 2
  isEnabled: boolean;
}

export interface ServiceCapacityConfig {
  serviceType: string;
  maxDailyBookings: number;
  defaultSlotCapacity: number;
  allowOverbooking: boolean;
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

// Event Type Metadata for UI
export const EVENT_TYPE_META: Record<EventType, { label: string; colorClass: string; badgeVariant: string; iconName: string; bgSoft: string }> = {
  subhakary_booking: {
    label: "Subhakary Booking",
    colorClass: "bg-amber-500 text-white border-amber-600",
    badgeVariant: "default",
    iconName: "Sparkles",
    bgSoft: "bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200",
  },
  external_booking: {
    label: "External Booking",
    colorClass: "bg-purple-600 text-white border-purple-700",
    badgeVariant: "secondary",
    iconName: "Briefcase",
    bgSoft: "bg-purple-500/15 border-purple-500/30 text-purple-900 dark:text-purple-200",
  },
  personal_event: {
    label: "Personal Event",
    colorClass: "bg-emerald-600 text-white border-emerald-700",
    badgeVariant: "outline",
    iconName: "User",
    bgSoft: "bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-200",
  },
  vacation: {
    label: "Vacation",
    colorClass: "bg-cyan-600 text-white border-cyan-700",
    badgeVariant: "outline",
    iconName: "Palmtree",
    bgSoft: "bg-cyan-500/15 border-cyan-500/30 text-cyan-900 dark:text-cyan-200",
  },
  holiday: {
    label: "Holiday",
    colorClass: "bg-rose-600 text-white border-rose-700",
    badgeVariant: "destructive",
    iconName: "CalendarOff",
    bgSoft: "bg-rose-500/15 border-rose-500/30 text-rose-900 dark:text-rose-200",
  },
  leave: {
    label: "Leave",
    colorClass: "bg-orange-600 text-white border-orange-700",
    badgeVariant: "secondary",
    iconName: "Coffee",
    bgSoft: "bg-orange-500/15 border-orange-500/30 text-orange-900 dark:text-orange-200",
  },
  blocked_date: {
    label: "Blocked Date",
    colorClass: "bg-slate-700 text-white border-slate-800",
    badgeVariant: "secondary",
    iconName: "Ban",
    bgSoft: "bg-slate-500/15 border-slate-500/30 text-slate-800 dark:text-slate-200 line-through",
  },
};

const STORAGE_KEYS = {
  EVENTS: "subhakary_provider_events",
  SLOTS: "subhakary_provider_slots",
  CAPACITY: "subhakary_provider_capacity",
  NOTIFICATIONS: "subhakary_provider_notifications",
  GOOGLE_CAL: "subhakary_provider_google_cal",
};

const DEFAULT_PROVIDER_SCOPE = "default";

const getScopedKey = (baseKey: string, providerId?: string) =>
  providerId && providerId !== DEFAULT_PROVIDER_SCOPE ? `${baseKey}:${providerId}` : baseKey;

const readScopedStorage = <T,>(baseKey: string, providerId: string | undefined, fallback: T): T => {
  try {
    const scopedKey = getScopedKey(baseKey, providerId);
    const scopedValue = localStorage.getItem(scopedKey);
    if (scopedValue) {
      return JSON.parse(scopedValue) as T;
    }

    if (scopedKey !== baseKey) {
      const legacyValue = localStorage.getItem(baseKey);
      if (legacyValue) {
        return JSON.parse(legacyValue) as T;
      }
    }
  } catch (error) {
    console.warn(`Failed to read schedule storage for ${baseKey}`, error);
  }

  return fallback;
};

const writeScopedStorage = <T,>(baseKey: string, providerId: string | undefined, value: T) => {
  const scopedKey = getScopedKey(baseKey, providerId);
  localStorage.setItem(scopedKey, JSON.stringify(value));
};

// Initial Mock Seed Data if local storage is empty
const INITIAL_MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: "evt-1",
    providerId: "default",
    type: "subhakary_booking",
    title: "Ananya & Rahul Wedding Photography",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "14:00",
    isAllDay: false,
    location: "Grand Palace Hall, Jubilee Hills, Hyderabad",
    notes: "Full ceremony & couple photoshoot requested.",
    customerName: "Ananya Sharma",
    customerPhone: "+91 98765 43210",
    status: "confirmed",
    capacityUsed: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-2",
    providerId: "default",
    type: "external_booking",
    title: "Corporate Gala Dinner Shoot",
    startDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    startTime: "18:00",
    endTime: "22:00",
    isAllDay: false,
    location: "Taj Krishna, Banjara Hills",
    notes: "External client directly booked via WhatsApp.",
    customerName: "Venkatesh Rao",
    customerPhone: "+91 91234 56789",
    status: "confirmed",
    capacityUsed: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-3",
    providerId: "default",
    type: "vacation",
    title: "Family Trip to Coorg",
    startDate: format(addDays(new Date(), 4), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 6), "yyyy-MM-dd"),
    isAllDay: true,
    notes: "Out of town. Phone unavailable.",
    status: "blocked",
    capacityUsed: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-4",
    providerId: "default",
    type: "personal_event",
    title: "Equipment Calibration & Maintenance",
    startDate: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    startTime: "11:00",
    endTime: "13:00",
    isAllDay: false,
    location: "Studio Loft",
    notes: "Checking camera lenses and lighting gear.",
    status: "confirmed",
    capacityUsed: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt-5",
    providerId: "default",
    type: "holiday",
    title: "Ganesh Chaturthi Festival",
    startDate: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    isAllDay: true,
    notes: "Public Holiday",
    status: "blocked",
    capacityUsed: 2,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: "slot-morning", name: "Morning", startTime: "08:00", endTime: "12:00", maxCapacity: 1, isEnabled: true },
  { id: "slot-afternoon", name: "Afternoon", startTime: "12:00", endTime: "16:00", maxCapacity: 1, isEnabled: true },
  { id: "slot-evening", name: "Evening", startTime: "16:00", endTime: "20:00", maxCapacity: 1, isEnabled: true },
];

const DEFAULT_CAPACITY: ServiceCapacityConfig = {
  serviceType: "Photography & Videography",
  maxDailyBookings: 2,
  defaultSlotCapacity: 1,
  allowOverbooking: false,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailReminders: true,
  emailTiming: "24h",
  pushNotifications: true,
  bookingUpdates: true,
  scheduleSummaries: "daily",
  summaryTime: "08:00",
};

const DEFAULT_GOOGLE_CAL: GoogleCalendarState = {
  isConnected: false,
  autoSync: true,
  syncOption: "all",
  importExternal: true,
};

// Store Helper API
export const getProviderEvents = (providerId?: string): ScheduleEvent[] => {
  const fallbackEvents = providerId && providerId !== DEFAULT_PROVIDER_SCOPE
    ? INITIAL_MOCK_EVENTS.map((event) => ({ ...event, providerId }))
    : INITIAL_MOCK_EVENTS;

  return readScopedStorage(STORAGE_KEYS.EVENTS, providerId, fallbackEvents);
};

export const saveProviderEvent = (
  event: Omit<ScheduleEvent, "id" | "createdAt"> & { id?: string },
  providerId?: string
): ScheduleEvent => {
  const events = getProviderEvents(providerId);
  const newEvent: ScheduleEvent = {
    ...event,
    id: event.id || `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const existingIndex = events.findIndex((e) => e.id === newEvent.id);
  if (existingIndex >= 0) {
    events[existingIndex] = newEvent;
  } else {
    events.push(newEvent);
  }

  writeScopedStorage(STORAGE_KEYS.EVENTS, providerId, events);
  return newEvent;
};

export const deleteProviderEvent = (id: string, providerId?: string) => {
  const events = getProviderEvents(providerId).filter((e) => e.id !== id);
  writeScopedStorage(STORAGE_KEYS.EVENTS, providerId, events);
};

export const getTimeSlots = (providerId?: string): TimeSlotConfig[] =>
  readScopedStorage(STORAGE_KEYS.SLOTS, providerId, DEFAULT_TIME_SLOTS);

export const saveTimeSlots = (slots: TimeSlotConfig[], providerId?: string) => {
  writeScopedStorage(STORAGE_KEYS.SLOTS, providerId, slots);
};

export const getCapacityConfig = (providerId?: string): ServiceCapacityConfig =>
  readScopedStorage(STORAGE_KEYS.CAPACITY, providerId, DEFAULT_CAPACITY);

export const saveCapacityConfig = (config: ServiceCapacityConfig, providerId?: string) => {
  writeScopedStorage(STORAGE_KEYS.CAPACITY, providerId, config);
};

export const getNotificationSettings = (providerId?: string): NotificationSettings =>
  readScopedStorage(STORAGE_KEYS.NOTIFICATIONS, providerId, DEFAULT_NOTIFICATIONS);

export const saveNotificationSettings = (settings: NotificationSettings, providerId?: string) => {
  writeScopedStorage(STORAGE_KEYS.NOTIFICATIONS, providerId, settings);
};

export const getGoogleCalendarState = (providerId?: string): GoogleCalendarState =>
  readScopedStorage(STORAGE_KEYS.GOOGLE_CAL, providerId, DEFAULT_GOOGLE_CAL);

export const saveGoogleCalendarState = (state: GoogleCalendarState, providerId?: string) => {
  writeScopedStorage(STORAGE_KEYS.GOOGLE_CAL, providerId, state);
};

// Conflict Detection Engine
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: "time_overlap" | "capacity_reached" | "blocked_date" | "existing_booking";
  message?: string;
  conflictingEvent?: ScheduleEvent;
}

export const checkScheduleConflict = (
  candidate: {
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    ignoreEventId?: string;
  },
  events: ScheduleEvent[],
  capacityConfig: ServiceCapacityConfig = getCapacityConfig()
): ConflictCheckResult => {
  const candidateStart = candidate.startDate;
  const candidateEnd = candidate.endDate || candidate.startDate;

  // Filter existing events for candidate date range
  const relevantEvents = events.filter((e) => {
    if (candidate.ignoreEventId && e.id === candidate.ignoreEventId) return false;
    const eStart = e.startDate;
    const eEnd = e.endDate || e.startDate;
    // Check range overlap
    return !(candidateEnd < eStart || candidateStart > eEnd);
  });

  // 1. Check Blocked / Vacation / Leave / Holiday conflict
  const blockingEvent = relevantEvents.find((e) => 
    ["vacation", "holiday", "leave", "blocked_date"].includes(e.type)
  );

  if (blockingEvent) {
    return {
      hasConflict: true,
      conflictType: "blocked_date",
      message: `Date is unavailable due to "${blockingEvent.title}" (${EVENT_TYPE_META[blockingEvent.type].label}).`,
      conflictingEvent: blockingEvent,
    };
  }

  // 2. Check Daily Capacity Limit
  const sameDayBookings = relevantEvents.filter((e) => 
    ["subhakary_booking", "external_booking"].includes(e.type)
  );

  if (sameDayBookings.length >= capacityConfig.maxDailyBookings && !capacityConfig.allowOverbooking) {
    return {
      hasConflict: true,
      conflictType: "capacity_reached",
      message: `Daily maximum capacity reached (${sameDayBookings.length}/${capacityConfig.maxDailyBookings} bookings filled).`,
      conflictingEvent: sameDayBookings[0],
    };
  }

  // 3. Time Overlap Check (if times are specified and not all day)
  if (!candidate.isAllDay && candidate.startTime && candidate.endTime) {
    const timeOverlapping = relevantEvents.find((e) => {
      if (e.isAllDay) return true; // All day event blocks entire day
      if (!e.startTime || !e.endTime) return false;
      // Overlap formula: max(start1, start2) < min(end1, end2)
      return (candidate.startTime < e.endTime) && (candidate.endTime > e.startTime);
    });

    if (timeOverlapping) {
      return {
        hasConflict: true,
        conflictType: "time_overlap",
        message: `Time slot overlaps with "${timeOverlapping.title}" (${timeOverlapping.startTime} - ${timeOverlapping.endTime}).`,
        conflictingEvent: timeOverlapping,
      };
    }
  }

  return { hasConflict: false };
};

// Helper to compute date capacity utilization
export const getDayCapacitySummary = (
  date: Date,
  events: ScheduleEvent[],
  maxCapacity: number = 2
) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayEvents = events.filter((e) => {
    const eStart = e.startDate;
    const eEnd = e.endDate || e.startDate;
    return dateStr >= eStart && dateStr <= eEnd;
  });

  const isBlocked = dayEvents.some((e) => 
    ["vacation", "holiday", "leave", "blocked_date"].includes(e.type)
  );

  const bookingsCount = dayEvents.filter((e) => 
    ["subhakary_booking", "external_booking"].includes(e.type)
  ).length;

  const remaining = Math.max(0, maxCapacity - bookingsCount);

  return {
    dateStr,
    eventsCount: dayEvents.length,
    bookingsCount,
    maxCapacity,
    remaining,
    isFullyBooked: bookingsCount >= maxCapacity,
    isBlocked,
    dayEvents,
  };
};

// Countdown Helper for Next Event
export const getNextEventCountdown = (events: ScheduleEvent[]) => {
  const now = new Date();
  const futureEvents = events
    .map((e) => {
      const datePart = e.startDate;
      const timePart = e.startTime || "00:00";
      const fullDateStr = `${datePart}T${timePart}:00`;
      const eventDate = new Date(fullDateStr);
      return { event: e, eventDate };
    })
    .filter(({ eventDate }) => isAfter(eventDate, now))
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

  if (futureEvents.length === 0) return null;

  const next = futureEvents[0];
  const diffHours = differenceInHours(next.eventDate, now);
  const diffMins = differenceInMinutes(next.eventDate, now) % 60;
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  let countdownText = "";
  if (diffDays > 0) {
    countdownText = `${diffDays}d ${remainingHours}h`;
  } else if (remainingHours > 0) {
    countdownText = `${remainingHours}h ${diffMins}m`;
  } else {
    countdownText = `${diffMins}m`;
  }

  return {
    nextEvent: next.event,
    eventDate: next.eventDate,
    countdownText,
    isToday: isSameDay(next.eventDate, now),
  };
};
