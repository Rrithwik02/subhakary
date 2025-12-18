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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const viewDocuments = (documents: any[]) => {
    setSelectedDocs(documents);
    setDocumentsDialogOpen(true);
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
  }: {
    provider: any;
    showActions?: boolean;
  }) => (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {provider.category?.icon || "🙏"}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {provider.business_name}
                </h3>
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
            </div>

            {provider.rejection_reason && (
              <p className="text-sm text-destructive mt-3">
                <strong>Rejection reason:</strong> {provider.rejection_reason}
              </p>
            )}
          </div>

          {showActions && provider.status === "pending" && (
            <div className="flex gap-2 lg:flex-col">
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
            </div>
          )}
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users">
                  Users ({allUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingProviders.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedProviders.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedProviders.length})
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
                        <ProviderCard provider={provider} />
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
                        <ProviderCard provider={provider} />
                      </motion.div>
                    ))}
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

      {/* Documents Dialog with Image Preview */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uploaded Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedDocs.map((doc) => {
              // Construct the full storage URL
              const storageUrl = doc.file_url.startsWith('http') 
                ? doc.file_url 
                : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/provider-documents/${doc.file_url}`;
              
              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.file_name);
              
              return (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg border border-border space-y-3"
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
                    <a
                      href={storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Open
                    </a>
                  </div>
                  {isImage && (
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
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
