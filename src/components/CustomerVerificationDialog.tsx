import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, IndianRupee, Calendar, FileText, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface CompletionDetails {
  id: string;
  service_description: string;
  amount_charged: number;
  completion_days: number;
  additional_notes: string | null;
}

interface CustomerVerificationDialogProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}

export const CustomerVerificationDialog = ({
  bookingId,
  providerId,
  providerName,
  open,
  onOpenChange,
  onVerified,
}: CustomerVerificationDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionDetails, setCompletionDetails] = useState<CompletionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [verification, setVerification] = useState({
    serviceDescriptionVerified: true,
    serviceDescriptionDispute: "",
    amountVerified: true,
    amountDispute: "",
    completionDaysVerified: true,
    completionDaysDispute: "",
    additionalNotesVerified: true,
    additionalNotesDispute: "",
  });

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const fetchCompletionDetails = async () => {
      if (!open) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("booking_completion_details")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching completion details:", error);
        toast({
          title: "Error",
          description: "Could not load service details.",
          variant: "destructive",
        });
      } else {
        setCompletionDetails(data);
      }
      setLoading(false);
    };

    fetchCompletionDetails();
  }, [bookingId, open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating for the service.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const hasDisputes = 
        !verification.serviceDescriptionVerified ||
        !verification.amountVerified ||
        !verification.completionDaysVerified ||
        !verification.additionalNotesVerified;

      // Update completion details with verification
      const { error: updateError } = await supabase
        .from("booking_completion_details")
        .update({
          customer_verified_at: new Date().toISOString(),
          service_description_verified: verification.serviceDescriptionVerified,
          service_description_dispute: verification.serviceDescriptionVerified ? null : verification.serviceDescriptionDispute,
          amount_verified: verification.amountVerified,
          amount_dispute: verification.amountVerified ? null : verification.amountDispute,
          completion_days_verified: verification.completionDaysVerified,
          completion_days_dispute: verification.completionDaysVerified ? null : verification.completionDaysDispute,
          additional_notes_verified: verification.additionalNotesVerified,
          additional_notes_dispute: verification.additionalNotesVerified ? null : verification.additionalNotesDispute,
        })
        .eq("booking_id", bookingId);

      if (updateError) throw updateError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          completion_confirmed_by_customer: true,
        })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      // Get user's profile ID for review
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userProfile) throw new Error("Profile not found");

      // Create review
      const { error: reviewError } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          provider_id: providerId,
          user_id: userProfile.id,
          rating: rating,
          review_text: reviewText || null,
        });

      if (reviewError) throw reviewError;

      // Get provider's profile_id for notification
      const { data: provider } = await supabase
        .from("service_providers")
        .select("profile_id")
        .eq("id", providerId)
        .single();

      if (provider?.profile_id) {
        if (hasDisputes) {
          const disputes: string[] = [];
          if (!verification.serviceDescriptionVerified) {
            disputes.push(`Service Description: ${verification.serviceDescriptionDispute}`);
          }
          if (!verification.amountVerified) {
            disputes.push(`Amount Charged: ${verification.amountDispute}`);
          }
          if (!verification.completionDaysVerified) {
            disputes.push(`Completion Days: ${verification.completionDaysDispute}`);
          }
          if (!verification.additionalNotesVerified) {
            disputes.push(`Additional Notes: ${verification.additionalNotesDispute}`);
          }

          await supabase
            .from("notifications")
            .insert({
              user_id: provider.profile_id,
              title: "Customer Disputed Service Details",
              message: `A customer has disputed some service details:\n${disputes.join("\n")}`,
              type: "dispute",
            });
        } else {
          // Send verification success notification to provider
          await supabase
            .from("notifications")
            .insert({
              user_id: provider.profile_id,
              title: "Service Verified by Customer",
              message: `Great news! The customer has verified and confirmed your service completion details. They left a ${rating}-star review.`,
              type: "completion",
            });
        }
      }

      toast({
        title: "Verification Submitted",
        description: "Thank you for verifying the service and leaving a review!",
      });

      onVerified();
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!completionDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Service Details Not Found</DialogTitle>
            <DialogDescription>
              The provider has not submitted the service details yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Verify Service Completion
          </DialogTitle>
          <DialogDescription>
            Please verify the service details provided by {providerName}. 
            Toggle "No" if any information is incorrect and provide the correct details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Description */}
          <VerificationField
            icon={<FileText className="h-4 w-4" />}
            label="Service Provided"
            value={completionDetails.service_description}
            verified={verification.serviceDescriptionVerified}
            onVerifiedChange={(checked) => 
              setVerification({ ...verification, serviceDescriptionVerified: checked })
            }
            disputeValue={verification.serviceDescriptionDispute}
            onDisputeChange={(value) => 
              setVerification({ ...verification, serviceDescriptionDispute: value })
            }
          />

          {/* Amount Charged */}
          <VerificationField
            icon={<IndianRupee className="h-4 w-4" />}
            label="Amount Charged"
            value={`₹${completionDetails.amount_charged.toLocaleString()}`}
            verified={verification.amountVerified}
            onVerifiedChange={(checked) => 
              setVerification({ ...verification, amountVerified: checked })
            }
            disputeValue={verification.amountDispute}
            onDisputeChange={(value) => 
              setVerification({ ...verification, amountDispute: value })
            }
          />

          {/* Completion Days */}
          <VerificationField
            icon={<Calendar className="h-4 w-4" />}
            label="Days to Complete"
            value={`${completionDetails.completion_days} day${completionDetails.completion_days > 1 ? 's' : ''}`}
            verified={verification.completionDaysVerified}
            onVerifiedChange={(checked) => 
              setVerification({ ...verification, completionDaysVerified: checked })
            }
            disputeValue={verification.completionDaysDispute}
            onDisputeChange={(value) => 
              setVerification({ ...verification, completionDaysDispute: value })
            }
          />

          {/* Additional Notes */}
          {completionDetails.additional_notes && (
            <VerificationField
              icon={<FileText className="h-4 w-4" />}
              label="Additional Notes"
              value={completionDetails.additional_notes}
              verified={verification.additionalNotesVerified}
              onVerifiedChange={(checked) => 
                setVerification({ ...verification, additionalNotesVerified: checked })
              }
              disputeValue={verification.additionalNotesDispute}
              onDisputeChange={(value) => 
                setVerification({ ...verification, additionalNotesDispute: value })
              }
            />
          )}

          {/* Rating Section */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              Rate Your Experience *
            </Label>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Label htmlFor="reviewText" className="mb-2 block">
              Write a Review (Optional)
            </Label>
            <Textarea
              id="reviewText"
              placeholder="Share your experience with this service provider..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          {/* Warning for disputes */}
          {(!verification.serviceDescriptionVerified || 
            !verification.amountVerified || 
            !verification.completionDaysVerified ||
            !verification.additionalNotesVerified) && (
            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Your disputes will be sent to the service provider for their review.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="gradient-gold text-primary-foreground w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Verification & Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface VerificationFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified: boolean;
  onVerifiedChange: (checked: boolean) => void;
  disputeValue: string;
  onDisputeChange: (value: string) => void;
}

const VerificationField = ({
  icon,
  label,
  value,
  verified,
  onVerifiedChange,
  disputeValue,
  onDisputeChange,
}: VerificationFieldProps) => {
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="flex items-center gap-2 text-sm font-medium mb-1">
            {icon}
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${verified ? 'text-green-600' : 'text-red-600'}`}>
            {verified ? 'Correct' : 'Incorrect'}
          </span>
          <Switch
            checked={verified}
            onCheckedChange={onVerifiedChange}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
          />
        </div>
      </div>
      
      {!verified && (
        <div className="space-y-1">
          <Label htmlFor={`dispute-${label}`} className="text-xs text-muted-foreground">
            What is the correct information?
          </Label>
          <Input
            id={`dispute-${label}`}
            placeholder="Enter the correct details..."
            value={disputeValue}
            onChange={(e) => onDisputeChange(e.target.value)}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
};
