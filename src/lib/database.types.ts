
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
      associations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo: string | null
          address: string | null
          contact_email: string
          contact_phone: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo?: string | null
          address?: string | null
          contact_email: string
          contact_phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo?: string | null
          address?: string | null
          contact_email?: string
          contact_phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          association_id: string | null
          profile_image: string | null
          two_factor_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
          association_id?: string | null
          profile_image?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          association_id?: string | null
          profile_image?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
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
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          association_id: string
          parent_id: string | null
          is_room: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          association_id: string
          parent_id?: string | null
          is_room?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          association_id?: string
          parent_id?: string | null
          is_room?: boolean
          created_at?: string
          updated_at?: string
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
          purchase_date: string | null
          purchase_price: number | null
          warranty_expiration: string | null
          category_id: string
          location_id: string
          association_id: string
          is_consumable: boolean
          quantity: number | null
          minimum_quantity: number | null
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
          condition: string
          purchase_date?: string | null
          purchase_price?: number | null
          warranty_expiration?: string | null
          category_id: string
          location_id: string
          association_id: string
          is_consumable?: boolean
          quantity?: number | null
          minimum_quantity?: number | null
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
          purchase_date?: string | null
          purchase_price?: number | null
          warranty_expiration?: string | null
          category_id?: string
          location_id?: string
          association_id?: string
          is_consumable?: boolean
          quantity?: number | null
          minimum_quantity?: number | null
          image?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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
          association_id: string
          status: string
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
          association_id: string
          status?: string
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
          association_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          association_id: string
          sender_id: string
          sender_name: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          association_id: string
          sender_id: string
          sender_name: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          sender_id?: string
          sender_name?: string
          message?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
  }
}
