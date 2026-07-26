import { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Calendar, 
  Save, 
  CheckCircle2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  NotificationSettings, 
  getNotificationSettings, 
  saveNotificationSettings 
} from "@/lib/providerScheduleStore";

interface ScheduleNotificationSettingsProps {
  providerId?: string;
}

export const ScheduleNotificationSettings = ({ providerId }: ScheduleNotificationSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailReminders: true,
    emailTiming: "24h",
    pushNotifications: true,
    bookingUpdates: true,
    scheduleSummaries: "daily",
    summaryTime: "08:00",
  });

  useEffect(() => {
    setSettings(getNotificationSettings(providerId));
  }, [providerId]);

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveNotificationSettings(settings, providerId);
    toast({
      title: "Notification Preferences Saved",
      description: "Your schedule reminder and alert preferences have been updated.",
    });
  };

  return (
    <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600" />
          Schedule Notification Settings
        </h3>
        <p className="text-xs text-stone-500">Configure email reminders, push notifications, and daily summaries</p>
      </div>

      <div className="space-y-4">
        {/* Email Reminders */}
        <div className="p-3.5 rounded-xl bg-white border border-stone-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-amber-600" />
              <div>
                <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Email Reminders</Label>
                <p className="text-[11px] text-stone-400">Receive upcoming booking reminders via email</p>
              </div>
            </div>
            <Switch
              checked={settings.emailReminders}
              onCheckedChange={(checked) => handleChange("emailReminders", checked)}
            />
          </div>

          {settings.emailReminders && (
            <div className="pl-7 space-y-1">
              <Label className="text-[11px] font-semibold text-stone-600">Reminder Timing</Label>
              <Select
                value={settings.emailTiming}
                onValueChange={(v) => handleChange("emailTiming", v)}
              >
                <SelectTrigger className="w-full sm:w-[220px] h-8 text-xs border-stone-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour Before Event</SelectItem>
                  <SelectItem value="24h">24 Hours Before Event</SelectItem>
                  <SelectItem value="48h">48 Hours Before Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Mobile Push */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-purple-600" />
            <div>
              <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Push Notifications</Label>
              <p className="text-[11px] text-stone-400">Real-time mobile push notifications for schedule updates</p>
            </div>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => handleChange("pushNotifications", checked)}
          />
        </div>

        {/* Instant Booking Updates */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <div>
              <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Instant Booking Updates</Label>
              <p className="text-[11px] text-stone-400">Get notified immediately when bookings are created or modified</p>
            </div>
          </div>
          <Switch
            checked={settings.bookingUpdates}
            onCheckedChange={(checked) => handleChange("bookingUpdates", checked)}
          />
        </div>

        {/* Digest */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-white border border-stone-200/60">
          <Label className="text-xs font-semibold text-stone-800">Schedule Digest</Label>
          <Select
            value={settings.scheduleSummaries}
            onValueChange={(v) => handleChange("scheduleSummaries", v)}
          >
            <SelectTrigger className="w-full h-8 text-xs border-stone-200 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Morning Schedule Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest (Every Monday)</SelectItem>
              <SelectItem value="off">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          className="bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Save Notification Preferences
        </Button>
      </div>
    </Card>
  );
};
