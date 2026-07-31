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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_memberships: {
        Row: {
          id: string
          invited_by: string
          is_hidden: boolean
          joined_at: string
          resource_id: string
          resource_type: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by: string
          is_hidden?: boolean
          joined_at?: string
          resource_id: string
          resource_type: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string
          is_hidden?: boolean
          joined_at?: string
          resource_id?: string
          resource_type?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_cards: {
        Row: {
          balance: number
          card_name: string
          card_type: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          last_four: string | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          card_name: string
          card_type: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_four?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          card_name?: string
          card_type?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_four?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          limit_amount: number
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          limit_amount: number
          period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          limit_amount?: number
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      e_wallets: {
        Row: {
          account_identifier: string | null
          balance: number
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          text_color: string | null
          updated_at: string
          user_id: string
          wallet_name: string
          wallet_type: string
        }
        Insert: {
          account_identifier?: string | null
          balance?: number
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text_color?: string | null
          updated_at?: string
          user_id: string
          wallet_name: string
          wallet_type: string
        }
        Update: {
          account_identifier?: string | null
          balance?: number
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text_color?: string | null
          updated_at?: string
          user_id?: string
          wallet_name?: string
          wallet_type?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          linked_card_id: string | null
          linked_wallet_id: string | null
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          linked_card_id?: string | null
          linked_wallet_id?: string | null
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          linked_card_id?: string | null
          linked_wallet_id?: string | null
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_linked_card_id_fkey"
            columns: ["linked_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_linked_wallet_id_fkey"
            columns: ["linked_wallet_id"]
            isOneToOne: false
            referencedRelation: "e_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      joint_account_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          owner_id: string
          resource_id: string
          resource_type: string
          role: string
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          owner_id: string
          resource_id: string
          resource_type: string
          role?: string
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string
          resource_id?: string
          resource_type?: string
          role?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          account_snapshot: Json
          category_breakdown: Json
          created_at: string
          expense_total: number
          generated_at: string
          id: string
          income_total: number
          net_cashflow: number
          report_month: string
          transaction_count: number
          transfer_total: number
          updated_at: string
          user_id: string
          withdrawal_total: number
        }
        Insert: {
          account_snapshot?: Json
          category_breakdown?: Json
          created_at?: string
          expense_total?: number
          generated_at?: string
          id?: string
          income_total?: number
          net_cashflow?: number
          report_month: string
          transaction_count?: number
          transfer_total?: number
          updated_at?: string
          user_id: string
          withdrawal_total?: number
        }
        Update: {
          account_snapshot?: Json
          category_breakdown?: Json
          created_at?: string
          expense_total?: number
          generated_at?: string
          id?: string
          income_total?: number
          net_cashflow?: number
          report_month?: string
          transaction_count?: number
          transfer_total?: number
          updated_at?: string
          user_id?: string
          withdrawal_total?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          payment_method: string
          receipt_url: string | null
          to_card_id: string | null
          to_wallet_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method: string
          receipt_url?: string | null
          to_card_id?: string | null
          to_wallet_id?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string
          receipt_url?: string | null
          to_card_id?: string | null
          to_wallet_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_card_id_fkey"
            columns: ["to_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "e_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "e_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_joint_account_invite: {
        Args: { p_code: string }
        Returns: undefined
      }
      can_transact_account: {
        Args: { p_resource_id: string; p_resource_type: string }
        Returns: boolean
      }
      can_view_account: {
        Args: { p_resource_id: string; p_resource_type: string }
        Returns: boolean
      }
      delete_transaction: { Args: { p_id: string }; Returns: undefined }
      get_account_owner: {
        Args: { p_resource_id: string; p_resource_type: string }
        Returns: string
      }
      map_share_user_id: { Args: never; Returns: undefined }
      process_transaction: {
        Args: {
          p_amount: number
          p_card_id?: string
          p_category_id: string
          p_description: string
          p_payment_method: string
          p_to_card_id?: string
          p_to_wallet_id?: string
          p_transaction_date: string
          p_type: string
          p_user_id?: string
          p_wallet_id?: string
        }
        Returns: Json
      }
      process_transaction_checked: {
        Args: {
          p_amount: number
          p_card_id: string
          p_category_id: string
          p_description: string
          p_payment_method: string
          p_to_card_id: string
          p_to_wallet_id: string
          p_transaction_date: string
          p_type: string
          p_wallet_id: string
        }
        Returns: undefined
      }
      save_monthly_report: {
        Args: { p_report_month?: string }
        Returns: {
          account_snapshot: Json
          category_breakdown: Json
          created_at: string
          expense_total: number
          generated_at: string
          id: string
          income_total: number
          net_cashflow: number
          report_month: string
          transaction_count: number
          transfer_total: number
          updated_at: string
          user_id: string
          withdrawal_total: number
        }
        SetofOptions: {
          from: "*"
          to: "monthly_reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_joint_account_invite: {
        Args: { p_invite_id: string }
        Returns: undefined
      }
      sync_monthly_reports: { Args: never; Returns: undefined }
      set_account_membership_hidden: {
        Args: { p_hidden: boolean; p_membership_id: string }
        Returns: undefined
      }
      update_account_member_role: {
        Args: { p_membership_id: string; p_role: string }
        Returns: undefined
      }
      update_card_balance: {
        Args: { p_delta: number; p_id: string }
        Returns: undefined
      }
      update_transaction: {
        Args: {
          p_amount: number
          p_card_id?: string
          p_category_id: string
          p_description: string
          p_id: string
          p_payment_method: string
          p_to_card_id?: string
          p_to_wallet_id?: string
          p_transaction_date: string
          p_type: string
          p_wallet_id?: string
        }
        Returns: undefined
      }
      update_transaction_checked: {
        Args: {
          p_amount: number
          p_card_id: string
          p_category_id: string
          p_description: string
          p_id: string
          p_payment_method: string
          p_to_card_id: string
          p_to_wallet_id: string
          p_transaction_date: string
          p_type: string
          p_wallet_id: string
        }
        Returns: undefined
      }
      update_transaction_legacy: {
        Args: {
          p_amount: number
          p_card_id?: string
          p_category_id: string
          p_description: string
          p_id: string
          p_payment_method: string
          p_to_card_id?: string
          p_to_wallet_id?: string
          p_transaction_date: string
          p_type: string
          p_wallet_id?: string
        }
        Returns: undefined
      }
      update_wallet_balance: {
        Args: { p_delta: number; p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
