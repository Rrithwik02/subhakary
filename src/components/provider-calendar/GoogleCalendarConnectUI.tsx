import { useState } from "react";
import { Cloud, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnderDevelopmentDialog } from "./UnderDevelopmentDialog";

interface GoogleCalendarConnectUIProps {
  providerId?: string;
}

export const GoogleCalendarConnectUI = (_props: GoogleCalendarConnectUIProps) => {
  const [underDevelopmentOpen, setUnderDevelopmentOpen] = useState(false);

  return (
    <>
      <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
              <Cloud className="h-5 w-5 text-amber-600" />
              Google Calendar Integration
            </h3>
            <p className="text-xs text-stone-500">
              Google Calendar sync will be available after OAuth is implemented.
            </p>
          </div>

          <Badge className="bg-stone-100 text-stone-500 border-stone-200">Not Connected</Badge>
        </div>

        <div className="rounded-xl border border-stone-200/60 bg-white p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-base font-bold text-stone-700 shadow-xs">
              G
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-stone-800">Not Connected</h4>
              <p className="text-[11px] text-stone-400">
                Connect Google Calendar after OAuth is enabled to sync events and bookings.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-[#D97706] hover:bg-[#b46205] text-white h-9 text-xs font-medium rounded-xl px-4"
            onClick={() => setUnderDevelopmentOpen(true)}
          >
            Connect Google Calendar
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
          Sync controls, import/export actions, and account details will appear after a successful OAuth connection.
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <CheckCircle2 className="h-4 w-4 text-stone-400" />
          Background sync is currently off until the integration ships.
        </div>
      </Card>

      <UnderDevelopmentDialog
        open={underDevelopmentOpen}
        onOpenChange={setUnderDevelopmentOpen}
      />
    </>
  );
};
