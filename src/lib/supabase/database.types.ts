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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "member" | "organiser" | "admin";
      user_status: "active" | "suspended";
    };
    CompositeTypes: Record<string, never>;
  };
};
