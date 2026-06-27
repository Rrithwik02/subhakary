import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
  Sparkles,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/wedding-planner";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeddingRecord {
  id: string;
  title: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  total_budget: number;
  city: string;
  location: string | null;
  guest_count: number;
  wedding_type: string;
  cultural_preferences: string[];
}

const WeddingDashboard = () => {
  const { weddingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for Manual Expense Form
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseNotes, setExpenseNotes] = useState("");

  // State for Collaborator Invite link
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("parent");
  const [invitePerm, setInvitePerm] = useState("edit");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding-dashboard", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings" as any)
        .select("*")
        .eq("id", weddingId)
        .single();

      if (error) throw error;
      return data as WeddingRecord;
    },
    enabled: !!weddingId && !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["wedding-events", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_events" as any)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["wedding-tasks", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_tasks" as any)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: budgetItems = [] } = useQuery({
    queryKey: ["wedding-budget-items", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_budget_items" as any)
        .select("*")
        .eq("wedding_id", weddingId);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ["wedding-requirements", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_event_vendor_requirements" as any)
        .select(`
          *,
          wedding_event:wedding_events!wedding_event_vendor_requirements_wedding_event_id_fkey(id, wedding_id, title)
        `)
        .in("wedding_event_id", events.map((event) => event.id));

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user && events.length > 0,
  });

  const { data: linkedBookings = [] } = useQuery({
    queryKey: ["wedding-linked-bookings", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          wedding_event_id,
          total_amount,
          service_date,
          provider:service_providers(
            id,
            business_name,
            base_price,
            city,
            is_premium,
            is_verified,
            category:service_categories(name, slug)
          )
        `)
        .eq("user_id", user!.id)
        .eq("wedding_id", weddingId)
        .order("service_date", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: recommendedProviders = [] } = useQuery({
    queryKey: ["wedding-recommendations", weddingId, wedding?.city],
    queryFn: async () => {
      const requirementSlugs = Array.from(
        new Set(
          requirements
            .map((requirement) => requirement.category_slug)
            .filter((slug) => slug && !linkedBookings.some((booking) => booking.provider?.category?.slug === slug))
        )
      ).slice(0, 4);

      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          id,
          business_name,
          city,
          rating,
          total_reviews,
          base_price,
          is_premium,
          is_verified,
          category:service_categories(name, slug)
        `)
        .eq("status", "approved")
        .order("rating", { ascending: false });

      if (error) throw error;

      return ((data || []) as any[])
        .filter((provider) => {
          const matchesCategory = requirementSlugs.length === 0 || requirementSlugs.includes(provider.category?.slug);
          const matchesCity = !wedding?.city || provider.city?.toLowerCase().includes(wedding.city.toLowerCase());
          return matchesCategory && matchesCity;
        })
        .slice(0, 8);
    },
    enabled: !!weddingId && !!user && !!wedding,
  });

  // Fetch Manual Expenses
  const { data: manualExpenses = [] } = useQuery({
    queryKey: ["wedding-manual-expenses", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_manual_expenses")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("spent_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  // Fetch Wedding Collaborators
  const { data: members = [] } = useQuery({
    queryKey: ["wedding-members", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_members" as any)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("role", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  // Mutation to Log Manual Expense
  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!expenseName.trim() || !expenseAmount) return;
      const { error } = await supabase
        .from("wedding_manual_expenses")
        .insert({
          wedding_id: weddingId,
          category_name: expenseName.trim(),
          amount: parseFloat(expenseAmount),
          spent_at: expenseDate,
          notes: expenseNotes.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Expense logged",
        description: "The expense has been added to your ledger.",
      });
      setIsExpenseOpen(false);
      setExpenseName("");
      setExpenseAmount("");
      setExpenseNotes("");
      queryClient.invalidateQueries({ queryKey: ["wedding-manual-expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["wedding-dashboard", weddingId] });
    },
    onError: (error: any) => {
      toast({
        title: "Logging failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to Delete Manual Expense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wedding_manual_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense was removed from your ledger.",
      });
      queryClient.invalidateQueries({ queryKey: ["wedding-manual-expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["wedding-dashboard", weddingId] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to Generate Invitation Link
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const code = "INV-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from("wedding_invitations")
        .insert({
          wedding_id: weddingId,
          invite_code: code,
          role: inviteRole,
          permission_level: invitePerm,
          expires_at: expiresAt.toISOString(),
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const link = `${window.location.origin}/wedding/join/${data.invite_code}`;
      setGeneratedLink(link);
      toast({
        title: "Link Generated",
        description: "Copy and share the invitation link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const dashboard = useMemo(() => {
    const totalBudget = Number(wedding?.total_budget || 0);
    const plannedSpend = budgetItems.reduce((sum, item) => sum + Number(item.planned_amount || 0), 0);
    
    // Sum platform vendor bookings + manual ledger expenses
    const manualSpend = manualExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const actualSpend = linkedBookings.reduce((sum, booking) => {
      return sum + Number(booking.total_amount || booking.provider?.base_price || 0);
    }, 0) + manualSpend;

    const categoryBreakdown = budgetItems
      .map((item) => {
        const actual = linkedBookings
          .filter((booking) => booking.provider?.category?.slug === item.category_slug)
          .reduce((sum, booking) => sum + Number(booking.total_amount || booking.provider?.base_price || 0), 0);

        return {
          slug: item.category_slug,
          name: item.category_name,
          planned: Number(item.planned_amount || 0),
          actual,
        };
      })
      .sort((a, b) => b.planned - a.planned);

    const progressByCategory = requirements.reduce((acc, requirement) => {
      const current = acc.get(requirement.category_slug) || {
        slug: requirement.category_slug,
        name: requirement.category_name,
        required: 0,
        booked: 0,
      };

      current.required += Number(requirement.required_count || 0);
      current.booked = linkedBookings.filter(
        (booking) => booking.provider?.category?.slug === requirement.category_slug
      ).length;
      acc.set(requirement.category_slug, current);
      return acc;
    }, new Map<string, { slug: string; name: string; required: number; booked: number }>());

    const upcomingTasks = tasks
      .filter((task) => task.status !== "done")
      .slice(0, 6);

    const timeline = [...events].sort((a, b) => {
      const aDate = a.event_date ? new Date(a.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.event_date ? new Date(b.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    return {
      totalBudget,
      plannedSpend,
      actualSpend,
      manualSpend,
      remainingBudget: Math.max(totalBudget - actualSpend, 0),
      categoryBreakdown,
      progressByCategory: Array.from(progressByCategory.values()),
      upcomingTasks,
      timeline,
    };
  }, [budgetItems, events, linkedBookings, requirements, tasks, wedding, manualExpenses]);

  const tagRecommendation = (provider: any) => {
    if (provider.is_premium) return "Premium Choice";
    if (provider.base_price && provider.base_price < dashboard.totalBudget * 0.08) return "Best Value";
    if (provider.city?.toLowerCase() === wedding?.city?.toLowerCase()) return "Near You";
    return "AI Recommended";
  };

  if (authLoading || weddingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { Heart, Calendar, MapPin, IndianRupee, CheckCircle2, Clock, Plus, ArrowRight, Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  status: string;
  sort_order: number;
  is_default?: boolean;
};

type Booking = {
  id: string;
  status: string;
  service_date: string;
  total_amount: number | null;
  provider_id: string;
  service_providers?: { business_name: string; category_id: string | null; category?: { name: string | null } | null } | null;
};

type BudgetCategory = {
  id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
};

const normalizePlanningCategory = (name?: string | null) => {
  const value = (name || "").toLowerCase();
  if (value.includes("photo") || value.includes("video")) return "Photography";
  if (value.includes("cater")) return "Catering";
  if (value.includes("decor")) return "Decor";
  if (value.includes("function") || value.includes("venue") || value.includes("hall")) return "Venue";
  if (value.includes("makeup") || value.includes("mehndi")) return "Makeup and Mehndi";
  if (value.includes("music") || value.includes("mangala") || value.includes("dj")) return "Music and Entertainment";
  if (value.includes("pandit") || value.includes("priest") || value.includes("pooj")) return "Pandit";
  return name || "Other vendors";
};

const WeddingDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { event, loading: eventLoading, refetch } = useWeddingEvent(searchParams.get("event"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [budgetSpent, setBudgetSpent] = useState(0);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("pending");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("planning");
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/wedding-dashboard");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!event) return;
    (async () => {
      const [{ data: t }, { data: b }, { data: c }] = await Promise.all([
        supabase.from("wedding_tasks").select("*").eq("event_id", event.id).order("sort_order"),
        supabase
          .from("bookings")
          .select("id,status,service_date,total_amount,provider_id,service_providers(business_name,category_id,category:service_categories(name))")
          .eq("user_id", user!.id)
          .eq("event_id", event.id),
        supabase.from("wedding_budget_categories").select("*").eq("event_id", event.id).order("planned_amount", { ascending: false }),
      ]);
      setTasks((t as Task[]) ?? []);
      const bks = (b as Booking[]) ?? [];
      setBookings(bks);
      setBudgetCategories((c as BudgetCategory[]) ?? []);
      const spent = bks
        .filter((x) => ["accepted", "completed"].includes(x.status))
        .reduce((s, x) => s + (Number(x.total_amount) || 0), 0);
      setBudgetSpent(spent);
    })();
  }, [event, user]);

  const updateProgress = async (eventId: string, newTasks: Task[]) => {
    const completed = newTasks.filter((t) => t.status === "completed").length;
    const taskPct = newTasks.length ? (completed / newTasks.length) * 55 : 0;
    const bookedCategories = new Set(acceptedBookings.map((b) => b.service_providers?.category?.name).filter(Boolean)).size;
    const vendorPct = Math.min(25, bookedCategories * 5);
    const budgetPct = event?.total_budget ? Math.min(20, (budgetSpent / Number(event.total_budget)) * 20) : 0;
    const pct = Math.min(100, Math.round(taskPct + vendorPct + budgetPct));
    await supabase.from("wedding_events").update({ progress_percent: pct }).eq("id", eventId);
    refetch();
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("wedding_tasks")
      .update({ status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (error) {
      toast.error("Could not update task");
      return;
    }
    const updated = tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t));
    setTasks(updated);
    if (event) updateProgress(event.id, updated);
  };

  const addTask = async () => {
    if (!event || !newTaskTitle.trim()) return;
    const { data, error } = await supabase
      .from("wedding_tasks")
      .insert({
        event_id: event.id,
        title: newTaskTitle.trim(),
        category: newTaskCategory || null,
        due_date: newTaskDueDate || null,
        sort_order: tasks.length + 1,
        is_default: false,
      })
      .select()
      .single();
    if (error) {
      toast.error("Could not add task");
      return;
    }
    const updated = [...tasks, data as Task];
    setTasks(updated);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    updateProgress(event.id, updated);
  };

  const deleteTask = async (taskId: string) => {
    if (!event) return;
    const { error } = await supabase.from("wedding_tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Could not delete task");
      return;
    }
    const updated = tasks.filter((task) => task.id !== taskId);
    setTasks(updated);
    updateProgress(event.id, updated);
  };

  const saveBudget = async (category: BudgetCategory) => {
    const planned = Number(editingBudget[category.id] ?? category.planned_amount);
    const { error } = await supabase
      .from("wedding_budget_categories")
      .update({ planned_amount: Number.isFinite(planned) ? planned : 0 })
      .eq("id", category.id);
    if (error) {
      toast.error("Could not update budget");
      return;
    }
    setBudgetCategories((rows) => rows.map((row) => row.id === category.id ? { ...row, planned_amount: planned } : row));
    toast.success("Budget updated");
  };

  const syncActualSpend = async () => {
    const updates = budgetCategories.map((category) => {
      const actual = acceptedBookings
        .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0);
      return supabase.from("wedding_budget_categories").update({ actual_amount: actual }).eq("id", category.id);
    });
    await Promise.all(updates);
    setBudgetCategories((rows) => rows.map((category) => ({
      ...category,
      actual_amount: acceptedBookings
        .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0),
    })));
    toast.success("Actual spend synced from accepted bookings");
  };

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-16 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl font-semibold">Wedding not found</h1>
            <p className="text-muted-foreground mt-3">
              This dashboard does not exist yet, so let&apos;s create a new one.
            </p>
            <Button variant="gold" className="mt-6" onClick={() => navigate("/wedding/new")}>
              Create Wedding Dashboard
            </Button>
          </div>
        </section>
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Wedding Dashboard | Subhakary" description="Your single source of truth for planning your wedding." />
        <Navbar />
        <main className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Start your Wedding Plan</h1>
          <p className="text-muted-foreground mb-6">
            Tell us a bit about your wedding and we'll set up your dashboard, checklist and budget.
          </p>
          <Button size="lg" onClick={() => navigate("/plan-wedding")}>
            Plan my wedding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" className="mb-5" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {wedding.wedding_type}
                  </Badge>
                  <Badge variant="outline">
                    {wedding.guest_count} guests
                  </Badge>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-semibold mt-3">
                  {wedding.title}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-3xl">
                  {wedding.bride_name} and {wedding.groom_name} are planning a {wedding.wedding_type} wedding in {wedding.city}.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {wedding.wedding_date ? format(new Date(wedding.wedding_date), "PPP") : "Date to be finalized"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {wedding.location || wedding.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {wedding.cultural_preferences?.join(", ") || "Custom rituals"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/wedding/new">
                  <Button variant="outline">New Wedding</Button>
                </Link>
                {events[0] && (
                  <Link to={`/wedding/${wedding.id}/events/${events[0].id}`}>
                    <Button variant="gold">Open Event Workspace</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.totalBudget)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Planned Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.plannedSpend)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Actual Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.actualSpend)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.remainingBudget)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className="space-y-6">
                {/* Budget Overview Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Budget Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboard.categoryBreakdown.length === 0 ? (
                      <p className="text-muted-foreground">Budget categories will appear here once your planner is initialized.</p>
                    ) : (
                      dashboard.categoryBreakdown.map((item) => (
                        <div key={item.slug} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Planned {formatCurrency(item.planned)} | Actual {formatCurrency(item.actual)}
                              </p>
                            </div>
                            <Badge variant={item.actual > item.planned ? "destructive" : "secondary"}>
                              {item.planned > 0 ? `${Math.min(Math.round((item.actual / item.planned) * 100), 999)}%` : "0%"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Manual Expenses Ledger Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="font-display text-2xl">Manual Expenses Ledger</CardTitle>
                      <CardDescription>Expenses paid outside of the platform (attire, jewelry, offline bookings, etc.)</CardDescription>
                    </div>
                    <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                      <DialogTrigger asChild>
                        <Button variant="gold" size="sm" className="rounded-full shrink-0">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Log Expense
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Log Manual Expense</DialogTitle>
                          <DialogDescription>
                            Keep track of offline wedding purchases. This will be added to your actual spent total.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="expenseName">Expense Category / Item Name</Label>
                            <Input
                              id="expenseName"
                              placeholder="e.g. Bridal Lehengha, Gold jewelry, Invitations"
                              value={expenseName}
                              onChange={(e) => setExpenseName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expenseAmount">Amount (INR)</Label>
                            <Input
                              id="expenseAmount"
                              type="number"
                              placeholder="e.g. 50000"
                              value={expenseAmount}
                              onChange={(e) => setExpenseAmount(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expenseDate">Date Spent</Label>
                            <Input
                              id="expenseDate"
                              type="date"
                              value={expenseDate}
                              onChange={(e) => setExpenseDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expenseNotes">Notes (Optional)</Label>
                            <Input
                              id="expenseNotes"
                              placeholder="e.g. Purchased from designer boutique"
                              value={expenseNotes}
                              onChange={(e) => setExpenseNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsExpenseOpen(false)}>Cancel</Button>
                          <Button variant="gold" onClick={() => addExpenseMutation.mutate()} disabled={addExpenseMutation.isPending || !expenseName || !expenseAmount}>
                            {addExpenseMutation.isPending ? "Logging..." : "Log Expense"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {manualExpenses.length === 0 ? (
                      <p className="text-muted-foreground py-4 text-center">No manual expenses logged yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {manualExpenses.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between rounded-2xl border p-4">
                            <div>
                              <p className="font-medium">{expense.category_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {expense.spent_at ? format(new Date(expense.spent_at), "MMM dd, yyyy") : "Date unknown"}
                                {expense.notes && ` • ${expense.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-foreground">{formatCurrency(expense.amount)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                disabled={deleteExpenseMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vendor Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Vendor Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.progressByCategory.length === 0 ? (
                      <p className="text-muted-foreground">Vendor requirement tracking will appear after event setup.</p>
                    ) : (
                      dashboard.progressByCategory.map((progress) => (
                        <div key={progress.slug} className="flex items-center justify-between rounded-2xl border p-4">
                          <div>
                            <p className="font-medium">{progress.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {progress.booked}/{progress.required} booked
                            </p>
                          </div>
                          <Badge variant={progress.booked >= progress.required ? "secondary" : "outline"}>
                            {progress.booked >= progress.required ? "Ready" : "Pending"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Wedding Events Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-display text-2xl">Wedding Events</CardTitle>
                    {events[0] && (
                      <Link to={`/wedding/${wedding.id}/events/${events[0].id}`}>
                        <Button variant="outline" size="sm">Open Workspace</Button>
                      </Link>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.timeline.map((event) => (
                      <Link key={event.id} to={`/wedding/${wedding.id}/events/${event.id}`}>
                        <div className="flex items-center justify-between rounded-2xl border p-4 hover:border-primary/40 transition-colors">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.event_date ? format(new Date(event.event_date), "MMM dd") : "Date pending"} | {event.guest_count} guests
                            </p>
                          </div>
                          <Badge variant="outline">{formatCurrency(Number(event.budget_allocated || 0))}</Badge>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Family Collaborators Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="font-display text-2xl">Wedding Collaborators</CardTitle>
                      <CardDescription>Invite family members to plan together</CardDescription>
                    </div>
                    <Dialog open={isInviteOpen} onOpenChange={(open) => {
                      setIsInviteOpen(open);
                      if (!open) {
                        setGeneratedLink("");
                        setCopied(false);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full shrink-0">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Invite a Collaborator</DialogTitle>
                          <DialogDescription>
                            Choose their role and generate a link to share directly via WhatsApp.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Collaborator Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger id="inviteRole">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bride">Bride</SelectItem>
                                <SelectItem value="groom">Groom</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="planner">Planner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invitePerm">Permission Level</Label>
                            <Select value={invitePerm} onValueChange={setInvitePerm}>
                              <SelectTrigger id="invitePerm">
                                <SelectValue placeholder="Select permission" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="edit">Edit Workspace</SelectItem>
                                <SelectItem value="approve">Approve Actions</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {generatedLink && (
                            <div className="space-y-2 mt-4 p-3 bg-muted rounded-xl border">
                              <Label className="text-xs text-muted-foreground">Send this invite link via WhatsApp:</Label>
                              <div className="flex gap-2 items-center mt-1">
                                <Input value={generatedLink} readOnly className="h-9 text-xs" />
                                <Button
                                  variant="gold"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedLink);
                                    setCopied(true);
                                    toast({ title: "Link copied!" });
                                  }}
                                >
                                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Close</Button>
                          {!generatedLink && (
                            <Button variant="gold" onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending}>
                              {createInviteMutation.isPending ? "Generating..." : "Generate Invite Link"}
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {members.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No collaborators added.</p>
                    ) : (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-2xl border p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-semibold capitalize shrink-0">
                              {member.display_name?.charAt(0) || "U"}
                            </div>
                            <div className="truncate max-w-[150px]">
                              <p className="font-medium truncate">{member.display_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email || "No email"}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="gold" className="capitalize text-[10px] py-0.5 px-2">
                              {member.role}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground capitalize">Perms: {member.permission_level}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Tasks Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Upcoming Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.upcomingTasks.length === 0 ? (
                      <p className="text-muted-foreground">Everything is complete right now.</p>
                    ) : (
                      dashboard.upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 rounded-2xl border p-4">
                          <Clock3 className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.due_date ? `Due ${format(new Date(task.due_date), "PPP")}` : "No due date yet"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Event Timeline Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Event Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 rounded-2xl border p-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.event_date ? format(new Date(event.event_date), "PPP") : "Date pending"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recommended Vendors Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recommended Vendors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendedProviders.length === 0 ? (
                      <p className="text-muted-foreground">
                        Recommendations will appear as soon as your event requirements narrow down.
                      </p>
                    ) : (
                      recommendedProviders.map((provider) => (
                        <Link
                          key={provider.id}
                          to={`/provider/${provider.id}?wedding=${wedding.id}&event=${events[0]?.id || ""}`}
                        >
                          <div className="rounded-2xl border p-4 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{provider.business_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {provider.category?.name} | {provider.city} | {provider.rating?.toFixed?.(1) || "New"}
                                </p>
                              </div>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                {tagRecommendation(provider)}
                              </Badge>
                            </div>
                            <p className="text-sm mt-2">
                              Starting from {formatCurrency(Number(provider.base_price || 0))}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Booked Vendors Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Booked Vendors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {linkedBookings.length === 0 ? (
                      <p className="text-muted-foreground">
                        As you book vendors from this Wedding OS, actual spend will start syncing here automatically.
                      </p>
                    ) : (
                      linkedBookings.map((booking) => (
                        <div key={booking.id} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{booking.provider?.business_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.provider?.category?.name} | {booking.service_date ? format(new Date(booking.service_date), "PPP") : "Date pending"}
                              </p>
                            </div>
                            <Badge variant={booking.status === "accepted" || booking.status === "completed" ? "secondary" : "outline"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2 flex items-center gap-1.5">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            {formatCurrency(Number(booking.total_amount || booking.provider?.base_price || 0))}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const upcomingTasks = tasks.filter((t) => t.status !== "completed").slice(0, 5);
  const filteredTasks = tasks.filter((task) => taskFilter === "all" || task.status === taskFilter);
  const visibleTasks = filteredTasks.slice(0, 12);
  const acceptedBookings = bookings.filter((b) => ["accepted", "completed"].includes(b.status));
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const budgetPct = event.total_budget ? Math.min(100, Math.round((budgetSpent / Number(event.total_budget)) * 100)) : 0;
  const budgetRows = (() => {
    const rows = new Map<string, { category: string; planned: number; actual: number }>();
    budgetCategories.forEach((category) => {
      rows.set(category.category, {
        category: category.category,
        planned: Number(category.planned_amount) || 0,
        actual: Number(category.actual_amount) || 0,
      });
    });
    acceptedBookings.forEach((booking) => {
      const category = normalizePlanningCategory(booking.service_providers?.category?.name);
      const existing = rows.get(category) ?? { category, planned: 0, actual: 0 };
      existing.actual += Number(booking.total_amount) || 0;
      rows.set(category, existing);
    });
    return Array.from(rows.values()).sort((a, b) => b.actual + b.planned - (a.actual + a.planned));
  })();
  const vendorCategories = ["Venue", "Catering", "Photography", "Decor", "Makeup", "Mehndi", "Pandit", "Music"];
  const vendorStatusRows = vendorCategories.map((category) => {
    const matching = bookings.filter((booking) =>
      normalizePlanningCategory(booking.service_providers?.category?.name).toLowerCase().includes(category.toLowerCase()) ||
      booking.service_providers?.business_name?.toLowerCase().includes(category.toLowerCase())
    );
    const accepted = matching.find((booking) => ["accepted", "completed"].includes(booking.status));
    const pending = matching.find((booking) => booking.status === "pending");
    return { category, status: accepted ? "booked" : pending ? "pending" : "not started", booking: accepted || pending };
  });
  const nextStep = (() => {
    const overdue = tasks.find((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());
    if (overdue) return { label: `Finish overdue task: ${overdue.title}`, href: "/wedding-dashboard" };
    const openVendor = vendorStatusRows.find((row) => row.status === "not started");
    if (openVendor) return { label: `Book your ${openVendor.category}`, href: `/providers` };
    const nextTask = tasks.find((task) => task.status !== "completed");
    if (nextTask) return { label: `Next: ${nextTask.title}`, href: "/wedding-dashboard" };
    return { label: "Review your plan", href: "/journey" };
  })();
  const daysAway = event.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget and tasks for your wedding." />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(event.event_date).toLocaleDateString()}
                {daysAway !== null && <Badge variant="secondary" className="ml-1">{daysAway} days to go</Badge>}
              </span>
            )}
            {event.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.city}</span>}
            {event.wedding_style && <Badge variant="outline" className="capitalize">{event.wedding_style}</Badge>}
          </div>
        </div>

        {/* Progress hero */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Wedding planning progress</div>
                <div className="text-3xl font-bold">{event.progress_percent}% complete</div>
              </div>
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <Progress value={event.progress_percent} className="h-3" />
            <p className="text-sm text-muted-foreground mt-3">
              {completedTasks} of {tasks.length} tasks done, {acceptedBookings.length} vendors booked, {budgetPct}% of budget allocated
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/20">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">What should I do next?</p>
              <p className="text-lg font-semibold">{nextStep.label}</p>
            </div>
            <Button asChild>
              <Link to={nextStep.href}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vendors booked</CardDescription>
              <CardTitle className="text-2xl">{acceptedBookings.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{pendingBookings.length} pending requests</p>
              <Button variant="link" className="px-0 h-auto" asChild>
                <Link to="/providers">Find more vendors <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Budget</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <IndianRupee className="h-5 w-5" />
                {budgetSpent.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.total_budget ? (
                <>
                  <Progress value={budgetPct} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    of ₹{Number(event.total_budget).toLocaleString("en-IN")} ({budgetPct}%)
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No budget set</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tasks remaining</CardDescription>
              <CardTitle className="text-2xl">{tasks.length - completedTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {upcomingTasks[0] ? `Next: ${upcomingTasks[0].title}` : "All caught up!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: Tasks + Vendors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Your checklist</CardTitle>
              <CardDescription>Top tasks to focus on next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_auto] gap-2">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a custom task" />
                <Input value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} placeholder="Category" />
                <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                <Button onClick={addTask} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["pending", "completed", "all"] as const).map((filter) => (
                  <Button key={filter} size="sm" variant={taskFilter === filter ? "default" : "outline"} onClick={() => setTaskFilter(filter)} className="capitalize">
                    {filter}
                  </Button>
                ))}
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <>
                  {visibleTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition">
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => toggleTask(task)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {task.category && <Badge variant="outline" className="text-xs">{task.category}</Badge>}
                          {task.due_date && (
                            <span className={`flex items-center gap-1 ${
                              task.status !== "completed" && new Date(task.due_date) < new Date() ? "text-destructive" : ""
                            }`}>
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {!task.is_default && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {tasks.length > visibleTasks.length && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing {visibleTasks.length} of {tasks.length} tasks
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your vendors</CardTitle>
              <CardDescription>Bookings tied to this wedding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No vendors booked yet</p>
                  <Button asChild size="sm">
                    <Link to="/providers"><Plus className="h-4 w-4 mr-1" /> Browse vendors</Link>
                  </Button>
                </div>
              ) : (
                bookings.slice(0, 6).map((b) => (
                  <Link
                    key={b.id}
                    to={`/booking/${b.id}`}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {b.service_providers?.business_name ?? "Provider"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(b.service_date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={b.status === "accepted" || b.status === "completed" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {b.status}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor status tracker</CardTitle>
              <CardDescription>Category-level planning status</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {vendorStatusRows.map((row) => (
                <div key={row.category} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{row.category}</p>
                    {row.booking?.service_providers?.business_name && (
                      <p className="text-xs text-muted-foreground">{row.booking.service_providers.business_name}</p>
                    )}
                  </div>
                  <Badge variant={row.status === "booked" ? "default" : row.status === "pending" ? "secondary" : "outline"} className="capitalize">
                    {row.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Budget tracker</CardTitle>
                <CardDescription>Planned budget by category compared with accepted vendor spend</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={syncActualSpend}>Sync actuals</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Accepted bookings will appear here as actual spend.</p>
            ) : (
              budgetRows.slice(0, 6).map((row) => {
                const categoryRecord = budgetCategories.find((category) => category.category === row.category);
                const planned = row.planned || (event.total_budget ? Number(event.total_budget) / Math.max(budgetRows.length, 1) : 0);
                const pct = planned ? Math.min(100, Math.round((row.actual / planned) * 100)) : 0;
                const isOver = planned > 0 && row.actual > planned;
                return (
                  <div key={row.category} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 md:items-center text-sm">
                      <div>
                        <span className="font-medium">{row.category}</span>
                        {isOver && (
                          <span className="ml-2 inline-flex items-center text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Over budget
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Rs {row.actual.toLocaleString("en-IN")} actual
                        </p>
                      </div>
                      {categoryRecord ? (
                        <div>
                          <Label className="text-xs">Planned</Label>
                          <Input
                            type="number"
                            value={editingBudget[categoryRecord.id] ?? categoryRecord.planned_amount}
                            onChange={(e) => setEditingBudget((cur) => ({ ...cur, [categoryRecord.id]: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Rs {Math.round(planned).toLocaleString("en-IN")}</span>
                      )}
                      {categoryRecord && (
                        <Button size="sm" variant="outline" onClick={() => saveBudget(categoryRecord)}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                      )}
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WeddingDashboard;
