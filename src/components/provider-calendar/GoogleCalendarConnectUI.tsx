import { useState } from "react";
import { Calendar, Download, Upload, Cloud, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoogleCalendarConnectUIProps {
  providerId?: string;
}

export const GoogleCalendarConnectUI = (_props: GoogleCalendarConnectUIProps) => {
  const [featureOpen, setFeatureOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState("Google Calendar");

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-display text-lg font-semibold">
                  Google Calendar Integration
                </CardTitle>
                <CardDescription className="text-xs">
                  Prepare your calendar for future Google Calendar sync without showing a fake connected state.
                </CardDescription>
              </div>
            </div>

            <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-700">
              Coming soon
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-4 pt-0 md:p-6 md:pt-0">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-sm font-semibold text-primary">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">OAuth-ready placeholder</h4>
                  <p className="text-xs text-muted-foreground">
                    We will connect provider calendars, import external events, and export Subhakary bookings here.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => openComingSoon("Google Calendar connection")}
              >
                Connect Google Calendar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 rounded-2xl border-border/60 px-4 py-3 text-left"
              onClick={() => openComingSoon("Import Google events")}
            >
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Download className="h-4 w-4" />
              </div>
              <span className="flex flex-col items-start">
                <span className="text-sm font-semibold">Import events</span>
                <span className="text-xs text-muted-foreground">Bring Google Calendar events into Subhakary later.</span>
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 rounded-2xl border-border/60 px-4 py-3 text-left"
              onClick={() => openComingSoon("Export Subhakary bookings")}
            >
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <Upload className="h-4 w-4" />
              </div>
              <span className="flex flex-col items-start">
                <span className="text-sm font-semibold">Export bookings</span>
                <span className="text-xs text-muted-foreground">Publish bookings as an .ics feed in the future.</span>
              </span>
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
              This integration is not live yet. We are keeping the UI honest so it does not look connected before the backend is ready.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
