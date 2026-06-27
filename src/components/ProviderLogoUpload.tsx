import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderLogoUploadProps {
  providerId: string;
  currentLogoUrl: string | null;
  businessName: string;
  onLogoUpdated: () => void;
}

export const ProviderLogoUpload = ({
  providerId,
  currentLogoUrl,
  businessName,
  onLogoUpdated,
}: ProviderLogoUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user ID for storage path (RLS requires userId/filename format)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create unique file name with user ID prefix to satisfy RLS
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/provider-logo-${Date.now()}.${fileExt}`;

      // Upload to avatars bucket (which is public)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update service_providers table
      const { error: updateError } = await supabase
        .from("service_providers")
        .update({ logo_url: publicUrl })
        .eq("id", providerId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onLogoUpdated();

      toast({
        title: "Logo updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Profile Picture</CardTitle>
        <CardDescription>
          Upload a logo or profile picture that will be displayed on your provider profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Current/Preview Image */}
          <div className="relative group">
            <div className="h-32 w-32 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            {/* Overlay on hover */}
            <div 
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Upload Button and Info */}
          <div className="flex-1 text-center sm:text-left">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="mb-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {previewUrl ? "Change Picture" : "Upload Picture"}
                </>
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Recommended: Square image, at least 200x200px
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WebP (max 5MB)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
