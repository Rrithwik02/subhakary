export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      additional_services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string
          id: string
          max_price: number
          metadata: Json | null
          min_price: number
          portfolio_images: string[] | null
          provider_id: string
          service_type: string
          specialization: string | null
          status: string | null
          subcategory: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          max_price: number
          metadata?: Json | null
          min_price: number
          portfolio_images?: string[] | null
          provider_id: string
          service_type: string
          specialization?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          max_price?: number
          metadata?: Json | null
          min_price?: number
          portfolio_images?: string[] | null
          provider_id?: string
          service_type?: string
          specialization?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          token: string
          token_hash: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token?: string
          token_hash?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token?: string
          token_hash?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      admin_payment_details_access_log: {
        Row: {
          accessed_at: string | null
          admin_user_id: string
          id: string
          provider_id: string
        }
        Insert: {
          accessed_at?: string | null
          admin_user_id: string
          id?: string
          provider_id: string
        }
        Update: {
          accessed_at?: string | null
          admin_user_id?: string
          id?: string
          provider_id?: string
        }
        Relationships: []
      }
      booking_capacity_rules: {
        Row: {
          category_slug: string
          created_at: string
          id: string
          max_bookings_per_day: number
          provider_id: string | null
          service_label: string | null
          updated_at: string
        }
        Insert: {
          category_slug: string
          created_at?: string
          id?: string
          max_bookings_per_day?: number
          provider_id?: string | null
          service_label?: string | null
          updated_at?: string
        }
        Update: {
          category_slug?: string
          created_at?: string
          id?: string
          max_bookings_per_day?: number
          provider_id?: string | null
          service_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_capacity_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_capacity_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_completion_details: {
        Row: {
          additional_notes: string | null
          additional_notes_dispute: string | null
          additional_notes_verified: boolean | null
          amount_charged: number
          amount_dispute: string | null
          amount_verified: boolean | null
          booking_id: string
          completion_days: number
          completion_days_dispute: string | null
          completion_days_verified: boolean | null
          created_at: string
          customer_verified_at: string | null
          id: string
          service_description: string
          service_description_dispute: string | null
          service_description_verified: boolean | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          additional_notes_dispute?: string | null
          additional_notes_verified?: boolean | null
          amount_charged: number
          amount_dispute?: string | null
          amount_verified?: boolean | null
          booking_id: string
          completion_days: number
          completion_days_dispute?: string | null
          completion_days_verified?: boolean | null
          created_at?: string
          customer_verified_at?: string | null
          id?: string
          service_description: string
          service_description_dispute?: string | null
          service_description_verified?: boolean | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          additional_notes_dispute?: string | null
          additional_notes_verified?: boolean | null
          amount_charged?: number
          amount_dispute?: string | null
          amount_verified?: boolean | null
          booking_id?: string
          completion_days?: number
          completion_days_dispute?: string | null
          completion_days_verified?: boolean | null
          created_at?: string
          customer_verified_at?: string | null
          id?: string
          service_description?: string
          service_description_dispute?: string | null
          service_description_verified?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_completion_details_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completion_confirmed_by_customer: boolean | null
          completion_confirmed_by_provider: boolean | null
          completion_status: string | null
          created_at: string
          end_date: string | null
          event_id: string | null
          id: string
          message: string | null
          payment_preference: string | null
          provider_id: string
          provider_payment_requested: boolean | null
          refund_amount: number | null
          rejection_reason: string | null
          service_date: string
          service_time: string | null
          special_requirements: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: string | null
          total_amount: number | null
          total_days: number | null
          updated_at: string
          user_id: string
          wedding_event_id: string | null
          wedding_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completion_confirmed_by_customer?: boolean | null
          completion_confirmed_by_provider?: boolean | null
          completion_status?: string | null
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_preference?: string | null
          provider_id: string
          provider_payment_requested?: boolean | null
          refund_amount?: number | null
          rejection_reason?: string | null
          service_date: string
          service_time?: string | null
          special_requirements?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string | null
          total_amount?: number | null
          total_days?: number | null
          updated_at?: string
          user_id: string
          wedding_event_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completion_confirmed_by_customer?: boolean | null
          completion_confirmed_by_provider?: boolean | null
          completion_status?: string | null
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_preference?: string | null
          provider_id?: string
          provider_payment_requested?: boolean | null
          refund_amount?: number | null
          rejection_reason?: string | null
          service_date?: string
          service_time?: string | null
          special_requirements?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string | null
          total_amount?: number | null
          total_days?: number | null
          updated_at?: string
          user_id?: string
          wedding_event_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_event_id_fkey"
            columns: ["wedding_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_bookings: {
        Row: {
          advance_amount: number | null
          bundle_id: string
          created_at: string | null
          event_date: string
          guest_count: number | null
          id: string
          special_requirements: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advance_amount?: number | null
          bundle_id: string
          created_at?: string | null
          event_date: string
          guest_count?: number | null
          id?: string
          special_requirements?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advance_amount?: number | null
          bundle_id?: string
          created_at?: string | null
          event_date?: string
          guest_count?: number | null
          id?: string
          special_requirements?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_bookings_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string | null
          description: string | null
          id: string
          individual_price: number | null
          quantity: number | null
          service_name: string
          service_type: string
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          individual_price?: number | null
          quantity?: number | null
          service_name: string
          service_type: string
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          individual_price?: number | null
          quantity?: number | null
          service_name?: string
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      ceremony_themes: {
        Row: {
          ceremony_type: string
          color_scheme: Json
          created_at: string
          decorative_elements: Json
          font_settings: Json
          id: string
          is_active: boolean | null
          theme_name: string
          updated_at: string
        }
        Insert: {
          ceremony_type: string
          color_scheme: Json
          created_at?: string
          decorative_elements: Json
          font_settings: Json
          id?: string
          is_active?: boolean | null
          theme_name: string
          updated_at?: string
        }
        Update: {
          ceremony_type?: string
          color_scheme?: Json
          created_at?: string
          decorative_elements?: Json
          font_settings?: Json
          id?: string
          is_active?: boolean | null
          theme_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_connections: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          provider_confirmed: boolean | null
          provider_id: string | null
          updated_at: string | null
          user_confirmed: boolean | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          provider_confirmed?: boolean | null
          provider_id?: string | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          provider_confirmed?: boolean | null
          provider_id?: string | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_connections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          delivery_status: string | null
          id: string
          message: string
          read: boolean | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          message: string
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          message?: string
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone: string
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string | null
        }
        Relationships: []
      }
      email_otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          auto_release_date: string | null
          booking_id: string
          created_at: string
          dispute_reason: string | null
          held_at: string
          id: string
          payment_id: string
          release_condition: string
          released_at: string | null
          released_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_release_date?: string | null
          booking_id: string
          created_at?: string
          dispute_reason?: string | null
          held_at?: string
          id?: string
          payment_id: string
          release_condition?: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_release_date?: string | null
          booking_id?: string
          created_at?: string
          dispute_reason?: string | null
          held_at?: string
          id?: string
          payment_id?: string
          release_condition?: string
          released_at?: string | null
          released_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_payments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          provider_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          provider_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "inquiry_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          booking_updates: boolean | null
          created_at: string
          email_enabled: boolean | null
          frequency: string | null
          id: string
          payment_reminders: boolean | null
          promotional: boolean | null
          push_enabled: boolean | null
          reminder_day_before: boolean
          reminder_event_day: boolean
          schedule_email_timing: string
          schedule_reminders: boolean
          schedule_summary_time: string
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_updates?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          payment_reminders?: boolean | null
          promotional?: boolean | null
          push_enabled?: boolean | null
          reminder_day_before?: boolean
          reminder_event_day?: boolean
          schedule_email_timing?: string
          schedule_reminders?: boolean
          schedule_summary_time?: string
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_updates?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          frequency?: string | null
          id?: string
          payment_reminders?: boolean | null
          promotional?: boolean | null
          push_enabled?: boolean | null
          reminder_day_before?: boolean
          reminder_event_day?: boolean
          schedule_email_timing?: string
          schedule_reminders?: boolean
          schedule_summary_time?: string
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          milestone_number: number
          next_reminder_at: string | null
          reminder_type: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          milestone_number: number
          next_reminder_at?: string | null
          reminder_type: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          milestone_number?: number
          next_reminder_at?: string | null
          reminder_type?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          booking_id: string
          created_at: string
          current_milestone: number | null
          id: string
          milestones: Json
          payment_plan: string
          total_milestones: number | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          current_milestone?: number | null
          id?: string
          milestones?: Json
          payment_plan?: string
          total_milestones?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          current_milestone?: number | null
          id?: string
          milestones?: Json
          payment_plan?: string
          total_milestones?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_verified: boolean | null
          amount: number
          booking_id: string
          created_at: string | null
          escrow_status: string | null
          id: string
          is_provider_requested: boolean | null
          milestone_number: number | null
          payment_description: string | null
          payment_type: string
          provider_requested_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_verified?: boolean | null
          amount: number
          booking_id: string
          created_at?: string | null
          escrow_status?: string | null
          id?: string
          is_provider_requested?: boolean | null
          milestone_number?: number | null
          payment_description?: string | null
          payment_type: string
          provider_requested_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_verified?: boolean | null
          amount?: number
          booking_id?: string
          created_at?: string | null
          escrow_status?: string | null
          id?: string
          is_provider_requested?: boolean | null
          milestone_number?: number | null
          payment_description?: string | null
          payment_type?: string
          provider_requested_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          net_amount: number
          notes: string | null
          payout_date: string | null
          payout_method: string
          payout_reference: string | null
          processed_at: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          net_amount: number
          notes?: string | null
          payout_date?: string | null
          payout_method?: string
          payout_reference?: string | null
          processed_at?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          net_amount?: number
          notes?: string | null
          payout_date?: string | null
          payout_method?: string
          payout_reference?: string | null
          processed_at?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_image: string | null
          push_token: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image?: string | null
          push_token?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image?: string | null
          push_token?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      provider_calendar_integrations: {
        Row: {
          auto_sync: boolean
          created_at: string
          google_access_token_expires_at: string | null
          google_account_email: string | null
          google_account_name: string | null
          google_calendar_id: string | null
          google_calendar_name: string | null
          google_calendar_timezone: string | null
          google_connected_at: string | null
          id: string
          import_external: boolean
          integration_name: string
          last_error: string | null
          last_exported_at: string | null
          last_imported_at: string | null
          last_synced_at: string | null
          provider_id: string
          sync_cursor: string | null
          sync_scope: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean
          created_at?: string
          google_access_token_expires_at?: string | null
          google_account_email?: string | null
          google_account_name?: string | null
          google_calendar_id?: string | null
          google_calendar_name?: string | null
          google_calendar_timezone?: string | null
          google_connected_at?: string | null
          id?: string
          import_external?: boolean
          integration_name?: string
          last_error?: string | null
          last_exported_at?: string | null
          last_imported_at?: string | null
          last_synced_at?: string | null
          provider_id: string
          sync_cursor?: string | null
          sync_scope?: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean
          created_at?: string
          google_access_token_expires_at?: string | null
          google_account_email?: string | null
          google_account_name?: string | null
          google_calendar_id?: string | null
          google_calendar_name?: string | null
          google_calendar_timezone?: string | null
          google_connected_at?: string | null
          id?: string
          import_external?: boolean
          integration_name?: string
          last_error?: string | null
          last_exported_at?: string | null
          last_imported_at?: string | null
          last_synced_at?: string | null
          provider_id?: string
          sync_cursor?: string | null
          sync_scope?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_calendar_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_calendar_sync_jobs: {
        Row: {
          attempts: number
          created_at: string
          entity_id: string | null
          entity_type: string
          google_event_id: string | null
          id: string
          job_key: string
          last_error: string | null
          next_attempt_at: string
          operation: string
          payload: Json
          processed_at: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          entity_id?: string | null
          entity_type: string
          google_event_id?: string | null
          id?: string
          job_key: string
          last_error?: string | null
          next_attempt_at?: string
          operation: string
          payload?: Json
          processed_at?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          google_event_id?: string | null
          id?: string
          job_key?: string
          last_error?: string | null
          next_attempt_at?: string
          operation?: string
          payload?: Json
          processed_at?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_calendar_sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_calendar_sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          provider_id: string
          rejection_reason: string | null
          service_category_id: string | null
          verification_status: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          provider_id: string
          rejection_reason?: string | null
          service_category_id?: string | null
          verification_status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          provider_id?: string
          rejection_reason?: string | null
          service_category_id?: string | null
          verification_status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_event_reminders: {
        Row: {
          booking_id: string | null
          created_at: string
          delivery_attempts: number
          id: string
          last_error: string | null
          payload: Json
          provider_event_id: string | null
          provider_id: string
          reminder_channel: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          delivery_attempts?: number
          id?: string
          last_error?: string | null
          payload?: Json
          provider_event_id?: string | null
          provider_id: string
          reminder_channel: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          delivery_attempts?: number
          id?: string
          last_error?: string | null
          payload?: Json
          provider_event_id?: string | null
          provider_id?: string
          reminder_channel?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_event_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_event_reminders_provider_event_id_fkey"
            columns: ["provider_event_id"]
            isOneToOne: false
            referencedRelation: "provider_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_event_reminders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_event_reminders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_events: {
        Row: {
          all_day: boolean
          booking_id: string | null
          booking_status: string | null
          created_at: string
          end_date: string | null
          end_time: string | null
          event_date: string
          event_type: string
          external_source_id: string | null
          external_source_payload: Json
          id: string
          last_synced_at: string | null
          location: string | null
          notes: string | null
          provider_id: string
          source: string
          start_time: string | null
          sync_error: string | null
          sync_status: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          booking_id?: string | null
          booking_status?: string | null
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          external_source_id?: string | null
          external_source_payload?: Json
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notes?: string | null
          provider_id: string
          source?: string
          start_time?: string | null
          sync_error?: string | null
          sync_status?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          booking_id?: string | null
          booking_status?: string | null
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          external_source_id?: string | null
          external_source_payload?: Json
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notes?: string | null
          provider_id?: string
          source?: string
          start_time?: string | null
          sync_error?: string | null
          sync_status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payment_details: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_number_encrypted: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          ifsc_code: string | null
          ifsc_code_encrypted: string | null
          payment_method: string
          provider_id: string
          qr_code_url: string | null
          updated_at: string | null
          upi_id: string | null
          upi_id_encrypted: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_number_encrypted?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          ifsc_code_encrypted?: string | null
          payment_method: string
          provider_id: string
          qr_code_url?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_id_encrypted?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_number_encrypted?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          ifsc_code?: string | null
          ifsc_code_encrypted?: string | null
          payment_method?: string
          provider_id?: string
          qr_code_url?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_id_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_payment_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payment_details_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_time_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_enabled: boolean
          max_capacity: number
          provider_id: string
          slot_kind: string
          slot_name: string
          sort_order: number
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_enabled?: boolean
          max_capacity?: number
          provider_id: string
          slot_kind: string
          slot_name: string
          sort_order?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_enabled?: boolean
          max_capacity?: number
          provider_id?: string
          slot_kind?: string
          slot_name?: string
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_time_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_time_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          description: string
          event_date: string | null
          guest_count: number | null
          id: string
          images: string[] | null
          location: string
          provider_id: string | null
          quoted_amount: number | null
          quoted_description: string | null
          service_type: string
          special_requirements: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          description: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          images?: string[] | null
          location: string
          provider_id?: string | null
          quoted_amount?: number | null
          quoted_description?: string | null
          service_type: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          description?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          images?: string[] | null
          location?: string
          provider_id?: string | null
          quoted_amount?: number | null
          quoted_description?: string | null
          service_type?: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          review_text: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          review_text?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          review_text?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_bundles: {
        Row: {
          base_price: number
          bundle_name: string
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          discounted_price: number
          duration_days: number | null
          id: string
          is_active: boolean | null
          max_guests: number | null
          min_advance_percentage: number | null
          portfolio_images: string[] | null
          provider_id: string
          terms_conditions: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          bundle_name: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discounted_price: number
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_guests?: number | null
          min_advance_percentage?: number | null
          portfolio_images?: string[] | null
          provider_id: string
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          bundle_name?: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discounted_price?: number
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_guests?: number | null
          min_advance_percentage?: number | null
          portfolio_images?: string[] | null
          provider_id?: string
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bundles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bundles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      service_provider_availability: {
        Row: {
          booking_id: string | null
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_available: boolean | null
          is_blocked: boolean | null
          provider_id: string
          source: string
          specific_date: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          provider_id: string
          source?: string
          specific_date?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          provider_id?: string
          source?: string
          specific_date?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string | null
          advance_booking_days: number | null
          advance_payment_percentage: number | null
          availability_status: string | null
          base_price: number | null
          business_name: string
          category_id: string | null
          city: string | null
          created_at: string
          description: string | null
          experience_years: number | null
          facebook_url: string | null
          gst_number: string | null
          id: string
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          logo_url: string | null
          portfolio_images: string[] | null
          portfolio_link: string | null
          portfolio_tags: Json | null
          pricing_info: string | null
          profile_id: string | null
          rating: number | null
          real_wedding_stories: Json | null
          rejection_reason: string | null
          requires_advance_payment: boolean | null
          reviewed_at: string | null
          secondary_city: string | null
          service_cities: string[] | null
          service_type: string | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["provider_status"]
          subcategory: string | null
          submitted_at: string
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          total_reviews: number | null
          travel_charges_applicable: boolean | null
          updated_at: string
          url_slug: string
          user_id: string
          verification_document_url: string | null
          website_url: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
          availability_status?: string | null
          base_price?: number | null
          business_name: string
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          gst_number?: string | null
          id?: string
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_link?: string | null
          portfolio_tags?: Json | null
          pricing_info?: string | null
          profile_id?: string | null
          rating?: number | null
          real_wedding_stories?: Json | null
          rejection_reason?: string | null
          requires_advance_payment?: boolean | null
          reviewed_at?: string | null
          secondary_city?: string | null
          service_cities?: string[] | null
          service_type?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["provider_status"]
          subcategory?: string | null
          submitted_at?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          total_reviews?: number | null
          travel_charges_applicable?: boolean | null
          updated_at?: string
          url_slug: string
          user_id: string
          verification_document_url?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
          availability_status?: string | null
          base_price?: number | null
          business_name?: string
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          gst_number?: string | null
          id?: string
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_link?: string | null
          portfolio_tags?: Json | null
          pricing_info?: string | null
          profile_id?: string | null
          rating?: number | null
          real_wedding_stories?: Json | null
          rejection_reason?: string | null
          requires_advance_payment?: boolean | null
          reviewed_at?: string | null
          secondary_city?: string | null
          service_cities?: string[] | null
          service_type?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["provider_status"]
          subcategory?: string | null
          submitted_at?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          total_reviews?: number | null
          travel_charges_applicable?: boolean | null
          updated_at?: string
          url_slug?: string
          user_id?: string
          verification_document_url?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          provider_id: string | null
          service_type: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id?: string | null
          service_type: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_suggestions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          status: string | null
          suggestion_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          status?: string | null
          suggestion_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          status?: string | null
          suggestion_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          provider_application_id: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          provider_application_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          provider_application_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_provider_application_id_fkey"
            columns: ["provider_application_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_provider_application_id_fkey"
            columns: ["provider_application_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_theme_preferences: {
        Row: {
          ceremony_type: string
          created_at: string
          custom_settings: Json | null
          id: string
          theme_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ceremony_type: string
          created_at?: string
          custom_settings?: Json | null
          id?: string
          theme_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ceremony_type?: string
          created_at?: string
          custom_settings?: Json | null
          id?: string
          theme_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_preferences_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "ceremony_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_budget_categories: {
        Row: {
          actual_amount: number
          category: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          planned_amount: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          category: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          category?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_budget_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_budget_items: {
        Row: {
          category_name: string
          category_slug: string
          created_at: string
          id: string
          notes: string | null
          planned_amount: number
          updated_at: string
          wedding_event_id: string | null
          wedding_id: string
        }
        Insert: {
          category_name: string
          category_slug: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
          wedding_event_id?: string | null
          wedding_id: string
        }
        Update: {
          category_name?: string
          category_slug?: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
          wedding_event_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_budget_items_wedding_event_id_fkey"
            columns: ["wedding_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_budget_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_event_vendor_requirements: {
        Row: {
          category_name: string
          category_slug: string
          created_at: string
          id: string
          notes: string | null
          required_count: number
          wedding_event_id: string
        }
        Insert: {
          category_name: string
          category_slug: string
          created_at?: string
          id?: string
          notes?: string | null
          required_count?: number
          wedding_event_id: string
        }
        Update: {
          category_name?: string
          category_slug?: string
          created_at?: string
          id?: string
          notes?: string | null
          required_count?: number
          wedding_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_event_vendor_requirements_wedding_event_id_fkey"
            columns: ["wedding_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_events: {
        Row: {
          budget_allocated: number
          checklist_progress: number
          city: string | null
          created_at: string
          event_date: string | null
          event_time: string | null
          event_type: string | null
          guest_count: number
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          progress_percent: number
          sort_order: number
          title: string | null
          total_budget: number | null
          updated_at: string
          user_id: string | null
          venue: string | null
          wedding_id: string | null
          wedding_size: string | null
          wedding_style: string | null
        }
        Insert: {
          budget_allocated?: number
          checklist_progress?: number
          city?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: number
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          progress_percent?: number
          sort_order?: number
          title?: string | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
          wedding_id?: string | null
          wedding_size?: string | null
          wedding_style?: string | null
        }
        Update: {
          budget_allocated?: number
          checklist_progress?: number
          city?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: number
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          progress_percent?: number
          sort_order?: number
          title?: string | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
          wedding_id?: string | null
          wedding_size?: string | null
          wedding_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_events_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_invitations: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          is_used: boolean
          permission_level: string
          role: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          is_used?: boolean
          permission_level?: string
          role: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          is_used?: boolean
          permission_level?: string
          role?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_invitations_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_manual_expenses: {
        Row: {
          amount: number
          category_name: string
          created_at: string
          id: string
          notes: string | null
          receipt_url: string | null
          spent_at: string
          wedding_id: string
        }
        Insert: {
          amount?: number
          category_name: string
          created_at?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          spent_at?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          category_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          spent_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_manual_expenses_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_members: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          permission_level: string
          role: string
          status: string
          user_id: string | null
          wedding_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          permission_level?: string
          role: string
          status?: string
          user_id?: string | null
          wedding_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          permission_level?: string
          role?: string
          status?: string
          user_id?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_members_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_preferences: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          event_date: string | null
          guest_count: number | null
          id: string
          location: string | null
          priorities: string[] | null
          updated_at: string
          user_id: string
          wedding_size: string | null
          wedding_style: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          location?: string | null
          priorities?: string[] | null
          updated_at?: string
          user_id: string
          wedding_size?: string | null
          wedding_style?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          location?: string | null
          priorities?: string[] | null
          updated_at?: string
          user_id?: string
          wedding_size?: string | null
          wedding_style?: string | null
        }
        Relationships: []
      }
      wedding_tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          is_default: boolean
          priority: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          wedding_event_id: string | null
          wedding_id: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_default?: boolean
          priority?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          wedding_event_id?: string | null
          wedding_id?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_default?: boolean
          priority?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          wedding_event_id?: string | null
          wedding_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_tasks_wedding_event_id_fkey"
            columns: ["wedding_event_id"]
            isOneToOne: false
            referencedRelation: "wedding_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          bride_name: string
          budget_range: string
          city: string
          created_at: string
          cultural_preferences: string[]
          groom_name: string
          guest_count: number
          id: string
          is_estimated_date: boolean
          location: string | null
          notes: string | null
          owner_user_id: string
          status: string
          title: string
          total_budget: number
          updated_at: string
          wedding_date: string | null
          wedding_type: string
        }
        Insert: {
          bride_name: string
          budget_range: string
          city: string
          created_at?: string
          cultural_preferences?: string[]
          groom_name: string
          guest_count?: number
          id?: string
          is_estimated_date?: boolean
          location?: string | null
          notes?: string | null
          owner_user_id: string
          status?: string
          title: string
          total_budget?: number
          updated_at?: string
          wedding_date?: string | null
          wedding_type: string
        }
        Update: {
          bride_name?: string
          budget_range?: string
          city?: string
          created_at?: string
          cultural_preferences?: string[]
          groom_name?: string
          guest_count?: number
          id?: string
          is_estimated_date?: boolean
          location?: string | null
          notes?: string | null
          owner_user_id?: string
          status?: string
          title?: string
          total_budget?: number
          updated_at?: string
          wedding_date?: string | null
          wedding_type?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          conversation_state: string
          created_at: string
          current_step: string | null
          customer_id: string
          expires_at: string | null
          id: string
          last_inbound_at: string | null
          last_outbound_at: string | null
          source: string
          state_payload: Json
          updated_at: string
        }
        Insert: {
          conversation_state?: string
          created_at?: string
          current_step?: string | null
          customer_id: string
          expires_at?: string | null
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          source?: string
          state_payload?: Json
          updated_at?: string
        }
        Update: {
          conversation_state?: string
          created_at?: string
          current_step?: string | null
          customer_id?: string
          expires_at?: string | null
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          source?: string
          state_payload?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_customers: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_seen_at: string | null
          normalized_phone: string
          profile_id: string | null
          source: string
          updated_at: string
          whatsapp_phone: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          normalized_phone: string
          profile_id?: string | null
          source?: string
          updated_at?: string
          whatsapp_phone: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          normalized_phone?: string
          profile_id?: string | null
          source?: string
          updated_at?: string
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          event_name: string
          id: string
          payload: Json
          request_id: string | null
          source: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_name: string
          id?: string
          payload?: Json
          request_id?: string | null
          source?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_name?: string
          id?: string
          payload?: Json
          request_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          delivery_status: string
          direction: string
          id: string
          message_type: string
          payload: Json
          whatsapp_message_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          delivery_status?: string
          direction: string
          id?: string
          message_type?: string
          payload?: Json
          whatsapp_message_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          delivery_status?: string
          direction?: string
          id?: string
          message_type?: string
          payload?: Json
          whatsapp_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_request_providers: {
        Row: {
          created_at: string
          is_recommended: boolean
          provider_id: string
          request_id: string
          selection_rank: number
        }
        Insert: {
          created_at?: string
          is_recommended?: boolean
          provider_id: string
          request_id: string
          selection_rank?: number
        }
        Update: {
          created_at?: string
          is_recommended?: boolean
          provider_id?: string
          request_id?: string
          selection_rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_request_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_request_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_request_providers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          customer_id: string
          event_date: string | null
          event_type: string | null
          guest_count: number | null
          id: string
          location_name: string | null
          notes: string | null
          recommendation_requested: boolean
          request_code: string
          request_type: string
          selected_provider_ids: string[]
          selected_requirement_ids: string[]
          service_answers: Json
          service_category_id: string | null
          service_category_name: string | null
          service_category_slug: string | null
          source: string
          source_whatsapp_message_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          customer_id: string
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          location_name?: string | null
          notes?: string | null
          recommendation_requested?: boolean
          request_code: string
          request_type: string
          selected_provider_ids?: string[]
          selected_requirement_ids?: string[]
          service_answers?: Json
          service_category_id?: string | null
          service_category_name?: string | null
          service_category_slug?: string | null
          source?: string
          source_whatsapp_message_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          customer_id?: string
          event_date?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          location_name?: string | null
          notes?: string | null
          recommendation_requested?: boolean
          request_code?: string
          request_type?: string
          selected_provider_ids?: string[]
          selected_requirement_ids?: string[]
          service_answers?: Json
          service_category_id?: string | null
          service_category_name?: string | null
          service_category_slug?: string | null
          source?: string
          source_whatsapp_message_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_requests_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_service_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          options: Json | null
          required: boolean
          service_slug: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          options?: Json | null
          required?: boolean
          service_slug: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          options?: Json | null
          required?: boolean
          service_slug?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_service_questions_service_slug_fkey"
            columns: ["service_slug"]
            isOneToOne: false
            referencedRelation: "whatsapp_services"
            referencedColumns: ["slug"]
          },
        ]
      }
      whatsapp_service_requirements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          requirement_id: string
          service_slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          requirement_id: string
          service_slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          requirement_id?: string
          service_slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_service_requirements_service_slug_fkey"
            columns: ["service_slug"]
            isOneToOne: false
            referencedRelation: "whatsapp_services"
            referencedColumns: ["slug"]
          },
        ]
      }
      whatsapp_services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_service_providers: {
        Row: {
          advance_booking_days: number | null
          advance_payment_percentage: number | null
          availability_status: string | null
          base_price: number | null
          business_name: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          description: string | null
          experience_years: number | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          is_premium: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          logo_url: string | null
          portfolio_images: string[] | null
          portfolio_link: string | null
          portfolio_tags: Json | null
          pricing_info: string | null
          rating: number | null
          real_wedding_stories: Json | null
          requires_advance_payment: boolean | null
          secondary_city: string | null
          service_cities: string[] | null
          service_type: string | null
          specializations: string[] | null
          status: Database["public"]["Enums"]["provider_status"] | null
          subcategory: string | null
          total_reviews: number | null
          travel_charges_applicable: boolean | null
          updated_at: string | null
          url_slug: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
          availability_status?: string | null
          base_price?: number | null
          business_name?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_link?: string | null
          portfolio_tags?: Json | null
          pricing_info?: string | null
          rating?: number | null
          real_wedding_stories?: Json | null
          requires_advance_payment?: boolean | null
          secondary_city?: string | null
          service_cities?: string[] | null
          service_type?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["provider_status"] | null
          subcategory?: string | null
          total_reviews?: number | null
          travel_charges_applicable?: boolean | null
          updated_at?: string | null
          url_slug?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
          availability_status?: string | null
          base_price?: number | null
          business_name?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          portfolio_images?: string[] | null
          portfolio_link?: string | null
          portfolio_tags?: Json | null
          pricing_info?: string | null
          rating?: number | null
          real_wedding_stories?: Json | null
          requires_advance_payment?: boolean | null
          secondary_city?: string | null
          service_cities?: string[] | null
          service_type?: string | null
          specializations?: string[] | null
          status?: Database["public"]["Enums"]["provider_status"] | null
          subcategory?: string | null
          total_reviews?: number | null
          travel_charges_applicable?: boolean | null
          updated_at?: string | null
          url_slug?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_chat_message: {
        Args: { p_receiver_id: string; p_sender_id: string }
        Returns: boolean
      }
      can_access_otp: { Args: { p_user_id: string }; Returns: boolean }
      can_access_wedding: { Args: { _wedding_id: string }; Returns: boolean }
      can_manage_wedding: { Args: { _wedding_id: string }; Returns: boolean }
      claim_admin_invitation: { Args: { p_token: string }; Returns: boolean }
      cleanup_expired_admin_invitations: { Args: never; Returns: number }
      count_provider_occupied_events: {
        Args: {
          p_end_date: string
          p_provider_id: string
          p_start_date: string
        }
        Returns: number
      }
      decrypt_payment_field: { Args: { ciphertext: string }; Returns: string }
      encrypt_payment_field: { Args: { plaintext: string }; Returns: string }
      generate_provider_slug: {
        Args: { p_id: string; p_name: string }
        Returns: string
      }
      get_availability_summary: {
        Args: { p_for_date?: string; p_provider_id: string }
        Returns: {
          blocked_source_count: number
          booking_event_count: number
          bookings_count: number
          capacity_limit: number
          for_date: string
          is_blocked: boolean
          is_fully_booked: boolean
          manual_event_count: number
          provider_id: string
          remaining_capacity: number
        }[]
      }
      get_booking_customer_chat_info: {
        Args: { booking_ids: string[] }
        Returns: {
          booking_id: string
          customer_name: string
          customer_profile_id: string
          customer_profile_image: string
          customer_user_id: string
        }[]
      }
      get_booking_customer_info: {
        Args: { booking_ids: string[] }
        Returns: {
          booking_id: string
          customer_email: string
          customer_name: string
          customer_phone: string
          customer_profile_image: string
        }[]
      }
      get_booking_participant_profile_ids: {
        Args: { p_booking_id: string }
        Returns: {
          customer_profile_id: string
          provider_profile_id: string
        }[]
      }
      get_inquiry_customer_info: {
        Args: { conversation_ids: string[] }
        Returns: {
          conversation_id: string
          customer_email: string
          customer_name: string
          customer_profile_image: string
          customer_user_id: string
        }[]
      }
      get_provider_capacity_limit: {
        Args: { p_provider_id: string }
        Returns: number
      }
      get_provider_contact_info: {
        Args: { provider_uuid: string }
        Returns: {
          address: string
          whatsapp_number: string
        }[]
      }
      get_provider_payment_details: {
        Args: { p_provider_id: string }
        Returns: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          ifsc_code: string
          payment_method: string
          provider_id: string
          qr_code_url: string
          updated_at: string
          upi_id: string
        }[]
      }
      get_provider_profile_name: {
        Args: { p_profile_id: string }
        Returns: {
          avatar_url: string
          full_name: string
        }[]
      }
      get_public_provider_info: {
        Args: { provider_uuid: string }
        Returns: {
          business_name: string
          category_icon: string
          category_id: string
          category_name: string
          city: string
          description: string
          experience_years: number
          id: string
          is_premium: boolean
          is_verified: boolean
          languages: string[]
          portfolio_images: string[]
          rating: number
          service_cities: string[]
          service_type: string
          specializations: string[]
          subcategory: string
          total_reviews: number
        }[]
      }
      get_trending_service_categories: {
        Args: never
        Returns: {
          booking_count: number
          name: string
          slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_admin_token: { Args: { raw_token: string }; Returns: string }
      is_provider_owner: { Args: { p_provider_id: string }; Returns: boolean }
      queue_provider_calendar_sync_job: {
        Args: {
          p_entity_id?: string
          p_entity_type: string
          p_google_event_id?: string
          p_operation: string
          p_payload?: Json
          p_provider_id: string
        }
        Returns: undefined
      }
      queue_provider_event_reminders: {
        Args: {
          p_booking_id?: string
          p_event_date?: string
          p_event_title?: string
          p_provider_event_id?: string
          p_provider_id: string
        }
        Returns: undefined
      }
      validate_booking_request: {
        Args: {
          p_booking_id?: string
          p_end_date?: string
          p_provider_id: string
          p_service_date: string
          p_service_time?: string
          p_start_date?: string
          p_status?: string
          p_time_slot?: string
        }
        Returns: {
          bookings_count: number
          capacity_limit: number
          conflict_type: string
          conflicting_id: string
          message: string
          valid: boolean
        }[]
      }
      validate_provider_event_request: {
        Args: {
          p_all_day?: boolean
          p_end_time?: string
          p_event_date: string
          p_event_type: string
          p_provider_event_id?: string
          p_provider_id: string
          p_start_time?: string
        }
        Returns: {
          bookings_count: number
          capacity_limit: number
          conflict_type: string
          conflicting_id: string
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "user"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      provider_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      provider_calendar_item: {
        id: string | null
        provider_id: string | null
        title: string | null
        event_type: string | null
        event_date: string | null
        start_time: string | null
        end_time: string | null
        all_day: boolean | null
        notes: string | null
        location: string | null
        source: string | null
        booking_id: string | null
        booking_status: string | null
        customer_name: string | null
        customer_phone: string | null
        is_blocked: boolean | null
        capacity_limit: number | null
        bookings_count: number | null
        created_at: string | null
        updated_at: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "provider", "user"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      provider_status: ["pending", "approved", "rejected"],
    },
  },
} as const
