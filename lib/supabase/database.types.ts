export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          clinic_id: number
          created_at: string
          end_time: string
          id: number
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          questionnaire_id: number | null
          service_type_id: number
          start_time: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          clinic_id: number
          created_at?: string
          end_time: string
          id?: number
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          questionnaire_id?: number | null
          service_type_id: number
          start_time: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          clinic_id?: number
          created_at?: string
          end_time?: string
          id?: number
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          questionnaire_id?: number | null
          service_type_id?: number
          start_time?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          clinic_id: number
          created_at: string
          day_of_week: number | null
          end_date: string | null
          end_time: string
          id: number
          is_available: boolean
          service_type_id: number
          specific_date: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          end_time: string
          id?: number
          is_available?: boolean
          service_type_id: number
          specific_date?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          end_time?: string
          id?: number
          is_available?: boolean
          service_type_id?: number
          specific_date?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_settings_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string
          id: number
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questionnaires: {
        Row: {
          child_birth_day: number
          child_birth_month: number
          child_birth_year: number
          child_first_name: string
          child_first_name_kana: string
          child_gender: string
          child_last_name: string
          child_last_name_kana: string
          child_number: number
          created_at: string
          email: string
          has_resigned: boolean
          id: number
          is_on_maternity_leave: boolean
          location_aichi: boolean
          location_nihonbashi: boolean
          location_nishinomiya: boolean
          location_takarazuka: boolean
          location_visit: boolean
          mother_birth_day: number
          mother_birth_month: number
          mother_birth_year: number
          mother_first_name: string
          mother_first_name_kana: string
          mother_last_name: string
          mother_last_name_kana: string
          notes: string | null
          occupation: string | null
          phone_number: string
        }
        Insert: {
          child_birth_day: number
          child_birth_month: number
          child_birth_year: number
          child_first_name: string
          child_first_name_kana: string
          child_gender: string
          child_last_name: string
          child_last_name_kana: string
          child_number: number
          created_at?: string
          email: string
          has_resigned?: boolean
          id?: number
          is_on_maternity_leave?: boolean
          location_aichi?: boolean
          location_nihonbashi?: boolean
          location_nishinomiya?: boolean
          location_takarazuka?: boolean
          location_visit?: boolean
          mother_birth_day: number
          mother_birth_month: number
          mother_birth_year: number
          mother_first_name: string
          mother_first_name_kana: string
          mother_last_name: string
          mother_last_name_kana: string
          notes?: string | null
          occupation?: string | null
          phone_number: string
        }
        Update: {
          child_birth_day?: number
          child_birth_month?: number
          child_birth_year?: number
          child_first_name?: string
          child_first_name_kana?: string
          child_gender?: string
          child_last_name?: string
          child_last_name_kana?: string
          child_number?: number
          created_at?: string
          email?: string
          has_resigned?: boolean
          id?: number
          is_on_maternity_leave?: boolean
          location_aichi?: boolean
          location_nihonbashi?: boolean
          location_nishinomiya?: boolean
          location_takarazuka?: boolean
          location_visit?: boolean
          mother_birth_day?: number
          mother_birth_month?: number
          mother_birth_year?: number
          mother_first_name?: string
          mother_first_name_kana?: string
          mother_last_name?: string
          mother_last_name_kana?: string
          notes?: string | null
          occupation?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          duration: number
          id: number
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration: number
          id?: number
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: number
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
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
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
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
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
