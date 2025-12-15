import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  MapPin,
  Star,
  Clock,
  Languages,
  Phone,
  ArrowLeft,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewsList } from "@/components/ReviewsList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch provider details
  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          category:service_categories(name, icon, description)
        `)
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleBookingSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book this provider",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please select a date for your booking",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        provider_id: id,
        service_date: format(selectedDate, "yyyy-MM-dd"),
        service_time: selectedTime || null,
        message: message || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking request sent!",
        description: "The provider will review your request and respond soon.",
      });
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      setMessage("");
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-4" />
              <div className="h-12 bg-muted rounded w-3/4 mb-6" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Provider not found</h1>
            <p className="text-muted-foreground mb-6">
              This provider may no longer be available.
            </p>
            <Button onClick={() => navigate("/providers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Providers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/providers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Providers
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <Card className="mb-6">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-5xl">
                      {provider.category?.icon || "🙏"}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">
                          {provider.business_name}
                        </h1>
                        {provider.category?.name && (
                          <Badge variant="secondary" className="mt-2">
                            {provider.category.name}
                          </Badge>
                        )}
                      </div>
                      {provider.is_verified && (
                        <span className="verified-badge">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      {provider.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {provider.city}
                          {provider.address && `, ${provider.address}`}
                        </span>
                      )}
                      {provider.experience_years ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {provider.experience_years}+ years experience
                        </span>
                      ) : null}
                      {provider.languages && provider.languages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Languages className="h-4 w-4" />
                          {provider.languages.join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-primary text-primary" />
                        <span className="font-bold text-lg">
                          {provider.rating?.toFixed(1) || "New"}
                        </span>
                        <span className="text-muted-foreground">
                          ({provider.total_reviews || 0} reviews)
                        </span>
                      </div>
                      {provider.pricing_info && (
                        <Badge variant="outline" className="text-secondary font-medium">
                          {provider.pricing_info}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="md:col-span-2 space-y-6">
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {provider.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>

                {/* Service details */}
                {provider.category?.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display">Service Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {provider.category.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews */}
                <ReviewsList providerId={provider.id} />
              </div>

              {/* Booking sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-28">
                  <CardHeader>
                    <CardTitle className="font-display">Book This Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send a booking request to {provider.business_name}. They will
                      review and respond to your request.
                    </p>
                    <Button
                      className="w-full gradient-gold text-primary-foreground"
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Request Booking
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Book {provider.business_name}
            </DialogTitle>
            <DialogDescription>
              Select a date and provide details for your booking request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Select Date *</Label>
              <div className="flex justify-center mt-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Describe your requirements, event details, etc."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-gold text-primary-foreground"
              onClick={handleBookingSubmit}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProviderProfile;
