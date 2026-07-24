import { ProviderCalendarModule } from "@/components/provider-calendar/ProviderCalendarModule";
import { UpcomingEventsWidget } from "@/components/provider-calendar/UpcomingEventsWidget";
import { TimeSlotCapacityManager } from "@/components/provider-calendar/TimeSlotCapacityManager";
import { ScheduleNotificationSettings } from "@/components/provider-calendar/ScheduleNotificationSettings";
import { GoogleCalendarConnectUI } from "@/components/provider-calendar/GoogleCalendarConnectUI";
import { ProviderAvailabilityManager } from "@/components/ProviderAvailabilityManager";

interface ProviderScheduleModuleProps {
  providerId: string;
  showUpcomingWidget?: boolean;
  onOpenCalendar?: () => void;
}

export const ProviderScheduleModule = ({
  providerId,
  showUpcomingWidget = false,
  onOpenCalendar,
}: ProviderScheduleModuleProps) => {
  return (
    <div className="space-y-6">
      {showUpcomingWidget && (
        <UpcomingEventsWidget
          providerId={providerId}
          onOpenCalendar={onOpenCalendar}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ProviderCalendarModule providerId={providerId} />
        </div>

        <div className="space-y-6">
          <ProviderAvailabilityManager providerId={providerId} />
          <TimeSlotCapacityManager providerId={providerId} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScheduleNotificationSettings providerId={providerId} />
        <GoogleCalendarConnectUI providerId={providerId} />
      </div>
    </div>
  );
};
