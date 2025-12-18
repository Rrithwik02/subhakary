import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { Clock, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  providerId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-700 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
  rejected: "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const BookingCalendar = ({ providerId }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: bookings = [] } = useQuery({
    queryKey: ["provider-calendar-bookings", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            city
          )
        `)
        .eq("provider_id", providerId)
        .in("status", ["pending", "accepted", "completed"]);

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });

  // Get dates that have bookings
  const bookingDates = bookings.map((booking) => new Date(booking.service_date));

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter((booking) =>
        isSameDay(new Date(booking.service_date), selectedDate)
      )
    : [];

  // Custom day content to show booking indicators
  const modifiers = {
    booked: bookingDates,
  };

  const modifiersStyles = {
    booked: {
      fontWeight: "bold",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border pointer-events-auto"
            components={{
              DayContent: ({ date }) => {
                const hasBooking = bookingDates.some((d) => isSameDay(d, date));
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {hasBooking && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? `Bookings for ${format(selectedDate, "MMM dd, yyyy")}`
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bookings for this date
            </p>
          ) : (
            <div className="space-y-4">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(booking.profiles as any)?.full_name || "Customer"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        statusColors[booking.status] || ""
                      )}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {booking.service_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{booking.service_time}</span>
                      </div>
                    )}
                    {(booking.profiles as any)?.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{(booking.profiles as any).city}</span>
                      </div>
                    )}
                    {booking.message && (
                      <p className="mt-2 text-foreground/80 bg-muted/50 p-2 rounded">
                        {booking.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCalendar;
