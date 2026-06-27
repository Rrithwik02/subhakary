import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Star,
  Users,
  Building,
  Globe,
  BadgeCheck,
  Crown,
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";

interface AdminProviderDetailDialogProps {
  provider: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminProviderDetailDialog = ({
  provider,
  open,
  onOpenChange,
}: AdminProviderDetailDialogProps) => {
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);

  // Fetch provider bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["provider-bookings", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id(full_name, email, phone)
        `)
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!provider?.id,
  });

  // Fetch provider reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["provider-reviews", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!provider?.id,
  });

  // Generate signed URLs for documents
  const viewDocument = async (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      window.open(fileUrl, "_blank");
      return;
    }
    const { data } = await supabase.storage
      .from("provider-documents")
      .createSignedUrl(fileUrl, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (!provider) return null;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    approved: "bg-green-500/10 text-green-600 border-green-200",
    rejected: "bg-red-500/10 text-red-600 border-red-200",
    accepted: "bg-green-500/10 text-green-600 border-green-200",
    completed: "bg-blue-500/10 text-blue-600 border-blue-200",
    cancelled: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  const completedBookings = bookings.filter((b: any) => b.status === "completed");
  const pendingBookings = bookings.filter((b: any) => b.status === "pending");
  const acceptedBookings = bookings.filter((b: any) => b.status === "accepted");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
              {provider.category?.icon || "🙏"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl font-bold">
                  {provider.business_name}
                </DialogTitle>
                {provider.is_premium && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-bold rounded-md">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                )}
                {provider.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-medium rounded-md border border-green-500/30">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {provider.category?.name && (
                  <Badge variant="secondary">{provider.category.name}</Badge>
                )}
                <Badge className={statusColors[provider.status]}>
                  {provider.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex flex-col flex-1">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({provider.documents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-4 space-y-6">
              {/* Contact Information - Admin Only */}
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Details (Admin Only)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {provider.whatsapp_number && (
                      <a
                        href={`tel:${provider.whatsapp_number}`}
                        className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {provider.whatsapp_number}
                      </a>
                    )}
                    {provider.profile?.email && (
                      <a
                        href={`mailto:${provider.profile.email}`}
                        className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {provider.profile?.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Business Info</h3>
                  <div className="space-y-2 text-sm">
                    {provider.city && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {provider.city}
                        {provider.address && ` - ${provider.address}`}
                      </p>
                    )}
                    {provider.experience_years > 0 && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {provider.experience_years}+ years experience
                      </p>
                    )}
                    {provider.gst_number && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-4 w-4" />
                        GST: {provider.gst_number}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Applied: {format(new Date(provider.submitted_at), "PPP")}
                    </p>
                    {provider.reviewed_at && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Reviewed: {format(new Date(provider.reviewed_at), "PPP")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {provider.rating || 0}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" /> Rating
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {provider.total_reviews || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {completedBookings.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {pendingBookings.length + acceptedBookings.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {provider.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {provider.description}
                  </p>
                </div>
              )}

              {/* Languages & Specializations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {provider.languages?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Languages</h3>
                    <div className="flex flex-wrap gap-1">
                      {provider.languages.map((lang: string) => (
                        <Badge key={lang} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {provider.specializations?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Specializations</h3>
                    <div className="flex flex-wrap gap-1">
                      {provider.specializations.map((spec: string) => (
                        <Badge key={spec} variant="outline">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(provider.website_url || provider.instagram_url || provider.facebook_url || provider.youtube_url) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Social Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.website_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={provider.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-1" /> Website
                        </a>
                      </Button>
                    )}
                    {provider.instagram_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={provider.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4 mr-1" /> Instagram
                        </a>
                      </Button>
                    )}
                    {provider.facebook_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={provider.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4 mr-1" /> Facebook
                        </a>
                      </Button>
                    )}
                    {provider.youtube_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={provider.youtube_url} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 mr-1" /> YouTube
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {provider.rejection_reason && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold text-destructive mb-1">Rejection Reason</h3>
                  <p className="text-sm text-foreground">{provider.rejection_reason}</p>
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              {!provider.documents?.length ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                  <p className="text-sm text-amber-600 mt-2">
                    This provider may require phone verification
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.documents.map((doc: any) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {doc.document_type}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={
                                  doc.verification_status === "verified"
                                    ? "bg-green-500/10 text-green-600"
                                    : doc.verification_status === "rejected"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }
                              >
                                {doc.verification_status || "pending"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDocument(doc.file_url)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking: any) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {booking.profiles?.full_name || "Unknown Customer"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.service_date), "PPP")}
                              {booking.service_time && ` at ${booking.service_time}`}
                            </div>
                            {booking.message && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {booking.message}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[booking.status]}>
                              {booking.status}
                            </Badge>
                            {booking.total_amount && (
                              <span className="text-sm font-medium">
                                ₹{booking.total_amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {review.profiles?.full_name || "Anonymous"}
                              </p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.review_text && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {review.review_text}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(review.created_at), "PPP")}
                            </p>
                          </div>
                          <Badge className={statusColors[review.status] || "bg-gray-500/10"}>
                            {review.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
