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
      availability_settings: {
        Row: {
          clinic_id: number
          created_at: string | null
          day_of_week: number
          end_time: string
          id: number
          is_available: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: number
          is_available?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: number
          is_available?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      breast_care_charts: {
        Row: {
          care_details: string | null
          concerns: string | null
          created_at: string | null
          id: number
          left_breast_condition: Json | null
          patient_id: number
          practitioner_name: string | null
          recommendations: string | null
          right_breast_condition: Json | null
          updated_at: string | null
          visit_date: string
        }
        Insert: {
          care_details?: string | null
          concerns?: string | null
          created_at?: string | null
          id?: number
          left_breast_condition?: Json | null
          patient_id: number
          practitioner_name?: string | null
          recommendations?: string | null
          right_breast_condition?: Json | null
          updated_at?: string | null
          visit_date: string
        }
        Update: {
          care_details?: string | null
          concerns?: string | null
          created_at?: string | null
          id?: number
          left_breast_condition?: Json | null
          patient_id?: number
          practitioner_name?: string | null
          recommendations?: string | null
          right_breast_condition?: Json | null
          updated_at?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "breast_care_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string | null
          id: number
          name: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: number
          name: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: number
          name?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          kana: string
          name: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          kana: string
          name: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          kana?: string
          name?: string
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      postpartum_care_charts: {
        Row: {
          care_provided: string | null
          created_at: string | null
          guidance: string | null
          id: number
          mental_condition: string | null
          patient_id: number
          physical_condition: string | null
          practitioner_name: string | null
          updated_at: string | null
          visit_date: string
          weeks_postpartum: number | null
        }
        Insert: {
          care_provided?: string | null
          created_at?: string | null
          guidance?: string | null
          id?: number
          mental_condition?: string | null
          patient_id: number
          physical_condition?: string | null
          practitioner_name?: string | null
          updated_at?: string | null
          visit_date: string
          weeks_postpartum?: number | null
        }
        Update: {
          care_provided?: string | null
          created_at?: string | null
          guidance?: string | null
          id?: number
          mental_condition?: string | null
          patient_id?: number
          physical_condition?: string | null
          practitioner_name?: string | null
          updated_at?: string | null
          visit_date?: string
          weeks_postpartum?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "postpartum_care_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          clinic_id: number
          created_at: string | null
          end_time: string
          id: number
          patient_id: number
          reservation_date: string
          service_type_id: number
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string | null
          end_time: string
          id?: number
          patient_id: number
          reservation_date: string
          service_type_id: number
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string | null
          end_time?: string
          id?: number
          patient_id?: number
          reservation_date?: string
          service_type_id?: number
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: number
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: number
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: number
          name?: string
          price?: number
          updated_at?: string | null
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
