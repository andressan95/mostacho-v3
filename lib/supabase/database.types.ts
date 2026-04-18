// Stub generado manualmente hasta que se ejecute `pnpm supabase:gen-types`
// contra la base de datos local. Cuando esté, este archivo se sobrescribe con
// el tipado completo (`supabase gen types typescript --local`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "client" | "barber" | "admin";
export type LoyaltyLevel = "bronze" | "silver" | "gold" | "diamond";

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
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: AppRole;
      loyalty_level: LoyaltyLevel;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
