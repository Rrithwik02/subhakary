import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnderDevelopmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UnderDevelopmentDialog = ({ open, onOpenChange }: UnderDevelopmentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-semibold">Under Development</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            This feature is currently under development and will be available in a future update.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-3">
          <Button className="rounded-full gradient-gold text-primary-foreground font-semibold" onClick={() => onOpenChange(false)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
