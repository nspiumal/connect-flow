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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blacklist: {
        Row: {
          added_by: string
          branch_id: string
          created_at: string
          customer_name: string
          customer_nic: string
          id: string
          is_active: boolean
          police_report_date: string | null
          police_report_number: string | null
          reason: string
        }
        Insert: {
          added_by: string
          branch_id: string
          created_at?: string
          customer_name: string
          customer_nic: string
          id?: string
          is_active?: boolean
          police_report_date?: string | null
          police_report_number?: string | null
          reason: string
        }
        Update: {
          added_by?: string
          branch_id?: string
          created_at?: string
          customer_name?: string
          customer_nic?: string
          id?: string
          is_active?: boolean
          police_report_date?: string | null
          police_report_number?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_requests: {
        Row: {
          branch_address: string | null
          branch_name: string
          branch_phone: string | null
          created_at: string
          id: string
          notes: string | null
          processed_by: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          branch_address?: string | null
          branch_name: string
          branch_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          branch_address?: string | null
          branch_name?: string
          branch_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          position: number
          user_id: string
          widget_config: Json | null
          widget_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          user_id: string
          widget_config?: Json | null
          widget_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          user_id?: string
          widget_config?: Json | null
          widget_type?: string
        }
        Relationships: []
      }
      interest_rates: {
        Row: {
          created_at: string
          created_by: string | null
          customer_type: string
          id: string
          is_active: boolean
          name: string
          period_months: number
          rate_percent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_type?: string
          id?: string
          is_active?: boolean
          name: string
          period_months: number
          rate_percent: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_type?: string
          id?: string
          is_active?: boolean
          name?: string
          period_months?: number
          rate_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      pawn_transactions: {
        Row: {
          appraised_value: number
          branch_id: string
          created_at: string
          created_by: string
          customer_address: string | null
          customer_name: string
          customer_nic: string
          customer_phone: string | null
          customer_type: string
          id: string
          interest_rate_id: string | null
          interest_rate_percent: number
          item_description: string
          item_karat: number
          item_weight_grams: number
          loan_amount: number
          maturity_date: string
          pawn_date: string
          pawn_id: string
          period_months: number
          remarks: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appraised_value: number
          branch_id: string
          created_at?: string
          created_by: string
          customer_address?: string | null
          customer_name: string
          customer_nic: string
          customer_phone?: string | null
          customer_type?: string
          id?: string
          interest_rate_id?: string | null
          interest_rate_percent: number
          item_description: string
          item_karat?: number
          item_weight_grams: number
          loan_amount: number
          maturity_date: string
          pawn_date?: string
          pawn_id: string
          period_months?: number
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appraised_value?: number
          branch_id?: string
          created_at?: string
          created_by?: string
          customer_address?: string | null
          customer_name?: string
          customer_nic?: string
          customer_phone?: string | null
          customer_type?: string
          id?: string
          interest_rate_id?: string | null
          interest_rate_percent?: number
          item_description?: string
          item_karat?: number
          item_weight_grams?: number
          loan_amount?: number
          maturity_date?: string
          pawn_date?: string
          pawn_id?: string
          period_months?: number
          remarks?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pawn_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_branch_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_branch_access: { Args: { _branch_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "SUPERADMIN" | "ADMIN" | "MANAGER" | "STAFF"
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
      app_role: ["SUPERADMIN", "ADMIN", "MANAGER", "STAFF"],
    },
  },
} as const
