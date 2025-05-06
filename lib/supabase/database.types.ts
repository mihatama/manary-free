export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: number
          name: string
          address: string | null
          phone: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      service_types: {
        Row: {
          id: number
          clinic_id: number
          name: string
          description: string | null
          duration: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          clinic_id: number
          name: string
          description?: string | null
          duration: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          clinic_id?: number
          name?: string
          description?: string | null
          duration?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      schedules: {
        Row: {
          id: number
          clinic_id: number
          date: string
          start_time: string
          end_time: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          clinic_id: number
          date: string
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          clinic_id?: number
          date?: string
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: number
          clinic_id: number
          service_type_id: number
          booking_date: string
          start_time: string
          end_time: string
          patient_name: string
          patient_email: string | null
          patient_phone: string
          notes: string | null
          status: string
          access_token: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          clinic_id: number
          service_type_id: number
          booking_date: string
          start_time: string
          end_time: string
          patient_name: string
          patient_email?: string | null
          patient_phone: string
          notes?: string | null
          status: string
          access_token: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          clinic_id?: number
          service_type_id?: number
          booking_date?: string
          start_time?: string
          end_time?: string
          patient_name?: string
          patient_email?: string | null
          patient_phone?: string
          notes?: string | null
          status?: string
          access_token?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      availability_settings: {
        Row: {
          id: number
          service_type_id: number
          day_of_week: number | null
          specific_date: string | null
          start_time: string
          end_time: string
          is_available: boolean
          end_date: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          service_type_id: number
          day_of_week?: number | null
          specific_date?: string | null
          start_time: string
          end_time: string
          is_available?: boolean
          end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          service_type_id?: number
          day_of_week?: number | null
          specific_date?: string | null
          start_time?: string
          end_time?: string
          is_available?: boolean
          end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
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
