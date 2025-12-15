import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo.png";

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ProviderApplication {
  id: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  business_name: string;
}

const BecomeProvider = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [existingApplication, setExistingApplication] = useState<ProviderApplication | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    businessName: "",
    categoryId: "",
    description: "",
    experienceYears: "",
    languages: [] as string[],
    city: "",
    address: "",
    pricingInfo: "",
  });

  const languageOptions = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCategories();
    if (user) {
      checkExistingApplication();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("name");
    
    if (data && !error) {
      setCategories(data);
    }
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("service_providers")
      .select("id, status, rejection_reason, business_name")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data && !error) {
      setExistingApplication(data as ProviderApplication);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({
        ...formData,
        languages: formData.languages.filter((l) => l !== lang),
      });
    } else {
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create provider application
      const { data: provider, error: providerError } = await supabase
        .from("service_providers")
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          category_id: formData.categoryId || null,
          description: formData.description,
          experience_years: parseInt(formData.experienceYears) || 0,
          languages: formData.languages,
          city: formData.city,
          address: formData.address,
          pricing_info: formData.pricingInfo,
          status: "pending",
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // Upload documents
      for (const file of uploadedFiles) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("provider-documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        // Save document reference
        await supabase.from("provider_documents").insert({
          provider_id: provider.id,
          document_type: "identity",
          file_url: filePath,
          file_name: file.name,
        });
      }

      toast({
        title: "Application submitted!",
        description: "Your provider application is under review. We'll notify you once it's processed.",
      });

      setExistingApplication({
        id: provider.id,
        status: "pending",
        rejection_reason: null,
        business_name: formData.businessName,
      });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show status if application exists
  if (existingApplication) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              {existingApplication.status === "pending" && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Application Under Review
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Your application for "{existingApplication.business_name}" is currently being reviewed by our team. 
                    We'll notify you via email once a decision has been made.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Pending Review
                  </div>
                </>
              )}
              
              {existingApplication.status === "approved" && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full gradient-gold flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-brown-dark" />
                  </div>
                  <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Congratulations! 🎉
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Your provider application has been approved! You can now access your provider dashboard 
                    to manage your services and bookings.
                  </p>
                  <Button variant="gold" className="rounded-full" onClick={() => navigate("/provider/dashboard")}>
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
              
              {existingApplication.status === "rejected" && (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
                    Application Not Approved
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Unfortunately, your application was not approved at this time.
                  </p>
                  {existingApplication.rejection_reason && (
                    <div className="bg-destructive/10 rounded-lg p-4 mb-6 text-left">
                      <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
                      <p className="text-sm text-foreground">{existingApplication.rejection_reason}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    If you believe this was a mistake, please contact our support team.
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
              Become a Service Provider
            </h1>
            <p className="text-muted-foreground">
              Join our network of trusted professionals and grow your business
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s
                      ? "gradient-gold text-brown-dark"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card rounded-2xl p-8"
          >
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Basic Information</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your business or professional name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <select
                    id="category"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Languages Spoken</Label>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.languages.includes(lang)
                            ? "gradient-gold text-brown-dark"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full rounded-full"
                  onClick={() => setStep(2)}
                  disabled={!formData.businessName || !formData.categoryId}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Service Details</h2>

                <div className="space-y-2">
                  <Label htmlFor="description">About Your Services *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your services, experience, and what makes you unique..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Your business address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing">Pricing Information</Label>
                  <Textarea
                    id="pricing"
                    placeholder="e.g., Starting from ₹5,000 for basic packages..."
                    value={formData.pricingInfo}
                    onChange={(e) => setFormData({ ...formData, pricingInfo: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1 rounded-full"
                    onClick={() => setStep(3)}
                    disabled={!formData.description || !formData.city}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Upload Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Please upload your identity proof and any relevant certifications. This helps us verify your profile.
                </p>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="documents" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium text-foreground mb-1">Click to upload documents</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, JPG, or PNG (max 10MB each)
                    </p>
                  </label>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1 rounded-full"
                    onClick={handleSubmit}
                    disabled={loading || uploadedFiles.length === 0}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BecomeProvider;
