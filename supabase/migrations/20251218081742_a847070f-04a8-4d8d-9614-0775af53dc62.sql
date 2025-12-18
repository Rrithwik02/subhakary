-- Update profiles table structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'guest'::text CHECK (user_type = ANY (ARRAY['guest'::text, 'service_provider'::text, 'admin'::text])),
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS profile_image text,
ADD COLUMN IF NOT EXISTS push_token text;

-- Update service_providers table
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS service_type text,
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS portfolio_link text DEFAULT ''::text,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS secondary_city text,
ADD COLUMN IF NOT EXISTS portfolio_images text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS requires_advance_payment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS advance_payment_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS verification_document_url text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS travel_charges_applicable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS advance_booking_days integer,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS service_cities text[] DEFAULT '{}'::text[];

-- Update bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS time_slot time without time zone,
ADD COLUMN IF NOT EXISTS special_requirements text,
ADD COLUMN IF NOT EXISTS completion_status text DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS completion_confirmed_by_customer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_confirmed_by_provider boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_preference text DEFAULT 'pay_now'::text,
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS total_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount numeric,
ADD COLUMN IF NOT EXISTS provider_payment_requested boolean DEFAULT false;

-- Update reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS comment text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text;

-- Create additional_services table
CREATE TABLE IF NOT EXISTS public.additional_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  service_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  min_price numeric NOT NULL,
  max_price numeric NOT NULL,
  portfolio_images text[] DEFAULT '{}'::text[],
  subcategory text,
  specialization text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their additional services" ON public.additional_services
FOR ALL USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = additional_services.provider_id AND sp.user_id = auth.uid()));

CREATE POLICY "Anyone can view approved additional services" ON public.additional_services
FOR SELECT USING (status = 'approved');

-- Create service_bundles table
CREATE TABLE IF NOT EXISTS public.service_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  bundle_name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  discounted_price numeric NOT NULL,
  discount_percentage integer DEFAULT 0,
  is_active boolean DEFAULT true,
  min_advance_percentage integer DEFAULT 30,
  max_guests integer,
  duration_days integer DEFAULT 1,
  portfolio_images text[] DEFAULT '{}'::text[],
  terms_conditions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their bundles" ON public.service_bundles
FOR ALL USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = service_bundles.provider_id AND sp.user_id = auth.uid()));

CREATE POLICY "Anyone can view active bundles" ON public.service_bundles
FOR SELECT USING (is_active = true);

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id uuid NOT NULL REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_name text NOT NULL,
  description text,
  quantity integer DEFAULT 1,
  individual_price numeric,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundle items" ON public.bundle_items FOR SELECT USING (true);

-- Create bundle_bookings table
CREATE TABLE IF NOT EXISTS public.bundle_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  bundle_id uuid NOT NULL REFERENCES public.service_bundles(id),
  event_date date NOT NULL,
  guest_count integer,
  total_amount numeric NOT NULL,
  advance_amount numeric,
  status text DEFAULT 'pending'::text,
  special_requirements text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bundle_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bundle bookings" ON public.bundle_bookings
FOR SELECT USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = bundle_bookings.user_id));

CREATE POLICY "Users can create bundle bookings" ON public.bundle_bookings
FOR INSERT WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = bundle_bookings.user_id));

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id),
  sender_id uuid REFERENCES public.profiles(id),
  receiver_id uuid REFERENCES public.profiles(id),
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.chat_messages
FOR SELECT USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id IN (chat_messages.sender_id, chat_messages.receiver_id)));

CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = chat_messages.sender_id));

-- Create chat_connections table
CREATE TABLE IF NOT EXISTS public.chat_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id),
  user_id uuid REFERENCES auth.users(id),
  provider_id uuid REFERENCES public.service_providers(id),
  user_confirmed boolean DEFAULT false,
  provider_confirmed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chat_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat connections" ON public.chat_connections
FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = chat_connections.provider_id AND sp.user_id = auth.uid()));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = notifications.user_id));

CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = notifications.user_id));

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  payment_reminders boolean DEFAULT true,
  booking_updates boolean DEFAULT true,
  promotional boolean DEFAULT false,
  frequency text DEFAULT 'immediate'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
FOR ALL USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  provider_id uuid REFERENCES public.service_providers(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their favorites" ON public.favorites
FOR ALL USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = favorites.user_id));

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'pending'::text
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create service_provider_availability table
CREATE TABLE IF NOT EXISTS public.service_provider_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  specific_date date,
  is_blocked boolean DEFAULT false
);

ALTER TABLE public.service_provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view provider availability" ON public.service_provider_availability
FOR SELECT USING (true);

CREATE POLICY "Providers can manage their availability" ON public.service_provider_availability
FOR ALL USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = service_provider_availability.provider_id AND sp.user_id = auth.uid()));

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  provider_id uuid REFERENCES public.service_providers(id),
  service_type text NOT NULL,
  description text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their service requests" ON public.service_requests
FOR SELECT USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = service_requests.user_id));

CREATE POLICY "Users can create service requests" ON public.service_requests
FOR INSERT WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = service_requests.user_id));

-- Create service_suggestions table
CREATE TABLE IF NOT EXISTS public.service_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  suggestion_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.service_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create suggestions" ON public.service_suggestions
FOR INSERT WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = service_suggestions.user_id));

CREATE POLICY "Admins can view suggestions" ON public.service_suggestions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create quotation_requests table
CREATE TABLE IF NOT EXISTS public.quotation_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  provider_id uuid REFERENCES public.service_providers(id),
  service_type text NOT NULL,
  description text NOT NULL,
  event_date date,
  budget_range text,
  location text NOT NULL,
  guest_count integer,
  special_requirements text,
  images text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'pending'::text,
  quoted_amount numeric,
  quoted_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quotation requests" ON public.quotation_requests
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Providers can view quotations sent to them" ON public.quotation_requests
FOR SELECT USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = quotation_requests.provider_id AND sp.user_id = auth.uid()));

-- Create payments table (without Razorpay columns)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  amount numeric NOT NULL,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['advance'::text, 'final'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])),
  admin_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  escrow_status text DEFAULT 'none'::text,
  milestone_number integer DEFAULT 1,
  provider_requested_amount numeric,
  payment_description text,
  is_provider_requested boolean DEFAULT false
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payments" ON public.payments
FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = payments.booking_id AND b.user_id = auth.uid()));

CREATE POLICY "Providers can view payments for their bookings" ON public.payments
FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b JOIN service_providers sp ON b.provider_id = sp.id WHERE b.id = payments.booking_id AND sp.user_id = auth.uid()));

-- Create payment_schedules table
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  payment_plan text NOT NULL DEFAULT 'standard'::text,
  total_milestones integer DEFAULT 2,
  milestones jsonb NOT NULL DEFAULT '[{"due_date": null, "percentage": 50, "description": "Advance payment"}, {"due_date": null, "percentage": 50, "description": "Final payment"}]'::jsonb,
  current_milestone integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payment schedules" ON public.payment_schedules
FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = payment_schedules.booking_id AND b.user_id = auth.uid()));

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  milestone_number integer NOT NULL,
  reminder_type text NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending'::text,
  next_reminder_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payment reminders" ON public.payment_reminders
FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = payment_reminders.booking_id AND b.user_id = auth.uid()));

-- Create escrow_payments table
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'held'::text,
  held_at timestamp with time zone NOT NULL DEFAULT now(),
  release_condition text NOT NULL DEFAULT 'completion_confirmation'::text,
  auto_release_date timestamp with time zone,
  released_at timestamp with time zone,
  released_by uuid REFERENCES auth.users(id),
  dispute_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their escrow payments" ON public.escrow_payments
FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = escrow_payments.booking_id AND b.user_id = auth.uid()));

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id),
  amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  payout_method text NOT NULL DEFAULT 'bank_transfer'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  payout_reference text,
  payout_date date,
  processed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their payouts" ON public.payouts
FOR SELECT USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = payouts.provider_id AND sp.user_id = auth.uid()));

-- Create provider_payment_details table
CREATE TABLE IF NOT EXISTS public.provider_payment_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL UNIQUE REFERENCES public.service_providers(id),
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  qr_code_url text,
  payment_method text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.provider_payment_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their payment details" ON public.provider_payment_details
FOR ALL USING (EXISTS (SELECT 1 FROM service_providers sp WHERE sp.id = provider_payment_details.provider_id AND sp.user_id = auth.uid()));

-- Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending'::text,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their deletion requests" ON public.account_deletion_requests
FOR ALL USING (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = account_deletion_requests.user_id));

-- Create ceremony_themes table
CREATE TABLE IF NOT EXISTS public.ceremony_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_name text NOT NULL,
  ceremony_type text NOT NULL,
  color_scheme jsonb NOT NULL,
  font_settings jsonb NOT NULL,
  decorative_elements jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ceremony_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active themes" ON public.ceremony_themes
FOR SELECT USING (is_active = true);

-- Create user_theme_preferences table
CREATE TABLE IF NOT EXISTS public.user_theme_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ceremony_type text NOT NULL,
  theme_id uuid REFERENCES public.ceremony_themes(id),
  custom_settings jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their theme preferences" ON public.user_theme_preferences
FOR ALL USING (auth.uid() = user_id);

-- Create admin_payment_details_access_log table
CREATE TABLE IF NOT EXISTS public.admin_payment_details_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  accessed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_payment_details_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs" ON public.admin_payment_details_access_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create access logs" ON public.admin_payment_details_access_log
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;