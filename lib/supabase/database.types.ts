export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      availability_settings: {
        Row: {
          created_at: string
          day_of_week: number | null
          end_time: string
          id: number
          is_available: boolean
          service_type_id: number | null
          specific_date: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: number
          is_available?: boolean
          service_type_id?: number | null
          specific_date?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: number
          is_available?: boolean
          service_type_id?: number | null
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      breast_care_charts: {
        Row: {
          appointment_id: number
          baby_development: string | null
          body_weight: number | null
          breast_diagram_left: Json | null
          breast_diagram_right: Json | null
          breast_milk_interval: string | null
          breast_shape: string | null
          care_towel_fee: boolean | null
          clinic_location: string[] | null
          created_at: string
          diagnosis: string | null
          family_support_status: string | null
          feeding_position: string | null
          formula_feeds_per_day: number | null
          formula_volume_per_feed: string | null
          id: number
          initial_consultation_fee: boolean | null
          milk_volume_day: string | null
          milk_volume_night: string | null
          nipple_areola_condition: string[] | null
          nipple_shield_used: boolean | null
          no: string | null
          other_fee: number | null
          other_fee_description: string | null
          p_text: string | null
          pain_location: string[] | null
          payment_method: string | null
          practitioner_name: string | null
          pumping_frequency: number | null
          pumping_method: string | null
          rental_towel_fee: boolean | null
          s_text: string | null
          single_session_fee: boolean | null
          stool_consistency: string | null
          stool_frequency: number | null
          ticket_fee: boolean | null
          trainee_name: string | null
          visit_date: string | null
          weaning_details: string | null
          weaning_feeds_per_day: number | null
          weaning_status: string | null
          weight_gain_per_day: number | null
        }
        Insert: {
          appointment_id: number
          baby_development?: string | null
          body_weight?: number | null
          breast_diagram_left?: Json | null
          breast_diagram_right?: Json | null
          breast_milk_interval?: string | null
          breast_shape?: string | null
          care_towel_fee?: boolean | null
          clinic_location?: string[] | null
          created_at?: string
          diagnosis?: string | null
          family_support_status?: string | null
          feeding_position?: string | null
          formula_feeds_per_day?: number | null
          formula_volume_per_feed?: string | null
          id?: number
          initial_consultation_fee?: boolean | null
          milk_volume_day?: string | null
          milk_volume_night?: string | null
          nipple_areola_condition?: string[] | null
          nipple_shield_used?: boolean | null
          no?: string | null
          other_fee?: number | null
          other_fee_description?: string | null
          p_text?: string | null
          pain_location?: string[] | null
          payment_method?: string | null
          practitioner_name?: string | null
          pumping_frequency?: number | null
          pumping_method?: string | null
          rental_towel_fee?: boolean | null
          s_text?: string | null
          single_session_fee?: boolean | null
          stool_consistency?: string | null
          stool_frequency?: number | null
          ticket_fee?: boolean | null
          trainee_name?: string | null
          visit_date?: string | null
          weaning_details?: string | null
          weaning_feeds_per_day?: number | null
          weaning_status?: string | null
          weight_gain_per_day?: number | null
        }
        Update: {
          appointment_id?: number
          baby_development?: string | null
          body_weight?: number | null
          breast_diagram_left?: Json | null
          breast_diagram_right?: Json | null
          breast_milk_interval?: string | null
          breast_shape?: string | null
          care_towel_fee?: boolean | null
          clinic_location?: string[] | null
          created_at?: string
          diagnosis?: string | null
          family_support_status?: string | null
          feeding_position?: string | null
          formula_feeds_per_day?: number | null
          formula_volume_per_feed?: string | null
          id?: number
          initial_consultation_fee?: boolean | null
          milk_volume_day?: string | null
          milk_volume_night?: string | null
          nipple_areola_condition?: string[] | null
          nipple_shield_used?: boolean | null
          no?: string | null
          other_fee?: number | null
          other_fee_description?: string | null
          p_text?: string | null
          pain_location?: string[] | null
          payment_method?: string | null
          practitioner_name?: string | null
          pumping_frequency?: number | null
          pumping_method?: string | null
          rental_towel_fee?: boolean | null
          s_text?: string | null
          single_session_fee?: boolean | null
          stool_consistency?: string | null
          stool_frequency?: number | null
          ticket_fee?: boolean | null
          trainee_name?: string | null
          visit_date?: string | null
          weaning_details?: string | null
          weaning_feeds_per_day?: number | null
          weaning_status?: string | null
          weight_gain_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "breast_care_charts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          email: string | null
          id: number
          kana: string
          name: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          kana: string
          name: string
          phone_number: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          kana?: string
          name?: string
          phone_number?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          access_token: string
          clinic_id: number | null
          created_at: string
          end_time: string
          id: number
          note: string | null
          patient_id: number | null
          reservation_date: string
          service_type_id: number | null
          start_time: string
          status: string
        }
        Insert: {
          access_token?: string
          clinic_id?: number | null
          created_at?: string
          end_time: string
          id?: number
          note?: string | null
          patient_id?: number | null
          reservation_date: string
          service_type_id?: number | null
          start_time: string
          status?: string
        }
        Update: {
          access_token?: string
          clinic_id?: number | null
          created_at?: string
          end_time?: string
          id?: number
          note?: string | null
          patient_id?: number | null
          reservation_date?: string
          service_type_id?: number | null
          start_time?: string
          status?: string
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
          clinic_id: number | null
          color: string | null
          created_at: string
          duration: number
          id: number
          name: string
        }
        Insert: {
          clinic_id?: number | null
          color?: string | null
          created_at?: string
          duration: number
          id?: number
          name: string
        }
        Update: {
          clinic_id?: number | null
          color?: string | null
          created_at?: string
          duration?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
