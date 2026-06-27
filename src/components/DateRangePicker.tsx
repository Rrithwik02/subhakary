import { useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  singleDate: Date | undefined;
  onSingleDateChange: (date: Date | undefined) => void;
  isMultiDay: boolean;
  onMultiDayToggle: (isMulti: boolean) => void;
  disabledDates?: Date[];
  className?: string;
}

export const DateRangePicker = ({
  dateRange,
  onDateRangeChange,
  singleDate,
  onSingleDateChange,
  isMultiDay,
  onMultiDayToggle,
  disabledDates = [],
  className,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);

  const isDateDisabled = (date: Date) => {
    if (date < new Date()) return true;
    return disabledDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  const totalDays = isMultiDay && dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 1;

  const displayValue = () => {
    if (isMultiDay) {
      if (dateRange?.from && dateRange?.to) {
        return `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")} (${totalDays} days)`;
      }
      if (dateRange?.from) {
        return `${format(dateRange.from, "dd MMM yyyy")} - Select end date`;
      }
      return "Select date range";
    } else {
      return singleDate ? format(singleDate, "PPP") : "Select a date";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Multi-day toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="multi-day" className="text-sm font-medium cursor-pointer">
          Multi-day event (e.g., Wedding)
        </Label>
        <Switch
          id="multi-day"
          checked={isMultiDay}
          onCheckedChange={(checked) => {
            onMultiDayToggle(checked);
            if (!checked) {
              onDateRangeChange(undefined);
              if (dateRange?.from) {
                onSingleDateChange(dateRange.from);
              }
            } else {
              if (singleDate) {
                onDateRangeChange({ from: singleDate, to: undefined });
              }
              onSingleDateChange(undefined);
            }
          }}
        />
      </div>

      {/* Date picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-11",
              !(isMultiDay ? dateRange?.from : singleDate) && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {isMultiDay ? (
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range);
                if (range?.from && range?.to) {
                  setOpen(false);
                }
              }}
              disabled={isDateDisabled}
              numberOfMonths={1}
              className="pointer-events-auto"
              modifiers={{
                blocked: disabledDates,
              }}
              modifiersStyles={{
                blocked: { textDecoration: "line-through", color: "hsl(var(--destructive))" },
              }}
            />
          ) : (
            <Calendar
              mode="single"
              selected={singleDate}
              onSelect={(date) => {
                onSingleDateChange(date);
                setOpen(false);
              }}
              disabled={isDateDisabled}
              className="pointer-events-auto"
              modifiers={{
                blocked: disabledDates,
              }}
              modifiersStyles={{
                blocked: { textDecoration: "line-through", color: "hsl(var(--destructive))" },
              }}
            />
          )}
        </PopoverContent>
      </Popover>

      {/* Total days info */}
      {isMultiDay && dateRange?.from && dateRange?.to && (
        <p className="text-sm text-muted-foreground">
          Total duration: <span className="font-medium text-foreground">{totalDays} days</span>
        </p>
      )}
    </div>
  );
};
