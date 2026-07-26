import { useState, useEffect } from "react";
import { 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  ExternalLink 
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

export const GoogleCalendarConnectUI = ({ providerId }: GoogleCalendarConnectUIProps) => {
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
      setIsConnecting(true);
      setTimeout(() => {
        const newState: GoogleCalendarState = {
          ...state,
          isConnected: true,
          accountEmail: "provider.studio@gmail.com",
          lastSyncedAt: "Just now (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")",
        };
        setState(newState);
        saveGoogleCalendarState(newState, providerId);
        setIsConnecting(false);
        toast({
          title: "Google Calendar Connected!",
          description: "Linked to provider.studio@gmail.com. Two-way sync UI ready.",
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
    <Card className="border border-stone-200/60 shadow-xs bg-stone-50/40 rounded-2xl p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-normal text-stone-800 flex items-center gap-2">
            <Cloud className="h-5 w-5 text-amber-600" />
            Google Calendar Integration
          </h3>
          <p className="text-xs text-stone-500">Sync Subhakary bookings and personal events with your Google Calendar</p>
        </div>

        <Badge className={state.isConnected ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"}>
          {state.isConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      {/* Connection Account Box */}
      <div className="p-4 rounded-xl border border-stone-200/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-base font-bold text-stone-700 shadow-xs">
            G
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-800">
              {state.isConnected ? state.accountEmail : "Link Google Account"}
            </h4>
            <p className="text-[11px] text-stone-400">
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
              className="h-8 text-xs border-stone-200 rounded-xl"
              onClick={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          )}

          <Button
            size="sm"
            className={state.isConnected ? "bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs rounded-xl" : "bg-[#D97706] hover:bg-[#b46205] text-white h-8 text-xs font-medium rounded-xl"}
            onClick={handleToggleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : state.isConnected ? "Disconnect" : "Connect Google Calendar"}
          </Button>
        </div>
      </div>

      {/* Sync Preferences & Import / Export */}
      {state.isConnected && (
        <div className="space-y-4 pt-2 border-t border-stone-200/40">
          <h4 className="text-xs font-semibold text-stone-700">Sync Controls & Preferences</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-stone-600">Sync Scope</Label>
              <Select
                value={state.syncOption}
                onValueChange={(v) => handleChange("syncOption", v)}
              >
                <SelectTrigger className="w-full h-8 text-xs border-stone-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sync All Events & Bookings</SelectItem>
                  <SelectItem value="bookings_only">Sync Subhakary Bookings Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-stone-600">Auto Background Sync</Label>
              <div className="flex items-center justify-between p-2 rounded-xl border border-stone-200/60 bg-white">
                <span className="text-xs text-stone-600">Sync changes automatically</span>
                <Switch
                  checked={state.autoSync}
                  onCheckedChange={(checked) => handleChange("autoSync", checked)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-center gap-1.5 text-xs h-8 border-stone-200 rounded-xl"
              onClick={() => {
                toast({ title: "Import Initialized", description: "Importing external events from Google Calendar..." });
              }}
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              Import Google Events
            </Button>

            <Button
              variant="outline"
              className="w-full justify-center gap-1.5 text-xs h-8 border-stone-200 rounded-xl"
              onClick={() => {
                toast({ title: "Export Initialized", description: "Exporting Subhakary bookings (.ics format)..." });
              }}
            >
              <Upload className="h-3.5 w-3.5 text-emerald-600" />
              Export Subhakary Bookings
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
