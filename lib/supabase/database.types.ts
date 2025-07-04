export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
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
          payment_method: string | null
          pain_location: string[] | null
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
          payment_method?: string | null
          pain_location?: string[] | null
          practitioner_name?: string | null
          pumping_frequency?: number | null
          pumping_method?: string | null
          rental_towel_fee?: boolean | null
          s_text?: string | null
          single_session_fee?: boolean | null
          stool_consistency?: string | null
          stool_frequency?: string | null
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
          payment_method?: string | null
          pain_location?: string[] | null
          practitioner_name?: string | null
          pumping_frequency?: number | null
          pumping_method?: string | null
          rental_towel_fee?: boolean | null
          s_text?: string | null
          single_session_fee?: boolean | null
          stool_consistency?: string | null
          stool_frequency?: string | null
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
            referencedRelation: "appointments"
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
