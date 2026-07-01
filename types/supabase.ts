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
          cost_price_bdt: number;
          image_url: string | null;
          images: Json;
          barcode: string | null;
          brand: string | null;
          category: string | null;
          color: string | null;
          size: string | null;
          variants: Json;
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
          cost_price_bdt?: number;
          image_url?: string | null;
          images?: Json;
          barcode?: string | null;
          brand?: string | null;
          category?: string | null;
          color?: string | null;
          size?: string | null;
          variants?: Json;
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
          cost_price_bdt?: number;
          image_url?: string | null;
          images?: Json;
          barcode?: string | null;
          brand?: string | null;
          category?: string | null;
          color?: string | null;
          size?: string | null;
          variants?: Json;
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
          payment_status: string;
          advance_bdt: number;
          delivery_charge_bdt: number;
          discount_bdt: number;
          coupon_code: string | null;
          coupon_discount_bdt: number;
          notes: string;
          order_phone: string | null;
          order_address: string | null;
          courier_name: string | null;
          tracking_code: string | null;
          shipping_cost_bdt: number;
          created_at: string;
          updated_at: string;
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
          payment_status?: string;
          advance_bdt?: number;
          delivery_charge_bdt?: number;
          discount_bdt?: number;
          coupon_code?: string | null;
          coupon_discount_bdt?: number;
          notes?: string;
          order_phone?: string | null;
          order_address?: string | null;
          courier_name?: string | null;
          tracking_code?: string | null;
          shipping_cost_bdt?: number;
          created_at?: string;
          updated_at?: string;
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
          payment_status?: string;
          advance_bdt?: number;
          delivery_charge_bdt?: number;
          discount_bdt?: number;
          coupon_code?: string | null;
          coupon_discount_bdt?: number;
          notes?: string;
          order_phone?: string | null;
          order_address?: string | null;
          courier_name?: string | null;
          tracking_code?: string | null;
          shipping_cost_bdt?: number;
          created_at?: string;
          updated_at?: string;
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
          business_name: string;
          notes: string;
          avatar_url: string | null;
          tags: Json;
          addresses: Json;
          phones: Json;
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
          business_name?: string;
          notes?: string;
          avatar_url?: string | null;
          tags?: Json;
          addresses?: Json;
          phones?: Json;
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
          business_name?: string;
          notes?: string;
          avatar_url?: string | null;
          tags?: Json;
          addresses?: Json;
          phones?: Json;
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
          unit_price_bdt: number;
          discount_bdt: number;
          line_total_bdt: number;
          product_name: string | null;
          product_sku: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_bdt?: number;
          discount_bdt?: number;
          line_total_bdt?: number;
          product_name?: string | null;
          product_sku?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_bdt?: number;
          discount_bdt?: number;
          line_total_bdt?: number;
          product_name?: string | null;
          product_sku?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_timeline: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          note: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          note?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          note?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_comments: {
        Row: {
          id: string;
          order_id: string;
          author: string;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          author: string;
          content: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          author?: string;
          content?: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          organization_id: string;
          amount_bdt: number;
          category: string;
          description: string | null;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          amount_bdt: number;
          category: string;
          description?: string | null;
          date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          amount_bdt?: number;
          category?: string;
          description?: string | null;
          date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
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
          invoice_prefix: string;
          default_courier: string | null;
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
          invoice_prefix?: string;
          default_courier?: string | null;
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
          invoice_prefix?: string;
          default_courier?: string | null;
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
      payment_history: {
        Row: {
          id: string;
          organization_id: string;
          plan: string;
          amount_bdt: number;
          currency: string;
          payment_provider: string;
          provider_payment_id: string | null;
          status: string;
          invoice_number: string | null;
          invoice_pdf_url: string | null;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan: string;
          amount_bdt: number;
          currency?: string;
          payment_provider?: string;
          provider_payment_id?: string | null;
          status?: string;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: string;
          amount_bdt?: number;
          currency?: string;
          payment_provider?: string;
          provider_payment_id?: string | null;
          status?: string;
          invoice_number?: string | null;
          invoice_pdf_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_history_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      coupons: {
        Row: {
          id: string;
          organization_id: string | null;
          code: string;
          type: string;
          value: number;
          max_uses: number;
          current_uses: number;
          min_plan: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          code: string;
          type?: string;
          value: number;
          max_uses?: number;
          current_uses?: number;
          min_plan?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          code?: string;
          type?: string;
          value?: number;
          max_uses?: number;
          current_uses?: number;
          min_plan?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_organization_id_fkey",
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
          theme: string;
          locale: string;
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
          theme?: string;
          locale?: string;
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
          theme?: string;
          locale?: string;
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
          status: string;
          last_login: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: string;
          status?: string;
          last_login?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          last_login?: string | null;
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
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey",
            columns: ["actor_id"],
            referencedRelation: "users",
            referencedColumns: ["id"],
          },
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          activity_type: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          activity_type: string;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          activity_type?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "users",
            referencedColumns: ["id"],
          },
        ];
      };
      org_settings: {
        Row: {
          id: string;
          organization_id: string;
          key: string;
          value: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          key: string;
          value?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey",
            columns: ["organization_id"],
            referencedRelation: "organizations",
            referencedColumns: ["id"],
          },
        ];
      };
      notification_preferences: {
        Row: {
          id: string;
          organization_id: string;
          email_enabled: boolean;
          sms_enabled: boolean;
          push_enabled: boolean;
          order_updates: boolean;
          low_stock_alerts: boolean;
          marketing_emails: boolean;
          payment_confirmations: boolean;
          daily_summary: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          push_enabled?: boolean;
          order_updates?: boolean;
          low_stock_alerts?: boolean;
          marketing_emails?: boolean;
          payment_confirmations?: boolean;
          daily_summary?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email_enabled?: boolean;
          sms_enabled?: boolean;
          push_enabled?: boolean;
          order_updates?: boolean;
          low_stock_alerts?: boolean;
          marketing_emails?: boolean;
          payment_confirmations?: boolean;
          daily_summary?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey",
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
          status: string;
          last_login: string | null;
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
