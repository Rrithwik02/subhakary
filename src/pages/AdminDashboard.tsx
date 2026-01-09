import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
  Shield,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  UserCircle,
  BadgeCheck,
  BadgeX,
  Crown,
  Check,
  X,
  MessageSquare,
  RotateCcw,
  Layers,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProviderDetailDialog } from "@/components/AdminProviderDetailDialog";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  approved: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newAdminMessage, setNewAdminMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailProvider, setDetailProvider] = useState<any>(null);

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all provider applications
  const {
    data: providers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["all-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          category:service_categories(name, icon),
          documents:provider_documents(*)
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch all users/profiles
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch support tickets
  const { data: supportTickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          messages:support_ticket_messages(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch additional services pending verification
  const { data: additionalServices = [], refetch: refetchAdditionalServices } = useQuery({
    queryKey: ["admin-additional-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_services")
        .select(`
          *,
          provider:service_providers(id, business_name, user_id, category:service_categories(name, icon)),
          category:service_categories(name, icon),
          documents:provider_documents(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Filter documents to only include those for this additional service's category
      return (data || []).map((service: any) => ({
        ...service,
        documents: (service.documents || []).filter((doc: any) => 
          doc.service_category_id === service.category_id && 
          doc.document_type === 'additional_service_proof'
        )
      }));
    },
    enabled: isAdmin === true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleApprove = async (providerId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          status: "approved",
          is_verified: true,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", providerId);

      if (error) throw error;

      // Also add provider role to user
      const provider = providers.find((p) => p.id === providerId);
      if (provider) {
        await supabase.from("user_roles").upsert(
          {
            user_id: provider.user_id,
            role: "provider",
          },
          { onConflict: "user_id,role" }
        );
      }

      toast({
        title: "Provider approved",
        description: "The provider has been approved and notified.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProvider) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider);

      if (error) throw error;

      toast({
        title: "Provider rejected",
        description: "The provider has been notified of the rejection.",
      });
      setRejectDialogOpen(false);
      setSelectedProvider(null);
      setRejectionReason("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Revoke rejection / reinstate deleted provider
  const handleRevokeRejection = async (providerId: string) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      // Fetch the current provider record to decide whether this is a user-deletion reinstatement
      const { data: providerRow, error: providerFetchError } = await supabase
        .from("service_providers")
        .select("id, user_id, rejection_reason, status, is_verified")
        .eq("id", providerId)
        .single();

      if (providerFetchError) throw providerFetchError;

      const wasUserDeleted = (providerRow.rejection_reason || "").includes(
        "User deleted their provider account"
      );

      if (wasUserDeleted) {
        // Reinstate: restore to approved so the user doesn't see the "Provider Account Deleted" gate.
        const { error: reinstateError } = await supabase
          .from("service_providers")
          .update({
            status: "approved",
            rejection_reason: null,
            reviewed_at: new Date().toISOString(),
            is_verified: providerRow.is_verified ?? true,
          })
          .eq("id", providerId);

        if (reinstateError) throw reinstateError;

        // Ensure provider role exists (safe no-op if already present)
        await supabase.from("user_roles").upsert(
          {
            user_id: providerRow.user_id,
            role: "provider",
          },
          { onConflict: "user_id,role" }
        );

        // Log reinstatement in security_audit_log
        await supabase.from("security_audit_log").insert({
          user_id: user.id,
          action: "provider_reinstated",
          resource_type: "service_provider",
          resource_id: providerId,
          details: {
            provider_user_id: providerRow.user_id,
            reason: "Admin reinstated deleted provider account",
          },
        });

        toast({
          title: "Provider reinstated",
          description: "The provider can access their dashboard again.",
        });
      } else {
        // For normal rejections, just clear review fields so they can resubmit in the application flow.
        const { error } = await supabase
          .from("service_providers")
          .update({
            rejection_reason: null,
            reviewed_at: null,
          })
          .eq("id", providerId);

        if (error) throw error;

        // Log rejection revoke in security_audit_log
        await supabase.from("security_audit_log").insert({
          user_id: user.id,
          action: "rejection_revoked",
          resource_type: "service_provider",
          resource_id: providerId,
          details: {
            provider_user_id: providerRow.user_id,
            reason: "Admin revoked rejection to allow re-application",
          },
        });

        toast({
          title: "Rejection revoked",
          description: "The user can now resubmit their provider application.",
        });
      }

      refetch();
      refetchTickets();
    } catch (error: any) {
      console.error("Revoke rejection error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Support ticket handlers
  const openTicketChat = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketMessages(ticket.messages || []);
    setSupportChatOpen(true);
  };

  const sendAdminMessage = async () => {
    if (!newAdminMessage.trim() || !selectedTicket || !user) return;
    
    setSendingMessage(true);
    try {
      const { data: message, error } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: newAdminMessage.trim(),
          is_admin: true,
        })
        .select()
        .single();
      
      if (!error && message) {
        setTicketMessages([...ticketMessages, message]);
        setNewAdminMessage("");
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket || !user) return;

    const confirmed = window.confirm(
      "Mark this ticket as resolved and close it? You can still reopen the chat window without closing the ticket using the (X) button."
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        })
        .eq("id", selectedTicket.id);

      if (!error) {
        toast({ title: "Ticket closed" });
        setSupportChatOpen(false);
        setSelectedTicket(null);
        setTicketMessages([]);
        setNewAdminMessage("");
        refetchTickets();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVerification = async (providerId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          is_verified: !currentStatus,
        })
        .eq("id", providerId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Verification removed" : "Provider verified",
        description: currentStatus 
          ? "The provider's verified status has been removed." 
          : "The provider is now marked as verified.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePremium = async (providerId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          is_premium: !currentStatus,
        })
        .eq("id", providerId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Premium status removed" : "Premium status granted",
        description: currentStatus 
          ? "The provider is no longer a premium member." 
          : "The provider is now a premium member.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const viewDocuments = async (documents: any[]) => {
    // Generate signed URLs for private documents
    const docsWithSignedUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.file_url.startsWith('http')) {
          return doc;
        }
        // Create a signed URL for the private bucket
        const { data } = await supabase.storage
          .from('provider-documents')
          .createSignedUrl(doc.file_url, 3600); // 1 hour expiry
        return {
          ...doc,
          signed_url: data?.signedUrl || null
        };
      })
    );
    setSelectedDocs(docsWithSignedUrls);
    setDocumentsDialogOpen(true);
  };

  // Bulk verification handlers
  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const selectAllApproved = () => {
    const allApprovedIds = providers
      .filter((p) => p.status === "approved")
      .map((p) => p.id);
    setSelectedProviders(new Set(allApprovedIds));
  };

  const clearSelection = () => {
    setSelectedProviders(new Set());
  };

  const handleBulkVerify = async (verify: boolean) => {
    if (selectedProviders.size === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({ is_verified: verify })
        .in("id", Array.from(selectedProviders));

      if (error) throw error;

      toast({
        title: verify ? "Providers verified" : "Verification removed",
        description: `${selectedProviders.size} provider(s) have been ${verify ? "verified" : "unverified"}.`,
      });
      
      setSelectedProviders(new Set());
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Additional Services handlers
  const handleApproveAdditionalService = async (serviceId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("additional_services")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Service verified",
        description: "The additional service has been approved.",
      });
      refetchAdditionalServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAdditionalService = async (serviceId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("additional_services")
        .update({
          verification_status: "rejected",
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Service rejected",
        description: "The additional service has been rejected.",
        variant: "destructive",
      });
      refetchAdditionalServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const pendingProviders = providers.filter((p) => p.status === "pending");
  const approvedProviders = providers.filter((p) => p.status === "approved");
  const rejectedProviders = providers.filter((p) => p.status === "rejected");

  const getUserRole = (userId: string) => {
    const roles = userRoles.filter((r) => r.user_id === userId);
    if (roles.some((r) => r.role === "admin")) return "admin";
    if (roles.some((r) => r.role === "provider")) return "provider";
    return "user";
  };

  const roleColors = {
    admin: "bg-purple-500/10 text-purple-600 border-purple-200",
    provider: "bg-blue-500/10 text-blue-600 border-blue-200",
    user: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  const ProviderCard = ({
    provider,
    showActions = false,
    showVerificationToggle = false,
    showCheckbox = false,
  }: {
    provider: any;
    showActions?: boolean;
    showVerificationToggle?: boolean;
    showCheckbox?: boolean;
  }) => (
    <Card className={`hover-lift ${showCheckbox && selectedProviders.has(provider.id) ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-3">
              {showCheckbox && (
                <Checkbox
                  checked={selectedProviders.has(provider.id)}
                  onCheckedChange={() => toggleProviderSelection(provider.id)}
                  className="mt-1"
                />
              )}
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {provider.category?.icon || "🙏"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-semibold">
                    {provider.business_name}
                  </h3>
                  {/* Premium Badge */}
                  {provider.is_premium && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-bold rounded-md shadow-sm">
                      <Crown className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                  {/* Verification Badge */}
                  {provider.is_verified ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-medium rounded-md border border-green-500/30">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs font-medium rounded-md border border-yellow-500/30">
                      <BadgeX className="h-3 w-3" />
                      Not Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {provider.category?.name && (
                    <Badge variant="secondary" className="text-xs">
                      {provider.category.name}
                    </Badge>
                  )}
                  <Badge className={statusColors[provider.status as keyof typeof statusColors]}>
                    {provider.status}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {provider.description || "No description provided"}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {provider.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {provider.city}
                </span>
              )}
              {provider.experience_years > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {provider.experience_years}+ years
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Applied {format(new Date(provider.submitted_at), "PP")}
              </span>
              {provider.documents?.length > 0 && (
                <button
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={() => viewDocuments(provider.documents)}
                >
                  <FileText className="h-3 w-3" />
                  {provider.documents.length} document(s)
                </button>
              )}
              <button
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={() => {
                  setDetailProvider(provider);
                  setDetailDialogOpen(true);
                }}
              >
                <Eye className="h-3 w-3" />
                View Details
              </button>
            </div>

            {/* Admin-only: Show provider phone/WhatsApp for verification */}
            {provider.whatsapp_number && (
              <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4" />
                  Contact: <a href={`tel:${provider.whatsapp_number}`} className="underline hover:no-underline">{provider.whatsapp_number}</a>
                </p>
              </div>
            )}

            {/* Show phone verification notice for providers without documents */}
            {provider.status === "pending" && (!provider.documents || provider.documents.length === 0) && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <strong>No documents:</strong> Verify via phone call before approving
                  {provider.whatsapp_number && <span className="ml-1">({provider.whatsapp_number})</span>}
                </p>
              </div>
            )}

            {provider.rejection_reason && (
              <p className="text-sm text-destructive mt-3">
                <strong>Rejection reason:</strong> {provider.rejection_reason}
              </p>
            )}
          </div>

          <div className="flex gap-2 lg:flex-col">
            {/* Premium Toggle for approved providers */}
            {showVerificationToggle && provider.status === "approved" && (
              <Button
                size="sm"
                variant={provider.is_premium ? "outline" : "default"}
                className={provider.is_premium 
                  ? "border-amber-500/50 text-amber-600 hover:bg-amber-50" 
                  : "bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:from-amber-600 hover:to-yellow-500"}
                onClick={() => handleTogglePremium(provider.id, provider.is_premium)}
                disabled={isProcessing}
              >
                <Crown className="h-4 w-4 mr-1" />
                {provider.is_premium ? "Remove Premium" : "Make Premium"}
              </Button>
            )}

            {/* Verification Toggle for approved providers */}
            {showVerificationToggle && provider.status === "approved" && (
              <Button
                size="sm"
                variant={provider.is_verified ? "outline" : "default"}
                className={provider.is_verified ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                onClick={() => handleToggleVerification(provider.id, provider.is_verified)}
                disabled={isProcessing}
              >
                {provider.is_verified ? (
                  <>
                    <BadgeX className="h-4 w-4 mr-1" />
                    Remove Verified
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4 mr-1" />
                    Mark Verified
                  </>
                )}
              </Button>
            )}

            {/* Pending Actions */}
            {showActions && provider.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setRejectDialogOpen(true);
                  }}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="gradient-gold text-primary-foreground"
                  onClick={() => handleApprove(provider.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage provider applications and platform settings
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-3xl font-bold">{providers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingProviders.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {approvedProviders.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-red-600">
                    {rejectedProviders.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="users" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  Users ({allUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  Pending ({pendingProviders.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  Approved ({approvedProviders.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  Rejected ({rejectedProviders.length})
                </TabsTrigger>
                <TabsTrigger value="support" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  Support ({supportTickets.filter((t: any) => t.status === 'open').length})
                </TabsTrigger>
                <TabsTrigger value="additional-services" className="flex-1 min-w-[100px] text-xs sm:text-sm">
                  <Layers className="h-3 w-3 mr-1" />
                  Services ({additionalServices.filter((s: any) => s.verification_status === 'pending').length})
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="mt-6">
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : allUsers.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No users yet
                      </h3>
                      <p className="text-muted-foreground">
                        Users will appear here when they sign up
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {allUsers.map((profile, i) => {
                      const role = getUserRole(profile.user_id);
                      return (
                        <motion.div
                          key={profile.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card className="hover-lift">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    {profile.avatar_url ? (
                                      <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name || "User"}
                                        className="h-12 w-12 rounded-full object-cover"
                                      />
                                    ) : (
                                      <UserCircle className="h-8 w-8 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-display text-lg font-semibold">
                                      {profile.full_name || "Unnamed User"}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge className={roleColors[role as keyof typeof roleColors]}>
                                        {role}
                                      </Badge>
                                      {profile.city && (
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <MapPin className="h-3 w-3" />
                                          {profile.city}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                  {profile.email && (
                                    <span className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      {profile.email}
                                    </span>
                                  )}
                                  {profile.phone && (
                                    <span className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      {profile.phone}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Joined {format(new Date(profile.created_at), "PP")}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : pendingProviders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No pending applications
                      </h3>
                      <p className="text-muted-foreground">
                        All provider applications have been reviewed
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingProviders.map((provider, i) => (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ProviderCard provider={provider} showActions />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 inline mr-1 text-green-600" />
                      <strong>Tip:</strong> Select multiple providers for bulk verification actions.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedProviders.size > 0 && (
                        <span className="text-sm text-primary font-medium">
                          {selectedProviders.size} selected
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={approvedProviders.length === selectedProviders.size ? clearSelection : selectAllApproved}
                        disabled={approvedProviders.length === 0}
                      >
                        {approvedProviders.length === selectedProviders.size ? "Deselect All" : "Select All"}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleBulkVerify(true)}
                        disabled={selectedProviders.size === 0 || isProcessing}
                      >
                        <BadgeCheck className="h-4 w-4 mr-1" />
                        Verify Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkVerify(false)}
                        disabled={selectedProviders.size === 0 || isProcessing}
                      >
                        <BadgeX className="h-4 w-4 mr-1" />
                        Unverify Selected
                      </Button>
                    </div>
                  </div>
                </div>
                {approvedProviders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No approved providers
                      </h3>
                      <p className="text-muted-foreground">
                        Approved providers will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {approvedProviders.map((provider, i) => (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ProviderCard provider={provider} showVerificationToggle showCheckbox />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {rejectedProviders.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No rejected applications
                      </h3>
                      <p className="text-muted-foreground">
                        Rejected applications will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {rejectedProviders.map((provider, i) => (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="hover-lift">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-4 mb-3">
                                  <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-2xl flex-shrink-0">
                                    {provider.category?.icon || "🙏"}
                                  </div>
                                  <div>
                                    <h3 className="font-display text-lg font-semibold">
                                      {provider.business_name}
                                    </h3>
                                    <Badge className={statusColors.rejected}>
                                      Rejected
                                    </Badge>
                                  </div>
                                </div>
                                {provider.rejection_reason && (
                                  <p className="text-sm text-destructive mb-3">
                                    <strong>Reason:</strong> {provider.rejection_reason}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  Applied {format(new Date(provider.submitted_at), "PP")}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeRejection(provider.id)}
                                disabled={isProcessing}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {(provider.rejection_reason || "").includes("User deleted their provider account")
                                  ? "Reinstate Provider"
                                  : "Revoke (Allow Re-apply)"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Support Tickets Tab */}
              <TabsContent value="support" className="mt-6">
                {supportTickets.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No support tickets
                      </h3>
                      <p className="text-muted-foreground">
                        Support tickets from rejected providers will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket: any, i: number) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="hover-lift">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                  <h3 className="font-medium">{ticket.subject}</h3>
                                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                                    {ticket.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.messages?.length || 0} messages • Created {format(new Date(ticket.created_at), "PP")}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openTicketChat(ticket)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Chat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Additional Services Tab */}
              <TabsContent value="additional-services" className="mt-6">
                {additionalServices.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No additional services
                      </h3>
                      <p className="text-muted-foreground">
                        Additional service requests from providers will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Pending services first */}
                    {additionalServices.filter((s: any) => s.verification_status === 'pending').length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          Pending Verification ({additionalServices.filter((s: any) => s.verification_status === 'pending').length})
                        </h3>
                        <div className="space-y-3">
                          {additionalServices
                            .filter((s: any) => s.verification_status === 'pending')
                            .map((service: any, i: number) => (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Card className="hover-lift border-yellow-500/30">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                                            {service.category?.icon || "📋"}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold">{service.service_type}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              by {service.provider?.business_name || 'Unknown Provider'}
                                            </p>
                                          </div>
                                          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                                            Pending
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {service.description}
                                        </p>
                                        {service.documents?.length > 0 && (
                                          <button
                                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                                            onClick={() => viewDocuments(service.documents)}
                                          >
                                            <FileText className="h-3 w-3" />
                                            {service.documents.length} proof document(s)
                                          </button>
                                        )}
                                        {(!service.documents || service.documents.length === 0) && (
                                          <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            No proof documents uploaded
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRejectAdditionalService(service.id)}
                                          disabled={isProcessing}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="gradient-gold text-primary-foreground"
                                          onClick={() => handleApproveAdditionalService(service.id)}
                                          disabled={isProcessing}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Verified services */}
                    {additionalServices.filter((s: any) => s.verification_status === 'verified').length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          Verified ({additionalServices.filter((s: any) => s.verification_status === 'verified').length})
                        </h3>
                        <div className="space-y-3">
                          {additionalServices
                            .filter((s: any) => s.verification_status === 'verified')
                            .map((service: any, i: number) => (
                              <Card key={service.id} className="border-green-500/30">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-xl">
                                        {service.category?.icon || "📋"}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">{service.service_type}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          by {service.provider?.business_name || 'Unknown Provider'}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-600 border-green-200">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected services */}
                    {additionalServices.filter((s: any) => s.verification_status === 'rejected').length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          Rejected ({additionalServices.filter((s: any) => s.verification_status === 'rejected').length})
                        </h3>
                        <div className="space-y-3">
                          {additionalServices
                            .filter((s: any) => s.verification_status === 'rejected')
                            .map((service: any) => (
                              <Card key={service.id} className="border-red-500/30">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-xl">
                                        {service.category?.icon || "📋"}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">{service.service_type}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          by {service.provider?.business_name || 'Unknown Provider'}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="destructive">
                                      Rejected
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Incomplete documents, Invalid credentials, Insufficient experience..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog with Image Preview and Verification */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Business Proof Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedDocs.map((doc) => {
              const storageUrl = doc.signed_url || doc.file_url;
              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.file_name);
              
              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border border-border space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {doc.document_type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        doc.verification_status === 'verified' ? 'default' :
                        doc.verification_status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {doc.verification_status || 'pending'}
                      </Badge>
                      {storageUrl && (
                        <a
                          href={storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {isImage && storageUrl && (
                    <div className="border rounded-lg overflow-hidden bg-muted/30">
                      <img
                        src={storageUrl}
                        alt={doc.file_name}
                        className="w-full max-h-80 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {doc.rejection_reason && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      Rejection reason: {doc.rejection_reason}
                    </div>
                  )}

                  {/* Verification Actions */}
                  {doc.verification_status !== 'verified' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('provider_documents')
                            .update({
                              verification_status: 'verified',
                              verified_at: new Date().toISOString(),
                              verified_by: user?.id,
                              rejection_reason: null
                            })
                            .eq('id', doc.id);
                          if (!error) {
                            toast({ title: "Document verified" });
                            setDocumentsDialogOpen(false);
                            refetch();
                          }
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Verify Document
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={async () => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) {
                            const { error } = await supabase
                              .from('provider_documents')
                              .update({
                                verification_status: 'rejected',
                                rejection_reason: reason
                              })
                              .eq('id', doc.id);
                            if (!error) {
                              toast({ title: "Document rejected", variant: "destructive" });
                              setDocumentsDialogOpen(false);
                              refetch();
                            }
                          }
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Chat Dialog */}
      <Dialog
        open={supportChatOpen}
        onOpenChange={(open) => {
          setSupportChatOpen(open);
          if (!open) {
            // Closing the window should NOT close the ticket.
            setSelectedTicket(null);
            setTicketMessages([]);
            setNewAdminMessage("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Support Chat
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {ticketMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet.
                  </p>
                ) : (
                  ticketMessages.map((msg: any, i: number) => (
                    <div
                      key={msg.id || i}
                      className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.is_admin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            {selectedTicket?.status === 'open' ? (
              <div className="space-y-2 mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newAdminMessage}
                    onChange={(e) => setNewAdminMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendAdminMessage()}
                  />
                  <Button onClick={sendAdminMessage} disabled={sendingMessage || !newAdminMessage.trim()}>
                    Send
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={closeTicket}
                  disabled={isProcessing}
                >
                  Mark as Resolved (Close Ticket)
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-4 border-t mt-4">
                This ticket is closed.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Detail Dialog */}
      <AdminProviderDetailDialog
        provider={detailProvider}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <Footer />
    </div>
  );
};

export default AdminDashboard;
