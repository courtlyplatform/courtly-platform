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
          professional_requirement: Database["public"]["Enums"]["scheduling_requirement"]
          resource_requirement: Database["public"]["Enums"]["scheduling_requirement"]
          scheduling_mode: Database["public"]["Enums"]["activity_scheduling_mode"]
          specialty_id: string | null
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
          professional_requirement?: Database["public"]["Enums"]["scheduling_requirement"]
          resource_requirement?: Database["public"]["Enums"]["scheduling_requirement"]
          scheduling_mode?: Database["public"]["Enums"]["activity_scheduling_mode"]
          specialty_id?: string | null
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
          professional_requirement?: Database["public"]["Enums"]["scheduling_requirement"]
          resource_requirement?: Database["public"]["Enums"]["scheduling_requirement"]
          scheduling_mode?: Database["public"]["Enums"]["activity_scheduling_mode"]
          specialty_id?: string | null
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
          {
            foreignKeyName: "fk_activities_specialty"
            columns: ["specialty_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professional_specialties"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      activity_resource_requirements: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          resource_pool_id: string | null
          resource_type_id: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity?: number
          resource_pool_id?: string | null
          resource_type_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          resource_pool_id?: string | null
          resource_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_resource_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_activity_resource_pool"
            columns: ["resource_pool_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resource_pools"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_activity_resource_type"
            columns: ["resource_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resource_types"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      appointment_resources: {
        Row: {
          appointment_id: string
          created_at: string
          ends_at: string
          organization_id: string
          resource_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_id: string
          created_at?: string
          ends_at: string
          organization_id: string
          resource_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_id?: string
          created_at?: string
          ends_at?: string
          organization_id?: string
          resource_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_appointment_resources_appointment"
            columns: ["appointment_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_appointment_resources_resource"
            columns: ["resource_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      appointments: {
        Row: {
          activity_id: string
          attendance_status: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          customer_subscription_id: string | null
          ends_at: string
          id: string
          organization_id: string
          professional_id: string | null
          schedule_rule_id: string | null
          source: Database["public"]["Enums"]["appointment_source"]
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          attendance_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          customer_subscription_id?: string | null
          ends_at: string
          id?: string
          organization_id: string
          professional_id?: string | null
          schedule_rule_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          attendance_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          customer_subscription_id?: string | null
          ends_at?: string
          id?: string
          organization_id?: string
          professional_id?: string | null
          schedule_rule_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_appointments_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_appointments_customer"
            columns: ["customer_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_appointments_professional"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_appointments_rule"
            columns: ["schedule_rule_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "schedule_rules"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_appointments_subscription"
            columns: [
              "customer_subscription_id",
              "organization_id",
              "customer_id",
              "activity_id",
            ]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: [
              "id",
              "organization_id",
              "customer_id",
              "activity_id",
            ]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
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
      membership_permission_overrides: {
        Row: {
          allowed: boolean
          membership_id: string
          permission_code: string
          updated_at: string
        }
        Insert: {
          allowed: boolean
          membership_id: string
          permission_code: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          membership_id?: string
          permission_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_permission_overrides_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_permission_overrides_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["code"]
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
      organization_scheduling_settings: {
        Row: {
          allow_makeup_for_early_cancellation: boolean
          allow_makeup_for_professional_absence: boolean
          allow_makeup_for_weather: boolean
          allow_manual_makeup_override: boolean
          check_in_enabled: boolean
          check_in_window_minutes: number
          created_at: string
          generation_window_days: number
          late_cancellation_window_minutes: number
          organization_id: string
          scheduling_enabled: boolean
          updated_at: string
        }
        Insert: {
          allow_makeup_for_early_cancellation?: boolean
          allow_makeup_for_professional_absence?: boolean
          allow_makeup_for_weather?: boolean
          allow_manual_makeup_override?: boolean
          check_in_enabled?: boolean
          check_in_window_minutes?: number
          created_at?: string
          generation_window_days?: number
          late_cancellation_window_minutes?: number
          organization_id: string
          scheduling_enabled?: boolean
          updated_at?: string
        }
        Update: {
          allow_makeup_for_early_cancellation?: boolean
          allow_makeup_for_professional_absence?: boolean
          allow_makeup_for_weather?: boolean
          allow_manual_makeup_override?: boolean
          check_in_enabled?: boolean
          check_in_window_minutes?: number
          created_at?: string
          generation_window_days?: number
          late_cancellation_window_minutes?: number
          organization_id?: string
          scheduling_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_scheduling_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
      permission_definitions: {
        Row: {
          code: string
          domain: string
          sort_order: number
        }
        Insert: {
          code: string
          domain: string
          sort_order?: number
        }
        Update: {
          code?: string
          domain?: string
          sort_order?: number
        }
        Relationships: []
      }
      professional_activities: {
        Row: {
          activity_id: string
          created_at: string
          organization_id: string
          professional_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          organization_id: string
          professional_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          organization_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_activities_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_professional_activities_professional"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      professional_availability_rules: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          organization_id: string
          professional_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          organization_id: string
          professional_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          organization_id?: string
          professional_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_rul_professional_id_organization_fkey"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "professional_availability_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_registrations: {
        Row: {
          authority: string
          created_at: string
          id: string
          organization_id: string
          professional_id: string
          region: string | null
          registration_number: string
          updated_at: string
        }
        Insert: {
          authority: string
          created_at?: string
          id?: string
          organization_id: string
          professional_id: string
          region?: string | null
          registration_number: string
          updated_at?: string
        }
        Update: {
          authority?: string
          created_at?: string
          id?: string
          organization_id?: string
          professional_id?: string
          region?: string | null
          registration_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_registrations_professional_id_organization_id_fkey"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      professional_schedule_exceptions: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          exception_type: Database["public"]["Enums"]["professional_schedule_exception_type"]
          id: string
          organization_id: string
          professional_id: string
          reason: Database["public"]["Enums"]["professional_schedule_exception_reason"]
          reason_details: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at: string
          exception_type: Database["public"]["Enums"]["professional_schedule_exception_type"]
          id?: string
          organization_id: string
          professional_id: string
          reason: Database["public"]["Enums"]["professional_schedule_exception_reason"]
          reason_details?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          exception_type?: Database["public"]["Enums"]["professional_schedule_exception_type"]
          id?: string
          organization_id?: string
          professional_id?: string
          reason?: Database["public"]["Enums"]["professional_schedule_exception_reason"]
          reason_details?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_schedule_exception_professional"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "professional_schedule_exceptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          active: boolean
          area: Database["public"]["Enums"]["professional_specialty_area"]
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area?: Database["public"]["Enums"]["professional_specialty_area"]
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area?: Database["public"]["Enums"]["professional_specialty_area"]
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialty_assignments: {
        Row: {
          created_at: string
          organization_id: string
          professional_id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          professional_id: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          professional_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialty_assign_professional_id_organization_fkey"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "professional_specialty_assign_specialty_id_organization_id_fkey"
            columns: ["specialty_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professional_specialties"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "professional_specialty_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_unavailability: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          organization_id: string
          professional_id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          organization_id: string
          professional_id: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          organization_id?: string
          professional_id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_unavailability_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_unavailability_professional_id_organization_i_fkey"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      professionals: {
        Row: {
          access_status: Database["public"]["Enums"]["professional_access_status"]
          active: boolean
          avatar_path: string | null
          birth_date: string | null
          country_code: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          preferred_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["professional_access_status"]
          active?: boolean
          avatar_path?: string | null
          birth_date?: string | null
          country_code?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          preferred_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_status?: Database["public"]["Enums"]["professional_access_status"]
          active?: boolean
          avatar_path?: string | null
          birth_date?: string | null
          country_code?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          preferred_name?: string | null
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
      resource_pool_members: {
        Row: {
          created_at: string
          organization_id: string
          resource_id: string
          resource_pool_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          resource_id: string
          resource_pool_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          resource_id?: string
          resource_pool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resource_pool_members_pool"
            columns: ["resource_pool_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resource_pools"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_resource_pool_members_resource"
            columns: ["resource_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      resource_pools: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_pools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          resource_type_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          resource_type_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          resource_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resources_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_resources_type"
            columns: ["resource_type_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resource_types"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          permission_code: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Insert: {
          allowed?: boolean
          permission_code: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Update: {
          allowed?: boolean
          permission_code?: string
          role?: Database["public"]["Enums"]["organization_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
      schedule_generation_conflicts: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          organization_id: string
          reason: Database["public"]["Enums"]["schedule_generation_conflict_reason"]
          resolved_at: string | null
          schedule_rule_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          organization_id: string
          reason?: Database["public"]["Enums"]["schedule_generation_conflict_reason"]
          resolved_at?: string | null
          schedule_rule_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          organization_id?: string
          reason?: Database["public"]["Enums"]["schedule_generation_conflict_reason"]
          resolved_at?: string | null
          schedule_rule_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_generation_conflicts_rule"
            columns: ["schedule_rule_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "schedule_rules"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      schedule_rule_resources: {
        Row: {
          created_at: string
          organization_id: string
          resource_id: string
          schedule_rule_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          resource_id: string
          schedule_rule_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          resource_id?: string
          schedule_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_rule_resources_resource"
            columns: ["resource_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_schedule_rule_resources_rule"
            columns: ["schedule_rule_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "schedule_rules"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      schedule_rules: {
        Row: {
          activity_id: string
          created_at: string
          customer_id: string
          customer_subscription_id: string
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          organization_id: string
          professional_id: string | null
          recurrence_type: Database["public"]["Enums"]["schedule_recurrence_type"]
          start_time: string
          status: Database["public"]["Enums"]["schedule_rule_status"]
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          activity_id: string
          created_at?: string
          customer_id: string
          customer_subscription_id: string
          effective_from: string
          effective_until?: string | null
          end_time: string
          id?: string
          organization_id: string
          professional_id?: string | null
          recurrence_type?: Database["public"]["Enums"]["schedule_recurrence_type"]
          start_time: string
          status?: Database["public"]["Enums"]["schedule_rule_status"]
          timezone?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          activity_id?: string
          created_at?: string
          customer_id?: string
          customer_subscription_id?: string
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          organization_id?: string
          professional_id?: string | null
          recurrence_type?: Database["public"]["Enums"]["schedule_recurrence_type"]
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_rule_status"]
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_rules_activity"
            columns: ["activity_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_schedule_rules_customer"
            columns: ["customer_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_schedule_rules_professional"
            columns: ["professional_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "fk_schedule_rules_subscription"
            columns: [
              "customer_subscription_id",
              "organization_id",
              "customer_id",
              "activity_id",
            ]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: [
              "id",
              "organization_id",
              "customer_id",
              "activity_id",
            ]
          },
        ]
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
      allocate_activity_resources: {
        Args: {
          p_activity_id: string
          p_ends_at: string
          p_ignore_appointment_id?: string
          p_organization_id: string
          p_starts_at: string
        }
        Returns: string[]
      }
      cancel_scheduling_appointment: {
        Args: { p_appointment_id: string; p_reason?: string }
        Returns: undefined
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
      create_scheduling_appointment: {
        Args: {
          p_activity_id: string
          p_customer_id: string
          p_customer_subscription_id: string
          p_ends_at: string
          p_professional_id?: string
          p_resource_ids?: string[]
          p_source?: Database["public"]["Enums"]["appointment_source"]
          p_starts_at: string
        }
        Returns: string
      }
      create_scheduling_rule: {
        Args: {
          p_customer_subscription_id: string
          p_effective_from: string
          p_effective_until?: string
          p_end_time: string
          p_professional_id?: string
          p_resource_ids?: string[]
          p_start_time: string
          p_weekday: number
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
      generate_schedule_rule_appointments: {
        Args: { p_schedule_rule_id: string; p_window_end?: string }
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
      get_my_permissions: {
        Args: never
        Returns: {
          allowed: boolean
          permission_code: string
        }[]
      }
      get_scheduling_availability: {
        Args: {
          p_activity_id: string
          p_ends_at: string
          p_professional_id?: string
          p_starts_at: string
        }
        Returns: Json
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
      list_available_professionals: {
        Args: { p_activity_id: string; p_ends_at: string; p_starts_at: string }
        Returns: {
          professional_id: string
        }[]
      }
      professional_is_available: {
        Args: {
          p_activity_id: string
          p_ends_at: string
          p_ignore_appointment_id?: string
          p_organization_id: string
          p_professional_id: string
          p_starts_at: string
        }
        Returns: boolean
      }
      reactivate_rule_pause_appointments: {
        Args: { p_schedule_rule_id: string }
        Returns: number
      }
      reactivate_subscription_pause_appointments: {
        Args: { p_subscription_id: string }
        Returns: number
      }
      reassign_professional_future_appointments: {
        Args: { p_from_professional_id: string; p_to_professional_id: string }
        Returns: {
          moved: number
          remaining: number
        }[]
      }
      refresh_financial_overdue_statuses: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      refresh_organization_scheduling_window: {
        Args: { p_organization_id: string }
        Returns: number
      }
      refresh_scheduling_window: { Args: never; Returns: number }
      replace_activity_resource_requirements: {
        Args: { p_activity_id: string; p_requirements: Json }
        Returns: undefined
      }
      reschedule_scheduling_appointment: {
        Args: {
          p_appointment_id: string
          p_ends_at: string
          p_professional_id?: string
          p_starts_at: string
        }
        Returns: undefined
      }
      save_resource_pool: {
        Args: {
          p_name: string
          p_organization_id: string
          p_pool_id: string
          p_resource_ids?: string[]
        }
        Returns: string
      }
      seed_default_expense_categories: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      set_appointment_attendance_status: {
        Args: { p_appointment_id: string; p_status: string }
        Returns: undefined
      }
      set_customer_active_status: {
        Args: { p_active: boolean; p_customer_id: string }
        Returns: {
          active: boolean
          ended_subscriptions: number
        }[]
      }
      set_professional_active_status: {
        Args: { p_active: boolean; p_professional_id: string }
        Returns: {
          future_appointments: number
        }[]
      }
      set_schedule_rule_status: {
        Args: {
          p_schedule_rule_id: string
          p_status: Database["public"]["Enums"]["schedule_rule_status"]
        }
        Returns: undefined
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
      user_has_permission: {
        Args: { target_organization_id: string; target_permission: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_scheduling_mode: "NONE" | "OPTIONAL" | "REQUIRED"
      appointment_source: "RECURRENCE" | "MANUAL" | "MAKEUP" | "RESCHEDULE"
      appointment_status: "SCHEDULED" | "CANCELLED" | "COMPLETED"
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
      professional_access_status:
        | "NO_ACCESS"
        | "INVITED"
        | "ACTIVE"
        | "SUSPENDED"
      professional_schedule_exception_reason:
        | "PERSONAL"
        | "HEALTH"
        | "VACATION"
        | "TRAINING"
        | "EVENT"
        | "EXTRA_SHIFT"
        | "COVERAGE"
        | "OTHER"
      professional_schedule_exception_type: "ABSENCE" | "PRESENCE"
      professional_specialty_area:
        | "HEALTHCARE"
        | "DENTISTRY"
        | "FITNESS"
        | "SPORTS"
        | "THERAPY"
        | "BEAUTY"
        | "WELLNESS"
        | "EDUCATION"
        | "OTHER"
      schedule_generation_conflict_reason: "CAPACITY_CONFLICT"
      schedule_recurrence_type: "WEEKLY"
      schedule_rule_status: "ACTIVE" | "PAUSED" | "ENDED"
      scheduling_requirement: "NONE" | "OPTIONAL" | "REQUIRED"
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
      activity_scheduling_mode: ["NONE", "OPTIONAL", "REQUIRED"],
      appointment_source: ["RECURRENCE", "MANUAL", "MAKEUP", "RESCHEDULE"],
      appointment_status: ["SCHEDULED", "CANCELLED", "COMPLETED"],
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
      professional_access_status: [
        "NO_ACCESS",
        "INVITED",
        "ACTIVE",
        "SUSPENDED",
      ],
      professional_schedule_exception_reason: [
        "PERSONAL",
        "HEALTH",
        "VACATION",
        "TRAINING",
        "EVENT",
        "EXTRA_SHIFT",
        "COVERAGE",
        "OTHER",
      ],
      professional_schedule_exception_type: ["ABSENCE", "PRESENCE"],
      professional_specialty_area: [
        "HEALTHCARE",
        "DENTISTRY",
        "FITNESS",
        "SPORTS",
        "THERAPY",
        "BEAUTY",
        "WELLNESS",
        "EDUCATION",
        "OTHER",
      ],
      schedule_generation_conflict_reason: ["CAPACITY_CONFLICT"],
      schedule_recurrence_type: ["WEEKLY"],
      schedule_rule_status: ["ACTIVE", "PAUSED", "ENDED"],
      scheduling_requirement: ["NONE", "OPTIONAL", "REQUIRED"],
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

