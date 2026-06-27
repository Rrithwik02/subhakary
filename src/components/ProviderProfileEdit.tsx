import { useState } from "react";
import { Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderProfileEditProps {
  providerId: string;
  initialData: {
    business_name: string;
    description: string | null;
    city: string | null;
    address: string | null;
    whatsapp_number: string | null;
    website_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    youtube_url: string | null;
    base_price: number | null;
    subcategory: string | null;
    specializations: string[] | null;
  };
  onProfileUpdated: () => void;
}

export const ProviderProfileEdit = ({
  providerId,
  initialData,
  onProfileUpdated,
}: ProviderProfileEditProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [formData, setFormData] = useState({
    business_name: initialData.business_name || "",
    description: initialData.description || "",
    city: initialData.city || "",
    address: initialData.address || "",
    whatsapp_number: initialData.whatsapp_number || "",
    website_url: initialData.website_url || "",
    instagram_url: initialData.instagram_url || "",
    facebook_url: initialData.facebook_url || "",
    youtube_url: initialData.youtube_url || "",
    base_price: initialData.base_price?.toString() || "",
    subcategory: initialData.subcategory || "",
    specializations: initialData.specializations || [],
  });

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSpecialization = () => {
    if (!newSpecialization.trim()) return;
    if (formData.specializations.includes(newSpecialization.trim())) {
      toast({
        title: "Already added",
        description: "This specialization is already in your list",
        variant: "destructive",
      });
      return;
    }
    handleChange("specializations", [...formData.specializations, newSpecialization.trim()]);
    setNewSpecialization("");
  };

  const removeSpecialization = (spec: string) => {
    handleChange(
      "specializations",
      formData.specializations.filter((s) => s !== spec)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_name.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const basePrice = formData.base_price ? parseFloat(formData.base_price) : null;

      const { error } = await supabase
        .from("service_providers")
        .update({
          business_name: formData.business_name.trim(),
          description: formData.description.trim() || null,
          city: formData.city.trim() || null,
          address: formData.address.trim() || null,
          whatsapp_number: formData.whatsapp_number.trim() || null,
          website_url: formData.website_url.trim() || null,
          instagram_url: formData.instagram_url.trim() || null,
          facebook_url: formData.facebook_url.trim() || null,
          youtube_url: formData.youtube_url.trim() || null,
          base_price: basePrice,
          subcategory: formData.subcategory.trim() || null,
          specializations: formData.specializations,
        })
        .eq("id", providerId);

      if (error) throw error;

      onProfileUpdated();
      toast({
        title: "Profile updated",
        description: "Your profile details have been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Business Details</CardTitle>
        <CardDescription>
          Update your business information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange("business_name", e.target.value)}
                placeholder="Your business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tell customers about your services, experience, and what makes you unique..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g., Mumbai, Delhi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address (visible after booking)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Your business address"
                />
                <p className="text-xs text-muted-foreground">
                  Address is only shown to customers who have booked your service
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <Label htmlFor="base_price">Starting Price (₹)</Label>
              <Input
                id="base_price"
                type="number"
                min="0"
                value={formData.base_price}
                onChange={(e) => handleChange("base_price", e.target.value)}
                placeholder="e.g., 5000"
              />
              <p className="text-xs text-muted-foreground">
                Your base service price. Shown as "Starting from ₹X"
              </p>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Service Details</h3>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory / Service Type</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleChange("subcategory", e.target.value)}
                placeholder="e.g., Wedding Photography, Mehendi Artist"
              />
            </div>

            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="flex gap-2">
                <Input
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="e.g., Destination Weddings"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                />
                <Button type="button" size="icon" variant="outline" onClick={addSpecialization}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specializations.map((spec) => (
                    <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact & Social Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => handleChange("website_url", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => handleChange("instagram_url", e.target.value)}
                  placeholder="https://instagram.com/youraccount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => handleChange("facebook_url", e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => handleChange("youtube_url", e.target.value)}
                  placeholder="https://youtube.com/yourchannel"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSaving} className="gradient-gold text-primary-foreground">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
