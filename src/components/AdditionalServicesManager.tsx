import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Upload, FileText, Check, Clock, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface AdditionalService {
  id: string;
  service_type: string;
  description: string;
  category_id: string | null;
  verification_status: string | null;
  category?: ServiceCategory;
}

interface AdditionalServicesManagerProps {
  providerId: string;
  primaryCategoryId?: string;
}

export const AdditionalServicesManager = ({ 
  providerId, 
  primaryCategoryId 
}: AdditionalServicesManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ [categoryId: string]: File[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all service categories
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  // Fetch existing additional services for this provider
  const { data: additionalServices = [], refetch } = useQuery({
    queryKey: ["additional-services", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("provider_id", providerId);
      if (error) throw error;
      
      // Fetch category names
      const categoryIds = data.map(s => s.category_id).filter(Boolean);
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("service_categories")
          .select("*")
          .in("id", categoryIds);
        
        const catMap = new Map(cats?.map(c => [c.id, c]) || []);
        return data.map(s => ({
          ...s,
          category: catMap.get(s.category_id || "") || null
        })) as AdditionalService[];
      }
      
      return data as AdditionalService[];
    },
    enabled: !!providerId,
  });

  // Get available categories (excluding primary and already added)
  const availableCategories = categories.filter(cat => 
    cat.id !== primaryCategoryId && 
    !additionalServices.some(s => s.category_id === cat.id)
  );

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleFileUpload = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), ...Array.from(files)]
      }));
    }
  };

  const removeFile = (categoryId: string, index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [categoryId]: prev[categoryId]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmitServices = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No services selected",
        description: "Please select at least one additional service",
        variant: "destructive",
      });
      return;
    }

    // Check if all selected categories have at least one document
    const missingDocs = selectedCategories.filter(catId => 
      !uploadedFiles[catId] || uploadedFiles[catId].length === 0
    );

    if (missingDocs.length > 0) {
      const missingNames = missingDocs.map(id => 
        categories.find(c => c.id === id)?.name
      ).join(", ");
      toast({
        title: "Documents required",
        description: `Please upload proof documents for: ${missingNames}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const categoryId of selectedCategories) {
        const category = categories.find(c => c.id === categoryId);
        if (!category) continue;

        // Create additional service entry
        const { data: service, error: serviceError } = await supabase
          .from("additional_services")
          .insert({
            provider_id: providerId,
            service_type: category.name,
            description: `Additional service: ${category.name}`,
            category_id: categoryId,
            verification_status: "pending",
            min_price: 0,
            max_price: 0,
          })
          .select()
          .single();

        if (serviceError) throw serviceError;

        // Upload documents for this service
        const files = uploadedFiles[categoryId] || [];
        for (const file of files) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("provider-documents")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          // Save document reference with category link
          await supabase.from("provider_documents").insert({
            provider_id: providerId,
            document_type: "additional_service_proof",
            file_url: filePath,
            file_name: file.name,
            service_category_id: categoryId,
          });
        }
      }

      toast({
        title: "Services added!",
        description: "Your additional services are pending verification",
      });

      setAddDialogOpen(false);
      setSelectedCategories([]);
      setUploadedFiles({});
      refetch();
      queryClient.invalidateQueries({ queryKey: ["additional-services", providerId] });
    } catch (error: any) {
      console.error("Error adding services:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add services",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("additional_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Service removed",
        description: "The additional service has been removed",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove service",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600"><Check className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Additional Services
        </CardTitle>
        <CardDescription>
          Offer multiple services to reach more customers. Each service requires proof documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing additional services */}
        {additionalServices.length > 0 ? (
          <div className="space-y-3">
            {additionalServices.map((service) => (
              <div 
                key={service.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{service.category?.name || service.service_type}</p>
                    {getStatusBadge(service.verification_status)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveService(service.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No additional services added yet
          </p>
        )}

        {/* Add new services button */}
        {availableCategories.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Additional Services
          </Button>
        )}

        {/* Add services dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Additional Services</DialogTitle>
              <DialogDescription>
                Select services you offer and upload proof documents for each
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Service selection */}
              <div className="space-y-3">
                <Label>Select Services</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategories.includes(category.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <span className="font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Document uploads for each selected service */}
              {selectedCategories.length > 0 && (
                <div className="space-y-4">
                  <Label>Upload Proof Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    For each service, upload proof that you're authorized to provide it (portfolio images, equipment invoices, business registration, etc.)
                  </p>
                  
                  {selectedCategories.map((categoryId) => {
                    const category = categories.find(c => c.id === categoryId);
                    const files = uploadedFiles[categoryId] || [];
                    
                    return (
                      <div key={categoryId} className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">{category?.name}</span>
                          <Badge variant="outline">Required</Badge>
                        </div>
                        
                        {/* Upload area */}
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            id={`file-${categoryId}`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(categoryId, e)}
                            className="hidden"
                            multiple
                          />
                          <label htmlFor={`file-${categoryId}`} className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">
                              PDF, JPG, or PNG (Portfolio, invoices, certificates)
                            </p>
                          </label>
                        </div>

                        {/* Uploaded files list */}
                        {files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {files.map((file, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 rounded bg-background"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeFile(categoryId, index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitServices}
                disabled={isSubmitting || selectedCategories.length === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
