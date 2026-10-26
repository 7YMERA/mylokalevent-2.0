// Hand-written to match supabase/migrations. Replace with generated types
// (`npx supabase gen types typescript --local`) once the stack runs locally.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: "member" | "organiser" | "admin";
          status: "active" | "suspended";
          locale: "ms" | "en";
          consented_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string;
          locale?: "ms" | "en";
        };
        Relationships: [];
      };
      organisers: {
        Row: {
          id: string;
          slug: string;
          name: string;
          phone: string | null;
          state: string | null;
          ssm_number: string | null;
          verification: "none" | "pending" | "verified" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          phone?: string | null;
          state?: string | null;
          ssm_number?: string | null;
        };
        Update: {
          slug?: string;
          name?: string;
          phone?: string | null;
          state?: string | null;
          ssm_number?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_ms: string;
          name_en: string;
          active: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          slug: string;
          name_ms: string;
          name_en: string;
          active?: boolean;
          position?: number;
        };
        Update: {
          slug?: string;
          name_ms?: string;
          name_en?: string;
          active?: boolean;
          position?: number;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          organiser_id: string;
          category_id: string;
          title: string;
          description: string;
          starts_at: string;
          ends_at: string | null;
          state: string;
          district: string;
          venue: string;
          location: string | null;
          lat: number | null;
          lng: number | null;
          fee_myr: number;
          status:
            | "draft"
            | "awaiting_payment"
            | "in_review"
            | "approved"
            | "rejected"
            | "unpublished";
          rejection_reason: string | null;
          featured_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          organiser_id: string;
          category_id: string;
          title: string;
          description: string;
          starts_at: string;
          ends_at?: string | null;
          state: string;
          district: string;
          venue: string;
          location?: string | null;
          fee_myr?: number;
        };
        Update: {
          slug?: string;
          category_id?: string;
          title?: string;
          description?: string;
          starts_at?: string;
          ends_at?: string | null;
          state?: string;
          district?: string;
          venue?: string;
          location?: string | null;
          fee_myr?: number;
        };
        Relationships: [];
      };
      event_images: {
        Row: {
          id: string;
          event_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          event_id: string;
          storage_path: string;
          position?: number;
        };
        Update: never;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          purpose: "listing" | "featured";
          amount_myr: number;
          featured_days: number;
          stripe_session_id: string;
          status: "pending" | "paid" | "refunded" | "failed";
          paid_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      stripe_events: {
        Row: { id: string; received_at: string };
        Insert: { id: string };
        Update: never;
        Relationships: [];
      };
      saved_events: {
        Row: {
          user_id: string;
          event_id: string;
          remind: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          event_id: string;
          remind?: boolean;
        };
        Update: { remind?: boolean };
        Relationships: [];
      };
      follows: {
        Row: {
          user_id: string;
          organiser_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          organiser_id: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_organiser_verification: {
        Args: {
          target: string;
          new_verification: "none" | "pending" | "verified" | "rejected";
          reason: string;
        };
        Returns: undefined;
      };
      set_event_status: {
        Args: {
          target: string;
          new_status:
            | "draft"
            | "awaiting_payment"
            | "in_review"
            | "approved"
            | "rejected"
            | "unpublished";
          reason?: string | null;
        };
        Returns: undefined;
      };
      start_event_payment: {
        Args: {
          target_event: string;
          session_id: string;
          amount: number;
          purpose: "listing" | "featured";
          featured_days?: number;
        };
        Returns: undefined;
      };
      confirm_payment: {
        Args: { session_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "member" | "organiser" | "admin";
      user_status: "active" | "suspended";
      organiser_verification: "none" | "pending" | "verified" | "rejected";
      event_status:
        | "draft"
        | "awaiting_payment"
        | "in_review"
        | "approved"
        | "rejected"
        | "unpublished";
      payment_purpose: "listing" | "featured";
      payment_status: "pending" | "paid" | "refunded" | "failed";
    };
    CompositeTypes: Record<string, never>;
  };
};
