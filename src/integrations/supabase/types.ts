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
      association_members: {
        Row: {
          association_id: string
          created_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          logo: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity: string
          entity_id: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity: string
          entity_id: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          association_id: string
          created_at: string | null
          created_by: string
          file_url: string
          id: string
          name: string
          size: number
        }
        Insert: {
          association_id: string
          created_at?: string | null
          created_by: string
          file_url: string
          id?: string
          name: string
          size: number
        }
        Update: {
          association_id?: string
          created_at?: string | null
          created_by?: string
          file_url?: string
          id?: string
          name?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "backups_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          association_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          association_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_name: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_access: {
        Row: {
          convention_id: string
          created_at: string | null
          id: string
          invitation_code: string | null
          user_id: string
        }
        Insert: {
          convention_id: string
          created_at?: string | null
          id?: string
          invitation_code?: string | null
          user_id: string
        }
        Update: {
          convention_id?: string
          created_at?: string | null
          id?: string
          invitation_code?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convention_access_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_invitations: {
        Row: {
          code: string
          convention_id: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          uses_remaining: number | null
        }
        Insert: {
          code: string
          convention_id: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          uses_remaining?: number | null
        }
        Update: {
          code?: string
          convention_id?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "convention_invitations_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_locations: {
        Row: {
          convention_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          convention_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          convention_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convention_locations_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "convention_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      conventions: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          location: string | null
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          name: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conventions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          item_id: string
          name: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_type: string
          file_url: string
          id?: string
          item_id: string
          name: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          item_id?: string
          name?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_set_items: {
        Row: {
          item_id: string
          quantity: number
          set_id: string
        }
        Insert: {
          item_id: string
          quantity?: number
          set_id: string
        }
        Update: {
          item_id?: string
          quantity?: number
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_set_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_set_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "equipment_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_sets: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          association_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_sets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          item_id: string
          tag: string
        }
        Insert: {
          item_id: string
          tag: string
        }
        Update: {
          item_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          association_id: string
          barcode: string | null
          category_id: string
          condition: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_consumable: boolean | null
          location_id: string
          minimum_quantity: number | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          serial_number: string | null
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          association_id: string
          barcode?: string | null
          category_id: string
          condition: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_consumable?: boolean | null
          location_id: string
          minimum_quantity?: number | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          serial_number?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          association_id?: string
          barcode?: string | null
          category_id?: string
          condition?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_consumable?: boolean | null
          location_id?: string
          minimum_quantity?: number | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          serial_number?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          is_room: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          association_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_room?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_room?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          convention_id: string | null
          created_at: string | null
          from_location_id: string | null
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          quantity: number
          to_location_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          convention_id?: string | null
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          quantity?: number
          to_location_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          convention_id?: string | null
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          to_location_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          association_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          profile_image: string | null
          role: string
          two_factor_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          association_id?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          profile_image?: string | null
          role?: string
          two_factor_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          association_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          profile_image?: string | null
          role?: string
          two_factor_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      requirement_items: {
        Row: {
          item_id: string
          quantity: number
          requirement_id: string
        }
        Insert: {
          item_id: string
          quantity?: number
          requirement_id: string
        }
        Update: {
          item_id?: string
          quantity?: number
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          category_id: string | null
          convention_id: string
          created_at: string | null
          description: string | null
          id: string
          location_id: string | null
          name: string
          quantity: number
          requested_by: string
          status: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          convention_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name: string
          quantity?: number
          requested_by: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          convention_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name?: string
          quantity?: number
          requested_by?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "convention_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_requested_by_fkey"
            columns: ["requested_by"]
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
      can_create_association: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      has_convention_access: {
        Args: {
          user_id: string
          conv_id: string
        }
        Returns: boolean
      }
      has_elevated_admin_role: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_association_member: {
        Args: {
          user_id: string
          association_id: string
        }
        Returns: boolean
      }
      is_member_of_association: {
        Args: {
          user_id: string
          assoc_id: string
        }
        Returns: boolean
      }
      is_system_or_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      convention_status: "planned" | "active" | "completed" | "archived"
      item_condition: "new" | "good" | "fair" | "poor" | "damaged" | "retired"
      movement_type: "checkout" | "return" | "transfer"
      report_type: "inventory" | "movement" | "convention" | "audit"
      requirement_status: "requested" | "approved" | "fulfilled" | "denied"
      user_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "member"
        | "guest"
        | "system_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
