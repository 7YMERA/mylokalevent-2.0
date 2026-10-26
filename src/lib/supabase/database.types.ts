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
    };
    Enums: {
      user_role: "member" | "organiser" | "admin";
      user_status: "active" | "suspended";
      organiser_verification: "none" | "pending" | "verified" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
};
