import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays } from "date-fns";
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
  Share2,
  Heart,
  Phone,
  ChevronRight,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/DateRangePicker";
import { AvailabilityStatusBadge } from "@/components/AvailabilityStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";

const MobileProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const queryClient = useQueryClient();
  
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<DateRange>();
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Fetch provider details using public_service_providers view for anonymous access
  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_service_providers")
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

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["provider-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, booking:bookings(user_id)")
        .eq("provider_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/provider/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: provider?.business_name || "Service Provider",
          text: `Check out ${provider?.business_name}!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!" });
    }
  };

  const handleBookingSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const bookingDate = isMultiDay ? dateRange?.from : selectedDate;
    const endDate = isMultiDay ? dateRange?.to : selectedDate;

    if (!bookingDate) {
      toast({
        title: "Select a date",
        description: "Please select a date for your booking",
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
      setShowBookingSheet(false);
      setSelectedDate(undefined);
      setDateRange(undefined);
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

  const handleInquiry = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/inquiry/${id}`);
  };

  if (isLoading) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen bg-background">
          {/* Header skeleton */}
          <div className="relative">
            <Skeleton className="w-full h-64" />
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!provider) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
          <p className="text-lg font-medium mb-4">Provider not found</p>
          <Button onClick={() => navigate("/providers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Providers
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const portfolioImages = provider.portfolio_images || [];
  const isFav = isFavorite(provider.id);

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen bg-background pb-24">
        {/* Hero Image Section */}
        <div className="relative">
          {portfolioImages.length > 0 ? (
            <div className="relative h-72 overflow-hidden">
              <img
                src={portfolioImages[activeImageIndex]}
                alt={provider.business_name}
                className="w-full h-full object-cover"
              />
              {portfolioImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {portfolioImages.slice(0, 5).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === activeImageIndex ? "bg-white w-4" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
              {portfolioImages.length > 1 && (
                <button
                  onClick={() => setShowFullGallery(true)}
                  className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                >
                  <ImageIcon className="h-3 w-3" />
                  {portfolioImages.length} photos
                </button>
              )}
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl">{provider.category?.icon || "🙏"}</span>
            </div>
          )}

          {/* Floating action buttons */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 backdrop-blur-sm hover:bg-black/40"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/30 backdrop-blur-sm hover:bg-black/40"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`bg-black/30 backdrop-blur-sm hover:bg-black/40 ${isFav ? "text-red-500" : ""}`}
                onClick={() => user ? toggleFavorite.mutate(provider.id) : navigate("/auth")}
              >
                <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Provider Info */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{provider.business_name}</h1>
                  {provider.is_verified && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {provider.category?.name}
                  </Badge>
                  <AvailabilityStatusBadge status={(provider as any).availability_status || 'offline'} />
                </div>
              </div>
              {provider.logo_url && (
                <img
                  src={provider.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover"
                />
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{provider.rating?.toFixed(1) || "New"}</span>
                <span className="text-muted-foreground">({provider.total_reviews || 0})</span>
              </div>
              {provider.city && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{provider.city}</span>
                </div>
              )}
              {provider.experience_years && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{provider.experience_years}+ yrs</span>
                </div>
              )}
            </div>

            {/* Price Badge */}
            {provider.base_price && (
              <div className="mt-3">
                <Badge variant="outline" className="text-primary border-primary font-semibold">
                  From ₹{provider.base_price.toLocaleString('en-IN')}
                </Badge>
              </div>
            )}
          </div>

          {/* Description */}
          {provider.description && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {provider.description}
              </p>
            </div>
          )}

          {/* Languages & Specializations */}
          <div className="flex flex-wrap gap-2">
            {provider.languages?.map((lang: string) => (
              <Badge key={lang} variant="outline" className="text-xs">
                <Languages className="h-3 w-3 mr-1" />
                {lang}
              </Badge>
            ))}
            {provider.specializations?.map((spec: string) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Reviews</h3>
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  See all <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review: any) => (
                  <div key={review.id} className="bg-muted/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "fill-primary text-primary" : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 safe-area-bottom">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={handleInquiry}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Inquiry
          </Button>
          <Button
            className="flex-1 h-12 gradient-gold text-primary-foreground"
            onClick={() => setShowBookingSheet(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>

        {/* Booking Sheet */}
        <AnimatePresence>
          {showBookingSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowBookingSheet(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 max-h-[85vh] overflow-auto safe-area-bottom"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Book {provider.business_name}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowBookingSheet(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Multi-day toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={!isMultiDay ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsMultiDay(false)}
                      >
                        Single Day
                      </Button>
                      <Button
                        variant={isMultiDay ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsMultiDay(true)}
                      >
                        Multi-Day
                      </Button>
                    </div>

                    {/* Date Selection */}
                    <div>
                      <Label className="mb-2 block">Select Date{isMultiDay ? "s" : ""}</Label>
                      <DateRangePicker
                        singleDate={selectedDate}
                        dateRange={dateRange}
                        onSingleDateChange={setSelectedDate}
                        onDateRangeChange={setDateRange}
                        isMultiDay={isMultiDay}
                        onMultiDayToggle={setIsMultiDay}
                      />
                    </div>

                    {/* Time Selection */}
                    <div>
                      <Label className="mb-2 block">Preferred Time (Optional)</Label>
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <Label className="mb-2 block">Message (Optional)</Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any special requirements..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button
                      className="w-full h-12 gradient-gold text-primary-foreground"
                      onClick={handleBookingSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Booking Request"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full Gallery Modal */}
        <AnimatePresence>
          {showFullGallery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-4">
                <span className="text-white">{activeImageIndex + 1} / {portfolioImages.length}</span>
                <Button variant="ghost" size="icon" onClick={() => setShowFullGallery(false)}>
                  <X className="h-5 w-5 text-white" />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={portfolioImages[activeImageIndex]}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-4 flex gap-2 overflow-x-auto">
                {portfolioImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      idx === activeImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
};

export default MobileProviderProfile;
