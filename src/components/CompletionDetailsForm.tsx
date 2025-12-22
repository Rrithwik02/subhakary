import { useState } from "react";
import { ClipboardCheck, IndianRupee, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface CompletionDetailsFormProps {
  bookingId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export const CompletionDetailsForm = ({
  bookingId,
  customerName,
  open,
  onOpenChange,
  onSubmitted,
}: CompletionDetailsFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serviceDescription: "",
    amountCharged: "",
    completionDays: "",
    additionalNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceDescription || !formData.amountCharged || !formData.completionDays) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert completion details
      const { error: detailsError } = await supabase
        .from("booking_completion_details")
        .insert({
          booking_id: bookingId,
          service_description: formData.serviceDescription,
          amount_charged: parseFloat(formData.amountCharged),
          completion_days: parseInt(formData.completionDays),
          additional_notes: formData.additionalNotes || null,
        });

      if (detailsError) throw detailsError;

      // Update booking status to mark completion requested
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          completion_confirmed_by_provider: true,
          completion_requested_at: new Date().toISOString(),
          auto_complete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      toast({
        title: "Completion Request Sent",
        description: "The customer will be notified to verify the service details.",
      });

      setFormData({
        serviceDescription: "",
        amountCharged: "",
        completionDays: "",
        additionalNotes: "",
      });
      
      onSubmitted();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Service Completion Details
          </DialogTitle>
          <DialogDescription>
            Fill in the details of the service completed for {customerName}. 
            The customer will verify this information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceDescription" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              What service did you provide? *
            </Label>
            <Textarea
              id="serviceDescription"
              placeholder="Describe the service you provided..."
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountCharged" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Amount Charged (₹) *
            </Label>
            <Input
              id="amountCharged"
              type="number"
              placeholder="Enter amount in rupees"
              value={formData.amountCharged}
              onChange={(e) => setFormData({ ...formData, amountCharged: e.target.value })}
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionDays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Number of Days to Complete *
            </Label>
            <Input
              id="completionDays"
              type="number"
              placeholder="How many days did it take?"
              value={formData.completionDays}
              onChange={(e) => setFormData({ ...formData, completionDays: e.target.value })}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-gold text-primary-foreground w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
