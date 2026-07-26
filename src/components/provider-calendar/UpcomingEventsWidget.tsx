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
}

const getEventIcon = (type: ScheduleEvent["type"]) => {
  switch (type) {
    case "subhakary_booking":
      return <Sparkles className="h-4 w-4 text-amber-500" />;
    case "external_booking":
      return <Briefcase className="h-4 w-4 text-purple-500" />;
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

export const UpcomingEventsWidget = ({ 
  events: propEvents, 
  onOpenCalendar,
  onNewEvent 
}: UpcomingEventsWidgetProps) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "this_week">("today");

  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents);
    } else {
      setEvents(getProviderEvents());
    }
  }, [propEvents]);

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
    <Card className="hover-lift border-primary/20 bg-card/95 backdrop-blur shadow-sm mb-8 overflow-hidden">
      <CardHeader className="p-4 md:p-6 pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display text-lg md:text-xl font-bold flex items-center gap-2">
                Upcoming Events & Schedule
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Your immediate bookings, personal events, and availability overview
              </p>
            </div>
          </div>

          {/* Next Event Live Countdown Banner */}
          {countdownInfo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300"
            >
              <Timer className="h-4 w-4 animate-pulse text-amber-600" />
              <div className="text-xs font-medium">
                <span className="text-muted-foreground">Next Event: </span>
                <span className="font-semibold text-foreground">{countdownInfo.nextEvent.title}</span>
                <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-700 border-amber-500/40 text-[10px] py-0 font-bold">
                  {countdownInfo.countdownText}
                </Badge>
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-4">
        {/* Quick Filter Tabs */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border/30">
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "today" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today ({todayEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("tomorrow")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "tomorrow" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tomorrow ({tomorrowEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("this_week")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "this_week" 
                  ? "bg-background text-foreground shadow-sm font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Week ({thisWeekEvents.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNewEvent && (
              <Button size="sm" variant="outline" onClick={onNewEvent} className="h-8 text-xs font-medium">
                + Add Event
              </Button>
            )}
            {onOpenCalendar && (
              <Button size="sm" variant="ghost" onClick={onOpenCalendar} className="h-8 text-xs font-medium flex items-center gap-1 text-primary">
                Full Schedule <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Events List */}
        {displayedEvents.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/60 rounded-xl bg-muted/10">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No events scheduled for {activeTab.replace("_", " ")}</p>
            <p className="text-xs text-muted-foreground mt-1">You are fully available to receive Subhakary bookings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedEvents.map((event) => {
              const meta = EVENT_TYPE_META[event.type];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border transition-all ${meta.bgSoft} hover:shadow-md flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <h4 className="font-semibold text-sm line-clamp-1">{event.title}</h4>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${meta.colorClass}`}>
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Clock className="h-3 w-3" />
                        {event.isAllDay ? "All-Day" : `${event.startTime || "09:00"} - ${event.endTime || "18:00"}`}
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {event.customerName && (
                    <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Client: <strong className="text-foreground">{event.customerName}</strong></span>
                      {event.customerPhone && <span className="text-muted-foreground font-mono">{event.customerPhone}</span>}
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
