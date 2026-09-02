import { useState } from "react";
import { Bell, Mail, Smartphone, Calendar, Save, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UnderDevelopmentDialog } from "./UnderDevelopmentDialog";

interface ScheduleNotificationSettingsProps {
  providerId?: string;
}

export const ScheduleNotificationSettings = (_props: ScheduleNotificationSettingsProps) => {
  const [underDevelopmentOpen, setUnderDevelopmentOpen] = useState(false);

  return (
    <>
      <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Schedule Notification Settings
          </h3>
          <p className="text-xs text-stone-500">
            Email reminders, push notifications, booking updates, and schedule digests are planned for a future update.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
            Notifications are currently unavailable. All controls stay off until the feature is released.
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-stone-200/60 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-amber-600" />
                <div>
                  <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Email Reminders</Label>
                  <p className="text-[11px] text-stone-400">Currently off</p>
                </div>
              </div>
              <Switch
                checked={false}
                onCheckedChange={() => setUnderDevelopmentOpen(true)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-purple-600" />
              <div>
                <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Push Notifications</Label>
                <p className="text-[11px] text-stone-400">Currently off</p>
              </div>
            </div>
            <Switch
              checked={false}
              onCheckedChange={() => setUnderDevelopmentOpen(true)}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <div>
                <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Instant Booking Updates</Label>
                <p className="text-[11px] text-stone-400">Currently off</p>
              </div>
            </div>
            <Switch
              checked={false}
              onCheckedChange={() => setUnderDevelopmentOpen(true)}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200/60">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-stone-500" />
              <div>
                <Label className="text-xs font-semibold text-stone-800 cursor-pointer">Schedule Digest</Label>
                <p className="text-[11px] text-stone-400">Disabled until the backend is ready</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-stone-200 text-xs h-8 px-3"
              onClick={() => setUnderDevelopmentOpen(true)}
            >
              Configure
            </Button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            className="bg-[#D97706] hover:bg-[#b46205] text-white text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
            onClick={() => setUnderDevelopmentOpen(true)}
          >
            <Save className="h-4 w-4" />
            Save Notification Preferences
          </Button>
        </div>
      </Card>

      <UnderDevelopmentDialog
        open={underDevelopmentOpen}
        onOpenChange={setUnderDevelopmentOpen}
      />
    </>
  );
};
