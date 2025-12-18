import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { Clock, User, MapPin, Ban, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

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

  const { data: blockedDates = [] } = useQuery({
    queryKey: ["provider-blocked-dates", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_availability")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_blocked", true)
        .not("specific_date", "is", null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });

  const blockDateMutation = useMutation({
    mutationFn: async (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = blockedDates.find(
        (b) => b.specific_date === dateStr
      );

      if (existing) {
        // Unblock the date
        const { error } = await supabase
          .from("service_provider_availability")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "unblocked", date: dateStr };
      } else {
        // Block the date
        const { error } = await supabase
          .from("service_provider_availability")
          .insert({
            provider_id: providerId,
            specific_date: dateStr,
            is_blocked: true,
            start_time: "00:00",
            end_time: "23:59",
          });
        if (error) throw error;
        return { action: "blocked", date: dateStr };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["provider-blocked-dates", providerId] });
      toast.success(
        result.action === "blocked"
          ? `Date ${result.date} has been blocked`
          : `Date ${result.date} has been unblocked`
      );
    },
    onError: () => {
      toast.error("Failed to update date availability");
    },
  });

  // Get dates that have bookings
  const bookingDates = bookings.map((booking) => new Date(booking.service_date));
  
  // Get blocked date objects
  const blockedDateObjects = blockedDates
    .filter((b) => b.specific_date)
    .map((b) => new Date(b.specific_date!));

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter((booking) =>
        isSameDay(new Date(booking.service_date), selectedDate)
      )
    : [];

  // Check if selected date is blocked
  const isSelectedDateBlocked = selectedDate
    ? blockedDateObjects.some((d) => isSameDay(d, selectedDate))
    : false;

  const handleBlockDate = () => {
    if (selectedDate) {
      blockDateMutation.mutate(selectedDate);
    }
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
            className="rounded-md border pointer-events-auto"
            components={{
              DayContent: ({ date }) => {
                const hasBooking = bookingDates.some((d) => isSameDay(d, date));
                const isBlocked = blockedDateObjects.some((d) => isSameDay(d, date));
                return (
                  <div className={cn(
                    "relative w-full h-full flex items-center justify-center",
                    isBlocked && "text-destructive line-through"
                  )}>
                    {date.getDate()}
                    {hasBooking && !isBlocked && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                    {isBlocked && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-destructive rounded-full" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {selectedDate
              ? `${format(selectedDate, "MMM dd, yyyy")}`
              : "Select a date"}
          </CardTitle>
          {selectedDate && (
            <Button
              variant={isSelectedDateBlocked ? "outline" : "destructive"}
              size="sm"
              onClick={handleBlockDate}
              disabled={blockDateMutation.isPending}
            >
              {isSelectedDateBlocked ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Unblock
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-1" />
                  Block Date
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isSelectedDateBlocked && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              This date is blocked. You will not receive new bookings for this date.
            </div>
          )}
          
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
