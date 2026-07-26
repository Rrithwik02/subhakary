import { CalendarDays, Bell, Clock, Cloud, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderAvailabilityManager } from "@/components/ProviderAvailabilityManager";
import { TimeSlotCapacityManager } from "./TimeSlotCapacityManager";
import { ScheduleNotificationSettings } from "./ScheduleNotificationSettings";
import { GoogleCalendarConnectUI } from "./GoogleCalendarConnectUI";

interface ProviderScheduleSettingsPanelProps {
  providerId: string;
}

export const ProviderScheduleSettingsPanel = ({
  providerId,
}: ProviderScheduleSettingsPanelProps) => {
  return (
    <Card
      id="schedule-settings"
      className="overflow-hidden border-border/60 bg-card/95 shadow-sm"
    >
      <CardHeader className="border-b border-border/40 bg-muted/15 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-lg font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Schedule settings
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-muted-foreground">
              Advanced availability controls stay in one place so the calendar can remain the main workspace.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
              Availability
            </span>
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
              Capacity
            </span>
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
              Time slots
            </span>
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
              Notifications
            </span>
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
              Google Calendar
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="availability" className="w-full">
          <div className="border-b border-border/40 px-3 py-3 sm:px-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="availability"
                className="gap-2 rounded-full border border-border/60 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Availability
              </TabsTrigger>
              <TabsTrigger
                value="capacity"
                className="gap-2 rounded-full border border-border/60 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Capacity & slots
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="gap-2 rounded-full border border-border/60 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
              >
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="google"
                className="gap-2 rounded-full border border-border/60 px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10"
              >
                <Cloud className="h-3.5 w-3.5" />
                Google Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-3 sm:p-4">
            <TabsContent value="availability" className="mt-0">
              <ProviderAvailabilityManager providerId={providerId} />
            </TabsContent>

            <TabsContent value="capacity" className="mt-0">
              <TimeSlotCapacityManager providerId={providerId} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <ScheduleNotificationSettings providerId={providerId} />
            </TabsContent>

            <TabsContent value="google" className="mt-0">
              <GoogleCalendarConnectUI providerId={providerId} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
