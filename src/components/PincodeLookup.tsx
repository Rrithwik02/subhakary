import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  const lookupPincode = async () => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        setPostOffices(data[0].PostOffice);
        // Auto-select first post office
        const firstPO = data[0].PostOffice[0];
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
      toast({
        title: "Error",
        description: "Failed to lookup pincode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);
    if (value.length === 6) {
      // Auto-lookup when 6 digits entered
      setTimeout(() => lookupPincode(), 100);
    }
  };

  const selectPostOffice = (po: PostOffice) => {
    onAddressFound({
      state: po.State,
      city: po.District,
      district: po.District,
      postOffice: po.Name,
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
            className="pl-10"
            maxLength={6}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={lookupPincode}
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
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {postOffices.map((po, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectPostOffice(po)}
                className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {po.Name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enter your pincode to auto-fill state and city
      </p>
    </div>
  );
};
