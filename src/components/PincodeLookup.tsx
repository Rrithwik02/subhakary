import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PincodeLookupProps {
  onAddressFound: (data: {
    state: string;
    city: string;
    district: string;
    postOffice: string;
  }) => void;
}

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Block: string;
  Country: string;
}

export const PincodeLookup = ({ onAddressFound }: PincodeLookupProps) => {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const { toast } = useToast();

  const lookupPincode = useCallback(async (code: string) => {
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSelectedPO(null);
    
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${code}`
      );
      const data = await response.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        setPostOffices(data[0].PostOffice);
        // Auto-select first post office
        const firstPO = data[0].PostOffice[0];
        setSelectedPO(firstPO.Name);
        onAddressFound({
          state: firstPO.State,
          city: firstPO.District,
          district: firstPO.District,
          postOffice: firstPO.Name,
        });
        toast({
          title: "Location Found",
          description: `${firstPO.District}, ${firstPO.State}`,
        });
      } else {
        setPostOffices([]);
        toast({
          title: "Not Found",
          description: "No location found for this pincode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Pincode lookup error:", error);
      toast({
        title: "Error",
        description: "Failed to lookup pincode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [onAddressFound, toast]);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);
    setPostOffices([]);
    setSelectedPO(null);
  };

  const handleLookup = () => {
    lookupPincode(pincode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pincode.length === 6) {
      e.preventDefault();
      lookupPincode(pincode);
    }
  };

  const selectPostOffice = (po: PostOffice) => {
    setSelectedPO(po.Name);
    onAddressFound({
      state: po.State,
      city: po.District,
      district: po.District,
      postOffice: po.Name,
    });
    toast({
      title: "Location Updated",
      description: `${po.Name}, ${po.District}`,
    });
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="pincode">Pincode Lookup</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="pincode"
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={handlePincodeChange}
            onKeyDown={handleKeyDown}
            className="pl-10"
            maxLength={6}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleLookup}
          disabled={loading || pincode.length !== 6}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {postOffices.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Select your area:
          </p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {postOffices.map((po, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectPostOffice(po)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  selectedPO === po.Name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {selectedPO === po.Name && <CheckCircle2 className="h-3 w-3" />}
                {po.Name}
              </button>
            ))}
          </div>
        </div>
      )}

      {postOffices.length === 1 && selectedPO && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Location set: {selectedPO}, {postOffices[0].District}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enter your pincode and click search to auto-fill state and city
      </p>
    </div>
  );
};
