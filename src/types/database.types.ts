export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          active: boolean
          created_at: string
          default_duration_minutes: number
          default_price: number | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_duration_minutes: number
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_duration_minutes?: number
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          activity_id: string
          amount: number
          billing_cycle: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          customer_id: string
          ends_at: string | null
          id: string
          organization_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          amount: number
          billing_cycle: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at?: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          customer_id: string
          ends_at?: string | null
          id?: string
          organization_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at?: string
          currency_code?: Database["public"]["Enums"]["organization_currency"]
          customer_id?: string
          ends_at?: string | null
          id?: string
          organization_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_subscriptions_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_customer_subscriptions_customer"
            columns: ["customer_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          system: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          system?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          system?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_recurrences: {
        Row: {
          active: boolean
          amount: number
          category_id: string
          created_at: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          description: string
          ends_at: string | null
          first_due_date: string
          id: string
          notes: string | null
          organization_id: string
          recurrence_cycle: Database["public"]["Enums"]["expense_recurrence_cycle"]
          starts_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount: number
          category_id: string
          created_at?: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          description: string
          ends_at?: string | null
          first_due_date: string
          id?: string
          notes?: string | null
          organization_id: string
          recurrence_cycle: Database["public"]["Enums"]["expense_recurrence_cycle"]
          starts_at: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          category_id?: string
          created_at?: string
          currency_code?: Database["public"]["Enums"]["organization_currency"]
          description?: string
          ends_at?: string | null
          first_due_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          recurrence_cycle?: Database["public"]["Enums"]["expense_recurrence_cycle"]
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_recurrences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_recurrences_category"
            columns: ["category_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      financial_expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          description: string
          due_date: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          recurrence_id: string | null
          reference_date: string
          status: Database["public"]["Enums"]["financial_entry_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          description: string
          due_date: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          recurrence_id?: string | null
          reference_date: string
          status?: Database["public"]["Enums"]["financial_entry_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency_code?: Database["public"]["Enums"]["organization_currency"]
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          recurrence_id?: string | null
          reference_date?: string
          status?: Database["public"]["Enums"]["financial_entry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_expenses_category"
            columns: ["category_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_financial_expenses_recurrence"
            columns: ["recurrence_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "expense_recurrences"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      financial_periods: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          month: number
          organization_id: string
          status: Database["public"]["Enums"]["financial_period_status"]
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          month: number
          organization_id: string
          status?: Database["public"]["Enums"]["financial_period_status"]
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          month?: number
          organization_id?: string
          status?: Database["public"]["Enums"]["financial_period_status"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_revenues: {
        Row: {
          activity_id: string | null
          amount: number
          created_at: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          customer_id: string | null
          customer_subscription_id: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          reference_date: string
          source: Database["public"]["Enums"]["financial_revenue_source"]
          status: Database["public"]["Enums"]["financial_entry_status"]
          updated_at: string
        }
        Insert: {
          activity_id?: string | null
          amount: number
          created_at?: string
          currency_code: Database["public"]["Enums"]["organization_currency"]
          customer_id?: string | null
          customer_subscription_id?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          reference_date: string
          source: Database["public"]["Enums"]["financial_revenue_source"]
          status?: Database["public"]["Enums"]["financial_entry_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string | null
          amount?: number
          created_at?: string
          currency_code?: Database["public"]["Enums"]["organization_currency"]
          customer_id?: string | null
          customer_subscription_id?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          reference_date?: string
          source?: Database["public"]["Enums"]["financial_revenue_source"]
          status?: Database["public"]["Enums"]["financial_entry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_revenues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_revenues_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_financial_revenues_customer"
            columns: ["customer_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_financial_revenues_subscription"
            columns: ["customer_subscription_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type:
            | Database["public"]["Enums"]["organization_business_type"]
            | null
          country: Database["public"]["Enums"]["organization_country"]
          created_at: string
          default_currency: Database["public"]["Enums"]["organization_currency"]
          id: string
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          business_type?:
            | Database["public"]["Enums"]["organization_business_type"]
            | null
          country?: Database["public"]["Enums"]["organization_country"]
          created_at?: string
          default_currency?: Database["public"]["Enums"]["organization_currency"]
          id?: string
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_type?:
            | Database["public"]["Enums"]["organization_business_type"]
            | null
          country?: Database["public"]["Enums"]["organization_country"]
          created_at?: string
          default_currency?: Database["public"]["Enums"]["organization_currency"]
          id?: string
          name?: string
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_expense_recurrence_cycle: {
        Args: {
          p_cycle: Database["public"]["Enums"]["expense_recurrence_cycle"]
          p_date: string
        }
        Returns: string
      }
      add_subscription_billing_cycle: {
        Args: {
          p_cycle: Database["public"]["Enums"]["subscription_billing_cycle"]
          p_date: string
        }
        Returns: string
      }
      create_organization_onboarding: {
        Args: {
          p_business_type: Database["public"]["Enums"]["organization_business_type"]
          p_country: Database["public"]["Enums"]["organization_country"]
          p_default_currency: Database["public"]["Enums"]["organization_currency"]
          p_organization_name: string
          p_phone: string
          p_professional_name: string
          p_timezone: string
        }
        Returns: string
      }
      generate_recurring_expenses_for_period: {
        Args: {
          p_organization_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: number
      }
      generate_subscription_revenues_for_period: {
        Args: {
          p_organization_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: number
      }
      is_organization_manager: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      refresh_financial_overdue_statuses: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      seed_default_expense_categories: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      set_customer_active_status: {
        Args: { p_active: boolean; p_customer_id: string }
        Returns: {
          active: boolean
          ended_subscriptions: number
        }[]
      }
      sync_financial_period: {
        Args: { p_reference_date: string }
        Returns: {
          generated_expenses: number
          generated_revenues: number
          organization_id: string
          period_end: string
          period_start: string
        }[]
      }
    }
    Enums: {
      expense_recurrence_cycle:
        | "WEEKLY"
        | "MONTHLY"
        | "QUARTERLY"
        | "SEMIANNUAL"
        | "ANNUAL"
      financial_entry_status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
      financial_period_status: "OPEN" | "CLOSED"
      financial_revenue_source: "SUBSCRIPTION" | "MANUAL"
      organization_business_type:
        | "ACADEMY"
        | "CLUB"
        | "STUDIO"
        | "INDEPENDENT_PROFESSIONAL"
        | "CLINIC"
        | "OTHER"
      organization_country: "BR" | "US" | "PT" | "CA" | "OTHER"
      organization_currency: "BRL" | "USD" | "EUR" | "CAD"
      organization_role: "OWNER" | "ADMIN" | "PROFESSIONAL" | "CUSTOMER"
      organization_status: "ACTIVE" | "INACTIVE"
      subscription_billing_cycle:
        | "WEEKLY"
        | "MONTHLY"
        | "QUARTERLY"
        | "SEMIANNUAL"
        | "ANNUAL"
        | "ONE_TIME"
      subscription_status: "ACTIVE" | "PAUSED" | "ENDED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      expense_recurrence_cycle: [
        "WEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "SEMIANNUAL",
        "ANNUAL",
      ],
      financial_entry_status: ["PENDING", "PAID", "OVERDUE", "CANCELLED"],
      financial_period_status: ["OPEN", "CLOSED"],
      financial_revenue_source: ["SUBSCRIPTION", "MANUAL"],
      organization_business_type: [
        "ACADEMY",
        "CLUB",
        "STUDIO",
        "INDEPENDENT_PROFESSIONAL",
        "CLINIC",
        "OTHER",
      ],
      organization_country: ["BR", "US", "PT", "CA", "OTHER"],
      organization_currency: ["BRL", "USD", "EUR", "CAD"],
      organization_role: ["OWNER", "ADMIN", "PROFESSIONAL", "CUSTOMER"],
      organization_status: ["ACTIVE", "INACTIVE"],
      subscription_billing_cycle: [
        "WEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "SEMIANNUAL",
        "ANNUAL",
        "ONE_TIME",
      ],
      subscription_status: ["ACTIVE", "PAUSED", "ENDED"],
    },
  },
} as const

