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
      alegra_sync_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_detail: string | null
          finished_at: string | null
          id: string
          items_failed: number | null
          items_processed: number | null
          items_synced: number | null
          message: string | null
          started_at: string
          status: string
          sync_type: string
          technical_details: Json | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_synced?: number | null
          message?: string | null
          started_at?: string
          status?: string
          sync_type: string
          technical_details?: Json | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          items_synced?: number | null
          message?: string | null
          started_at?: string
          status?: string
          sync_type?: string
          technical_details?: Json | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          alegra_invoice_id: string | null
          alegra_invoice_number: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          delivery_cost: number
          delivery_type: string
          id: string
          payment_status: string
          status: string
          subtotal: number
          total_price: number
          updated_at: string
        }
        Insert: {
          alegra_invoice_id?: string | null
          alegra_invoice_number?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_cost?: number
          delivery_type?: string
          id?: string
          payment_status?: string
          status?: string
          subtotal?: number
          total_price?: number
          updated_at?: string
        }
        Update: {
          alegra_invoice_id?: string | null
          alegra_invoice_number?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_cost?: number
          delivery_type?: string
          id?: string
          payment_status?: string
          status?: string
          subtotal?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alegra_id: string | null
          base_price: number | null
          brand: string | null
          category: string
          created_at: string
          description: string | null
          featured: boolean | null
          final_price: number | null
          full_description: string | null
          id: string
          image_url: string | null
          last_synced_at: string | null
          name: string
          original_price: number | null
          price: number
          product_type: string
          rating: number | null
          reference: string | null
          sku: string | null
          specifications: Json | null
          stock: number
          subcategory: string | null
          tax_percentage: number
          updated_at: string
        }
        Insert: {
          alegra_id?: string | null
          base_price?: number | null
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          final_price?: number | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          name: string
          original_price?: number | null
          price?: number
          product_type?: string
          rating?: number | null
          reference?: string | null
          sku?: string | null
          specifications?: Json | null
          stock?: number
          subcategory?: string | null
          tax_percentage?: number
          updated_at?: string
        }
        Update: {
          alegra_id?: string | null
          base_price?: number | null
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          final_price?: number | null
          full_description?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          name?: string
          original_price?: number | null
          price?: number
          product_type?: string
          rating?: number | null
          reference?: string | null
          sku?: string | null
          specifications?: Json | null
          stock?: number
          subcategory?: string | null
          tax_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          address: string | null
          created_at: string
          document_number: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          address?: string | null
          created_at?: string
          document_number?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          address?: string | null
          created_at?: string
          document_number?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repair_customers: {
        Row: {
          address: string | null
          created_at: string
          document_number: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      repair_devices: {
        Row: {
          accessories: string | null
          brand: string | null
          created_at: string
          customer_id: string
          device_password: string | null
          device_type: string
          id: string
          model: string | null
          physical_condition: string | null
          serial_imei: string | null
          updated_at: string
        }
        Insert: {
          accessories?: string | null
          brand?: string | null
          created_at?: string
          customer_id: string
          device_password?: string | null
          device_type: string
          id?: string
          model?: string | null
          physical_condition?: string | null
          serial_imei?: string | null
          updated_at?: string
        }
        Update: {
          accessories?: string | null
          brand?: string | null
          created_at?: string
          customer_id?: string
          device_password?: string | null
          device_type?: string
          id?: string
          model?: string | null
          physical_condition?: string | null
          serial_imei?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "repair_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_order_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["repair_status"] | null
          id: string
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["repair_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["repair_status"] | null
          id?: string
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["repair_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["repair_status"] | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["repair_status"]
        }
        Relationships: [
          {
            foreignKeyName: "repair_order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_order_photos: {
        Row: {
          created_at: string
          id: string
          label: string
          order_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          order_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_order_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "repair_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_orders: {
        Row: {
          assigned_technician: string | null
          assigned_technician_id: string | null
          cost: number
          created_at: string
          customer_id: string
          delivered_at: string | null
          device_id: string
          diagnosis: string | null
          estimated_date: string | null
          id: string
          internal_notes: string | null
          order_number: string
          received_at: string
          reported_issue: string
          solution: string | null
          status: Database["public"]["Enums"]["repair_status"]
          updated_at: string
          warranty_days: number
        }
        Insert: {
          assigned_technician?: string | null
          assigned_technician_id?: string | null
          cost?: number
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          device_id: string
          diagnosis?: string | null
          estimated_date?: string | null
          id?: string
          internal_notes?: string | null
          order_number: string
          received_at?: string
          reported_issue?: string
          solution?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          warranty_days?: number
        }
        Update: {
          assigned_technician?: string | null
          assigned_technician_id?: string | null
          cost?: number
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          device_id?: string
          diagnosis?: string | null
          estimated_date?: string | null
          id?: string
          internal_notes?: string | null
          order_number?: string
          received_at?: string
          reported_issue?: string
          solution?: string | null
          status?: Database["public"]["Enums"]["repair_status"]
          updated_at?: string
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "repair_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "repair_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string
          created_at: string
          customer_name: string
          id: string
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          comment: string
          created_at?: string
          customer_name: string
          id?: string
          rating: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          device_type: string | null
          email: string | null
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          service_id: string | null
          service_name: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          device_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          service_id?: string | null
          service_name?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          device_type?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          service_id?: string | null
          service_name?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: boolean
          show_prices: boolean
          updated_at: string
        }
        Insert: {
          id?: boolean
          show_prices?: boolean
          updated_at?: string
        }
        Update: {
          id?: boolean
          show_prices?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user: {
        Args: {
          _account_status: string
          _address: string
          _document_number: string
          _email: string
          _name: string
          _notes: string
          _phone: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      approve_repair_order: { Args: { _order_id: string }; Returns: undefined }
      create_customer_repair_order: {
        Args: {
          p_accessories?: string
          p_address?: string
          p_brand?: string
          p_category?: string
          p_device_type?: string
          p_document?: string
          p_email?: string
          p_model?: string
          p_name: string
          p_notes?: string
          p_phone: string
          p_reported_issue?: string
          p_serial?: string
        }
        Returns: {
          order_id: string
          order_number: string
        }[]
      }
      delete_user_by_admin: { Args: { _user_id: string }; Returns: undefined }
      find_repair_customer_by_document: {
        Args: { _doc: string }
        Returns: {
          address: string
          document_number: string
          email: string
          id: string
          name: string
          notes: string
          phone: string
          registered_email: string
          registered_name: string
          registered_phone: string
          user_id: string
        }[]
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_all_users: {
        Args: never
        Returns: {
          account_status: string
          address: string
          created_at: string
          document_number: string
          email: string
          name: string
          notes: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_my_repair_orders: {
        Args: never
        Returns: {
          brand: string
          cost: number
          delivered_at: string
          device_type: string
          diagnosis: string
          estimated_date: string
          id: string
          model: string
          order_number: string
          received_at: string
          reported_issue: string
          status: Database["public"]["Enums"]["repair_status"]
          warranty_days: number
        }[]
      }
      get_repair_dashboard_stats: { Args: never; Returns: Json }
      get_repair_order_history: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          created_at: string
          from_status: Database["public"]["Enums"]["repair_status"]
          note: string
          to_status: Database["public"]["Enums"]["repair_status"]
        }[]
      }
      get_repair_report: {
        Args: { _from: string; _to: string }
        Returns: {
          brand: string
          cost: number
          customer_document: string
          customer_name: string
          customer_phone: string
          delivered_at: string
          device_type: string
          estimated_date: string
          id: string
          model: string
          order_number: string
          received_at: string
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string
          technician_name: string
        }[]
      }
      get_repair_report_summary: {
        Args: { _from: string; _to: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      link_repair_customer_to_user_by_doc: {
        Args: { _doc: string; _user_id: string }
        Returns: number
      }
      lookup_repair_order: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          brand: string
          cost: number
          customer_name: string
          delivered_at: string
          device_type: string
          diagnosis: string
          estimated_date: string
          id: string
          model: string
          order_number: string
          received_at: string
          reported_issue: string
          status: Database["public"]["Enums"]["repair_status"]
          warranty_days: number
        }[]
      }
      tech_owns_repair_customer: {
        Args: { _customer_id: string }
        Returns: boolean
      }
      tech_owns_repair_device: {
        Args: { _device_id: string }
        Returns: boolean
      }
      tech_owns_repair_order: { Args: { _order_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "admin" | "technician"
      repair_status:
        | "recibido"
        | "en_diagnostico"
        | "esperando_repuesto"
        | "en_reparacion"
        | "reparado"
        | "listo_entrega"
        | "entregado"
        | "cancelado"
        | "pendiente_aprobacion"
        | "aprobado"
        | "garantia"
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
      app_role: ["customer", "admin", "technician"],
      repair_status: [
        "recibido",
        "en_diagnostico",
        "esperando_repuesto",
        "en_reparacion",
        "reparado",
        "listo_entrega",
        "entregado",
        "cancelado",
        "pendiente_aprobacion",
        "aprobado",
        "garantia",
      ],
    },
  },
} as const
