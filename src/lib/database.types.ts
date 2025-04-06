
// This file serves as the central type definition for our database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          profile_image: string | null
          two_factor_enabled: boolean
          association_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: string
          profile_image?: string | null
          two_factor_enabled?: boolean
          association_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          profile_image?: string | null
          two_factor_enabled?: boolean
          association_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      associations: {
        Row: {
          id: string
          name: string
          description: string | null
          contact_email: string
          contact_phone: string | null
          website: string | null
          address: string | null
          logo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          contact_email: string
          contact_phone?: string | null
          website?: string | null
          address?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          contact_email?: string
          contact_phone?: string | null
          website?: string | null
          address?: string | null
          logo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      association_members: {
        Row: {
          id: string
          user_id: string
          association_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          association_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          association_id?: string
          role?: string
          created_at?: string
        }
      }
      association_invitations: {
        Row: {
          id: string
          association_id: string
          code: string
          email: string | null
          role: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          association_id: string
          code: string
          email?: string | null
          role?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          code?: string
          email?: string | null
          role?: string
          expires_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          entity: string
          action: string
          entity_id: string
          user_id: string
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          entity: string
          action: string
          entity_id: string
          user_id: string
          changes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          entity?: string
          action?: string
          entity_id?: string
          user_id?: string
          changes?: Json | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          association_id: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          association_id: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          association_id?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          sender_id: string
          message: string
          sender_name: string
          created_at: string
          association_id: string
        }
        Insert: {
          id?: string
          sender_id: string
          message: string
          sender_name: string
          created_at?: string
          association_id: string
        }
        Update: {
          id?: string
          sender_id?: string
          message?: string
          sender_name?: string
          created_at?: string
          association_id?: string
        }
      }
      conventions: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          location: string | null
          status: string
          association_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          location?: string | null
          status?: string
          association_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          location?: string | null
          status?: string
          association_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      convention_access: {
        Row: {
          id: string
          convention_id: string
          user_id: string
          invitation_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          convention_id: string
          user_id: string
          invitation_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          convention_id?: string
          user_id?: string
          invitation_code?: string | null
          created_at?: string
        }
      }
      convention_invitations: {
        Row: {
          id: string
          code: string
          convention_id: string
          created_by: string
          expires_at: string
          uses_remaining: number
        }
        Insert: {
          id?: string
          code: string
          convention_id: string
          created_by: string
          expires_at: string
          uses_remaining?: number
        }
        Update: {
          id?: string
          code?: string
          convention_id?: string
          created_by?: string
          expires_at?: string
          uses_remaining?: number
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description: string | null
          serial_number: string | null
          barcode: string | null
          condition: string
          category_id: string | null
          location_id: string | null
          association_id: string
          is_consumable: boolean
          quantity: number
          minimum_quantity: number | null
          purchase_price: number | null
          purchase_date: string | null
          warranty_expiration: string | null
          image: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          serial_number?: string | null
          barcode?: string | null
          condition?: string
          category_id?: string | null
          location_id?: string | null
          association_id: string
          is_consumable?: boolean
          quantity?: number
          minimum_quantity?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          warranty_expiration?: string | null
          image?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          serial_number?: string | null
          barcode?: string | null
          condition?: string
          category_id?: string | null
          location_id?: string | null
          association_id?: string
          is_consumable?: boolean
          quantity?: number
          minimum_quantity?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          warranty_expiration?: string | null
          image?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          association_id: string
          is_room: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          association_id: string
          is_room?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          association_id?: string
          is_room?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          file_url: string
          file_type: string
          item_id: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          file_url: string
          file_type: string
          item_id: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_url?: string
          file_type?: string
          item_id?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      equipment_sets: {
        Row: {
          id: string
          name: string
          description: string | null
          association_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          association_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          association_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      equipment_set_items: {
        Row: {
          id: string
          set_id: string
          item_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          set_id: string
          item_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          item_id?: string
          quantity?: number
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      user_2fa: {
        Row: {
          id: string
          user_id: string
          totp_secret: string
          recovery_keys: string[]
          used_recovery_keys: string[] | null
          created_at: string
          updated_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          totp_secret: string
          recovery_keys: string[]
          used_recovery_keys?: string[] | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          totp_secret?: string
          recovery_keys?: string[]
          used_recovery_keys?: string[] | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

// Re-export the Database type
export type { Database };
