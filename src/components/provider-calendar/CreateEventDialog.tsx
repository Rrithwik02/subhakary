import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Sparkles,
  Briefcase,
  User,
  Palmtree,
  CalendarOff,
  Coffee,
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
  EVENT_TYPE_META, 
  saveProviderEvent, 
  getProviderEvents, 
  checkScheduleConflict, 
  ConflictCheckResult 
} from "@/lib/providerScheduleStore";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  editingEvent?: ScheduleEvent | null;
  providerId?: string;
  onEventSaved?: (event: ScheduleEvent) => void;
}

export const CreateEventDialog = ({
  open,
  onOpenChange,
  initialDate,
  editingEvent,
  providerId = "default",
  onEventSaved,
}: CreateEventDialogProps) => {
  const { toast } = useToast();

  const [eventType, setEventType] = useState<EventType>("external_booking");
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
  }, [editingEvent, initialDate, open]);

  // Live Conflict Detection whenever dates/times change
  useEffect(() => {
    if (!open) return;

    const allEvents = getProviderEvents(providerId);
    const result = checkScheduleConflict(
      {
        startDate,
        endDate: isAllDay ? endDate : startDate,
        startTime,
        endTime,
        isAllDay,
        ignoreEventId: editingEvent?.id,
      },
      allEvents
    );

    setConflictResult(result);
  }, [startDate, endDate, startTime, endTime, isAllDay, eventType, editingEvent, open, providerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
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

    const newEvent = saveProviderEvent({
      id: editingEvent?.id,
      providerId,
      type: eventType,
      title: title.trim(),
      startDate,
      endDate: ["vacation", "holiday", "leave"].includes(eventType) ? endDate : undefined,
      startTime: !isAllDay ? startTime : undefined,
      endTime: !isAllDay ? endTime : undefined,
      isAllDay,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      status: ["vacation", "holiday", "leave", "blocked_date"].includes(eventType) ? "blocked" : "confirmed",
    }, providerId);

    toast({
      title: editingEvent ? "Event Updated" : "Event Created",
      description: `"${newEvent.title}" has been saved to your schedule.`,
    });

    if (onEventSaved) onEventSaved(newEvent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
            {editingEvent ? "Edit Schedule Event" : "Create New Schedule Event"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add external bookings, personal events, vacations, holidays, or block dates on your calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Event Type Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Event Category</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="external_booking">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <span>External Booking</span>
                  </span>
                </SelectItem>
                <SelectItem value="personal_event">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span>Personal Event</span>
                  </span>
                </SelectItem>
                <SelectItem value="vacation">
                  <span className="flex items-center gap-2">
                    <Palmtree className="h-4 w-4 text-cyan-500" />
                    <span>Vacation</span>
                  </span>
                </SelectItem>
                <SelectItem value="holiday">
                  <span className="flex items-center gap-2">
                    <CalendarOff className="h-4 w-4 text-rose-500" />
                    <span>Holiday</span>
                  </span>
                </SelectItem>
                <SelectItem value="leave">
                  <span className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-orange-500" />
                    <span>Leave</span>
                  </span>
                </SelectItem>
                <SelectItem value="blocked_date">
                  <span className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-slate-500" />
                    <span>Manual Blocked Date</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Event Title *</Label>
            <Input
              placeholder={
                eventType === "external_booking"
                  ? "e.g. Priyesh & Sneha Reception shoot"
                  : eventType === "vacation"
                  ? "e.g. Annual Family Vacation"
                  : "e.g. Studio Maintenance"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
            <div>
              <Label className="text-xs font-semibold cursor-pointer">All-Day Event</Label>
              <p className="text-[11px] text-muted-foreground">Blocks the entire date without specific hours</p>
            </div>
            <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </div>

            {["vacation", "holiday", "leave"].includes(eventType) ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            ) : null}

            {!isAllDay && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Client Info (for external bookings) */}
          {eventType === "external_booking" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Client Name</Label>
                <Input
                  placeholder="Client Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  placeholder="+91 Mobile Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Location / Venue</Label>
            <Input
              placeholder="e.g. Hotel Novotel, Hyderabad"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notes & Details</Label>
            <Textarea
              placeholder="Any special requirements, equipment list, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Live Conflict Warning Alert */}
          {conflictResult.hasConflict && (
            <Alert variant="destructive" className="border-rose-500/50 bg-rose-500/10 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertTitle className="text-xs font-bold">Schedule Conflict Detected!</AlertTitle>
              <AlertDescription className="text-xs">
                {conflictResult.message}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gradient-gold text-primary-foreground font-semibold"
              disabled={conflictResult.hasConflict && conflictResult.conflictType === "blocked_date"}
            >
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
