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

interface TimeSlotCapacityManagerProps {
  providerId?: string;
}

export const TimeSlotCapacityManager = ({ providerId }: TimeSlotCapacityManagerProps) => {
  const { toast } = useToast();

  const [slots, setSlots] = useState<TimeSlotConfig[]>([]);
  const [capacity, setCapacity] = useState<ServiceCapacityConfig>({
    serviceType: "Photography & Videography",
    maxDailyBookings: 2,
    defaultSlotCapacity: 1,
    allowOverbooking: false,
  });

  useEffect(() => {
    setSlots(getTimeSlots(providerId));
    setCapacity(getCapacityConfig(providerId));
  }, [providerId]);

  const handleToggleSlot = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const handleCapacityChange = (field: keyof ServiceCapacityConfig, value: any) => {
    setCapacity((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = () => {
    saveTimeSlots(slots, providerId);
    saveCapacityConfig(capacity, providerId);
    toast({
      title: "Capacity & Time Slots Saved",
      description: "Your daily booking limits and time slot configurations have been updated.",
    });
  };

  return (
    <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
          <Sliders className="h-5 w-5 text-amber-600" />
          Service Capacity & Time Slots
        </h3>
        <p className="text-xs text-stone-500">Configure daily booking limits and morning/afternoon/evening time slots</p>
      </div>

      {/* Daily Capacity Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-stone-200/60 shadow-xs">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-stone-700">Service Category</Label>
          <Input
            value={capacity.serviceType}
            onChange={(e) => handleCapacityChange("serviceType", e.target.value)}
            className="h-9 text-xs border-stone-200 rounded-xl"
            placeholder="e.g. Photography, Catering, Decor"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-stone-700">Max Daily Bookings</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={capacity.maxDailyBookings}
            onChange={(e) => handleCapacityChange("maxDailyBookings", parseInt(e.target.value) || 1)}
            className="h-9 text-xs border-stone-200 rounded-xl font-mono"
          />
          <p className="text-[11px] text-stone-400">
            Determines when calendar days switch to "Fully Booked".
          </p>
        </div>
      </div>

      {/* Allow Overbooking Switch */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold text-stone-700">Allow Overbooking</Label>
          <p className="text-[11px] text-stone-400">
            Permit accepting extra bookings even after daily capacity is reached.
          </p>
        </div>
        <Switch
          checked={capacity.allowOverbooking}
          onCheckedChange={(checked) => handleCapacityChange("allowOverbooking", checked)}
        />
      </div>

      {/* Predefined Time Slots */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-stone-700">Predefined Time Slots</h4>
        <div className="space-y-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/60 bg-white hover:border-amber-500/30 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={slot.isEnabled}
                  onCheckedChange={() => handleToggleSlot(slot.id)}
                />
                <div>
                  <h5 className="font-semibold text-stone-800 flex items-center gap-2">
                    {slot.name}
                    <span className="text-[11px] text-stone-500 font-mono font-normal">
                      ({slot.startTime} - {slot.endTime})
                    </span>
                  </h5>
                  <p className="text-[11px] text-stone-400">
                    Max Capacity: {slot.maxCapacity} client per slot
                  </p>
                </div>
              </div>

              <Badge className={slot.isEnabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"}>
                {slot.isEnabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          className="bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
          onClick={handleSaveAll}
        >
          <Save className="h-4 w-4" />
          Save Capacity & Slots Settings
        </Button>
      </div>
    </Card>
  );
};
