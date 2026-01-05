import { useState, useCallback } from "react";
import { Star, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted: () => void;
}

const aspectRatings = [
  { key: "service_quality_rating", label: "Service Quality" },
  { key: "communication_rating", label: "Communication" },
  { key: "value_for_money_rating", label: "Value for Money" },
  { key: "punctuality_rating", label: "Punctuality" },
];

export const ReviewForm = ({
  bookingId,
  providerId,
  providerName,
  open,
  onOpenChange,
  onReviewSubmitted,
}: ReviewFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [aspectScores, setAspectScores] = useState<Record<string, number>>({});
  const [aspectHover, setAspectHover] = useState<Record<string, number>>({});

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast({
        title: "Too many photos",
        description: "You can upload up to 5 photos",
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `"${file.name}" is not a valid image. Only JPEG, PNG, WEBP, and GIF are allowed.`,
          variant: "destructive",
        });
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `"${file.name}" exceeds the 5MB size limit.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newPhotos = [...photos, ...validFiles].slice(0, 5);
    setPhotos(newPhotos);

    // Create previews
    const newPreviews: string[] = [];
    newPhotos.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newPhotos.length) {
          setPhotoPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [photos, toast]);

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}/review-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(fileName, photo);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('review-photos')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "You need to rate the provider before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload photos first
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(user.id);
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        provider_id: providerId,
        booking_id: bookingId,
        rating,
        review_text: reviewText.trim() || null,
        photos: photoUrls,
        service_quality_rating: aspectScores.service_quality_rating || null,
        communication_rating: aspectScores.communication_rating || null,
        value_for_money_rating: aspectScores.value_for_money_rating || null,
        punctuality_rating: aspectScores.punctuality_rating || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      // Reset form
      setRating(0);
      setReviewText("");
      setPhotos([]);
      setPhotoPreviews([]);
      setAspectScores({});
      onOpenChange(false);
      onReviewSubmitted();
    } catch (error: any) {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    hover, 
    onChange, 
    onHover,
    size = "default"
  }: { 
    value: number; 
    hover: number;
    onChange: (v: number) => void;
    onHover: (v: number) => void;
    size?: "default" | "small";
  }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className={cn(
            "transition-transform hover:scale-110",
            size === "small" ? "p-0.5" : "p-1"
          )}
        >
          <Star
            className={cn(
              "transition-colors",
              size === "small" ? "h-5 w-5" : "h-8 w-8",
              (hover || value) >= star
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Review {providerName}
          </DialogTitle>
          <DialogDescription>
            Share your experience to help others find great services
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Overall Rating *</Label>
            <div className="flex items-center gap-2">
              <StarRating 
                value={rating}
                hover={hoverRating}
                onChange={setRating}
                onHover={setHoverRating}
              />
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Aspect Ratings */}
          <div className="space-y-3">
            <Label>Rate specific aspects (optional)</Label>
            <div className="grid gap-3">
              {aspectRatings.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <StarRating
                    value={aspectScores[key] || 0}
                    hover={aspectHover[key] || 0}
                    onChange={(v) => setAspectScores({ ...aspectScores, [key]: v })}
                    onHover={(v) => setAspectHover({ ...aspectHover, [key]: v })}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Add Photos (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-0.5 bg-destructive rounded-full text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to 5 photos</p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Tell others about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gradient-gold text-primary-foreground"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
