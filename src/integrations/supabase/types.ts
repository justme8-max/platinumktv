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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approval_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          percentage: number | null
          reason: string
          request_type: Database["public"]["Enums"]["approval_request_type"]
          requested_by: string
          room_id: string | null
          status: Database["public"]["Enums"]["approval_status"]
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          percentage?: number | null
          reason: string
          request_type: Database["public"]["Enums"]["approval_request_type"]
          requested_by: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          percentage?: number | null
          reason?: string
          request_type?: Database["public"]["Enums"]["approval_request_type"]
          requested_by?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          email_error: string | null
          email_sent: boolean | null
          id: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          deposit_amount: number | null
          duration_hours: number
          end_time: string
          id: string
          notes: string | null
          room_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          deposit_amount?: number | null
          duration_hours: number
          end_time: string
          id?: string
          notes?: string | null
          room_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          deposit_amount?: number | null
          duration_hours?: number
          end_time?: string
          id?: string
          notes?: string | null
          room_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name_en: string
          name_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_en: string
          name_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name_en?: string
          name_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_channel_members: {
        Row: {
          channel_id: string | null
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          id: string
          is_all_mention: boolean | null
          mentions: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_all_mention?: boolean | null
          mentions?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_all_mention?: boolean | null
          mentions?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          division: string
          employee_id: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          division: string
          employee_id: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          division?: string
          employee_id?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          recorded_by: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost: number
          created_at: string | null
          description_en: string | null
          description_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock_level: number | null
          name_en: string
          name_id: string
          price: number
          sku: string
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost: number
          created_at?: string | null
          description_en?: string | null
          description_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number | null
          name_en: string
          name_id: string
          price: number
          sku: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost?: number
          created_at?: string | null
          description_en?: string | null
          description_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number | null
          name_en?: string
          name_id?: string
          price?: number
          sku?: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          purchase_order_id: string | null
          quantity: number
          subtotal: number
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          subtotal: number
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          po_number: string
          requested_at: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          po_number: string
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name: string
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_bookings: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          day_of_month: number | null
          day_of_week: number | null
          deposit_amount: number | null
          duration_hours: number
          end_date: string | null
          end_time: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          hourly_rate: number
          id: string
          is_active: boolean | null
          notes: string | null
          room_id: string
          start_date: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          day_of_month?: number | null
          day_of_week?: number | null
          deposit_amount?: number | null
          duration_hours: number
          end_date?: string | null
          end_time: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          room_id: string
          start_date: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          day_of_month?: number | null
          day_of_week?: number | null
          deposit_amount?: number | null
          duration_hours?: number
          end_date?: string | null
          end_time?: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          room_id?: string
          start_date?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string | null
          current_session_start: string | null
          hourly_rate: number
          id: string
          notes: string | null
          room_name: string
          room_number: string
          room_type: string
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          current_session_start?: string | null
          hourly_rate: number
          id?: string
          notes?: string | null
          room_name: string
          room_number: string
          room_type: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          current_session_start?: string | null
          hourly_rate?: number
          id?: string
          notes?: string | null
          room_name?: string
          room_number?: string
          room_type?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          subtotal: number
          transaction_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          subtotal: number
          transaction_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          transaction_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          closing_balance: number | null
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          opening_balance: number
          start_time: string
          status: string
          total_card: number | null
          total_cash: number | null
          total_ewallet: number | null
          total_transactions: number | null
          total_transfer: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          start_time?: string
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_ewallet?: number | null
          total_transactions?: number | null
          total_transfer?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_balance?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          start_time?: string
          status?: string
          total_card?: number | null
          total_cash?: number | null
          total_ewallet?: number | null
          total_transactions?: number | null
          total_transfer?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          applies_to: string[] | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rate: number
          tax_type: string
          updated_at: string
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          rate?: number
          tax_type?: string
          updated_at?: string
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rate?: number
          tax_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          final_amount: number | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          room_id: string | null
          service_charge: number | null
          session_end: string | null
          session_start: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          final_amount?: number | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          room_id?: string | null
          service_charge?: number | null
          session_end?: string | null
          session_start?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          final_amount?: number | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          room_id?: string | null
          service_charge?: number | null
          session_end?: string | null
          session_start?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_approval_to_transaction: {
        Args: { p_approval_id: string }
        Returns: boolean
      }
      calculate_transaction_total: {
        Args: {
          p_service_charge_rate?: number
          p_subtotal: number
          p_tax_rate?: number
        }
        Returns: {
          final_amount: number
          service_charge: number
          subtotal: number
          tax_amount: number
        }[]
      }
      can_use_all_mention: { Args: { _user_id: string }; Returns: boolean }
      check_room_availability: {
        Args: {
          p_booking_date: string
          p_end_time: string
          p_exclude_booking_id?: string
          p_room_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      generate_employee_id: {
        Args: { emp_division: string; emp_name: string }
        Returns: string
      }
      has_management_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      approval_request_type: "discount" | "minimum_charge"
      approval_status: "pending" | "approved" | "rejected"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      movement_type: "purchase" | "sale" | "adjustment" | "return"
      payment_method: "cash" | "card" | "ewallet" | "transfer"
      purchase_status: "pending" | "approved" | "rejected" | "completed"
      recurring_frequency: "weekly" | "monthly"
      room_status:
        | "available"
        | "occupied"
        | "maintenance"
        | "reserved"
        | "cleaning"
      transaction_type: "room_rental" | "food_beverage" | "other"
      user_role:
        | "owner"
        | "manager"
        | "cashier"
        | "waiter"
        | "waitress"
        | "accountant"
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
      approval_request_type: ["discount", "minimum_charge"],
      approval_status: ["pending", "approved", "rejected"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      movement_type: ["purchase", "sale", "adjustment", "return"],
      payment_method: ["cash", "card", "ewallet", "transfer"],
      purchase_status: ["pending", "approved", "rejected", "completed"],
      recurring_frequency: ["weekly", "monthly"],
      room_status: [
        "available",
        "occupied",
        "maintenance",
        "reserved",
        "cleaning",
      ],
      transaction_type: ["room_rental", "food_beverage", "other"],
      user_role: [
        "owner",
        "manager",
        "cashier",
        "waiter",
        "waitress",
        "accountant",
      ],
    },
  },
} as const
