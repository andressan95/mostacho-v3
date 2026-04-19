export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "client" | "barber" | "admin";
export type LoyaltyLevel = "bronze" | "silver" | "gold" | "diamond";
export type VisitStatus = "pending" | "confirmed" | "expired" | "cancelled";
export type QrTokenKind = "visit" | "raffle_prize";
export type LedgerSource = "visit" | "raffle" | "admin_adjust" | "decay";
export type RaffleStatus = "draft" | "open" | "running" | "completed";

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          full_name: string;
          phone: string | null;
          phone_verified: boolean;
          email: string | null;
          avatar_url: string | null;
          birthday: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          full_name?: string;
          phone?: string | null;
          phone_verified?: boolean;
          email?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          full_name?: string;
          phone?: string | null;
          phone_verified?: boolean;
          email?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_roles: {
        Row: {
          id: string;
          profile_id: string;
          tenant_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tenant_id: string;
          role: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          tenant_id?: string;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          profile_id: string;
          tenant_id: string;
          points: number;
          loyalty_level: LoyaltyLevel;
          joined_at: string | null;
          last_visit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tenant_id: string;
          points?: number;
          loyalty_level?: LoyaltyLevel;
          joined_at?: string | null;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          tenant_id?: string;
          points?: number;
          loyalty_level?: LoyaltyLevel;
          joined_at?: string | null;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      barbers: {
        Row: {
          id: string;
          profile_id: string;
          tenant_id: string;
          bio: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tenant_id: string;
          bio?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          tenant_id?: string;
          bio?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          duration_min: number;
          base_points: number;
          price_cents: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          duration_min?: number;
          base_points?: number;
          price_cents?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          duration_min?: number;
          base_points?: number;
          price_cents?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string | null;
          barber_id: string;
          status: VisitStatus;
          price_cents_total: number;
          points_awarded: number;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id?: string | null;
          barber_id: string;
          status?: VisitStatus;
          price_cents_total?: number;
          points_awarded?: number;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_id?: string | null;
          barber_id?: string;
          status?: VisitStatus;
          price_cents_total?: number;
          points_awarded?: number;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Relationships: [];
      };
      visit_services: {
        Row: {
          visit_id: string;
          service_id: string;
          qty: number;
          unit_price_cents: number;
        };
        Insert: {
          visit_id: string;
          service_id: string;
          qty?: number;
          unit_price_cents?: number;
        };
        Update: {
          visit_id?: string;
          service_id?: string;
          qty?: number;
          unit_price_cents?: number;
        };
        Relationships: [];
      };
      qr_tokens: {
        Row: {
          id: string;
          tenant_id: string;
          kind: QrTokenKind;
          ref_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          kind: QrTokenKind;
          ref_id: string;
          token: string;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          kind?: QrTokenKind;
          ref_id?: string;
          token?: string;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      points_ledger: {
        Row: {
          id: string;
          tenant_id: string;
          client_id: string;
          delta: number;
          reason: string;
          source: LedgerSource;
          source_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_id: string;
          delta: number;
          reason?: string;
          source: LedgerSource;
          source_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_id?: string;
          delta?: number;
          reason?: string;
          source?: LedgerSource;
          source_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_settings: {
        Row: {
          tenant_id: string;
          config: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          config?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          config?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          tenant_id: string | null;
          actor_user_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          actor_user_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          tenant_id: string;
          endpoint: string;
          keys: Json;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          tenant_id: string;
          endpoint: string;
          keys: Json;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          tenant_id?: string;
          endpoint?: string;
          keys?: Json;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      raffles: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          status: RaffleStatus;
          eligibility: Json;
          prize_name: string;
          prize_description: string | null;
          winner_client_id: string | null;
          drawn_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          starts_at: string;
          ends_at: string;
          status?: RaffleStatus;
          eligibility?: Json;
          prize_name: string;
          prize_description?: string | null;
          winner_client_id?: string | null;
          drawn_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: RaffleStatus;
          eligibility?: Json;
          prize_name?: string;
          prize_description?: string | null;
          winner_client_id?: string | null;
          drawn_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_points: {
        Args: { p_client_id: string; p_delta: number; p_reason: string };
        Returns: Json;
      };
      archive_service: {
        Args: { p_id: string };
        Returns: undefined;
      };
      close_due_raffles: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      create_raffle: {
        Args: { payload: Json };
        Returns: string;
      };
      create_visit: {
        Args: { p_services: Json; p_client_id?: string | null };
        Returns: Json;
      };
      draw_raffle: {
        Args: { p_raffle_id: string };
        Returns: Json;
      };
      redeem_prize_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      redeem_visit_token: {
        Args: { p_token: string };
        Returns: Json;
      };
      update_tenant_settings: {
        Args: { patch: Json };
        Returns: undefined;
      };
      upsert_push_subscription: {
        Args: {
          p_endpoint: string;
          p_keys: Json;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      upsert_service: {
        Args: {
          p_id?: string | null;
          p_name?: string;
          p_duration_min?: number;
          p_base_points?: number;
          p_price_cents?: number;
          p_active?: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: AppRole;
      loyalty_level: LoyaltyLevel;
      visit_status: VisitStatus;
      qr_token_kind: QrTokenKind;
      ledger_source: LedgerSource;
      raffle_status: RaffleStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
