import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Sparkles,
  Briefcase,
  User,
  Palmtree,
  CalendarOff,
  Coffee,
  Ban,
  LayoutGrid,
  List,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPE_META,
  EventType,
  ScheduleEvent,
  getDayCapacitySummary,
} from "@/lib/providerScheduleStore";
import {
  deleteBlockedDate,
  deleteProviderEvent,
  fetchCapacityConfig,
  fetchProviderCalendar,
} from "@/lib/providerCalendarApi";
import { CreateEventDialog } from "./CreateEventDialog";

type ViewMode = "month" | "week" | "day" | "agenda";

interface ProviderCalendarWorkspaceProps {
  providerId?: string;
}

const VIEW_MODES: Array<{ value: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { value: "month", label: "Month", icon: LayoutGrid },
  { value: "week", label: "Week", icon: List },
  { value: "day", label: "Day", icon: CalendarDays },
  { value: "agenda", label: "Agenda", icon: List },
];

const EVENT_TYPES: Array<EventType | "all"> = [
  "all",
  "subhakary_booking",
  "external_booking",
  "blocked_date",
];

const getRangeForAnchorDate = (date: Date) => ({
  startDate: format(startOfMonth(subMonths(date, 1)), "yyyy-MM-dd"),
  endDate: format(endOfMonth(addMonths(date, 2)), "yyyy-MM-dd"),
});

const getEventIcon = (type: ScheduleEvent["type"]) => {
  switch (type) {
    case "subhakary_booking":
      return <Sparkles className="h-4 w-4 text-amber-500" />;
    case "external_booking":
      return <Briefcase className="h-4 w-4 text-violet-500" />;
    case "personal_event":
      return <User className="h-4 w-4 text-emerald-500" />;
    case "vacation":
      return <Palmtree className="h-4 w-4 text-cyan-500" />;
    case "holiday":
      return <CalendarOff className="h-4 w-4 text-rose-500" />;
    case "leave":
      return <Coffee className="h-4 w-4 text-orange-500" />;
    default:
      return <Ban className="h-4 w-4 text-slate-500" />;
  }
};

const getViewTitle = (date: Date, mode: ViewMode) => {
  if (mode === "day") return format(date, "EEEE, MMMM d, yyyy");
  if (mode === "agenda") return "Agenda";
  return format(date, "MMMM yyyy");
};

export const ProviderCalendarWorkspace = ({ providerId = "default" }: ProviderCalendarWorkspaceProps) => {
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [capacityConfig, setCapacityConfig] = useState({
    serviceType: "Service",
    maxDailyBookings: 1,
    defaultSlotCapacity: 1,
    allowOverbooking: false,
  });
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<EventType>("external_booking");
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  const loadCalendar = useCallback(async (anchorDate: Date) => {
    const { startDate, endDate } = getRangeForAnchorDate(anchorDate);
    const [loadedEvents, loadedCapacity] = await Promise.all([
      fetchProviderCalendar(providerId, startDate, endDate),
      fetchCapacityConfig(providerId),
    ]);

    setEvents(loadedEvents as ScheduleEvent[]);
    setCapacityConfig({
      serviceType: loadedCapacity.serviceLabel,
      maxDailyBookings: loadedCapacity.maxDailyBookings,
      defaultSlotCapacity: loadedCapacity.maxDailyBookings,
      allowOverbooking: false,
    });
  }, [providerId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        await loadCalendar(currentDate);
      } catch {
        if (active) {
          setEvents([]);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [currentDate, loadCalendar]);

  const refreshEvents = () => {
    void loadCalendar(currentDate).catch(() => undefined);
  };

  const filteredEvents = useMemo(() => {
    if (selectedFilter === "all") return events;
    return events.filter((event) => event.type === selectedFilter);
  }, [events, selectedFilter]);

  const selectedDayCapacity = useMemo(
    () => getDayCapacitySummary(selectedDate, events, capacityConfig.maxDailyBookings),
    [selectedDate, events, capacityConfig.maxDailyBookings]
  );

  const visibleEventCount = filteredEvents.length;
  const blockedDayCount = new Set(
    events
      .filter((event) => event.type === "blocked_date")
      .map((event) => event.startDate)
  ).size;

  const openCreateDialog = (defaultType: EventType = "external_booking") => {
    setEditingEvent(null);
    setCreateDialogType(defaultType);
    setCreateDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    const target = events.find((event) => event.id === id);
    if (!target) return;

    if (target.source === "booking") {
      toast({
        title: "Read-only booking",
        description: "Subhakary bookings are managed through the booking flow and cannot be deleted here.",
      });
      return;
    }

    if (target.type === "blocked_date") {
      void deleteBlockedDate(providerId, id);
    } else {
      void deleteProviderEvent(providerId, id, target.source);
    }

    toast({
      title: "Event deleted",
      description: "The selected calendar item was removed.",
    });
    setDetailEvent(null);
    refreshEvents();
  };

  const selectedDayLabel = format(selectedDate, "EEE, MMM d");

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Calendar workspace
              </p>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {getViewTitle(currentDate, viewMode)}
                </h2>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Review bookings, blocked dates, and personal events from one cohesive schedule surface.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentDate((date) => (viewMode === "month" ? subMonths(date, 1) : viewMode === "week" ? subDays(date, 7) : subDays(date, 1)))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-medium" onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDate(today);
                }}>
                  Current
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentDate((date) => (viewMode === "month" ? addMonths(date, 1) : viewMode === "week" ? addDays(date, 7) : addDays(date, 1)))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1">
                {VIEW_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setViewMode(mode.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                        viewMode === mode.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <Button
                size="sm"
                className="gradient-gold text-primary-foreground font-semibold"
                onClick={() => openCreateDialog("external_booking")}
              >
                <Plus className="h-4 w-4" />
                Create event
              </Button>
            </div>
          </div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </span>
            {EVENT_TYPES.map((type) => {
              const label = type === "all" ? "All events" : EVENT_TYPE_META[type].label;
              const count = type === "all" ? events.length : events.filter((event) => event.type === type).length;
              const active = selectedFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedFilter(type)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                      : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span>{label}</span>
                  <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Visible items</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{visibleEventCount} events</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Blocked days</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{blockedDayCount} days</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Service capacity</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {capacityConfig.maxDailyBookings} booking{capacityConfig.maxDailyBookings === 1 ? "" : "s"} per day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
          <CardContent className="p-3 sm:p-4 lg:p-5">
            {viewMode === "month" && (
              <MonthView
                currentMonth={currentDate}
                events={filteredEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onEventClick={setDetailEvent}
                maxCapacity={capacityConfig.maxDailyBookings}
              />
            )}

            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onSelectDate={setSelectedDate}
                onEventClick={setDetailEvent}
              />
            )}

            {viewMode === "day" && (
              <DayView
                selectedDate={selectedDate}
                events={filteredEvents}
                onEventClick={setDetailEvent}
              />
            )}

            {viewMode === "agenda" && (
              <AgendaView
                events={filteredEvents}
                onEventClick={setDetailEvent}
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm xl:sticky xl:top-6 self-start">
          <CardHeader className="border-b border-border/40 bg-muted/15 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {selectedDayLabel}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Selected day overview and quick actions
                </CardDescription>
              </div>

              {selectedDayCapacity.isBlocked ? (
                <Badge variant="destructive" className="text-[10px]">
                  Unavailable
                </Badge>
              ) : selectedDayCapacity.isFullyBooked ? (
                <Badge className="bg-rose-500 text-white text-[10px]">Fully booked</Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px]">
                  {selectedDayCapacity.remaining} slot{selectedDayCapacity.remaining === 1 ? "" : "s"} open
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Capacity used</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedDayCapacity.bookingsCount} / {capacityConfig.maxDailyBookings} slots filled
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{selectedDayCapacity.eventsCount} total events</p>
                  <p>{selectedDayCapacity.remaining} remaining</p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    selectedDayCapacity.isBlocked
                      ? "bg-slate-500"
                      : selectedDayCapacity.isFullyBooked
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedDayCapacity.bookingsCount / Math.max(1, capacityConfig.maxDailyBookings)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Events on this day
                </h4>
                <span className="text-xs text-muted-foreground">{selectedDayCapacity.dayEvents.length}</span>
              </div>

              {selectedDayCapacity.dayEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
                  <p className="mt-3 text-sm font-medium text-foreground">No events scheduled</p>
                  <p className="mt-1 text-xs text-muted-foreground">This day is currently open for new bookings.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayCapacity.dayEvents.map((event) => {
                    const meta = EVENT_TYPE_META[event.type];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setDetailEvent(event)}
                        className={cn(
                          "w-full rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                          "bg-background/80",
                          meta.bgSoft
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.type)}
                              <span className="truncate text-sm font-semibold text-foreground">{event.title}</span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {event.isAllDay ? "All day" : `${event.startTime || "09:00"} - ${event.endTime || "17:00"}`}
                            </p>
                          </div>

                          <Badge className={cn("shrink-0 text-[10px]", meta.colorClass)}>
                            {meta.label}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Button
                className="gradient-gold text-primary-foreground font-semibold"
                onClick={() => openCreateDialog("external_booking")}
              >
                <Plus className="h-4 w-4" />
                Create event
              </Button>
              <Button
                variant="outline"
                onClick={() => openCreateDialog("blocked_date")}
              >
                <Ban className="h-4 w-4" />
                Block this date
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  document.getElementById("schedule-settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Edit advanced settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedDate}
        initialEventType={createDialogType}
        editingEvent={editingEvent}
        providerId={providerId}
        onEventSaved={(savedEvent) => {
          const savedDate = parseISO(savedEvent.startDate);
          setSelectedDate(savedDate);
          setCurrentDate(savedDate);
          void loadCalendar(savedDate).catch(() => undefined);
        }}
      />

      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        {detailEvent && (
          <DialogContent className="max-w-md w-[95vw] rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className={EVENT_TYPE_META[detailEvent.type].colorClass}>
                  {EVENT_TYPE_META[detailEvent.type].label}
                </Badge>
              </div>
              <DialogTitle className="font-display text-xl font-semibold">{detailEvent.title}</DialogTitle>
              <DialogDescription className="text-xs">
                Event details, timing, and quick actions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">
                  {format(parseISO(detailEvent.startDate), "PPP")}
                  {detailEvent.endDate ? ` — ${format(parseISO(detailEvent.endDate), "PPP")}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  {detailEvent.isAllDay ? "All-day event" : `${detailEvent.startTime} to ${detailEvent.endTime}`}
                </span>
              </div>

              {detailEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{detailEvent.location}</span>
                </div>
              )}

              {detailEvent.customerName && (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs">
                  <p className="font-semibold text-foreground">Client details</p>
                  <p>Name: {detailEvent.customerName}</p>
                  {detailEvent.customerPhone && <p>Phone: {detailEvent.customerPhone}</p>}
                </div>
              )}

              {detailEvent.notes && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs">
                  <p className="font-semibold text-foreground">Notes</p>
                  <p className="whitespace-pre-line">{detailEvent.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                variant="destructive"
                size="sm"
                disabled={detailEvent.source === "booking"}
                onClick={() => handleDeleteEvent(detailEvent.id)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={detailEvent.source === "booking"}
                onClick={() => {
                  setEditingEvent(detailEvent);
                  setDetailEvent(null);
                  setCreateDialogType(detailEvent.type);
                  setCreateDialogOpen(true);
                }}
              >
                <Edit2 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

const MonthView = ({
  currentMonth,
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
  maxCapacity,
}: {
  currentMonth: Date;
  events: ScheduleEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventClick: (e: ScheduleEvent) => void;
  maxCapacity: number;
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2 rounded-2xl border border-border/60 bg-muted/25 p-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayCapacity = getDayCapacitySummary(day, events, maxCapacity);
          const isToday = isSameDay(day, new Date());
          const hasBlockedDate = dayCapacity.dayEvents.some((event) => event.type === "blocked_date");
          const hasSubhakaryBooking = dayCapacity.dayEvents.some((event) => event.type === "subhakary_booking");
          const hasExternalBooking = dayCapacity.dayEvents.some((event) => event.type === "external_booking");

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDate(day);
                }
              }}
              className={cn(
                "group min-h-[118px] rounded-2xl border p-2.5 text-left transition-all",
                "bg-background/80 hover:border-primary/40 hover:bg-accent/20 hover:shadow-sm",
                !isCurrentMonth && "opacity-40",
                isSelected && "border-primary/60 ring-2 ring-primary/10",
                dayCapacity.isBlocked && "border-destructive/40 bg-destructive/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected && !isToday && "bg-foreground text-background",
                    !isToday && !isSelected && "bg-muted text-foreground",
                    dayCapacity.isBlocked && "text-destructive line-through"
                  )}
                >
                  {day.getDate()}
                </span>

                {dayCapacity.isBlocked ? (
                  <Badge variant="destructive" className="text-[9px]">
                    Blocked
                  </Badge>
                ) : dayCapacity.bookingsCount > 0 ? (
                  <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/25 text-[9px]">
                    {dayCapacity.bookingsCount}/{maxCapacity}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">{dayCapacity.remaining} open</span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 px-1">
                {hasBlockedDate && <span className="h-2 w-2 rounded-full bg-destructive" title="Blocked date" />}
                {!hasBlockedDate && hasSubhakaryBooking && <span className="h-2 w-2 rounded-full bg-amber-500" title="Subhakary booking" />}
                {!hasBlockedDate && !hasSubhakaryBooking && hasExternalBooking && (
                  <span className="h-2 w-2 rounded-full bg-violet-500" title="External booking" />
                )}
              </div>

              <div className="mt-2 space-y-1 overflow-hidden">
                {dayCapacity.dayEvents.slice(0, 3).map((event) => {
                  const meta = EVENT_TYPE_META[event.type];
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={cn(
                        "w-full rounded-lg border px-2 py-1 text-left text-[10px] font-medium leading-tight transition-transform hover:-translate-y-px",
                        meta.bgSoft
                      )}
                    >
                      <span className="block truncate">{event.title}</span>
                    </button>
                  );
                })}

                {dayCapacity.dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{dayCapacity.dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekView = ({
  currentDate,
  events,
  onSelectDate,
  onEventClick,
}: {
  currentDate: Date;
  events: ScheduleEvent[];
  onSelectDate: (d: Date) => void;
  onEventClick: (e: ScheduleEvent) => void;
}) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(weekStart);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayCapacity = getDayCapacitySummary(day, events);
        return (
          <div
            key={day.toISOString()}
            className="rounded-2xl border border-border/60 bg-background/80 p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            role="button"
            tabIndex={0}
            onClick={() => onSelectDate(day)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectDate(day);
              }
            }}
          >
            <div className="border-b border-border/40 pb-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{format(day, "d")}</p>
            </div>

            <div className="mt-3 space-y-1.5">
              {dayCapacity.dayEvents.slice(0, 4).map((event) => {
                const meta = EVENT_TYPE_META[event.type];
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={cn("w-full truncate rounded-lg border px-2 py-1.5 text-[11px] font-medium", meta.bgSoft)}
                  >
                    {event.title}
                  </button>
                );
              })}
              {dayCapacity.dayEvents.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Open</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DayView = ({
  selectedDate,
  events,
  onEventClick,
}: {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick: (e: ScheduleEvent) => void;
}) => {
  const dayCapacity = getDayCapacitySummary(selectedDate, events);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {dayCapacity.isBlocked
            ? "This day is currently blocked."
            : `${dayCapacity.remaining} slot${dayCapacity.remaining === 1 ? "" : "s"} available.`}
        </p>
      </div>

      {dayCapacity.dayEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
          <p className="mt-3 text-sm font-medium text-foreground">No events scheduled</p>
          <p className="mt-1 text-xs text-muted-foreground">This day is open for bookings or manual events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayCapacity.dayEvents.map((event) => {
            const meta = EVENT_TYPE_META[event.type];
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-px hover:shadow-sm",
                  meta.bgSoft
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                  </div>
                  <Badge className={cn("text-[10px]", meta.colorClass)}>{meta.label}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {event.isAllDay ? "All day" : `${event.startTime} - ${event.endTime}`}
                </p>
                {event.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AgendaView = ({
  events,
  onEventClick,
}: {
  events: ScheduleEvent[];
  onEventClick: (e: ScheduleEvent) => void;
}) => {
  const sortedEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Agenda</h3>
        <p className="mt-1 text-sm text-muted-foreground">A clean list of all currently visible schedule items.</p>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-8 text-center">
          <List className="mx-auto h-8 w-8 text-muted-foreground/70" />
          <p className="mt-3 text-sm font-medium text-foreground">No events match the current filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((event) => {
            const meta = EVENT_TYPE_META[event.type];
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-px hover:shadow-sm",
                  meta.bgSoft
                )}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{event.title}</span>
                      <Badge className={cn("text-[10px]", meta.colorClass)}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(parseISO(event.startDate), "PPP")}
                      {event.startTime ? ` • ${event.startTime} - ${event.endTime}` : ""}
                    </p>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
