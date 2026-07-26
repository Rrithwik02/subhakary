import { useState, useEffect } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Briefcase, 
  User, 
  Palmtree, 
  CalendarOff, 
  Coffee, 
  Ban, 
  ChevronRight, 
  MapPin,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ScheduleEvent, 
  EVENT_TYPE_META, 
  getProviderEvents, 
  getNextEventCountdown 
} from "@/lib/providerScheduleStore";

interface UpcomingEventsWidgetProps {
  events?: ScheduleEvent[];
  onOpenCalendar?: () => void;
  onNewEvent?: () => void;
  providerId?: string;
}

const getEventIcon = (type: ScheduleEvent["type"]) => {
  switch (type) {
    case "subhakary_booking":
      return <Sparkles className="h-4 w-4 text-amber-600" />;
    case "external_booking":
      return <Briefcase className="h-4 w-4 text-purple-600" />;
    case "personal_event":
      return <User className="h-4 w-4 text-emerald-600" />;
    case "vacation":
      return <Palmtree className="h-4 w-4 text-cyan-600" />;
    case "holiday":
      return <CalendarOff className="h-4 w-4 text-rose-600" />;
    case "leave":
      return <Coffee className="h-4 w-4 text-orange-600" />;
    default:
      return <Ban className="h-4 w-4 text-stone-500" />;
  }
};

export const UpcomingEventsWidget = ({ 
  events: propEvents, 
  onOpenCalendar,
  onNewEvent,
  providerId 
}: UpcomingEventsWidgetProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "this_week">("today");

  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents);
    } else {
      setEvents(getProviderEvents(providerId));
    }
  }, [propEvents, providerId]);

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const todayEvents = events.filter((e) => isSameDay(new Date(e.startDate), today));
  const tomorrowEvents = events.filter((e) => isSameDay(new Date(e.startDate), tomorrow));
  const thisWeekEvents = events.filter((e) => {
    const d = new Date(e.startDate);
    const diff = (d.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 7;
  });

  const countdownInfo = getNextEventCountdown(events);

  const displayedEvents = 
    activeTab === "today" 
      ? todayEvents 
      : activeTab === "tomorrow" 
      ? tomorrowEvents 
      : thisWeekEvents;

  return (
    <Card className="border border-stone-200/70 shadow-sm bg-white/90 rounded-2xl mb-8 overflow-hidden font-sans">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-stone-100 bg-stone-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 font-serif">
              📅
            </div>
            <div>
              <CardTitle className="font-serif text-base sm:text-lg font-normal text-stone-800 flex items-center gap-2">
                Upcoming Events & Schedule
              </CardTitle>
              <p className="text-[11px] text-stone-400">
                Your immediate bookings, personal events, and live availability
              </p>
            </div>
          </div>

          {/* Countdown Banner */}
          {countdownInfo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900"
            >
              <Timer className="h-3.5 w-3.5 animate-pulse text-amber-600" />
              <div className="text-xs font-medium">
                <span className="text-stone-500">Next: </span>
                <span className="font-semibold text-stone-800">{countdownInfo.nextEvent.title}</span>
                <Badge variant="outline" className="ml-2 bg-amber-200/60 text-amber-900 border-amber-300 text-[10px] py-0 font-bold">
                  {countdownInfo.countdownText}
                </Badge>
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-4 space-y-4">
        {/* Quick Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === "today" 
                  ? "bg-white text-stone-800 shadow-xs font-semibold" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Today ({todayEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("tomorrow")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === "tomorrow" 
                  ? "bg-white text-stone-800 shadow-xs font-semibold" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Tomorrow ({tomorrowEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("this_week")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === "this_week" 
                  ? "bg-white text-stone-800 shadow-xs font-semibold" 
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              This Week ({thisWeekEvents.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNewEvent && (
              <Button size="sm" variant="outline" onClick={onNewEvent} className="h-7 text-xs border-stone-200 rounded-lg">
                + Add Event
              </Button>
            )}
            {onOpenCalendar && (
              <Button size="sm" variant="ghost" onClick={onOpenCalendar} className="h-7 text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1">
                Full Schedule <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {displayedEvents.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
            <Calendar className="h-7 w-7 text-stone-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-stone-700">No events scheduled for {activeTab.replace("_", " ")}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Your calendar is open to accept new Subhakary bookings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedEvents.map((event) => {
              const meta = EVENT_TYPE_META[event.type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border transition-all ${meta.bgSoft} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <h4 className="font-semibold text-xs text-stone-800 line-clamp-1">{event.title}</h4>
                      </div>
                      <Badge className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 font-medium ${meta.colorClass}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 mt-2">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Clock className="h-3 w-3" />
                        {event.isAllDay ? "All-Day" : `${event.startTime || "09:00"} - ${event.endTime || "18:00"}`}
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {event.customerName && (
                    <div className="mt-2.5 pt-2 border-t border-stone-200/40 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Client: <strong className="text-stone-800">{event.customerName}</strong></span>
                      {event.customerPhone && <span className="text-stone-500 font-mono">{event.customerPhone}</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
