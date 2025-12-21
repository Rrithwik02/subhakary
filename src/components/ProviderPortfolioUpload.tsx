import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderPortfolioUploadProps {
  providerId: string;
  currentImages: string[];
  onImagesUpdated: () => void;
}

export const ProviderPortfolioUpload = ({
  providerId,
  currentImages,
  onImagesUpdated,
}: ProviderPortfolioUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>(currentImages || []);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 portfolio images",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Get current user ID for storage path (RLS requires userId/filename format)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 5MB`,
            variant: "destructive",
          });
          continue;
        }

        // Create unique file name with user ID prefix to satisfy RLS
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/portfolio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to avatars bucket
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const newImages = [...images, ...uploadedUrls];
        
        // Update service_providers table
        const { error: updateError } = await supabase
          .from("service_providers")
          .update({ portfolio_images: newImages })
          .eq("id", providerId);

        if (updateError) throw updateError;

        setImages(newImages);
        onImagesUpdated();

        toast({
          title: "Images uploaded",
          description: `${uploadedUrls.length} image(s) added to your portfolio`,
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    setDeletingIndex(index);
    
    try {
      const newImages = images.filter((_, i) => i !== index);
      
      const { error: updateError } = await supabase
        .from("service_providers")
        .update({ portfolio_images: newImages })
        .eq("id", providerId);

      if (updateError) throw updateError;

      setImages(newImages);
      onImagesUpdated();

      toast({
        title: "Image removed",
        description: "Portfolio image has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Portfolio Images</CardTitle>
        <CardDescription>
          Showcase your best work to attract customers (max 10 images)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                disabled={deletingIndex === index}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
          
          {images.length < 10 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Add Image</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-4 flex items-center gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= 10}
            variant="outline"
            size="sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {images.length}/10 images uploaded
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
