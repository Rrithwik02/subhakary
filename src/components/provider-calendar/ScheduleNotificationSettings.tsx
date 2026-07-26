import { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Calendar, 
  Save, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export const ScheduleNotificationSettings = () => {
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
    setSettings(getNotificationSettings());
  }, []);

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveNotificationSettings(settings);
    toast({
      title: "Notification Preferences Saved",
      description: "Your calendar and schedule alert settings have been updated.",
    });
  };

  return (
    <Card className="border-border/50 shadow-sm bg-card">
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-display text-lg font-bold">
              Schedule Notification Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how and when you receive reminders for upcoming bookings and events
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Email Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-amber-500" />
              <div>
                <Label className="text-sm font-semibold cursor-pointer">Email Reminders</Label>
                <p className="text-xs text-muted-foreground">Receive upcoming booking alerts via email</p>
              </div>
            </div>
            <Switch
              checked={settings.emailReminders}
              onCheckedChange={(checked) => handleChange("emailReminders", checked)}
            />
          </div>

          {settings.emailReminders && (
            <div className="pl-6 space-y-1.5">
              <Label className="text-xs font-semibold">Reminder Timing</Label>
              <Select
                value={settings.emailTiming}
                onValueChange={(v) => handleChange("emailTiming", v)}
              >
                <SelectTrigger className="w-full sm:w-[240px]">
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

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-purple-500" />
            <div>
              <Label className="text-sm font-semibold cursor-pointer">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Real-time mobile push notifications for schedule changes</p>
            </div>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => handleChange("pushNotifications", checked)}
          />
        </div>

        {/* Booking Updates */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <div>
              <Label className="text-sm font-semibold cursor-pointer">Instant Booking Updates</Label>
              <p className="text-xs text-muted-foreground">Get notified immediately when new bookings or cancellations occur</p>
            </div>
          </div>
          <Switch
            checked={settings.bookingUpdates}
            onCheckedChange={(checked) => handleChange("bookingUpdates", checked)}
          />
        </div>

        {/* Daily / Weekly Digest */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Schedule Summary Digest</Label>
          <Select
            value={settings.scheduleSummaries}
            onValueChange={(v) => handleChange("scheduleSummaries", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Morning Schedule Digest</SelectItem>
              <SelectItem value="weekly">Weekly Schedule Digest (Every Monday)</SelectItem>
              <SelectItem value="off">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            className="gradient-gold text-primary-foreground font-semibold flex items-center gap-2"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Save Notification Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
