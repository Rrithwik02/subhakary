import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PaymentHistorySectionProps {
  providerId?: string;
  userId?: string;
  bookingId?: string;
  compact?: boolean;
}

const statusConfig = {
  pending: { 
    label: "Pending", 
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: Clock 
  },
  processing: { 
    label: "Processing", 
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: Loader2 
  },
  completed: { 
    label: "Completed", 
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: CheckCircle2 
  },
  failed: { 
    label: "Failed", 
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: XCircle 
  },
};

export const PaymentHistorySection = ({
  providerId,
  userId,
  bookingId,
  compact = false,
}: PaymentHistorySectionProps) => {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payment-history", providerId, userId, bookingId],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          booking:bookings(
            id,
            service_date,
            user_id,
            provider_id,
            provider:service_providers(business_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (providerId) {
        // Get bookings for this provider first
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("provider_id", providerId);
        
        if (bookings && bookings.length > 0) {
          const bookingIds = bookings.map(b => b.id);
          query = query.in("booking_id", bookingIds);
        } else {
          return [];
        }
      }

      if (userId) {
        // Get bookings for this user
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", userId);
        
        if (bookings && bookings.length > 0) {
          const bookingIds = bookings.map(b => b.id);
          query = query.in("booking_id", bookingIds);
        } else {
          return [];
        }
      }

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      const { data, error } = await query.limit(compact ? 5 : 50);
      if (error) throw error;

      // Get customer names for provider view using SECURITY DEFINER function
      if (providerId && data && data.length > 0) {
        const bookingIds = [...new Set(data.map(p => p.booking_id).filter(Boolean))];
        const { data: customerInfo } = await supabase
          .rpc('get_booking_customer_info', { booking_ids: bookingIds });

        const profileMap = new Map(customerInfo?.map((c: any) => [c.booking_id, c.customer_name]) || []);

        return data.map(payment => ({
          ...payment,
          customerName: profileMap.get(payment.booking_id) || "Customer",
        }));
      }

      return data;
    },
    enabled: !!(providerId || userId || bookingId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment: any) => {
        const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = status.icon;

        return (
          <Card key={payment.id} className={compact ? "border-0 shadow-none bg-muted/50" : ""}>
            <CardContent className={compact ? "p-3" : "p-4"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    payment.status === "completed" ? "bg-green-500/10" : "bg-primary/10"
                  }`}>
                    <IndianRupee className={`h-5 w-5 ${
                      payment.status === "completed" ? "text-green-600" : "text-primary"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">
                      ₹{payment.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.payment_type === "advance" ? "Advance Payment" : payment.payment_type}
                    </p>
                    {payment.customerName && (
                      <p className="text-xs text-muted-foreground">
                        {payment.customerName}
                      </p>
                    )}
                    {payment.booking?.provider?.business_name && (
                      <p className="text-xs text-muted-foreground">
                        {payment.booking.provider.business_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${status.color} text-xs mb-1`}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${status.label === "Processing" ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(payment.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {payment.payment_description && !compact && (
                <p className="text-sm text-muted-foreground mt-2 pl-13">
                  {payment.payment_description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
