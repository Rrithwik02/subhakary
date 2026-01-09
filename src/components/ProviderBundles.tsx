import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, IndianRupee, Calendar, Users, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { trackBundleBooking } from "@/lib/analytics";

interface ProviderBundlesProps {
  providerId: string;
  providerName: string;
}

export function ProviderBundles({ providerId, providerName }: ProviderBundlesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [guestCount, setGuestCount] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bundles with items
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["provider-bundles-public", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bundles")
        .select(`
          *,
          items:bundle_items(*)
        `)
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("discounted_price", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleBookBundle = (bundle: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book this package",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSelectedBundle(bundle);
    setBookingDialogOpen(true);
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please select an event date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a booking for the bundle
      const { error } = await supabase.from("bookings").insert({
        user_id: user!.id,
        provider_id: providerId,
        service_date: format(selectedDate, "yyyy-MM-dd"),
        message: `Package: ${selectedBundle.bundle_name}\nGuests: ${guestCount || 'Not specified'}`,
        special_requirements: specialRequirements || null,
        total_amount: selectedBundle.discounted_price,
        status: "pending",
      });

      if (error) throw error;

      // Track bundle booking
      trackBundleBooking({
        bundleId: selectedBundle.id,
        bundleName: selectedBundle.bundle_name,
        providerId,
        providerName,
        price: selectedBundle.discounted_price,
      });

      toast({
        title: "Package booking request sent!",
        description: `Your request for "${selectedBundle.bundle_name}" has been submitted.`,
      });
      
      setBookingDialogOpen(false);
      setSelectedBundle(null);
      setSelectedDate(undefined);
      setGuestCount("");
      setSpecialRequirements("");
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Service Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bundles.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Service Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{bundle.bundle_name}</h4>
                    {bundle.discount_percentage > 0 && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-200">
                        {bundle.discount_percentage}% OFF
                      </Badge>
                    )}
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground">
                      {bundle.description}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-muted-foreground line-through">
                    ₹{bundle.base_price.toLocaleString()}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    ₹{bundle.discounted_price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bundle details */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                {bundle.duration_days > 1 && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {bundle.duration_days} days
                  </span>
                )}
                {bundle.max_guests && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Up to {bundle.max_guests} guests
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {bundle.min_advance_percentage}% advance
                </span>
              </div>

              {/* Bundle items */}
              {bundle.items && bundle.items.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">What's included:</p>
                  <div className="grid gap-1">
                    {bundle.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span>
                          {item.quantity > 1 && `${item.quantity}x `}
                          {item.service_name}
                          {item.description && (
                            <span className="text-muted-foreground"> - {item.description}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full gradient-gold text-primary-foreground"
                onClick={() => handleBookBundle(bundle)}
              >
                Book This Package
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Book Package
            </DialogTitle>
            <DialogDescription>
              {selectedBundle?.bundle_name} - ₹{selectedBundle?.discounted_price?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Select Event Date *</Label>
              <div className="flex justify-center mt-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className={cn("rounded-md border")}
                />
              </div>
            </div>

            {selectedBundle?.max_guests && (
              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  max={selectedBundle.max_guests}
                  placeholder={`Max ${selectedBundle.max_guests} guests`}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="requirements">Special Requirements (optional)</Label>
              <Textarea
                id="requirements"
                placeholder="Any specific requirements or customizations..."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {selectedBundle?.terms_conditions && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p className="font-medium mb-1">Terms & Conditions:</p>
                <p>{selectedBundle.terms_conditions}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setBookingDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              className="gradient-gold text-primary-foreground w-full sm:w-auto"
              onClick={handleSubmitBooking}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
