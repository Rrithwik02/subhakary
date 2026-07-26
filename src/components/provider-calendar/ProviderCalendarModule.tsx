import { useState, useEffect, useRef } from "react";
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
  Sliders,
  Bell,
  Cloud,
  Trash2,
  Edit2,
  CalendarDays,
  X
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
  getCapacityConfig,
  saveProviderEvent,
  getWeeklyOffDays,
  saveWeeklyOffDays
} from "@/lib/providerScheduleStore";
import { CreateEventDialog } from "./CreateEventDialog";
import { TimeSlotCapacityManager } from "./TimeSlotCapacityManager";
import { ScheduleNotificationSettings } from "./ScheduleNotificationSettings";
import { GoogleCalendarConnectUI } from "./GoogleCalendarConnectUI";

type SettingsTab = "availability" | "capacity" | "notifications" | "google_calendar";

const DAYS_OF_WEEK_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ProviderCalendarModuleProps {
  providerId?: string;
}

export const ProviderCalendarModule = ({ providerId }: ProviderCalendarModuleProps) => {
  const { toast } = useToast();
  const settingsSectionRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<EventType | "all">("all");
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>("availability");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);
  const [editScheduleDialogOpen, setEditScheduleDialogOpen] = useState(false);
  const [weeklyOffs, setWeeklyOffs] = useState<number[]>([]);

  // Load events & weekly off days
  const loadData = () => {
    setEvents(getProviderEvents(providerId));
    setWeeklyOffs(getWeeklyOffDays(providerId));
  };

  useEffect(() => {
    loadData();
  }, [providerId]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleCurrentMonth = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const capacityConfig = getCapacityConfig(providerId);

  // Filtered events
  const filteredEvents = events.filter((e) => {
    if (selectedFilter === "all") return true;
    return e.type === selectedFilter;
  });

  // Calculate statistics for Top Summary Bar
  const visibleEventsCount = filteredEvents.length;
  const blockedDaysCount = events.filter((e) => ["blocked_date", "vacation", "holiday", "leave"].includes(e.type)).length;
  const serviceCapacityText = `${capacityConfig.maxDailyBookings} booking${capacityConfig.maxDailyBookings > 1 ? "s" : ""} per day`;

  // Selected Day Capacity Summary
  const selectedDayCapacity = getDayCapacitySummary(selectedDate, events, capacityConfig.maxDailyBookings);
  const isSelectedDateBlocked = selectedDayCapacity.isBlocked || weeklyOffs.includes(selectedDate.getDay());

  // Toggle Date Blocking
  const handleToggleBlockDate = () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingBlock = events.find(
      (e) => e.type === "blocked_date" && (e.startDate === dateStr || (e.endDate && dateStr >= e.startDate && dateStr <= e.endDate))
    );

    if (existingBlock) {
      deleteProviderEvent(existingBlock.id, providerId);
      toast({ title: "Date Unblocked", description: `${format(selectedDate, "MMM d, yyyy")} is now open for bookings.` });
    } else {
      saveProviderEvent(
        {
          providerId: providerId || "default",
          type: "blocked_date",
          title: "Blocked Date",
          startDate: dateStr,
          isAllDay: true,
          status: "blocked",
        },
        providerId
      );
      toast({ title: "Date Blocked", description: `${format(selectedDate, "MMM d, yyyy")} has been manually blocked.` });
    }
    loadData();
  };

  const handleDeleteEvent = (id: string) => {
    deleteProviderEvent(id, providerId);
    toast({ title: "Event Deleted", description: "Event has been removed from schedule." });
    setDetailEvent(null);
    loadData();
  };

  const handleSaveWeeklyOffs = (newDays: number[]) => {
    setWeeklyOffs(newDays);
    saveWeeklyOffDays(newDays, providerId);
    setEditScheduleDialogOpen(false);
    toast({ title: "Schedule Updated", description: "Weekly off days updated successfully." });
  };

  const scrollToSettings = (tab?: SettingsTab) => {
    if (tab) setActiveSettingsTab(tab);
    settingsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-8 font-sans text-stone-800 bg-[#FAF8F5] -mx-4 px-4 sm:-mx-6 sm:px-6 py-6 rounded-3xl">
      {/* 1. SCHEDULE WORKSPACE HEADER & TOP SUMMARY CARD (Image 4 Top) */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            SCHEDULE WORKSPACE
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 mt-1">
            Calendar, bookings, and availability in one place
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Keep the calendar front and center while advanced controls stay grouped below it for faster scanning.
          </p>
        </div>

        {/* Top Summary & Filter Card Container */}
        <Card className="border border-stone-200/70 shadow-sm bg-white/90 rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Header row with navigation & Create Event */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SCHEDULE WORKSPACE</p>
                <h2 className="font-serif text-lg sm:text-xl font-medium text-stone-800 flex items-center gap-2 mt-0.5">
                  <span className="text-amber-600 text-lg">📅</span>
                  Calendar, bookings, and availability in one place
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 max-w-xl">
                  Keep the calendar front and center while advanced controls stay grouped below it for faster scanning.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Navigation Pill */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200 text-xs font-medium">
                  <button 
                    onClick={handlePrevMonth} 
                    className="p-1 hover:bg-white rounded-full transition-all text-stone-600"
                    title="Previous Month"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={handleCurrentMonth} 
                    className="px-3 py-0.5 text-xs text-stone-700 font-semibold hover:text-stone-900"
                  >
                    Current
                  </button>
                  <button 
                    onClick={handleNextMonth} 
                    className="p-1 hover:bg-white rounded-full transition-all text-stone-600"
                    title="Next Month"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* + Create event Primary Gold Button */}
                <Button
                  className="bg-[#D97706] hover:bg-[#b46205] text-white font-medium text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm"
                  onClick={() => {
                    setEditingEvent(null);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create event</span>
                </Button>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-1 text-xs text-stone-500 font-medium mr-2">
                <Filter className="h-3.5 w-3.5" /> Filter
              </div>

              <button
                onClick={() => setSelectedFilter("all")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  selectedFilter === "all"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-900 font-semibold shadow-xs"
                    : "bg-stone-50/60 border-stone-200/60 text-stone-600 hover:bg-stone-100"
                )}
              >
                All events <span className="text-[10px] opacity-70 font-mono">({events.length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter("subhakary_booking")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  selectedFilter === "subhakary_booking"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-900 font-semibold shadow-xs"
                    : "bg-stone-50/60 border-stone-200/60 text-stone-600 hover:bg-stone-100"
                )}
              >
                Subhakary Booking <span className="text-[10px] opacity-70 font-mono">({events.filter(e => e.type === "subhakary_booking").length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter("external_booking")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  selectedFilter === "external_booking"
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-900 font-semibold shadow-xs"
                    : "bg-stone-50/60 border-stone-200/60 text-stone-600 hover:bg-stone-100"
                )}
              >
                External Booking <span className="text-[10px] opacity-70 font-mono">({events.filter(e => e.type === "external_booking").length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter("blocked_date")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  selectedFilter === "blocked_date"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-900 font-semibold shadow-xs"
                    : "bg-stone-50/60 border-stone-200/60 text-stone-600 hover:bg-stone-100"
                )}
              >
                Blocked Date <span className="text-[10px] opacity-70 font-mono">({events.filter(e => ["blocked_date", "vacation", "holiday", "leave"].includes(e.type)).length})</span>
              </button>
            </div>

            {/* Metrics Row (VISIBLE ITEMS, BLOCKED DAYS, SERVICE CAPACITY) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">VISIBLE ITEMS</p>
                <p className="text-sm font-semibold text-stone-800 mt-1">{visibleEventsCount} events</p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">BLOCKED DAYS</p>
                <p className="text-sm font-semibold text-stone-800 mt-1">{blockedDaysCount} days</p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SERVICE CAPACITY</p>
                <p className="text-sm font-semibold text-stone-800 mt-1">{serviceCapacityText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. TWO-COLUMN MAIN WORKSPACE (Image 4 & Image 5 Calendar Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (lg:col-span-7 or 8): Calendar Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-stone-200/70 shadow-sm bg-white/90 rounded-2xl overflow-hidden p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-normal text-stone-800">Calendar Workspace</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Review bookings, blocked dates, and personal events from one cohesive schedule surface.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-stone-200 rounded-lg text-stone-600 font-medium flex items-center gap-1"
                  onClick={() => setSelectedFilter("all")}
                >
                  <Filter className="h-3 w-3" /> Filters
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium rounded-lg px-3 flex items-center gap-1 shadow-xs"
                  onClick={() => {
                    setEditingEvent(null);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Create event
                </Button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 py-2 px-3 rounded-lg bg-stone-50/80 border border-stone-200/40 text-xs mb-4">
              <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Blocked date
              </span>
              <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Booking
              </span>
              <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> External event
              </span>
            </div>

            {/* Modern Clean Month Grid */}
            <MonthGrid
              currentMonth={currentMonth}
              events={filteredEvents}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onEventClick={(evt) => setDetailEvent(evt)}
              maxCapacity={capacityConfig.maxDailyBookings}
              weeklyOffs={weeklyOffs}
            />
          </Card>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5): Selected Day Overview and Quick Actions */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-stone-200/70 shadow-sm bg-white/90 rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-stone-100 bg-stone-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-medium text-stone-800 flex items-center gap-2">
                    <span>📅</span>
                    {format(selectedDate, "EEE, MMM d")}
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">Selected day overview and quick actions</p>
                </div>

                {isSelectedDateBlocked ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                    Blocked
                  </span>
                ) : selectedDayCapacity.isFullyBooked ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    Fully booked
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedDayCapacity.remaining} slot open
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-5">
              {/* CAPACITY USED Card */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">CAPACITY USED</span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {selectedDayCapacity.dayEvents.length} total events • {selectedDayCapacity.remaining} remaining
                  </span>
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  {selectedDayCapacity.bookingsCount} / {capacityConfig.maxDailyBookings} slots filled
                </p>
                <div className="w-full h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (selectedDayCapacity.bookingsCount / capacityConfig.maxDailyBookings) * 100)}%` }}
                  />
                </div>
              </div>

              {/* EVENTS ON THIS DAY Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">EVENTS ON THIS DAY</span>
                  <span className="font-mono text-stone-500 font-semibold">{selectedDayCapacity.dayEvents.length}</span>
                </div>

                {selectedDayCapacity.dayEvents.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/30 text-center space-y-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-sm">
                      ✓
                    </div>
                    <p className="text-xs font-semibold text-stone-800">No events scheduled</p>
                    <p className="text-[11px] text-stone-400">
                      {isSelectedDateBlocked ? "This date is currently blocked." : "This day is currently open for new bookings."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayCapacity.dayEvents.map((evt) => {
                      const meta = EVENT_TYPE_META[evt.type];
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setDetailEvent(evt)}
                          className={cn(
                            "p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01]",
                            meta.bgSoft
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 font-medium mb-1">
                            <span className="truncate text-stone-800 font-semibold">{evt.title}</span>
                            <Badge className={cn("text-[9px] px-1.5 py-0 font-medium shrink-0", meta.colorClass)}>
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="text-stone-500 text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evt.isAllDay ? "All Day" : `${evt.startTime || "09:00"} - ${evt.endTime || "17:00"}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium py-2.5 rounded-xl shadow-xs"
                  onClick={() => {
                    setEditingEvent(null);
                    setCreateDialogOpen(true);
                  }}
                >
                  + Create event
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  onClick={handleToggleBlockDate}
                >
                  <span>🚫</span>
                  <span>{isSelectedDateBlocked ? "Unblock this date" : "Block this date"}</span>
                </Button>

                <button
                  onClick={() => scrollToSettings("availability")}
                  className="w-full text-center text-xs text-stone-500 hover:text-amber-700 font-medium py-1.5 transition-all"
                >
                  Edit advanced settings
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. SCHEDULE SETTINGS CONTAINER SECTION (Image 5) */}
      <div ref={settingsSectionRef} className="pt-4">
        <Card className="border border-stone-200/70 shadow-sm bg-white/90 rounded-2xl overflow-hidden p-4 sm:p-6 space-y-6">
          {/* Header & Sub-Nav Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif text-xl font-normal text-stone-800 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-600" />
                Schedule settings
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Advanced availability controls stay in one place so the calendar can remain the main workspace.
              </p>
            </div>

            {/* Sub-Navigation Pill Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveSettingsTab("availability")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  activeSettingsTab === "availability"
                    ? "bg-[#F7F3EB] border-amber-600/30 text-amber-900 font-semibold shadow-xs"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-amber-600" />
                Availability
              </button>

              <button
                onClick={() => setActiveSettingsTab("capacity")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  activeSettingsTab === "capacity"
                    ? "bg-[#F7F3EB] border-amber-600/30 text-amber-900 font-semibold shadow-xs"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                <Sliders className="h-3.5 w-3.5 text-stone-500" />
                Capacity & slots
              </button>

              <button
                onClick={() => setActiveSettingsTab("notifications")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  activeSettingsTab === "notifications"
                    ? "bg-[#F7F3EB] border-amber-600/30 text-amber-900 font-semibold shadow-xs"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                <Bell className="h-3.5 w-3.5 text-stone-500" />
                Notifications
              </button>

              <button
                onClick={() => setActiveSettingsTab("google_calendar")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                  activeSettingsTab === "google_calendar"
                    ? "bg-[#F7F3EB] border-amber-600/30 text-amber-900 font-semibold shadow-xs"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                )}
              >
                <Cloud className="h-3.5 w-3.5 text-stone-500" />
                Google Calendar
              </button>
            </div>
          </div>

          {/* TAB CONTENT PANELS */}
          {activeSettingsTab === "availability" && (
            <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-stone-700" />
                  Availability Management
                </h3>
                <p className="text-xs text-stone-500">Block specific dates or set weekly off days</p>
              </div>

              {/* Weekly Off Days */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-stone-700">Weekly Off Days</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-stone-200 bg-white text-stone-700 hover:bg-stone-50 rounded-xl"
                    onClick={() => setEditScheduleDialogOpen(true)}
                  >
                    Edit Schedule
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {weeklyOffs.length === 0 ? (
                    <span className="text-xs text-stone-500 italic">No recurring weekly off days set</span>
                  ) : (
                    weeklyOffs.map((dayIdx) => (
                      <span
                        key={dayIdx}
                        className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#6E4726] text-white shadow-xs"
                      >
                        {DAYS_OF_WEEK_NAMES[dayIdx]}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Blocked Dates */}
              <div className="space-y-3 pt-4 border-t border-stone-200/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-stone-700">Blocked Dates</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-stone-200 bg-white text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-1"
                    onClick={() => {
                      setEditingEvent(null);
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Block Dates
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {events.filter((e) => e.type === "blocked_date").length === 0 ? (
                    <span className="text-xs text-stone-500 italic">No specific dates manually blocked</span>
                  ) : (
                    events
                      .filter((e) => e.type === "blocked_date")
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 shadow-xs"
                        >
                          <CalendarIcon className="h-3.5 w-3.5 text-stone-500" />
                          <span>{format(parseISO(evt.startDate), "MMM d, yyyy")}</span>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="ml-1 text-rose-500 hover:text-rose-700 transition-all p-0.5"
                            title="Unblock date"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeSettingsTab === "capacity" && <TimeSlotCapacityManager />}
          {activeSettingsTab === "notifications" && <ScheduleNotificationSettings />}
          {activeSettingsTab === "google_calendar" && <GoogleCalendarConnectUI />}
        </Card>
      </div>

      {/* CREATE / EDIT EVENT DIALOG */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedDate}
        editingEvent={editingEvent}
        onEventSaved={() => loadData()}
      />

      {/* EDIT WEEKLY OFF SCHEDULE DIALOG */}
      <Dialog open={editScheduleDialogOpen} onOpenChange={setEditScheduleDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-stone-800">Edit Weekly Off Schedule</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Select the days of the week you are recurringly unavailable for bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {DAYS_OF_WEEK_NAMES.map((name, idx) => {
              const isChecked = weeklyOffs.includes(idx);
              return (
                <div
                  key={name}
                  onClick={() => {
                    if (isChecked) setWeeklyOffs(weeklyOffs.filter((d) => d !== idx));
                    else setWeeklyOffs([...weeklyOffs, idx]);
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all",
                    isChecked ? "bg-[#6E4726] text-white border-[#6E4726]" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  )}
                >
                  <span className="font-medium">{name}</span>
                  {isChecked && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-stone-100">
            <Button variant="outline" size="sm" onClick={() => setEditScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium rounded-xl"
              onClick={() => handleSaveWeeklyOffs(weeklyOffs)}
            >
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EVENT DETAILS DIALOG */}
      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        {detailEvent && (
          <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={EVENT_TYPE_META[detailEvent.type].colorClass}>
                  {EVENT_TYPE_META[detailEvent.type].label}
                </Badge>
              </div>
              <DialogTitle className="font-serif text-xl font-normal text-stone-800">{detailEvent.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-amber-600" />
                <span className="text-stone-800 font-medium">
                  {format(parseISO(detailEvent.startDate), "PPP")}
                  {detailEvent.endDate ? ` — ${format(parseISO(detailEvent.endDate), "PPP")}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-stone-800">
                  {detailEvent.isAllDay ? "All-Day Event" : `${detailEvent.startTime} to ${detailEvent.endTime}`}
                </span>
              </div>

              {detailEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span className="text-stone-800">{detailEvent.location}</span>
                </div>
              )}

              {detailEvent.customerName && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <p className="font-semibold text-stone-800">Client Info:</p>
                  <p>Name: {detailEvent.customerName}</p>
                  {detailEvent.customerPhone && <p>Phone: {detailEvent.customerPhone}</p>}
                </div>
              )}

              {detailEvent.notes && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="font-semibold text-stone-800 mb-0.5">Notes:</p>
                  <p className="whitespace-pre-line">{detailEvent.notes}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-stone-100">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl"
                onClick={() => handleDeleteEvent(detailEvent.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-stone-200"
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

// Sub-Component: Clean Month Grid (matching Images 4 & 5)
const MonthGrid = ({ 
  currentMonth, 
  events, 
  selectedDate, 
  onSelectDate, 
  onEventClick, 
  maxCapacity,
  weeklyOffs 
}: {
  currentMonth: Date;
  events: ScheduleEvent[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventClick: (e: ScheduleEvent) => void;
  maxCapacity: number;
  weeklyOffs: number[];
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-2">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between py-2 border-b border-stone-100 text-sm font-serif text-stone-800">
        <span className="font-medium">{format(currentMonth, "MMMM yyyy")}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => {}} className="p-1 hover:bg-stone-100 rounded-lg text-stone-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => {}} className="p-1 hover:bg-stone-100 rounded-lg text-stone-500">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-stone-400 uppercase tracking-wider py-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          const dayCapacity = getDayCapacitySummary(day, events, maxCapacity);
          const isWeeklyOff = weeklyOffs.includes(day.getDay());

          // Event type indicators
          const hasBlocked = dayCapacity.isBlocked || isWeeklyOff;
          const hasBooking = dayCapacity.dayEvents.some((e) => ["subhakary_booking"].includes(e.type));
          const hasExternal = dayCapacity.dayEvents.some((e) => ["external_booking", "personal_event"].includes(e.type));

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[75px] sm:min-h-[85px] p-2 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between relative",
                !isCurrentMonth && "opacity-30 bg-stone-50/40 border-transparent",
                isCurrentMonth && "bg-stone-50/50 border-stone-200/50 hover:bg-white hover:border-amber-500/40",
                isSelected && "bg-[#D97706] text-white border-[#D97706] shadow-sm font-bold hover:bg-[#D97706]"
              )}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full">
                <span className={cn(
                  "text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center",
                  isSelected ? "text-white" : "text-stone-800"
                )}>
                  {day.getDate()}
                </span>

                {/* Capacity Label */}
                {!isSelected && isCurrentMonth && (
                  <span className="text-[10px] text-stone-400 font-mono">
                    {hasBlocked ? "off" : `${dayCapacity.remaining} open`}
                  </span>
                )}
              </div>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-1 mt-auto pt-1">
                {hasBlocked && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-rose-500")} />
                )}
                {hasBooking && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-amber-500")} />
                )}
                {hasExternal && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-purple-500")} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
