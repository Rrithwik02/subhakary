import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, User, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ReviewsListProps {
  providerId: string;
}

const aspectLabels: Record<string, string> = {
  service_quality_rating: "Service Quality",
  communication_rating: "Communication",
  value_for_money_rating: "Value for Money",
  punctuality_rating: "Punctuality",
};

export const ReviewsList = ({ providerId }: ReviewsListProps) => {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["provider-reviews", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Calculate rating summary
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 
      : 0,
  }));

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No reviews yet. Be the first to review!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display">
            Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-border">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{averageRating}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(Number(averageRating))
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingCounts.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{star}</span>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Reviews */}
          {reviews.map((review) => {
            const hasAspectRatings = review.service_quality_rating || 
              review.communication_rating || 
              review.value_for_money_rating || 
              review.punctuality_rating;
            const hasPhotos = review.photos && review.photos.length > 0;
            const isExpanded = expandedReview === review.id;

            return (
              <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "PP")}
                  </span>
                </div>

                {review.review_text && (
                  <p className="text-sm text-muted-foreground mb-3">{review.review_text}</p>
                )}

                {/* Photos */}
                {hasPhotos && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {review.photos.slice(0, isExpanded ? undefined : 3).map((photo: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setLightboxImage(photo)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {!isExpanded && review.photos.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        +{review.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Aspect Ratings */}
                {hasAspectRatings && isExpanded && (
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-muted/30 rounded-lg">
                    {Object.entries(aspectLabels).map(([key, label]) => {
                      const value = review[key as keyof typeof review];
                      if (!value) return null;
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < (value as number)
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expand/Collapse Button */}
                {(hasAspectRatings || (hasPhotos && review.photos.length > 3)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                    className="mt-2 text-xs h-7"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Photo Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {lightboxImage && (
            <img src={lightboxImage} alt="" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
