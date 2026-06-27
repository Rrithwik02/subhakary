import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

interface CompletionConfirmDialogProps {
  bookingId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

export const CompletionConfirmDialog = ({
  bookingId,
  providerName,
  open,
  onOpenChange,
  onConfirmed,
}: CompletionConfirmDialogProps) => {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          completion_confirmed_by_customer: true,
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Service confirmed!",
        description: "Thank you for confirming. You can now leave a review.",
      });
      onConfirmed();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const autoCompleteDate = addDays(new Date(), 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Confirm Service Completion
          </DialogTitle>
          <DialogDescription>
            {providerName} has marked this service as completed
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm">
              Please confirm that the service was completed satisfactorily. 
              This helps build trust in our community.
            </p>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                If you don't respond within 7 days (by {format(autoCompleteDate, "PPP")}), 
                the service will be automatically marked as completed.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              If there's an issue with the service, please contact us before confirming.
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Not Yet
          </Button>
          <Button
            className="gradient-gold text-primary-foreground w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Confirming..." : "Yes, Confirm Completion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
