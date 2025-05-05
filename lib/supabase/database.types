export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          role: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          id: number
          name: string
          address: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          id: number
          clinic_id: number
          name: string
          description: string | null
          duration: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          clinic_id: number
          name: string
          description?: string | null
          duration: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          clinic_id?: number
          name?: string
          description?: string | null
          duration?: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_types_clinic_id_fkey"
            columns: ["clinic_id"]
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          id: number
          service_type_id: number
          day_of_week: number
          specific_date: string | null
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          service_type_id: number
          day_of_week: number
          specific_date?: string | null
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          service_type_id?: number
          day_of_week?: number
          specific_date?: string | null
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_service_type_id_fkey"
            columns: ["service_type_id"]
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
