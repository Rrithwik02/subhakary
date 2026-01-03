import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { isSameDay, format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProviderAvailabilityCalendarProps {
  providerId: string;
  providerName: string;
}

export const ProviderAvailabilityCalendar = ({ 
  providerId, 
  providerName 
}: ProviderAvailabilityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch existing bookings (to show as booked dates)
  const { data: bookings = [] } = useQuery({
    queryKey: ["provider-public-bookings", providerId],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 2)); // Fetch 3 months ahead
      
      const { data, error } = await supabase
        .from("bookings")
        .select("service_date, start_date, end_date")
        .eq("provider_id", providerId)
        .in("status", ["accepted", "pending"])
        .gte("service_date", format(start, "yyyy-MM-dd"))
        .lte("service_date", format(end, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });

  // Fetch blocked dates
  const { data: blockedDates = [] } = useQuery({
    queryKey: ["provider-blocked-dates-public", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_availability")
        .select("specific_date, day_of_week, is_blocked")
        .eq("provider_id", providerId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });

  // Get all booked dates
  const bookedDates = bookings.map((b) => new Date(b.service_date));
  
  // Get specifically blocked dates
  const specificBlockedDates = blockedDates
    .filter((b) => b.specific_date && b.is_blocked)
    .map((b) => new Date(b.specific_date!));

  // Get recurring blocked days of week
  const blockedDaysOfWeek = blockedDates
    .filter((b) => b.day_of_week !== null && b.is_blocked)
    .map((b) => b.day_of_week);

  // Check if a date is blocked (either specifically or by day of week)
  const isDateBlocked = (date: Date) => {
    // Check specific blocked dates
    if (specificBlockedDates.some((d) => isSameDay(d, date))) {
      return true;
    }
    // Check recurring blocked days
    if (blockedDaysOfWeek.includes(date.getDay())) {
      return true;
    }
    return false;
  };

  // Check if a date has a booking
  const isDateBooked = (date: Date) => {
    return bookedDates.some((d) => isSameDay(d, date));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const today = new Date();

  return (
    <Card>
      <CardHeader className="pb-2 p-3 md:p-6 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base md:text-xl flex items-center gap-2">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Availability
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePreviousMonth}
              disabled={currentMonth <= today}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium min-w-[100px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 md:px-6 md:pb-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Unavailable</span>
          </div>
        </div>

        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md border w-full"
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          components={{
            DayContent: ({ date }) => {
              const isBooked = isDateBooked(date);
              const isBlocked = isDateBlocked(date);
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
              const isAvailable = !isBooked && !isBlocked && !isPast;

              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span
                    className={cn(
                      "flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm",
                      isPast && "text-muted-foreground/50",
                      isBlocked && !isPast && "bg-destructive/20 text-destructive line-through",
                      isBooked && !isPast && !isBlocked && "bg-yellow-500/20 text-yellow-700 font-medium",
                      isAvailable && "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            },
          }}
        />

        <p className="text-xs text-muted-foreground text-center mt-3">
          Select a date while booking to check {providerName}'s availability
        </p>
      </CardContent>
    </Card>
  );
};
