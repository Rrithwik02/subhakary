import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReminderRow = {
  id: string;
  provider_id: string;
  booking_id: string | null;
  provider_event_id: string | null;
  reminder_type: "one_day_before" | "event_day";
  reminder_channel: "email" | "push" | "notification";
  scheduled_for: string;
  payload: Record<string, unknown> | null;
  service_providers?: {
    business_name: string | null;
    user_id: string | null;
    profile_id: string | null;
    whatsapp_number: string | null;
  } | null;
  bookings?: {
    id: string;
    status: string;
    service_date: string;
    service_time: string | null;
    message: string | null;
    user_id: string;
    profiles?: {
      full_name: string | null;
      phone: string | null;
      email: string | null;
    } | null;
  } | null;
  provider_events?: {
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    notes: string | null;
  } | null;
};

const formatReminderTitle = (reminder: ReminderRow) => {
  if (reminder.booking_id && reminder.bookings) {
    return `Booking reminder for ${reminder.bookings.service_date}`;
  }
  return reminder.provider_events?.title || "Upcoming schedule reminder";
};

const buildReminderMessage = (reminder: ReminderRow) => {
  const booking = reminder.bookings;
  const event = reminder.provider_events;

  if (booking) {
    return [
      `Booking date: ${booking.service_date}`,
      booking.service_time ? `Time: ${booking.service_time}` : null,
      booking.message ? `Notes: ${booking.message}` : null,
      booking.profiles?.full_name ? `Customer: ${booking.profiles.full_name}` : null,
      booking.profiles?.phone ? `Customer phone: ${booking.profiles.phone}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (event) {
    return [
      `Event: ${event.title}`,
      `Date: ${event.event_date}`,
      event.start_time ? `Start: ${event.start_time}` : null,
      event.end_time ? `End: ${event.end_time}` : null,
      event.location ? `Location: ${event.location}` : null,
      event.notes ? `Notes: ${event.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "You have an upcoming schedule reminder.";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = Deno.env.get("CRON_SECRET_TOKEN");

    if (!expectedToken) {
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabase
      .from("provider_event_reminders")
      .select(`
        id,
        provider_id,
        booking_id,
        provider_event_id,
        reminder_type,
        reminder_channel,
        scheduled_for,
        payload,
        service_providers (
          business_name,
          user_id,
          profile_id,
          whatsapp_number
        ),
        bookings (
          id,
          status,
          service_date,
          service_time,
          message,
          user_id,
          profiles (
            full_name,
            phone,
            email
          )
        ),
        provider_events (
          id,
          title,
          event_type,
          event_date,
          start_time,
          end_time,
          location,
          notes
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(200);

    if (remindersError) throw remindersError;

    let processed = 0;
    let emailed = 0;
    let notificationsCreated = 0;

    for (const reminder of (reminders ?? []) as ReminderRow[]) {
      const title = formatReminderTitle(reminder);
      const message = buildReminderMessage(reminder);
      const providerProfileId =
        reminder.service_providers?.profile_id ||
        null;

      if (providerProfileId) {
        await supabase.from("notifications").insert({
          user_id: providerProfileId,
          title,
          message,
          type: "schedule_reminder",
        });
        notificationsCreated++;
      }

      const providerEmail = reminder.service_providers?.user_id
        ? (await supabase.auth.admin.getUserById(reminder.service_providers.user_id)).data.user?.email ?? null
        : null;

      if (resend && providerEmail && reminder.reminder_channel === "email") {
        try {
          await resend.emails.send({
            from: "Subhakary <no-reply@subhakary.com>",
            to: [providerEmail],
            subject: title,
            text: message,
          });
          emailed++;
        } catch (emailError) {
          await supabase.from("provider_event_reminders").update({
            status: "failed",
            delivery_attempts: 1,
            last_error: emailError instanceof Error ? emailError.message : "Email send failed",
          }).eq("id", reminder.id);
          continue;
        }
      }

      const { error: updateError } = await supabase
        .from("provider_event_reminders")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          delivery_attempts: 1,
          last_error: null,
        })
        .eq("id", reminder.id);

      if (updateError) throw updateError;
      processed++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        emailed,
        notificationsCreated,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
