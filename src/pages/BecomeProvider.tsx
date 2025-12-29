import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle,
  ChevronRight,
  X,
  MessageSquare
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StateCitySelect } from "@/components/StateCitySelect";
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
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [existingTicket, setExistingTicket] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    categoryId: "",
    description: "",
    experienceYears: "",
    languages: [] as string[],
    state: "",
    city: "",
    address: "",
    pricingInfo: "",
  });
  const [isResubmitting, setIsResubmitting] = useState(false);

  const languageOptions = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"];

  // Categories that don't require document verification (priests, poojaris, etc.)
  const noDocumentCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes("priest") || 
      cat.name.toLowerCase().includes("poojari") ||
      cat.name.toLowerCase().includes("pandit") ||
      cat.slug.toLowerCase().includes("priest") ||
      cat.slug.toLowerCase().includes("poojari") ||
      cat.slug.toLowerCase().includes("pandit")
    ).map(cat => cat.id);
  }, [categories]);

  const isDocumentRequired = useMemo(() => {
    return !noDocumentCategories.includes(formData.categoryId);
  }, [formData.categoryId, noDocumentCategories]);

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
    
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, status, rejection_reason, business_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data && !error) {
        setExistingApplication(data as ProviderApplication);
        
        // Check for existing support ticket if rejected
        if (data.status === 'rejected') {
          const { data: ticket } = await supabase
            .from("support_tickets")
            .select("*, messages:support_ticket_messages(*)")
            .eq("provider_application_id", data.id)
            .eq("status", "open")
            .maybeSingle();
          
          if (ticket) {
            setExistingTicket(ticket);
            setSupportMessages(ticket.messages || []);
          }
        }
      } else {
        setExistingApplication(null);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Subscribe to realtime updates on the provider application status
  useEffect(() => {
    if (!user || !existingApplication?.id) return;

    const channel = supabase
      .channel('provider-application-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_providers',
          filter: `id=eq.${existingApplication.id}`,
        },
        (payload) => {
          // Update local state with the new status
          setExistingApplication((prev) => prev ? {
            ...prev,
            status: payload.new.status,
            rejection_reason: payload.new.rejection_reason,
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, existingApplication?.id]);

  const openSupportChat = async () => {
    if (!user || !existingApplication) return;
    
    // Check if ticket already exists
    if (existingTicket) {
      setSupportChatOpen(true);
      return;
    }
    
    // Create new support ticket
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        provider_application_id: existingApplication.id,
        subject: `Support for rejected application: ${existingApplication.business_name}`,
      })
      .select()
      .single();
    
    if (!error && ticket) {
      setExistingTicket(ticket);
      setSupportChatOpen(true);
    }
  };

  const sendSupportMessage = async () => {
    if (!newMessage.trim() || !existingTicket || !user) return;
    
    setSendingMessage(true);
    try {
      const { data: message, error } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: existingTicket.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_admin: false,
        })
        .select()
        .single();
      
      if (!error && message) {
        setSupportMessages([...supportMessages, message]);
        setNewMessage("");
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!existingTicket) return;
    
    const channel = supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${existingTicket.id}`,
        },
        (payload) => {
          setSupportMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [existingTicket]);

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
      let providerId: string;

      // If resubmitting a rejected application, UPDATE instead of delete+insert
      if (isResubmitting && existingApplication) {
        // Delete old documents first
        await supabase
          .from("provider_documents")
          .delete()
          .eq("provider_id", existingApplication.id);
        
        // Update existing application
        const { data: updatedProvider, error: updateError } = await supabase
          .from("service_providers")
          .update({
            business_name: formData.businessName,
            category_id: formData.categoryId || null,
            description: formData.description,
            experience_years: parseInt(formData.experienceYears) || 0,
            languages: formData.languages,
            city: formData.city,
            address: formData.address,
            pricing_info: formData.pricingInfo,
            status: "pending",
            rejection_reason: null,
            reviewed_at: null,
          })
          .eq("id", existingApplication.id)
          .select()
          .single();

        if (updateError) throw updateError;
        providerId = updatedProvider.id;
      } else {
        // Create new provider application
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
        providerId = provider.id;
      }

      // Upload documents (if any)
      for (const file of uploadedFiles) {
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
          provider_id: providerId,
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
        id: providerId,
        status: "pending",
        rejection_reason: null,
        business_name: formData.businessName,
      });
      setIsResubmitting(false);
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

  // Show status if application exists and not resubmitting
  if (existingApplication && !isResubmitting) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              key={existingApplication.status}
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4"
                    onClick={checkExistingApplication}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh Status"}
                  </Button>
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
                    Unfortunately, your application was not approved at this time. You can update your documents and resubmit.
                  </p>
                  {existingApplication.rejection_reason && (
                    <div className="bg-destructive/10 rounded-lg p-4 mb-6 text-left">
                      <p className="text-sm font-medium text-destructive mb-1">Feedback:</p>
                      <p className="text-sm text-foreground">{existingApplication.rejection_reason}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Button
                      variant="gold"
                      className="w-full rounded-full"
                      onClick={() => {
                        setIsResubmitting(true);
                        setFormData({
                          businessName: existingApplication.business_name,
                          categoryId: "",
                          description: "",
                          experienceYears: "",
                          languages: [],
                          state: "",
                          city: "",
                          address: "",
                          pricingInfo: "",
                        });
                        setUploadedFiles([]);
                        setStep(1);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Resubmit Application
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={openSupportChat}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support Team
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Address the feedback above and resubmit, or chat with our support team.
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Support Chat Dialog */}
        <Dialog open={supportChatOpen} onOpenChange={setSupportChatOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Support Chat
              </DialogTitle>
              <DialogDescription>
                Chat with our support team about your application.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col h-[400px]">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {supportMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages yet. Start a conversation with our support team.
                    </p>
                  ) : (
                    supportMessages.map((msg, i) => (
                      <div
                        key={msg.id || i}
                        className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.is_admin
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {existingTicket?.status === 'open' ? (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendSupportMessage()}
                  />
                  <Button onClick={sendSupportMessage} disabled={sendingMessage || !newMessage.trim()}>
                    Send
                  </Button>
                </div>
              ) : existingTicket ? (
                <p className="text-sm text-muted-foreground text-center pt-4 border-t mt-4">
                  This conversation has been closed.
                </p>
              ) : (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendSupportMessage()}
                  />
                  <Button onClick={sendSupportMessage} disabled={sendingMessage || !newMessage.trim()}>
                    Send
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
                    placeholder="e.g., Sri Lakshmi Decorations, Venkat Photography"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your registered business name exactly as it appears on your documents
                  </p>
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
                    min="0"
                    max="50"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How many years have you been providing this service?
                  </p>
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

                <StateCitySelect
                  selectedState={formData.state}
                  selectedCity={formData.city}
                  onStateChange={(state) => setFormData({ ...formData, state })}
                  onCityChange={(city) => setFormData({ ...formData, city })}
                />

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
                  <Label htmlFor="pricing">Pricing Information *</Label>
                  <Textarea
                    id="pricing"
                    placeholder="e.g., ₹2,000 - ₹20,000 (depending on event size and requirements)"
                    value={formData.pricingInfo}
                    onChange={(e) => setFormData({ ...formData, pricingInfo: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a price range like "₹5,000 - ₹50,000" or describe your packages
                  </p>
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
                {isDocumentRequired ? (
                  <>
                    <h2 className="font-display text-xl font-semibold">Upload Business Proof Document</h2>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">Upload ONE of the following:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>GST Certificate</li>
                        <li>Shop Act License</li>
                        <li>Trade License</li>
                        <li>Business Registration Certificate</li>
                      </ul>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        ⚠️ The business name on the document must match "{formData.businessName || 'your business name'}"
                      </p>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadedFiles.length >= 1}
                      />
                      <label htmlFor="documents" className={`cursor-pointer ${uploadedFiles.length >= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium text-foreground mb-1">
                          {uploadedFiles.length >= 1 ? 'Document uploaded' : 'Click to upload document'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, JPG, or PNG (max 10MB)
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
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-semibold">Review & Submit</h2>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✅ <strong>No document required</strong> for Priests/Poojaris. Our team will verify your application through a phone call.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">Application Summary:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li><strong>Business:</strong> {formData.businessName}</li>
                        <li><strong>Location:</strong> {formData.city}, {formData.state}</li>
                        <li><strong>Experience:</strong> {formData.experienceYears || "Not specified"} years</li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1 rounded-full"
                    onClick={handleSubmit}
                    disabled={loading || (isDocumentRequired && uploadedFiles.length === 0)}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setTermsDialogOpen(true)}
                  >
                    Terms of Service
                  </button>{" "}
                  and Privacy Policy.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Terms of Service Dialog */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>
              Please read our terms carefully before registering.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none space-y-6">
              <section>
                <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground text-sm">
                  By accessing and using Subhakary's website and services, you agree to be bound by these Terms of Service.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">2. Service Provider Terms</h3>
                <p className="text-muted-foreground text-sm">
                  If you register as a service provider, you additionally agree to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Provide accurate information about your services, qualifications, and pricing</li>
                  <li>Maintain all necessary licenses and certifications</li>
                  <li>Deliver services as described and agreed upon with customers</li>
                  <li>Respond to booking requests and inquiries in a timely manner</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not engage in fraudulent or misleading practices</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">3. Document Verification</h3>
                <p className="text-muted-foreground text-sm">
                  All documents submitted must be authentic and belong to you or your registered business. 
                  Submission of fraudulent documents will result in permanent ban from the platform.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">4. Booking and Payments</h3>
                <p className="text-muted-foreground text-sm">
                  Payment terms are agreed upon between you and the customer. Some bookings may require advance payments. 
                  All payments are processed securely through our payment partners.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">5. Reviews and Ratings</h3>
                <p className="text-muted-foreground text-sm">
                  Users may leave reviews and ratings for service providers. Service providers may not incentivize 
                  or manipulate reviews in any way.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">6. Termination</h3>
                <p className="text-muted-foreground text-sm">
                  We reserve the right to suspend or terminate your account at any time for violation of these terms 
                  or for any other reason at our discretion.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground">7. Contact</h3>
                <p className="text-muted-foreground text-sm">
                  For questions about these Terms of Service, please contact us at legal@subhakary.com
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>


      <Footer />
    </>
  );
};

export default BecomeProvider;
