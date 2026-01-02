import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, isSameDay, parseISO, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  MapPin,
  Star,
  Clock,
  Languages,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewsList } from "@/components/ReviewsList";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProviderBundles } from "@/components/ProviderBundles";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { PricingTiers } from "@/components/PricingTiers";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<DateRange>();
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize date from URL params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (!isNaN(parsedDate.getTime()) && parsedDate >= new Date()) {
          setSelectedDate(parsedDate);
        }
      } catch (e) {
        // Invalid date format, ignore
      }
    }
  }, [searchParams]);

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

  // Fetch blocked dates for this provider
  const { data: blockedDates = [] } = useQuery({
    queryKey: ["provider-blocked-dates-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_availability")
        .select("specific_date")
        .eq("provider_id", id)
        .eq("is_blocked", true)
        .not("specific_date", "is", null);

      if (error) throw error;
      return (data || []).map((b) => new Date(b.specific_date!));
    },
    enabled: !!id,
  });

  // Check if a date is blocked
  const isDateBlocked = (date: Date) => {
    return blockedDates.some((blockedDate) => isSameDay(blockedDate, date));
  };

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

    const bookingDate = isMultiDay ? dateRange?.from : selectedDate;
    const endDate = isMultiDay ? dateRange?.to : selectedDate;

    if (!bookingDate) {
      toast({
        title: "Select a date",
        description: isMultiDay ? "Please select a date range for your booking" : "Please select a date for your booking",
        variant: "destructive",
      });
      return;
    }

    if (isMultiDay && !endDate) {
      toast({
        title: "Select end date",
        description: "Please select both start and end dates for multi-day booking",
        variant: "destructive",
      });
      return;
    }

    const totalDays = isMultiDay && endDate 
      ? differenceInDays(endDate, bookingDate) + 1 
      : 1;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        provider_id: id,
        service_date: format(bookingDate, "yyyy-MM-dd"),
        start_date: format(bookingDate, "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : format(bookingDate, "yyyy-MM-dd"),
        total_days: totalDays,
        service_time: selectedTime || null,
        message: message || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking request sent!",
        description: `Your ${totalDays > 1 ? `${totalDays}-day` : ''} booking request has been sent.`,
      });
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      setDateRange(undefined);
      setIsMultiDay(false);
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

      <section className="pt-20 md:pt-32 pb-12 px-3 md:px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 md:mb-6 h-8 md:h-10 touch-manipulation -ml-2"
            onClick={() => navigate("/providers")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <Card className="mb-4 md:mb-6">
              <CardContent className="p-3 md:p-8">
                <div className="flex flex-col gap-3 md:gap-6">
                  {/* Mobile: Horizontal layout */}
                  <div className="flex items-start gap-3 md:gap-6">
                    <div className="flex-shrink-0">
                      {provider.logo_url ? (
                        <img
                          src={provider.logo_url}
                          alt={provider.business_name}
                          className="h-14 w-14 md:h-24 md:w-24 rounded-lg md:rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 md:h-24 md:w-24 rounded-lg md:rounded-2xl bg-primary/10 flex items-center justify-center text-2xl md:text-5xl">
                          {provider.category?.icon || "🙏"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-3">
                        <div className="min-w-0 flex-1">
                          <h1 className="font-display text-lg md:text-3xl font-bold text-foreground line-clamp-2 leading-tight">
                            {provider.business_name}
                          </h1>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {provider.is_verified && (
                            <span className="verified-badge text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
                              <CheckCircle2 className="h-3 w-3" />
                            </span>
                          )}
                          <FavoriteButton providerId={provider.id} variant="button" />
                        </div>
                      </div>
                      
                      {provider.category?.name && (
                        <Badge variant="secondary" className="text-[10px] md:text-xs mb-2">
                          {provider.category.name}
                        </Badge>
                      )}
                      
                      {/* Rating and price - compact on mobile */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 md:h-5 md:w-5 fill-primary text-primary" />
                          <span className="font-bold text-sm md:text-lg">
                            {provider.rating?.toFixed(1) || "New"}
                          </span>
                          <span className="text-[10px] md:text-sm text-muted-foreground">
                            ({provider.total_reviews || 0})
                          </span>
                        </div>
                        {provider.base_price && (
                          <Badge variant="outline" className="text-secondary font-medium text-[10px] md:text-xs">
                            From ₹{provider.base_price.toLocaleString('en-IN')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] md:text-sm text-muted-foreground border-t border-border/50 pt-3 md:pt-4">
                    {provider.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                        {provider.city}
                      </span>
                    )}
                    {provider.experience_years ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        {provider.experience_years}+ yrs
                      </span>
                    ) : null}
                    {provider.languages && provider.languages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Languages className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="truncate max-w-[80px] md:max-w-none">
                          {provider.languages.slice(0, 2).join(", ")}
                          {provider.languages.length > 2 && ` +${provider.languages.length - 2}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile action buttons - fixed at bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-2.5 z-40 safe-area-bottom">
              <div className="flex gap-2 max-w-md mx-auto">
                <Button
                  className="flex-1 h-10 touch-manipulation active:scale-[0.98] transition-transform text-sm"
                  variant="outline"
                  onClick={() => navigate(`/inquiry/${provider.id}`)}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Chat
                </Button>
                <Button
                  className="flex-1 h-10 gradient-gold text-primary-foreground touch-manipulation active:scale-[0.98] transition-transform text-sm"
                  onClick={() => setBookingDialogOpen(true)}
                >
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Book Now
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 md:gap-6 pb-16 md:pb-0">
              {/* Main content */}
              <div className="md:col-span-2 space-y-3 md:space-y-6">
                {/* About */}
                <Card>
                  <CardHeader className="pb-2 p-3 md:p-6 md:pb-4">
                    <CardTitle className="font-display text-base md:text-xl">About</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-3 md:px-6 md:pb-6">
                    <p className="text-xs md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                      {provider.description || "No description provided."}
                    </p>
                  </CardContent>
                </Card>

                {/* Service details */}
                {provider.category?.description && (
                  <Card>
                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-4">
                      <CardTitle className="font-display text-base md:text-xl">Service Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 pb-3 md:px-6 md:pb-6">
                      <p className="text-xs md:text-base text-muted-foreground">
                        {provider.category.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Service Packages */}
                <ProviderBundles 
                  providerId={provider.id} 
                  providerName={provider.business_name}
                />

                {/* Pricing Tiers */}
                <PricingTiers providerId={provider.id} />

                {/* Portfolio Gallery */}
                {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                  <PortfolioGallery 
                    images={provider.portfolio_images} 
                    providerName={provider.business_name}
                  />
                )}

                {/* Reviews */}
                <ReviewsList providerId={provider.id} />
              </div>

              {/* Booking sidebar - hidden on mobile */}
              <div className="hidden md:block space-y-6">
                <Card className="sticky top-28">
                  <CardHeader>
                    <CardTitle className="font-display">Connect with Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Chat with {provider.business_name} to discuss your requirements
                      before booking.
                    </p>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/inquiry/${provider.id}`)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat Now
                    </Button>
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

      {/* Booking Dialog - mobile optimized */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] md:w-full max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg md:text-xl">
              Book {provider.business_name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Select a date and provide details for your booking request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 md:py-4">
            <div>
              <Label className="text-sm mb-2 block">Select Date *</Label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                singleDate={selectedDate}
                onSingleDateChange={setSelectedDate}
                isMultiDay={isMultiDay}
                onMultiDayToggle={setIsMultiDay}
                disabledDates={blockedDates}
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-sm">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1 h-11 md:h-10 touch-manipulation"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Describe your requirements, event details, etc."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 text-base md:text-sm touch-manipulation"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setBookingDialogOpen(false)}
              className="w-full sm:w-auto h-11 md:h-10 touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              className="gradient-gold text-primary-foreground w-full sm:w-auto h-11 md:h-10 touch-manipulation active:scale-[0.98] transition-transform"
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
