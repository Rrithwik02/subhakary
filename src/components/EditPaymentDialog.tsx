import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditPaymentDialogProps {
  payment: {
    id: string;
    amount: number;
    payment_description: string | null;
    booking_id: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditPaymentDialog = ({
  payment,
  open,
  onOpenChange,
  onSuccess,
}: EditPaymentDialogProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [amount, setAmount] = useState(payment?.amount?.toString() || "");
  const [description, setDescription] = useState(payment?.payment_description || "");

  // Update state when payment changes
  useState(() => {
    if (payment) {
      setAmount(payment.amount?.toString() || "");
      setDescription(payment.payment_description || "");
    }
  });

  const handleUpdate = async () => {
    if (!payment) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          amount: parsedAmount,
          provider_requested_amount: parsedAmount,
          payment_description: description || "Advance payment requested by provider",
        })
        .eq("id", payment.id);

      if (error) throw error;

      toast({
        title: "Payment updated",
        description: "The payment request has been updated.",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!payment) return;

    setIsProcessing(true);
    try {
      // Delete the payment request
      const { error: paymentError } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id);

      if (paymentError) throw paymentError;

      // Update booking to mark payment as not requested
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ provider_payment_requested: false })
        .eq("id", payment.booking_id);

      if (bookingError) throw bookingError;

      toast({
        title: "Payment cancelled",
        description: "The payment request has been cancelled.",
      });
      setCancelDialogOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!payment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Request</DialogTitle>
            <DialogDescription>
              Update or cancel this payment request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this payment is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setCancelDialogOpen(true)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Cancel Request
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isProcessing || !amount}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Pencil className="h-4 w-4 mr-1" />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Payment Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the payment request of ₹{payment.amount?.toLocaleString()}. 
              The customer will no longer see the payment button.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
