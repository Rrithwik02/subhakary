import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  ScheduleEvent,
  getDayCapacitySummary,
} from "@/lib/providerScheduleStore";

interface ProviderCalendarMonthSurfaceProps {
  currentMonth: Date;
  selectedDate: Date;
  events: ScheduleEvent[];
  maxCapacity: number;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export const ProviderCalendarMonthSurface = ({
  currentMonth,
  selectedDate,
  events,
  maxCapacity,
  onSelectDate,
  onMonthChange,
}: ProviderCalendarMonthSurfaceProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          Blocked date
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Booking
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          External event
        </span>
      </div>

      <Calendar
        mode="single"
        month={currentMonth}
        selected={selectedDate}
        onSelect={(date) => date && onSelectDate(date)}
        onMonthChange={onMonthChange}
        className="mx-auto w-fit rounded-2xl border border-border/60 bg-background/90 p-3 shadow-sm"
        components={{
          DayContent: ({ date }) => {
            const dayCapacity = getDayCapacitySummary(date, events, maxCapacity);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const hasBlockedDate = dayCapacity.dayEvents.some((event) => event.type === "blocked_date");
            const hasSubhakaryBooking = dayCapacity.dayEvents.some((event) => event.type === "subhakary_booking");
            const hasExternalBooking = dayCapacity.dayEvents.some((event) => event.type === "external_booking");
            const markers: Array<{ key: string; className: string; title: string }> = [];

            if (hasBlockedDate) {
              markers.push({
                key: "blocked",
                className: "bg-destructive shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
                title: "Blocked date",
              });
            } else {
              if (hasSubhakaryBooking) {
                markers.push({
                  key: "subhakary",
                  className: "bg-amber-500",
                  title: "Subhakary booking",
                });
              }

              if (hasExternalBooking) {
                markers.push({
                  key: "external",
                  className: "bg-violet-500",
                  title: "External event",
                });
              }
            }

            return (
              <div
                className={cn(
                  "relative flex h-full w-full items-center justify-center",
                  hasBlockedDate && "text-destructive line-through"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected && !isToday && "bg-foreground text-background",
                    !isToday && !isSelected && "bg-muted text-foreground",
                    hasBlockedDate && "bg-destructive/15 text-destructive line-through"
                  )}
                >
                  {format(date, "d")}
                </span>

                <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-1">
                  {markers.map((marker) => (
                    <span
                      key={marker.key}
                      className={cn("h-1.5 w-1.5 rounded-full", marker.className)}
                      title={marker.title}
                    />
                  ))}
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
};
