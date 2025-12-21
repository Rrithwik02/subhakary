import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, isSameDay } from "date-fns";
import { CalendarDays, Plus, Trash2, Loader2, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProviderAvailabilityManagerProps {
  providerId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const ProviderAvailabilityManager = ({
  providerId,
}: ProviderAvailabilityManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);
  const [selectedDatesToBlock, setSelectedDatesToBlock] = useState<Date[]>([]);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedRecurringDays, setSelectedRecurringDays] = useState<number[]>([]);

  // Fetch availability data
  const { data: availability = [], isLoading } = useQuery({
    queryKey: ["provider-availability", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_availability")
        .select("*")
        .eq("provider_id", providerId)
        .order("specific_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Get blocked dates and recurring blocked days
  const blockedDates = availability
    .filter((a) => a.specific_date && a.is_blocked)
    .map((a) => new Date(a.specific_date!));
  
  const recurringBlockedDays = availability
    .filter((a) => a.day_of_week !== null && a.is_blocked)
    .map((a) => a.day_of_week!);

  // Add blocked dates mutation
  const addBlockedDatesMutation = useMutation({
    mutationFn: async (dates: Date[]) => {
      const records = dates.map((date) => ({
        provider_id: providerId,
        specific_date: format(date, "yyyy-MM-dd"),
        is_blocked: true,
        is_available: false,
        start_time: "00:00",
        end_time: "23:59",
      }));

      const { error } = await supabase
        .from("service_provider_availability")
        .insert(records);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", providerId] });
      toast({ title: "Dates blocked", description: "Selected dates have been blocked" });
      setBlockDateDialogOpen(false);
      setSelectedDatesToBlock([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove blocked date mutation
  const removeBlockedDateMutation = useMutation({
    mutationFn: async (date: Date) => {
      const { error } = await supabase
        .from("service_provider_availability")
        .delete()
        .eq("provider_id", providerId)
        .eq("specific_date", format(date, "yyyy-MM-dd"));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", providerId] });
      toast({ title: "Date unblocked", description: "Date is now available" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update recurring days mutation
  const updateRecurringDaysMutation = useMutation({
    mutationFn: async (days: number[]) => {
      // First delete all recurring day records
      await supabase
        .from("service_provider_availability")
        .delete()
        .eq("provider_id", providerId)
        .not("day_of_week", "is", null);

      // Then insert new ones
      if (days.length > 0) {
        const records = days.map((day) => ({
          provider_id: providerId,
          day_of_week: day,
          is_blocked: true,
          is_available: false,
          start_time: "00:00",
          end_time: "23:59",
        }));

        const { error } = await supabase
          .from("service_provider_availability")
          .insert(records);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", providerId] });
      toast({ title: "Schedule updated", description: "Weekly schedule has been updated" });
      setRecurringDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDatesToBlock((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  const toggleRecurringDay = (day: number) => {
    setSelectedRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const isDateBlocked = (date: Date) => {
    // Check specific blocked dates
    if (blockedDates.some((d) => isSameDay(d, date))) return true;
    // Check recurring blocked days
    if (recurringBlockedDays.includes(date.getDay())) return true;
    return false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Availability Management
        </CardTitle>
        <CardDescription>
          Block specific dates or set weekly off days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Weekly Off Days</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRecurringDays(recurringBlockedDays);
                setRecurringDialogOpen(true);
              }}
            >
              Edit Schedule
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recurringBlockedDays.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Available all days of the week
              </span>
            ) : (
              DAYS_OF_WEEK.filter((d) => recurringBlockedDays.includes(d.value)).map(
                (day) => (
                  <Badge key={day.value} variant="secondary">
                    {day.label}
                  </Badge>
                )
              )
            )}
          </div>
        </div>

        {/* Blocked Dates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Blocked Dates</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBlockDateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Block Dates
            </Button>
          </div>
          
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No specific dates blocked
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blockedDates
                .filter((d) => d >= new Date())
                .sort((a, b) => a.getTime() - b.getTime())
                .slice(0, 10)
                .map((date) => (
                  <Badge
                    key={date.toISOString()}
                    variant="outline"
                    className="flex items-center gap-1 pr-1"
                  >
                    <CalendarX className="h-3 w-3" />
                    {format(date, "MMM d, yyyy")}
                    <button
                      onClick={() => removeBlockedDateMutation.mutate(date)}
                      className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                      disabled={removeBlockedDateMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </Badge>
                ))}
              {blockedDates.filter((d) => d >= new Date()).length > 10 && (
                <Badge variant="secondary">
                  +{blockedDates.filter((d) => d >= new Date()).length - 10} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Block Dates Dialog */}
        <Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Block Dates</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDatesToBlock}
                onSelect={(dates) => setSelectedDatesToBlock(dates || [])}
                disabled={(date) => date < new Date() || isDateBlocked(date)}
                className={cn("rounded-md border pointer-events-auto")}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedDatesToBlock.length} date(s) selected
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBlockDateDialogOpen(false);
                  setSelectedDatesToBlock([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addBlockedDatesMutation.mutate(selectedDatesToBlock)}
                disabled={
                  selectedDatesToBlock.length === 0 ||
                  addBlockedDatesMutation.isPending
                }
              >
                {addBlockedDatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Block Selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recurring Days Dialog */}
        <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Weekly Off Days</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.value}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
                    {day.label}
                  </Label>
                  <Switch
                    id={`day-${day.value}`}
                    checked={selectedRecurringDays.includes(day.value)}
                    onCheckedChange={() => toggleRecurringDay(day.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Toggle on days when you're unavailable
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRecurringDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  updateRecurringDaysMutation.mutate(selectedRecurringDays)
                }
                disabled={updateRecurringDaysMutation.isPending}
              >
                {updateRecurringDaysMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
