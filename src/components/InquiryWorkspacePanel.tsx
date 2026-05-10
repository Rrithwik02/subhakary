import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, CalendarDays, FileText, IndianRupee, Loader2, MessageSquareQuote, Paperclip, Save, Upload } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getPrimaryWeddingEventId } from "@/lib/weddingEvent";

type ThreadRole = "couple" | "provider";

type ConversationRecord = {
  id: string;
  event_id: string | null;
  booking_id: string | null;
  provider_id: string;
  user_id: string;
  status: string;
  selected_service_date: string | null;
  couple_budget: number | null;
  guest_count: number | null;
  preferred_style: string | null;
  priority_notes: string | null;
  negotiation_status: string;
};

type QuoteRecord = {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  valid_until: string | null;
  created_at: string;
  version_no: number;
};

type DocumentRecord = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

const NEGOTIATION_OPTIONS = [
  { value: "researching", label: "Researching" },
  { value: "quoted", label: "Quoted" },
  { value: "negotiating", label: "Negotiating" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "locked", label: "Locked" },
];

export const InquiryWorkspacePanel = ({
  conversationId,
  role,
  className = "",
}: {
  conversationId: string;
  role: ThreadRole;
  className?: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contextForm, setContextForm] = useState({
    selected_service_date: "",
    couple_budget: "",
    guest_count: "",
    preferred_style: "",
    priority_notes: "",
    negotiation_status: "researching",
  });
  const [quoteForm, setQuoteForm] = useState({ amount: "", description: "", valid_until: "" });
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("contract");
  const [uploading, setUploading] = useState(false);

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["inquiry-workspace", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_conversations")
        .select("id,event_id,booking_id,provider_id,user_id,status,selected_service_date,couple_budget,guest_count,preferred_style,priority_notes,negotiation_status")
        .eq("id", conversationId)
        .single();
      if (error) throw error;
      return data as ConversationRecord;
    },
    enabled: !!conversationId,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["inquiry-quotes", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_quotes")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("version_no", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuoteRecord[];
    },
    enabled: !!conversationId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["wedding-documents", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_documents")
        .select("id,title,document_type,file_name,file_path,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRecord[];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversation) return;
    setContextForm({
      selected_service_date: conversation.selected_service_date || "",
      couple_budget: conversation.couple_budget ? String(conversation.couple_budget) : "",
      guest_count: conversation.guest_count ? String(conversation.guest_count) : "",
      preferred_style: conversation.preferred_style || "",
      priority_notes: conversation.priority_notes || "",
      negotiation_status: conversation.negotiation_status || "researching",
    });
  }, [conversation]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["inquiry-workspace", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["inquiry-quotes", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["wedding-documents", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["provider-inquiry-conversations"] });
  };

  const saveContext = async () => {
    if (!conversation) return;
    const fallbackEventId = user && !conversation.event_id ? await getPrimaryWeddingEventId(user.id) : null;
    const payload = {
      event_id: conversation.event_id || fallbackEventId,
      selected_service_date: contextForm.selected_service_date || null,
      couple_budget: contextForm.couple_budget ? Number(contextForm.couple_budget) : null,
      guest_count: contextForm.guest_count ? Number(contextForm.guest_count) : null,
      preferred_style: contextForm.preferred_style || null,
      priority_notes: contextForm.priority_notes || null,
      negotiation_status: contextForm.negotiation_status,
    };
    const { error } = await supabase.from("inquiry_conversations").update(payload).eq("id", conversationId);
    if (error) {
      toast.error("Could not save thread details");
      return;
    }
    toast.success("Thread details updated");
    refresh();
  };

  const submitQuote = async () => {
    if (!user || !quoteForm.amount) return;
    const nextVersion = (quotes[0]?.version_no || 0) + 1;
    const { error } = await supabase.from("inquiry_quotes").insert({
      conversation_id: conversationId,
      amount: Number(quoteForm.amount),
      description: quoteForm.description || null,
      valid_until: quoteForm.valid_until || null,
      created_by: user.id,
      version_no: nextVersion,
      status: role === "provider" ? "proposed" : "countered",
    });
    if (error) {
      toast.error("Could not save quote");
      return;
    }
    await supabase.from("inquiry_conversations").update({ negotiation_status: "quoted" }).eq("id", conversationId);
    setQuoteForm({ amount: "", description: "", valid_until: "" });
    toast.success(role === "provider" ? "Quote shared" : "Counter offer sent");
    refresh();
  };

  const openDocument = async (doc: DocumentRecord) => {
    const { data, error } = await supabase.storage.from("wedding-documents").createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const uploadDocument = async (file?: File | null) => {
    if (!user || !conversation || !file) return;
    setUploading(true);
    try {
      const eventId = conversation.event_id || (await getPrimaryWeddingEventId(user.id));
      if (!eventId) {
        toast.error("Create your wedding plan first so documents have a home.");
        return;
      }
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = `${user.id}/${safeName}`;
      const upload = await supabase.storage.from("wedding-documents").upload(filePath, file, { upsert: false });
      if (upload.error) throw upload.error;

      const { error } = await supabase.from("wedding_documents").insert({
        event_id: eventId,
        conversation_id: conversation.id,
        booking_id: conversation.booking_id,
        provider_id: conversation.provider_id,
        uploaded_by: user.id,
        title: docTitle || file.name,
        document_type: docType,
        file_name: file.name,
        file_path: filePath,
      });
      if (error) throw error;

      setDocTitle("");
      toast.success("Document added to the thread");
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not upload document");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !conversation) {
    return (
      <Card className={className}>
        <CardContent className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const latestQuote = quotes[0];

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            Thread brief
          </CardTitle>
          <CardDescription>Keep the key planning context in the thread so decisions do not drift into chat chaos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={contextForm.selected_service_date}
                onChange={(event) => setContextForm((current) => ({ ...current, selected_service_date: event.target.value }))}
              />
            </div>
            <div>
              <Label>Negotiation</Label>
              <Select
                value={contextForm.negotiation_status}
                onValueChange={(value) => setContextForm((current) => ({ ...current, negotiation_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEGOTIATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget snapshot</Label>
              <Input
                type="number"
                value={contextForm.couple_budget}
                onChange={(event) => setContextForm((current) => ({ ...current, couple_budget: event.target.value }))}
                placeholder="500000"
              />
            </div>
            <div>
              <Label>Guest count</Label>
              <Input
                type="number"
                value={contextForm.guest_count}
                onChange={(event) => setContextForm((current) => ({ ...current, guest_count: event.target.value }))}
                placeholder="200"
              />
            </div>
          </div>
          <div>
            <Label>Style</Label>
            <Input
              value={contextForm.preferred_style}
              onChange={(event) => setContextForm((current) => ({ ...current, preferred_style: event.target.value }))}
              placeholder="Traditional, minimal, destination..."
            />
          </div>
          <div>
            <Label>Priority notes</Label>
            <Textarea
              rows={3}
              value={contextForm.priority_notes}
              onChange={(event) => setContextForm((current) => ({ ...current, priority_notes: event.target.value }))}
              placeholder="What matters most in this booking?"
            />
          </div>
          <Button onClick={saveContext} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save thread details
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeDollarSign className="h-4 w-4 text-primary" />
            Quote tracker
          </CardTitle>
          <CardDescription>The quote history stays visible, versioned, and anchored to this vendor thread.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestQuote ? (
            <div className="rounded-xl border bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-semibold text-primary">Latest quote</p>
                <Badge variant="outline" className="capitalize">{latestQuote.status}</Badge>
              </div>
              <p className="text-2xl font-bold">Rs {Number(latestQuote.amount).toLocaleString("en-IN")}</p>
              {latestQuote.description ? <p className="mt-2 text-sm text-muted-foreground">{latestQuote.description}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Version {latestQuote.version_no}</span>
                {latestQuote.valid_until ? <span>Valid till {format(new Date(latestQuote.valid_until), "PPP")}</span> : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No quote shared yet.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{role === "provider" ? "Quoted amount" : "Counter amount"}</Label>
              <Input
                type="number"
                value={quoteForm.amount}
                onChange={(event) => setQuoteForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="75000"
              />
            </div>
            <div>
              <Label>Valid until</Label>
              <Input
                type="date"
                value={quoteForm.valid_until}
                onChange={(event) => setQuoteForm((current) => ({ ...current, valid_until: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={quoteForm.description}
              onChange={(event) => setQuoteForm((current) => ({ ...current, description: event.target.value }))}
              placeholder={role === "provider" ? "What's included, exclusions, travel, lead times..." : "What would make this work for your wedding?"}
            />
          </div>
          <Button onClick={submitQuote} className="w-full" disabled={!quoteForm.amount}>
            <IndianRupee className="mr-2 h-4 w-4" />
            {role === "provider" ? "Share quote" : "Send counter offer"}
          </Button>

          {quotes.length > 1 ? (
            <div className="space-y-2 border-t pt-3">
              {quotes.slice(1, 4).map((quote) => (
                <div key={quote.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">Rs {Number(quote.amount).toLocaleString("en-IN")}</p>
                    {quote.description ? <p className="text-muted-foreground">{quote.description}</p> : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>V{quote.version_no}</p>
                    <p>{format(new Date(quote.created_at), "MMM d")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Paperclip className="h-4 w-4 text-primary" />
            Document vault
          </CardTitle>
          <CardDescription>Keep contracts, sample menus, floor plans, and proposal PDFs tied to the thread.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div>
              <Label>Document title</Label>
              <Input value={docTitle} onChange={(event) => setDocTitle(event.target.value)} placeholder="Venue proposal" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="quote">Quote PDF</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="moodboard">Moodboard</SelectItem>
                  <SelectItem value="floorplan">Floor plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-accent/40">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{uploading ? "Uploading..." : "Upload document"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(event) => void uploadDocument(event.target.files?.[0])}
              disabled={uploading}
            />
          </label>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No documents shared yet.</div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => void openDocument(doc)}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <p className="truncate font-medium">{doc.title}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{doc.document_type}</span>
                      <span>{doc.file_name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "MMM d")}</span>
                </button>
              ))
            )}
          </div>

          {conversation.selected_service_date ? (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Target service date: {format(new Date(conversation.selected_service_date), "PPP")}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
