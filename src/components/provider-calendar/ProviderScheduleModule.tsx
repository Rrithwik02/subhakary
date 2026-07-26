import { ProviderCalendarWorkspace } from "@/components/provider-calendar/ProviderCalendarWorkspace";
import { UpcomingEventsWidget } from "@/components/provider-calendar/UpcomingEventsWidget";
import { ProviderScheduleSettingsPanel } from "@/components/provider-calendar/ProviderScheduleSettingsPanel";

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Schedule workspace
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Calendar, bookings, and availability in one place
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Keep the calendar front and center while advanced controls stay grouped below it for faster scanning.
          </p>
        </div>
      </div>

      {showUpcomingWidget && (
        <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-1.5 shadow-sm">
          <UpcomingEventsWidget
            providerId={providerId}
            onOpenCalendar={onOpenCalendar}
          />
        </div>
      )}

      <ProviderCalendarWorkspace providerId={providerId} />

      <ProviderScheduleSettingsPanel providerId={providerId} />
    </div>
  );
};
