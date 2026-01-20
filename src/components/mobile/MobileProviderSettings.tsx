import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  Building2,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Shield,
  LogOut,
  Trash2,
  BadgeCheck,
  Loader2,
  Save,
  Plus,
  X,
  ChevronRight,
  IndianRupee,
  Briefcase,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";

const MobileProviderSettings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");

  // Fetch profile
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch provider profile
  const { data: provider, refetch: refetchProvider } = useQuery({
    queryKey: ["my-provider-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    city: "",
    address: "",
    whatsapp_number: "",
    website_url: "",
    instagram_url: "",
    facebook_url: "",
    youtube_url: "",
    base_price: "",
    subcategory: "",
    specializations: [] as string[],
  });

  // Update form data when provider loads
  useState(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || "",
        description: provider.description || "",
        city: provider.city || "",
        address: provider.address || "",
        whatsapp_number: provider.whatsapp_number || "",
        website_url: provider.website_url || "",
        instagram_url: provider.instagram_url || "",
        facebook_url: provider.facebook_url || "",
        youtube_url: provider.youtube_url || "",
        base_price: provider.base_price?.toString() || "",
        subcategory: provider.subcategory || "",
        specializations: provider.specializations || [],
      });
    }
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([refetchProfile(), refetchProvider()]);
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleSaveProfile = async () => {
    if (!provider || !formData.business_name.trim()) {
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
        .eq("id", provider.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
      setEditMode(false);
      toast({
        title: "Profile updated",
        description: "Your business details have been saved",
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteProvider = async () => {
    if (!provider) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          status: "rejected" as const,
          rejection_reason: "User deleted their provider account" + (deleteReason ? `: ${deleteReason}` : ""),
        })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Provider account deleted",
        description: "You have been reverted to a customer account.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete provider account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Settings" showBackButton>
      <div
        ref={scrollRef}
        className="min-h-screen bg-background pb-24"
        onTouchStart={(e) => handleTouchStart(e, scrollRef.current?.scrollTop || 0)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to Refresh Indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: pullDistance, opacity: pullProgress }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center overflow-hidden"
            >
              <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-4 space-y-4">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xl">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3 text-primary-foreground" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{profile?.full_name || "Your Name"}</h3>
                  <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                  {provider && (
                    <div className="flex items-center gap-1 mt-1">
                      <BadgeCheck className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">Verified Provider</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          {provider && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Business Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (editMode) {
                        handleSaveProfile();
                      } else {
                        setFormData({
                          business_name: provider.business_name || "",
                          description: provider.description || "",
                          city: provider.city || "",
                          address: provider.address || "",
                          whatsapp_number: provider.whatsapp_number || "",
                          website_url: provider.website_url || "",
                          instagram_url: provider.instagram_url || "",
                          facebook_url: provider.facebook_url || "",
                          youtube_url: provider.youtube_url || "",
                          base_price: provider.base_price?.toString() || "",
                          subcategory: provider.subcategory || "",
                          specializations: provider.specializations || [],
                        });
                        setEditMode(true);
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editMode ? (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    ) : (
                      "Edit"
                    )}
                  </Button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input
                        value={formData.business_name}
                        onChange={(e) => handleChange("business_name", e.target.value)}
                        placeholder="Your business name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Tell customers about your services..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          placeholder="e.g., Mumbai"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Starting Price (₹)</Label>
                        <Input
                          type="number"
                          value={formData.base_price}
                          onChange={(e) => handleChange("base_price", e.target.value)}
                          placeholder="e.g., 5000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address (visible after booking)</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Your business address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subcategory / Service Type</Label>
                      <Input
                        value={formData.subcategory}
                        onChange={(e) => handleChange("subcategory", e.target.value)}
                        placeholder="e.g., Wedding Photography"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Specializations</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          placeholder="Add specialization"
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

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Contact & Social Links</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.whatsapp_number}
                            onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                            placeholder="WhatsApp Number"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.website_url}
                            onChange={(e) => handleChange("website_url", e.target.value)}
                            placeholder="Website URL"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.instagram_url}
                            onChange={(e) => handleChange("instagram_url", e.target.value)}
                            placeholder="Instagram URL"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.facebook_url}
                            onChange={(e) => handleChange("facebook_url", e.target.value)}
                            placeholder="Facebook URL"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.youtube_url}
                            onChange={(e) => handleChange("youtube_url", e.target.value)}
                            placeholder="YouTube URL"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{provider.business_name}</span>
                    </div>
                    {provider.city && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.city}</span>
                      </div>
                    )}
                    {provider.base_price && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IndianRupee className="h-4 w-4" />
                        <span>Starting from ₹{provider.base_price.toLocaleString()}</span>
                      </div>
                    )}
                    {provider.subcategory && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{provider.subcategory}</span>
                      </div>
                    )}
                    {provider.specializations && provider.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {provider.specializations.map((spec: string) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {provider.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {provider.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                Security
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.two_factor_enabled ? "Enabled" : "Add extra security to your account"}
                  </p>
                </div>
                <Switch checked={profile?.two_factor_enabled || false} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete Provider Account
            </Button>
          </div>
        </div>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Provider Account</DialogTitle>
              <DialogDescription>
                This will revert you to a customer account. You will lose all your provider data including bookings, reviews, and portfolio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProvider}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default MobileProviderSettings;
