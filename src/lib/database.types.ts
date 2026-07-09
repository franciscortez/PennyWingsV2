// Public-schema snapshot matching the Supabase generated-types shape.
// Regenerate with the Supabase CLI after database migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
            foreignKeyName: 'budgets_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
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
            foreignKeyName: 'goals_linked_card_id_fkey'
            columns: ['linked_card_id']
            isOneToOne: false
            referencedRelation: 'bank_cards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goals_linked_wallet_id_fkey'
            columns: ['linked_wallet_id']
            isOneToOne: false
            referencedRelation: 'e_wallets'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'transactions_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'bank_cards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_to_card_id_fkey'
            columns: ['to_card_id']
            isOneToOne: false
            referencedRelation: 'bank_cards'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_to_wallet_id_fkey'
            columns: ['to_wallet_id']
            isOneToOne: false
            referencedRelation: 'e_wallets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_wallet_id_fkey'
            columns: ['wallet_id']
            isOneToOne: false
            referencedRelation: 'e_wallets'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      delete_transaction: {
        Args: { p_id: string }
        Returns: Json
      }
      process_transaction: {
        Args: {
          p_amount: number
          p_card_id: string | null
          p_category_id: string
          p_description: string | null
          p_payment_method: string
          p_to_card_id: string | null
          p_to_wallet_id: string | null
          p_transaction_date: string
          p_type: string
          p_wallet_id: string | null
        }
        Returns: Json
      }
      update_transaction: {
        Args: {
          p_amount: number
          p_card_id: string | null
          p_category_id: string
          p_description: string | null
          p_id: string
          p_payment_method: string
          p_to_card_id: string | null
          p_to_wallet_id: string | null
          p_transaction_date: string
          p_type: string
          p_wallet_id: string | null
        }
        Returns: Json
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database['public']

export type Tables<
  TableName extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][TableName]['Row']

export type TablesInsert<
  TableName extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][TableName]['Insert']

export type TablesUpdate<
  TableName extends keyof PublicSchema['Tables'],
> = PublicSchema['Tables'][TableName]['Update']
