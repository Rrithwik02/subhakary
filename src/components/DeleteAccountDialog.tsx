import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  isProvider?: boolean;
  willDeleteProvider?: boolean;
}

export const DeleteAccountDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Account",
  description = "This action cannot be undone. Your account and all associated data will be permanently deleted.",
  confirmText = "DELETE",
  isProvider = false,
  willDeleteProvider = false,
}: DeleteAccountDialogProps) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmInput !== confirmText) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(reason);
    } finally {
      setIsDeleting(false);
      setConfirmInput("");
      setReason("");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmInput("");
      setReason("");
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{description}</p>
            {willDeleteProvider && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive text-sm">
                <strong>Warning:</strong> This will also delete your service provider profile and all associated bookings, reviews, and data.
              </div>
            )}
            {isProvider && !willDeleteProvider && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-700 text-sm">
                <strong>Note:</strong> You will be reverted to a customer account. Your provider profile will be removed, but your customer account will remain.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for leaving (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're leaving..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold text-destructive">{confirmText}</span> to confirm
            </Label>
            <Input
              id="confirm"
              placeholder={confirmText}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmInput !== confirmText || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
