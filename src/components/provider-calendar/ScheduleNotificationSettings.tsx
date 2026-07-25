import { useState } from "react";
import { Bell, Mail, Smartphone, Calendar, Save, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScheduleNotificationSettingsProps {
  providerId?: string;
}

export const ScheduleNotificationSettings = (_props: ScheduleNotificationSettingsProps) => {
  const [featureOpen, setFeatureOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState("Notification settings");
  const [emailTiming, setEmailTiming] = useState("24h");
  const [digestTiming, setDigestTiming] = useState("daily");

  const openComingSoon = (label: string) => {
    setFeatureLabel(label);
    setFeatureOpen(true);
  };

  return (
    <>
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader className="p-4 pb-3 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg font-semibold">
                  Schedule Notification Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Notification preferences are visible here, but they are not wired to a live backend yet.
                </CardDescription>
              </div>
            </div>

            <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-700">
              Coming soon
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500" />
                <div>
                  <Label className="text-sm font-semibold cursor-pointer">Email reminders</Label>
                  <p className="text-xs text-muted-foreground">Will send one-day-before and event-day reminders.</p>
                </div>
              </div>
              <Switch checked={false} onCheckedChange={() => openComingSoon("Email reminders")} />
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs font-semibold">Reminder timing</Label>
              <Select value={emailTiming} onValueChange={(value) => { setEmailTiming(value); openComingSoon("Reminder timing"); }}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 hours before</SelectItem>
                  <SelectItem value="1d">1 day before</SelectItem>
                  <SelectItem value="event_day">Event day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="text-sm font-semibold cursor-pointer">Push notifications</Label>
                  <p className="text-xs text-muted-foreground">Mobile alerts for booking updates and schedule changes.</p>
                </div>
              </div>
              <Switch checked={false} onCheckedChange={() => openComingSoon("Push notifications")} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <div>
                  <Label className="text-sm font-semibold cursor-pointer">Booking updates</Label>
                  <p className="text-xs text-muted-foreground">Real-time updates for accepted, cancelled, or rescheduled bookings.</p>
                </div>
              </div>
              <Switch checked={false} onCheckedChange={() => openComingSoon("Booking updates")} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Schedule summary digest</Label>
              <Select value={digestTiming} onValueChange={(value) => { setDigestTiming(value); openComingSoon("Schedule summary digest"); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-2"
              onClick={() => openComingSoon("Notification preferences")}
            >
              <Save className="h-4 w-4" />
              Save notification preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={featureOpen} onOpenChange={setFeatureOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              {featureLabel}
            </DialogTitle>
            <DialogDescription className="text-sm">
              This control is not wired to a live notification service yet. We are showing the UI only so the backend integration can be added cleanly later.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
