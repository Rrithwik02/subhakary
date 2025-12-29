import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { indianStates, getCitiesByState } from "@/data/indianLocations";

interface StateCitySelectProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

export const StateCitySelect = ({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
}: StateCitySelectProps) => {
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const cities = useMemo(() => {
    return selectedState ? getCitiesByState(selectedState) : [];
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    onStateChange(state);
    onCityChange(""); // Reset city when state changes
    setStateOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* State Selection */}
      <div className="space-y-2">
        <Label>State *</Label>
        <Popover open={stateOpen} onOpenChange={setStateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={stateOpen}
              className="w-full justify-between h-10 bg-background"
            >
              {selectedState || "Select state..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50" align="start">
            <Command className="bg-popover">
              <CommandInput placeholder="Search state..." className="h-9" />
              <CommandList>
                <CommandEmpty>No state found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {indianStates.map((state) => (
                    <CommandItem
                      key={state.name}
                      value={state.name}
                      onSelect={() => handleStateChange(state.name)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedState === state.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {state.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label>City *</Label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              className="w-full justify-between h-10 bg-background"
              disabled={!selectedState}
            >
              {selectedCity || (selectedState ? "Select city..." : "Select state first")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50" align="start">
            <Command className="bg-popover">
              <CommandInput placeholder="Search city..." className="h-9" />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {cities.map((city) => (
                    <CommandItem
                      key={city}
                      value={city}
                      onSelect={() => {
                        onCityChange(city);
                        setCityOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCity === city ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedState && cities.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No cities available for this state. Please type your city manually.
          </p>
        )}
      </div>
    </div>
  );
};
