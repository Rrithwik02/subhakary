import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Briefcase,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  EventType, 
  ScheduleEvent, 
  ConflictCheckResult 
} from "@/lib/providerScheduleStore";
import {
  saveProviderEvent,
  validateProviderEventRequest,
} from "@/lib/providerCalendarApi";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialEventType?: EventType;
  editingEvent?: ScheduleEvent | null;
  providerId?: string;
  onEventSaved?: (event: ScheduleEvent) => void;
}

export const CreateEventDialog = ({
  open,
  onOpenChange,
  initialDate,
  initialEventType,
  editingEvent,
  providerId = "default",
  onEventSaved,
}: CreateEventDialogProps) => {
  const { toast } = useToast();

  const [eventType, setEventType] = useState<EventType>(initialEventType ?? "external_booking");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(format(initialDate || new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(initialDate || new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isAllDay, setIsAllDay] = useState(true);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [conflictResult, setConflictResult] = useState<ConflictCheckResult>({ hasConflict: false });
  const isBlockedDate = eventType === "blocked_date";
  const isLegacyMultiDayEvent = ["vacation", "holiday", "leave"].includes(eventType);
  const eventTypeOptions = [
    { value: "external_booking", label: "External Booking", icon: Briefcase },
    { value: "blocked_date", label: "Blocked Date", icon: Ban },
  ].concat(
    editingEvent && !["external_booking", "blocked_date"].includes(editingEvent.type)
      ? [
          {
            value: editingEvent.type,
            label:
              editingEvent.type === "personal_event"
                ? "Personal Event"
                : editingEvent.type === "vacation"
                ? "Vacation"
                : editingEvent.type === "holiday"
                ? "Holiday"
                : editingEvent.type === "leave"
                ? "Leave"
                : "Legacy Event",
            icon: Briefcase,
          },
        ]
      : []
  );

  // Populate form if editing
  useEffect(() => {
    if (editingEvent) {
      setEventType(editingEvent.type);
      setTitle(editingEvent.title);
      setStartDate(editingEvent.startDate);
      setEndDate(editingEvent.endDate || editingEvent.startDate);
      setStartTime(editingEvent.startTime || "09:00");
      setEndTime(editingEvent.endTime || "17:00");
      setIsAllDay(editingEvent.isAllDay);
      setLocation(editingEvent.location || "");
      setNotes(editingEvent.notes || "");
      setCustomerName(editingEvent.customerName || "");
      setCustomerPhone(editingEvent.customerPhone || "");
    } else {
      const defaultDateStr = format(initialDate || new Date(), "yyyy-MM-dd");
      setEventType(initialEventType ?? "external_booking");
      setTitle("");
      setStartDate(defaultDateStr);
      setEndDate(defaultDateStr);
      setStartTime("09:00");
      setEndTime("17:00");
      setIsAllDay(true);
      setLocation("");
      setNotes("");
      setCustomerName("");
      setCustomerPhone("");
    }
  }, [editingEvent, initialDate, initialEventType, open]);

  useEffect(() => {
    if (isBlockedDate && !isAllDay) {
      setIsAllDay(true);
    }
  }, [isBlockedDate, isAllDay]);

  // Live Conflict Detection whenever dates/times change
  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const runValidation = async () => {
      try {
        const result = await validateProviderEventRequest({
          providerId,
          eventType,
          eventDate: startDate,
          startTime: isAllDay ? null : startTime,
          endTime: isAllDay ? null : endTime,
          allDay: isAllDay,
          eventId: editingEvent?.id ?? null,
        });

        if (mounted) {
          setConflictResult(
            result.valid
              ? { hasConflict: false }
              : {
                  hasConflict: true,
                  conflictType: result.conflict_type,
                  message: result.message,
                }
          );
        }
      } catch (error: any) {
        if (mounted) {
          setConflictResult({
            hasConflict: true,
            conflictType: "time_overlap",
            message: error.message || "Could not validate event.",
          });
        }
      }
    };

    runValidation();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate, startTime, endTime, isAllDay, eventType, editingEvent, open, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = title.trim() || (isBlockedDate ? "Blocked date" : "");

    if (!normalizedTitle) {
      toast({
        title: "Title required",
        description: "Please enter an event title.",
        variant: "destructive",
      });
      return;
    }

    if (conflictResult.hasConflict) {
      toast({
        title: "Cannot schedule event",
        description: conflictResult.message,
        variant: "destructive",
      });
      return;
    }

    const newEvent = await saveProviderEvent(providerId, {
      id: editingEvent?.id,
      type: eventType,
      title: normalizedTitle,
      startDate,
      endDate: isLegacyMultiDayEvent ? endDate : undefined,
      startTime: !isAllDay ? startTime : undefined,
      endTime: !isAllDay ? endTime : undefined,
      isAllDay,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      status: ["vacation", "holiday", "leave", "blocked_date"].includes(eventType) ? "blocked" : "confirmed",
    });

    toast({
      title: editingEvent ? "Event Updated" : "Event Created",
      description: `"${newEvent.title}" has been saved to your schedule.`,
    });

    if (onEventSaved) onEventSaved(newEvent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2">
            {editingEvent ? "Edit Schedule Event" : "Create New Schedule Event"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add external bookings or blocked dates to your schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="my-2">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Event category</Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <span>{option.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label className="text-xs font-semibold">Event title {isBlockedDate ? "" : "*"}</Label>
                  <Input
                    placeholder={
                      eventType === "external_booking"
                        ? "e.g. Priyesh & Sneha reception shoot"
                        : isBlockedDate
                        ? "e.g. Studio closed for maintenance"
                        : "e.g. Studio maintenance"
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required={!isBlockedDate}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-semibold cursor-pointer">
                      {isBlockedDate ? "Blocked dates are always all-day" : "All-day event"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {isBlockedDate
                        ? "Manual blocked dates reserve the whole day and prevent provider availability."
                        : "Blocks the entire date without specific hours"}
                    </p>
                  </div>
                  {isBlockedDate ? (
                    <div className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      Always on
                    </div>
                  ) : (
                    <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Start date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) setEndDate(e.target.value);
                      }}
                    />
                  </div>

                  {isLegacyMultiDayEvent ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">End date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </div>
                  ) : null}

                  {!isAllDay && !isBlockedDate && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Start time</Label>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">End time</Label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {eventType === "external_booking" && (
                <div className="rounded-2xl border border-border/60 bg-violet-500/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Client details
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Client name</Label>
                      <Input
                        placeholder="Client full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Phone number</Label>
                      <Input
                        placeholder="+91 mobile number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Location / venue</Label>
                  <Input
                    placeholder="e.g. Hotel Novotel, Hyderabad"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Notes & details</Label>
                  <Textarea
                    placeholder="Any special requirements, equipment list, or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {conflictResult.hasConflict && (
                <Alert variant="destructive" className="border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="text-xs font-bold">Schedule conflict detected</AlertTitle>
                  <AlertDescription className="text-xs">
                    {conflictResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 mt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-gold text-primary-foreground font-semibold"
              disabled={conflictResult.hasConflict && conflictResult.conflictType === "blocked_date"}
            >
              {editingEvent ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
