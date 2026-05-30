export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          name: string;
          sku: string;
          stock: number;
          price_bdt: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          name: string;
          sku: string;
          stock?: number;
          price_bdt?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          name?: string;
          sku?: string;
          stock?: number;
          price_bdt?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          order_number: string;
          customer_name: string;
          customer_id: string | null;
          amount_bdt: number;
          status: string;
          created_at: string;
          updated_at: string;
          courier_name: string | null;
          tracking_code: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          order_number: string;
          customer_name: string;
          customer_id?: string | null;
          amount_bdt?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          courier_name?: string | null;
          tracking_code?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          order_number?: string;
          customer_name?: string;
          customer_id?: string | null;
          amount_bdt?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          courier_name?: string | null;
          tracking_code?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          name: string;
          phone: string;
          email: string | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          name: string;
          phone: string;
          email?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          line_total_bdt: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          line_total_bdt?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          line_total_bdt?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      staff_members: {
        Row: {
          id: string;
          shop_owner_id: string;
          full_name: string;
          email: string;
          role: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_owner_id?: string;
          full_name: string;
          email: string;
          role: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_owner_id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          shop_name: string;
          slug: string;
          description: string;
          currency: string;
          phone: string;
          address: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          shop_name: string;
          slug: string;
          description?: string;
          currency?: string;
          phone?: string;
          address?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          shop_name?: string;
          slug?: string;
          description?: string;
          currency?: string;
          phone?: string;
          address?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_info: {
        Row: {
          id: string;
          organization_id: string;
          legal_name: string;
          tax_id: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          legal_name?: string;
          tax_id?: string;
          address?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          legal_name?: string;
          tax_id?: string;
          address?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_info_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          type?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: string;
          status: string;
          start_date: string;
          end_date: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: string;
          status?: string;
          start_date?: string;
          end_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string | null;
          plan: string;
          subscription_status: string;
          trial_ends_at: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id?: string | null;
          plan?: string;
          subscription_status?: string;
          trial_ends_at?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string | null;
          plan?: string;
          subscription_status?: string;
          trial_ends_at?: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: string;
          invited_by: string;
          token: string;
          created_at: string;
          expires_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: string;
          invited_by: string;
          token?: string;
          created_at?: string;
          expires_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: string;
          invited_by?: string;
          token?: string;
          created_at?: string;
          expires_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_organization_members: {
        Args: { org_id: string };
        Returns: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
          email: string;
          full_name: string;
        }[];
      };
      get_org_subscription_context: {
        Args: { org_id: string };
        Returns: {
          plan: string;
          subscription_status: string;
          trial_ends_at: string;
          current_period_end: string | null;
          stripe_customer_id: string | null;
          orders_count: number;
          products_count: number;
          customers_count: number;
          staff_count: number;
          orders_this_month: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
