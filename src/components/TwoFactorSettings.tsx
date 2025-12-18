import { useState } from "react";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSettingsProps {
  email: string;
  twoFactorEnabled: boolean;
  onUpdate: () => void;
}

export const TwoFactorSettings = ({ email, twoFactorEnabled, onUpdate }: TwoFactorSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    const action = enabled ? "enable" : "disable";
    setPendingAction(action === "enable" ? "enable" : "disable");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          email,
          purpose: action === "enable" ? "enable_2fa" : "disable_2fa",
        },
      });

      if (error) throw error;

      toast({
        title: "Verification code sent",
        description: "Please check your email for the 6-digit code",
      });
      setShowOtpDialog(true);
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setPendingAction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          email,
          code: otpCode,
          purpose: pendingAction === "enable" ? "enable_2fa" : "disable_2fa",
        },
      });

      if (error) throw error;

      toast({
        title: pendingAction === "enable" ? "2FA Enabled" : "2FA Disabled",
        description: pendingAction === "enable"
          ? "Your account is now more secure"
          : "Two-factor authentication has been disabled",
      });

      setShowOtpDialog(false);
      setOtpCode("");
      setPendingAction(null);
      onUpdate();
    } catch (error: any) {
      console.error("Failed to verify OTP:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingAction) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: {
          email,
          purpose: pendingAction === "enable" ? "enable_2fa" : "disable_2fa",
        },
      });

      if (error) throw error;

      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend code",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            {twoFactorEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account has an extra layer of security"
                  : "Add an extra layer of security by requiring a verification code sent to your email when you log in"}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
          {twoFactorEnabled && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              2FA is active. You'll receive a code via email each time you sign in.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showOtpDialog} onOpenChange={(open) => {
        if (!open) {
          setShowOtpDialog(false);
          setOtpCode("");
          setPendingAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "enable" ? "Enable" : "Disable"} Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to {email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={handleVerifyOtp}
                disabled={otpCode.length !== 6 || isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm"
              >
                {isLoading ? "Sending..." : "Didn't receive the code? Resend"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
