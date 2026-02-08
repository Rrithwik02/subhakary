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
    PostgrestVersion: "13.0.5"
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
          verified_at: string | null
          verified_by: string | null
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
          verified_at?: string | null
          verified_by?: string | null
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
          verified_at?: string | null
          verified_by?: string | null
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
          auto_complete_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completion_confirmed_by_customer: boolean | null
          completion_confirmed_by_provider: boolean | null
          completion_requested_at: string | null
          completion_status: string | null
          created_at: string
          end_date: string | null
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
        }
        Insert: {
          auto_complete_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completion_confirmed_by_customer?: boolean | null
          completion_confirmed_by_provider?: boolean | null
          completion_requested_at?: string | null
          completion_status?: string | null
          created_at?: string
          end_date?: string | null
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
        }
        Update: {
          auto_complete_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completion_confirmed_by_customer?: boolean | null
          completion_confirmed_by_provider?: boolean | null
          completion_requested_at?: string | null
          completion_status?: string | null
          created_at?: string
          end_date?: string | null
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
        }
        Relationships: [
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
          {
            foreignKeyName: "provider_documents_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
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
          communication_rating: number | null
          created_at: string
          id: string
          photos: string[] | null
          provider_id: string
          punctuality_rating: number | null
          rating: number
          review_text: string | null
          service_quality_rating: number | null
          status: string | null
          user_id: string
          value_for_money_rating: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          photos?: string[] | null
          provider_id: string
          punctuality_rating?: number | null
          rating: number
          review_text?: string | null
          service_quality_rating?: number | null
          status?: string | null
          user_id: string
          value_for_money_rating?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          photos?: string[] | null
          provider_id?: string
          punctuality_rating?: number | null
          rating?: number
          review_text?: string | null
          service_quality_rating?: number | null
          status?: string | null
          user_id?: string
          value_for_money_rating?: number | null
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
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_available: boolean | null
          is_blocked: boolean | null
          provider_id: string
          specific_date: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          provider_id: string
          specific_date?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          provider_id?: string
          specific_date?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
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
          pricing_info: string | null
          profile_id: string | null
          rating: number | null
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
          pricing_info?: string | null
          profile_id?: string | null
          rating?: number | null
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
          pricing_info?: string | null
          profile_id?: string | null
          rating?: number | null
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
    }
    Views: {
      public_service_providers: {
        Row: {
          advance_booking_days: number | null
          advance_payment_percentage: number | null
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
          pricing_info: string | null
          rating: number | null
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
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
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
          pricing_info?: string | null
          rating?: number | null
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
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          advance_booking_days?: number | null
          advance_payment_percentage?: number | null
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
          pricing_info?: string | null
          rating?: number | null
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
      claim_admin_invitation: { Args: { p_token: string }; Returns: boolean }
      cleanup_expired_admin_invitations: { Args: never; Returns: number }
      decrypt_payment_field: { Args: { ciphertext: string }; Returns: string }
      encrypt_payment_field: { Args: { plaintext: string }; Returns: string }
      get_booking_customer_info: {
        Args: { booking_ids: string[] }
        Returns: {
          booking_id: string
          customer_email: string
          customer_name: string
          customer_phone: string
        }[]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_admin_token: { Args: { raw_token: string }; Returns: string }
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
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
