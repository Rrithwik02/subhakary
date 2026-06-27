import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Loader2, IndianRupee, Users, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PricingTier {
  id: string;
  tier_name: string;
  tier_type: string;
  description: string;
  min_guests?: number;
  max_guests?: number;
  price: number;
  features: string[];
}

interface PricingTiersProps {
  providerId: string;
  isEditable?: boolean;
}

export const PricingTiers = ({ providerId, isEditable = false }: PricingTiersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);

  const [formData, setFormData] = useState({
    tier_name: "",
    tier_type: "basic",
    description: "",
    min_guests: "",
    max_guests: "",
    price: "",
    features: "",
  });

  // Fetch pricing tiers from additional_services table with metadata
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ["pricing-tiers", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("provider_id", providerId)
        .eq("service_type", "pricing_tier")
        .order("min_price", { ascending: true });

      if (error) throw error;
      
      return (data || []).map((item) => ({
        id: item.id,
        tier_name: item.specialization || "Standard",
        tier_type: item.subcategory || "basic",
        description: item.description,
        min_guests: (item.metadata as any)?.min_guests,
        max_guests: (item.metadata as any)?.max_guests,
        price: item.min_price,
        features: (item.metadata as any)?.features || [],
      })) as PricingTier[];
    },
    enabled: !!providerId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<PricingTier, "id">) => {
      const { error } = await supabase.from("additional_services").insert({
        provider_id: providerId,
        service_type: "pricing_tier",
        specialization: data.tier_name,
        subcategory: data.tier_type,
        description: data.description,
        min_price: data.price,
        max_price: data.price,
        metadata: {
          min_guests: data.min_guests,
          max_guests: data.max_guests,
          features: data.features,
        },
        status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-tiers", providerId] });
      toast({ title: "Pricing tier added" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PricingTier) => {
      const { error } = await supabase
        .from("additional_services")
        .update({
          specialization: data.tier_name,
          subcategory: data.tier_type,
          description: data.description,
          min_price: data.price,
          max_price: data.price,
          metadata: {
            min_guests: data.min_guests,
            max_guests: data.max_guests,
            features: data.features,
          },
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-tiers", providerId] });
      toast({ title: "Pricing tier updated" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("additional_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-tiers", providerId] });
      toast({ title: "Pricing tier deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingTier(null);
    setFormData({
      tier_name: "",
      tier_type: "basic",
      description: "",
      min_guests: "",
      max_guests: "",
      price: "",
      features: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      tier_name: tier.tier_name,
      tier_type: tier.tier_type,
      description: tier.description,
      min_guests: tier.min_guests?.toString() || "",
      max_guests: tier.max_guests?.toString() || "",
      price: tier.price.toString(),
      features: tier.features.join("\n"),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTier(null);
  };

  const handleSubmit = () => {
    const tierData = {
      tier_name: formData.tier_name,
      tier_type: formData.tier_type,
      description: formData.description,
      min_guests: formData.min_guests ? parseInt(formData.min_guests) : undefined,
      max_guests: formData.max_guests ? parseInt(formData.max_guests) : undefined,
      price: parseFloat(formData.price),
      features: formData.features.split("\n").filter((f) => f.trim()),
    };

    if (editingTier) {
      updateMutation.mutate({ ...tierData, id: editingTier.id });
    } else {
      createMutation.mutate(tierData);
    }
  };

  const getTierColor = (type: string) => {
    switch (type) {
      case "basic":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "standard":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "premium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "luxury":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!isEditable && tiers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg md:text-xl flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Pricing Tiers
            </CardTitle>
            <CardDescription>
              {isEditable ? "Set different pricing based on service complexity or guest count" : "Choose a pricing tier that suits your needs"}
            </CardDescription>
          </div>
          {isEditable && (
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Tier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pricing tiers yet</p>
            {isEditable && (
              <Button variant="link" onClick={openCreateDialog} className="mt-2">
                Add your first pricing tier
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{tier.tier_name}</h4>
                      <Badge variant="outline" className={`text-xs ${getTierColor(tier.tier_type)}`}>
                        {tier.tier_type.charAt(0).toUpperCase() + tier.tier_type.slice(1)}
                      </Badge>
                    </div>
                    {isEditable && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(tier)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(tier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-primary mb-2">
                    ₹{tier.price.toLocaleString("en-IN")}
                  </p>

                  {(tier.min_guests || tier.max_guests) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      {tier.min_guests && tier.max_guests
                        ? `${tier.min_guests} - ${tier.max_guests} guests`
                        : tier.max_guests
                        ? `Up to ${tier.max_guests} guests`
                        : `${tier.min_guests}+ guests`}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>

                  {tier.features.length > 0 && (
                    <div className="space-y-1">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTier ? "Edit Pricing Tier" : "Add Pricing Tier"}</DialogTitle>
              <DialogDescription>
                Create different pricing options for your services
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier Name *</Label>
                  <Input
                    value={formData.tier_name}
                    onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                    placeholder="e.g., Silver Package"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tier Type *</Label>
                  <Select value={formData.tier_type} onValueChange={(v) => setFormData({ ...formData, tier_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Guests</Label>
                  <Input
                    type="number"
                    value={formData.min_guests}
                    onChange={(e) => setFormData({ ...formData, min_guests: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Guests</Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what's included in this tier"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.tier_name || !formData.price || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingTier ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
