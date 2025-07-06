export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
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
      service_types: {
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
