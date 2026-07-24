import { useState, useEffect } from "react";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Info 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TimeSlotConfig, 
  ServiceCapacityConfig, 
  getTimeSlots, 
  saveTimeSlots, 
  getCapacityConfig, 
  saveCapacityConfig 
} from "@/lib/providerScheduleStore";

export const TimeSlotCapacityManager = () => {
  const { toast } = useToast();

  const [slots, setSlots] = useState<TimeSlotConfig[]>([]);
  const [capacity, setCapacity] = useState<ServiceCapacityConfig>({
    serviceType: "Photography & Videography",
    maxDailyBookings: 2,
    defaultSlotCapacity: 1,
    allowOverbooking: false,
  });

  useEffect(() => {
    setSlots(getTimeSlots());
    setCapacity(getCapacityConfig());
  }, []);

  const handleToggleSlot = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const handleCapacityChange = (field: keyof ServiceCapacityConfig, value: any) => {
    setCapacity((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = () => {
    saveTimeSlots(slots);
    saveCapacityConfig(capacity);
    toast({
      title: "Schedule Settings Saved",
      description: "Your time slots and service capacity configuration have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Capacity Visualization & Rules */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="p-4 md:p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display text-lg font-bold">
                Capacity Visualization & Limits
              </CardTitle>
              <CardDescription className="text-xs">
                Configure maximum bookings per day based on your service type
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Service Category</Label>
              <Input
                value={capacity.serviceType}
                onChange={(e) => handleCapacityChange("serviceType", e.target.value)}
                placeholder="e.g. Photography, Catering, Decor"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Max Daily Bookings (Slots)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={capacity.maxDailyBookings}
                onChange={(e) => handleCapacityChange("maxDailyBookings", parseInt(e.target.value) || 1)}
              />
              <p className="text-[11px] text-muted-foreground">
                Determines when calendar days switch to "Fully Booked".
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">Allow Overbooking</Label>
              <p className="text-[11px] text-muted-foreground">
                If enabled, you can accept additional bookings even after max daily limit is reached.
              </p>
            </div>
            <Switch
              checked={capacity.allowOverbooking}
              onCheckedChange={(checked) => handleCapacityChange("allowOverbooking", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Management */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="p-4 md:p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg font-bold">
                  Time Slot Management
                </CardTitle>
                <CardDescription className="text-xs">
                  Define morning, afternoon, evening, or custom time slots for bookings
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card hover:bg-accent/20 transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={slot.isEnabled}
                    onCheckedChange={() => handleToggleSlot(slot.id)}
                  />
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {slot.name}
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {slot.startTime} - {slot.endTime}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Max Capacity: {slot.maxCapacity} client(s) per slot
                    </p>
                  </div>
                </div>

                <Badge className={slot.isEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
                  {slot.isEnabled ? "Active Slot" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              className="gradient-gold text-primary-foreground font-semibold flex items-center gap-2"
              onClick={handleSaveAll}
            >
              <Save className="h-4 w-4" />
              Save Capacity & Slot Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
