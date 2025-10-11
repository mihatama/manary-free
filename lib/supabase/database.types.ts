export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type TimestampString = string

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string
          address: string | null
          phone_number: string | null
          created_at: TimestampString
          updated_at: TimestampString
        }
        Insert: {
          id: string
          name: string
          address?: string | null
          phone_number?: string | null
          created_at: TimestampString
          updated_at: TimestampString
        }
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>
        Relationships: []
      }
      service_types: {
        Row: {
          id: string
          clinic_id: string
          name: string
          description: string | null
          duration: number
          interval_minutes: number
          price: number | null
          color: string | null
          created_at: TimestampString
          updated_at: TimestampString
        }
        Insert: Row
        Update: Partial<Row>
        Relationships: []
      }
      availability_settings: {
        Row: {
          id: string
          service_type_id: string
          day_of_week: number | null
          start_time: string
          end_time: string
          specific_date: string | null
          is_available: boolean
          created_at: TimestampString
          updated_at: TimestampString
        }
        Insert: Row
        Update: Partial<Row>
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          clinic_id: string
          service_type_id: string
          reservation_date: string
          start_time: string
          end_time: string
          patient_name: string
          patient_phone: string | null
          status: string
          note: string | null
          created_at: TimestampString
          updated_at: TimestampString
        }
        Insert: Row
        Update: Partial<Row>
        Relationships: []
      }
      questionnaires: {
        Row: Record<string, Json>
        Insert: Row
        Update: Partial<Row>
        Relationships: []
      }
    }
    Views: never
    Functions: never
    Enums: never
    CompositeTypes: never
  }
}
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          interval_minutes: number
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
          price: number
          interval_minutes: number
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
          price?: number
          interval_minutes: number
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any }) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & { row: any })
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any })
      ? PublicTableNameOrOptions
      : never,
> = (Database["public"]["Tables"] & { row: any })[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type Table<
  PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any }) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & { row: any })
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & { row: any })
      ? PublicTableNameOrOptions
      : never,
> = (Database["public"]["Tables"] & { row: any })[TableName] extends {
  Row: infer R
}
  ? R
  : never
