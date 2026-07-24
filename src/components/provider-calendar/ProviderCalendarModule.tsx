import { useState, useEffect, useCallback } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  subDays,
  parseISO
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Sparkles, 
  Briefcase, 
  User, 
  Palmtree, 
  CalendarOff, 
  Coffee, 
  Ban, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Grid,
  List,
  CalendarDays,
  Trash2,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  EventType, 
  ScheduleEvent, 
  EVENT_TYPE_META, 
  getProviderEvents, 
  deleteProviderEvent, 
  getDayCapacitySummary,
  getCapacityConfig
} from "@/lib/providerScheduleStore";
import { CreateEventDialog } from "./CreateEventDialog";

type ViewMode = "month" | "week" | "day" | "agenda";

interface ProviderCalendarModuleProps {
  providerId?: string;
  onEventSelect?: (event: ScheduleEvent) => void;
}

export const ProviderCalendarModule = ({ providerId = "default" }: ProviderCalendarModuleProps) => {
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all");

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  // Load events
  const loadEvents = useCallback(() => {
    setEvents(getProviderEvents(providerId));
  }, [providerId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDeleteEvent = (id: string) => {
    deleteProviderEvent(id, providerId);
    toast({ title: "Event Deleted", description: "Event has been removed from your schedule." });
    setDetailEvent(null);
    loadEvents();
  };

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === "all") return true;
    return e.type === selectedFilter;
  });

  const capacityConfig = getCapacityConfig();

  // Selected Day capacity summary
  const selectedDayCapacity = getDayCapacitySummary(selectedDate, events, capacityConfig.maxDailyBookings);

  return (
    <div className="space-y-6">
      {/* Calendar Header & View Switcher Toolbar */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="font-display text-lg md:text-xl font-bold text-foreground min-w-[160px]">
              {format(currentDate, viewMode === "day" ? "EEEE, MMMM d, yyyy" : "MMMM yyyy")}
            </h2>
          </div>

          {/* View Mode Switcher & Create Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40">
              {(["month", "week", "day", "agenda"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                    viewMode === mode 
                      ? "bg-background text-foreground shadow-sm font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              className="gradient-gold text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                setEditingEvent(null);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Event Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        <Badge
          variant={selectedFilter === "all" ? "default" : "outline"}
          className="cursor-pointer text-xs py-1 px-3"
          onClick={() => setSelectedFilter("all")}
        >
          All Events ({events.length})
        </Badge>
        {(Object.keys(EVENT_TYPE_META) as EventType[]).map((type) => {
          const meta = EVENT_TYPE_META[type];
          const count = events.filter((e) => e.type === type).length;
          return (
            <Badge
              key={type}
              variant={selectedFilter === type ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs py-1 px-2.5 transition-all shrink-0",
                selectedFilter === type ? meta.colorClass : "hover:bg-muted"
              )}
              onClick={() => setSelectedFilter(type)}
            >
              {meta.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Main Calendar View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Views */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === "month" && (
            <MonthView
              currentMonth={currentDate}
              events={filteredEvents}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onEventClick={(evt) => setDetailEvent(evt)}
              maxCapacity={capacityConfig.maxDailyBookings}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectDate={(d) => setSelectedDate(d)}
              onEventClick={(evt) => setDetailEvent(evt)}
            />
          )}

          {viewMode === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={filteredEvents}
              onEventClick={(evt) => setDetailEvent(evt)}
            />
          )}

          {viewMode === "agenda" && (
            <AgendaView
              events={filteredEvents}
              onEventClick={(evt) => setDetailEvent(evt)}
            />
          )}
        </div>

        {/* Right Column: Selected Date Inspector & Capacity Widget */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border/30 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {format(selectedDate, "EEE, MMM d, yyyy")}
                </CardTitle>

                {/* Capacity Status Badge */}
                {selectedDayCapacity.isBlocked ? (
                  <Badge variant="destructive" className="text-[10px]">Unavailable</Badge>
                ) : selectedDayCapacity.isFullyBooked ? (
                  <Badge className="bg-rose-500 text-white text-[10px]">Fully Booked</Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                    {selectedDayCapacity.remaining} Slot(s) Available
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Slot Utilization Bar */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Booking Utilization:</span>
                  <span className="font-semibold">{selectedDayCapacity.bookingsCount} / {capacityConfig.maxDailyBookings} Slots Filled</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(selectedDayCapacity.bookingsCount / capacityConfig.maxDailyBookings) * 100}%` }}
                  />
                </div>
              </div>

              {/* Events on selected date */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Events on this date ({selectedDayCapacity.dayEvents.length})
                </h4>

                {selectedDayCapacity.dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No events scheduled. Date is fully open.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayCapacity.dayEvents.map((evt) => {
                      const meta = EVENT_TYPE_META[evt.type];
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setDetailEvent(evt)}
                          className={cn(
                            "p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02]",
                            meta.bgSoft
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 font-semibold mb-1">
                            <span className="truncate">{evt.title}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0 font-medium shrink-0", meta.colorClass)}>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evt.isAllDay ? "All Day" : `${evt.startTime || "09:00"} - ${evt.endTime || "17:00"}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium"
                onClick={() => {
                  setEditingEvent(null);
                  setCreateDialogOpen(true);
                }}
              >
                Create Event on {format(selectedDate, "MMM d")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedDate}
        editingEvent={editingEvent}
        providerId={providerId}
        onEventSaved={() => loadEvents()}
      />

      {/* Event Details Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        {detailEvent && (
          <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={EVENT_TYPE_META[detailEvent.type].colorClass}>
                  {EVENT_TYPE_META[detailEvent.type].label}
                </Badge>
              </div>
              <DialogTitle className="font-display text-xl font-bold">{detailEvent.title}</DialogTitle>
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
                  {detailEvent.isAllDay ? "All-Day Event" : `${detailEvent.startTime} to ${detailEvent.endTime}`}
                </span>
              </div>

              {detailEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{detailEvent.location}</span>
                </div>
              )}

              {detailEvent.customerName && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1 text-xs">
                  <p className="font-semibold text-foreground">Client Details:</p>
                  <p>Name: {detailEvent.customerName}</p>
                  {detailEvent.customerPhone && <p>Phone: {detailEvent.customerPhone}</p>}
                </div>
              )}

              {detailEvent.notes && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-xs">
                  <p className="font-semibold text-foreground mb-0.5">Notes:</p>
                  <p className="whitespace-pre-line">{detailEvent.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteEvent(detailEvent.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingEvent(detailEvent);
                  setDetailEvent(null);
                  setCreateDialogOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

// Sub-View Component: Month View
const MonthView = ({ 
  currentMonth, 
  events, 
  selectedDate, 
  onSelectDate, 
  onEventClick, 
  maxCapacity 
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
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-2 sm:p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center font-semibold text-xs text-muted-foreground pb-2 border-b border-border/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1 pt-2">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            const dayCapacity = getDayCapacitySummary(day, events, maxCapacity);

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "min-h-[85px] sm:min-h-[100px] p-1 sm:p-1.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between",
                  !isCurrentMonth && "opacity-40 bg-muted/10",
                  isCurrentMonth && "bg-card hover:bg-accent/40",
                  isSelected && "ring-2 ring-primary border-primary font-bold shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold",
                    isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                  )}>
                    {day.getDate()}
                  </span>

                  {/* Utilization Badge */}
                  {dayCapacity.isBlocked ? (
                    <span className="text-[9px] text-destructive font-semibold">Blocked</span>
                  ) : dayCapacity.bookingsCount > 0 && (
                    <span className={cn(
                      "text-[9px] px-1 rounded font-semibold",
                      dayCapacity.isFullyBooked ? "bg-rose-500/20 text-rose-600" : "bg-amber-500/20 text-amber-600"
                    )}>
                      {dayCapacity.bookingsCount}/{maxCapacity}
                    </span>
                  )}
                </div>

                {/* Day events pills */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayCapacity.dayEvents.slice(0, 2).map((evt) => {
                    const meta = EVENT_TYPE_META[evt.type];
                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(evt);
                        }}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate font-medium border",
                          meta.bgSoft
                        )}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayCapacity.dayEvents.length > 2 && (
                    <div className="text-[9px] text-muted-foreground font-semibold px-1">
                      +{dayCapacity.dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Sub-View: Week View
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
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((day) => {
        const dayCapacity = getDayCapacitySummary(day, events);
        return (
          <Card 
            key={day.toISOString()} 
            className="border-border/50 cursor-pointer hover:border-primary transition-all p-3"
            onClick={() => onSelectDate(day)}
          >
            <div className="text-center pb-2 border-b border-border/30">
              <p className="text-xs text-muted-foreground uppercase font-bold">{format(day, "EEE")}</p>
              <p className="text-base font-extrabold">{format(day, "d")}</p>
            </div>

            <div className="mt-2 space-y-1.5">
              {dayCapacity.dayEvents.map((evt) => {
                const meta = EVENT_TYPE_META[evt.type];
                return (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    className={cn("p-1.5 rounded text-[11px] font-medium border truncate", meta.bgSoft)}
                  >
                    {evt.title}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Sub-View: Day View
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
    <Card className="border-border/50 p-6">
      <h3 className="font-display text-lg font-bold mb-4">
        Schedule for {format(selectedDate, "EEEE, MMMM d, yyyy")}
      </h3>

      {dayCapacity.dayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No events scheduled for this day.</p>
      ) : (
        <div className="space-y-3">
          {dayCapacity.dayEvents.map((evt) => {
            const meta = EVENT_TYPE_META[evt.type];
            return (
              <div
                key={evt.id}
                onClick={() => onEventClick(evt)}
                className={cn("p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all", meta.bgSoft)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm">{evt.title}</h4>
                  <Badge className={meta.colorClass}>{meta.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {evt.isAllDay ? "All Day" : `${evt.startTime} - ${evt.endTime}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

// Sub-View: Agenda View
const AgendaView = ({
  events,
  onEventClick,
}: {
  events: ScheduleEvent[];
  onEventClick: (e: ScheduleEvent) => void;
}) => {
  const sortedEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <Card className="border-border/50 p-4 sm:p-6 space-y-4">
      <h3 className="font-display text-lg font-bold">Upcoming Agenda & Event List</h3>

      {sortedEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No events match your current filter.</p>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((evt) => {
            const meta = EVENT_TYPE_META[evt.type];
            return (
              <div
                key={evt.id}
                onClick={() => onEventClick(evt)}
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition-all",
                  meta.bgSoft
                )}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-foreground">{evt.title}</span>
                    <Badge className={cn("text-[10px] py-0 px-2", meta.colorClass)}>{meta.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📅 {format(parseISO(evt.startDate), "PPP")} {evt.startTime ? `• ⏰ ${evt.startTime} - ${evt.endTime}` : ""}
                  </p>
                </div>

                {evt.location && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {evt.location}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
