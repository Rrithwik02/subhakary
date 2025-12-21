import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Loader2, Upload, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderPortfolioUploadProps {
  providerId: string;
  currentImages: string[];
  onImagesUpdated: () => void;
}

// Image compression utility
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Could not compress image"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
};

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
  const [isDragOver, setIsDragOver] = useState(false);

  const processAndUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max images limit
    if (images.length + fileArray.length > 10) {
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

      for (const file of fileArray) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Compress image
        let fileToUpload: Blob | File = file;
        try {
          const compressed = await compressImage(file, 1200, 0.8);
          if (compressed.size < file.size) {
            fileToUpload = compressed;
            console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB -> ${(compressed.size / 1024).toFixed(0)}KB`);
          }
        } catch (error) {
          console.warn("Compression failed, using original file", error);
        }

        // Create unique file name with user ID prefix to satisfy RLS
        const fileName = `${user.id}/portfolio-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        // Upload to avatars bucket
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, fileToUpload, { 
            upsert: true,
            contentType: "image/jpeg"
          });

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
          description: `${uploadedUrls.length} image(s) added to your portfolio (compressed for faster loading)`,
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processAndUploadFiles(files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAndUploadFiles(files);
    }
  }, [images, providerId]);

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
          Drag & drop or click to upload. Images are automatically compressed for faster loading (max 10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 mb-4 transition-all duration-200
            ${isDragOver 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-muted-foreground/25 hover:border-primary/50"
            }
            ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}
          `}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Compressing & uploading...</p>
              </>
            ) : (
              <>
                <Upload className={`h-10 w-10 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB each</p>
              </>
            )}
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                disabled={deletingIndex === index}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
              </div>
            </div>
          ))}
          
          {images.length < 10 && !isUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Add Image</span>
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

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {images.length}/10 images uploaded
          </p>
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tip: Hover over images to remove them
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
