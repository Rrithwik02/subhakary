import { useState, useEffect } from "react";
import { 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  ArrowLeftRight, 
  ShieldCheck, 
  ExternalLink,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  GoogleCalendarState, 
  getGoogleCalendarState, 
  saveGoogleCalendarState 
} from "@/lib/providerScheduleStore";

interface GoogleCalendarConnectUIProps {
  providerId?: string;
}

export const GoogleCalendarConnectUI = ({ providerId = "default" }: GoogleCalendarConnectUIProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<GoogleCalendarState>({
    isConnected: false,
    autoSync: true,
    syncOption: "all",
    importExternal: true,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setState(getGoogleCalendarState(providerId));
  }, [providerId]);

  const handleToggleConnect = () => {
    if (state.isConnected) {
      // Disconnect
      const newState: GoogleCalendarState = {
        ...state,
        isConnected: false,
        accountEmail: undefined,
        lastSyncedAt: undefined,
      };
      setState(newState);
      saveGoogleCalendarState(newState, providerId);
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar account has been unlinked.",
      });
    } else {
      // Connect flow (UI state only)
      setIsConnecting(true);
      setTimeout(() => {
        const newState: GoogleCalendarState = {
          ...state,
          isConnected: true,
          accountEmail: "provider.studio@gmail.com",
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today",
        };
        setState(newState);
        saveGoogleCalendarState(newState, providerId);
        setIsConnecting(false);
        toast({
          title: "Google Calendar Connected!",
          description: "Linked to provider.studio@gmail.com. Two-way sync interface ready.",
        });
      }, 1200);
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const newState = {
        ...state,
        lastSyncedAt: "Just now (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")",
      };
      setState(newState);
      saveGoogleCalendarState(newState, providerId);
      setIsSyncing(false);
      toast({
        title: "Schedule Synchronized",
        description: "Subhakary calendar and Google Calendar events are in sync.",
      });
    }, 1000);
  };

  const handleChange = (field: keyof GoogleCalendarState, value: any) => {
    const newState = { ...state, [field]: value };
    setState(newState);
    saveGoogleCalendarState(newState, providerId);
  };

  return (
    <Card className="border-border/50 shadow-sm bg-card">
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display text-lg font-bold flex items-center gap-2">
                Google Calendar Integration
              </CardTitle>
              <CardDescription className="text-xs">
                Sync Subhakary bookings and personal events with your Google Calendar
              </CardDescription>
            </div>
          </div>

          <Badge className={state.isConnected ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-muted text-muted-foreground"}>
            {state.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Connection Header Banner */}
        <div className="p-4 rounded-xl border border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-lg font-bold text-blue-600 shadow-sm">
              G
            </div>
            <div>
              <h4 className="text-sm font-semibold">
                {state.isConnected ? state.accountEmail : "Link Google Account"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {state.isConnected
                  ? `Last synced: ${state.lastSyncedAt || "Recently"}`
                  : "Connect to export bookings and import external Google events automatically."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.isConnected && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={handleManualSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
            )}

            <Button
              variant={state.isConnected ? "destructive" : "default"}
              size="sm"
              className={!state.isConnected ? "gradient-gold text-primary-foreground font-semibold" : ""}
              onClick={handleToggleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : state.isConnected ? "Disconnect" : "Connect Google Calendar"}
            </Button>
          </div>
        </div>

        {/* Sync Controls & Preferences */}
        {state.isConnected && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sync Preferences & Manual Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sync Scope</Label>
                <Select
                  value={state.syncOption}
                  onValueChange={(v) => handleChange("syncOption", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sync All Events & Bookings</SelectItem>
                    <SelectItem value="bookings_only">Sync Subhakary Bookings Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Auto Background Sync</Label>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card">
                  <span className="text-xs text-muted-foreground">Sync changes automatically</span>
                  <Switch
                    checked={state.autoSync}
                    onCheckedChange={(checked) => handleChange("autoSync", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Manual Import / Export Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 text-xs"
                onClick={() => {
                  toast({
                    title: "Import Initialized",
                    description: "Importing external events from Google Calendar...",
                  });
                }}
              >
                <Download className="h-4 w-4 text-blue-500" />
                Import Google Events to Subhakary
              </Button>

              <Button
                variant="outline"
                className="w-full justify-center gap-2 text-xs"
                onClick={() => {
                  toast({
                    title: "Export Initialized",
                    description: "Exporting Subhakary bookings to Google Calendar (.ics format)...",
                  });
                }}
              >
                <Upload className="h-4 w-4 text-emerald-500" />
                Export Subhakary Bookings (.ics)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
