import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Package, IndianRupee, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderBundleManagerProps {
  providerId: string;
}

interface BundleFormData {
  bundle_name: string;
  description: string;
  base_price: number;
  discounted_price: number;
  discount_percentage: number;
  duration_days: number;
  max_guests: number | null;
  min_advance_percentage: number;
  terms_conditions: string;
  is_active: boolean;
}

const defaultFormData: BundleFormData = {
  bundle_name: "",
  description: "",
  base_price: 0,
  discounted_price: 0,
  discount_percentage: 0,
  duration_days: 1,
  max_guests: null,
  min_advance_percentage: 30,
  terms_conditions: "",
  is_active: true,
};

export function ProviderBundleManager({ providerId }: ProviderBundleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<string | null>(null);
  const [formData, setFormData] = useState<BundleFormData>(defaultFormData);

  // Fetch bundles
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["provider-bundles", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bundles")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create/Update bundle mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BundleFormData) => {
      if (editingBundle) {
        const { error } = await supabase
          .from("service_bundles")
          .update(data)
          .eq("id", editingBundle);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("service_bundles")
          .insert({ ...data, provider_id: providerId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-bundles", providerId] });
      toast({
        title: editingBundle ? "Bundle updated" : "Bundle created",
        description: "Your service package has been saved successfully.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete bundle mutation
  const deleteMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      const { error } = await supabase
        .from("service_bundles")
        .delete()
        .eq("id", bundleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-bundles", providerId] });
      toast({
        title: "Bundle deleted",
        description: "The service package has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBundle(null);
    setFormData(defaultFormData);
  };

  const handleEdit = (bundle: any) => {
    setEditingBundle(bundle.id);
    setFormData({
      bundle_name: bundle.bundle_name,
      description: bundle.description || "",
      base_price: bundle.base_price,
      discounted_price: bundle.discounted_price,
      discount_percentage: bundle.discount_percentage || 0,
      duration_days: bundle.duration_days || 1,
      max_guests: bundle.max_guests,
      min_advance_percentage: bundle.min_advance_percentage || 30,
      terms_conditions: bundle.terms_conditions || "",
      is_active: bundle.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handlePriceChange = (field: 'base_price' | 'discounted_price', value: number) => {
    const newData = { ...formData, [field]: value };
    
    if (field === 'base_price' && value > 0) {
      const discount = Math.round(((value - formData.discounted_price) / value) * 100);
      newData.discount_percentage = Math.max(0, discount);
    } else if (field === 'discounted_price' && formData.base_price > 0) {
      const discount = Math.round(((formData.base_price - value) / formData.base_price) * 100);
      newData.discount_percentage = Math.max(0, discount);
    }
    
    setFormData(newData);
  };

  const handleSubmit = () => {
    if (!formData.bundle_name.trim()) {
      toast({
        title: "Validation error",
        description: "Package name is required.",
        variant: "destructive",
      });
      return;
    }
    if (formData.base_price <= 0 || formData.discounted_price <= 0) {
      toast({
        title: "Validation error",
        description: "Prices must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Service Packages
          </CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Package
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No service packages yet</p>
            <p className="text-sm">Create packages to offer bundled services at special prices</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{bundle.bundle_name}</h4>
                      {!bundle.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {bundle.discount_percentage > 0 && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200">
                          {bundle.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {bundle.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        <span className="line-through text-muted-foreground">
                          {bundle.base_price.toLocaleString()}
                        </span>
                        <span className="font-semibold text-primary">
                          ₹{bundle.discounted_price.toLocaleString()}
                        </span>
                      </span>
                      {bundle.duration_days > 1 && (
                        <span className="text-muted-foreground">
                          {bundle.duration_days} days
                        </span>
                      )}
                      {bundle.max_guests && (
                        <span className="text-muted-foreground">
                          Up to {bundle.max_guests} guests
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(bundle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBundle ? "Edit Service Package" : "Create Service Package"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bundle_name">Package Name *</Label>
              <Input
                id="bundle_name"
                placeholder="e.g., Complete Wedding Package"
                value={formData.bundle_name}
                onChange={(e) => setFormData({ ...formData, bundle_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this package..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">Original Price (₹) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  value={formData.base_price || ""}
                  onChange={(e) => handlePriceChange('base_price', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="discounted_price">Discounted Price (₹) *</Label>
                <Input
                  id="discounted_price"
                  type="number"
                  min="0"
                  value={formData.discounted_price || ""}
                  onChange={(e) => handlePriceChange('discounted_price', Number(e.target.value))}
                />
              </div>
            </div>

            {formData.discount_percentage > 0 && (
              <p className="text-sm text-green-600">
                Discount: {formData.discount_percentage}% off
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_days">Duration (days)</Label>
                <Input
                  id="duration_days"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="max_guests">Max Guests (optional)</Label>
                <Input
                  id="max_guests"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  value={formData.max_guests || ""}
                  onChange={(e) => setFormData({ ...formData, max_guests: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="min_advance">Minimum Advance (%)</Label>
              <Input
                id="min_advance"
                type="number"
                min="0"
                max="100"
                value={formData.min_advance_percentage}
                onChange={(e) => setFormData({ ...formData, min_advance_percentage: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                placeholder="Any specific terms for this package..."
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
