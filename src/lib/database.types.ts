// File generato dal database (strumento generate_typescript_types del server MCP supabase-scuola).
// Non si modifica a mano: dopo ogni migrazione va rigenerato (qui sono omessi i tipi di utilità
// per Enums e CompositeTypes, che oggi non servono).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      booking_types: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          active: boolean
          id: string
          name: string
          school_year: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          school_year: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          school_year?: string
        }
        Relationships: []
      }
      outing_bookings: {
        Row: {
          booking_type_id: string
          description: string
          id: string
          outing_id: string
          time: string
        }
        Insert: {
          booking_type_id: string
          description: string
          id?: string
          outing_id: string
          time: string
        }
        Update: {
          booking_type_id?: string
          description?: string
          id?: string
          outing_id?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_bookings_booking_type_id_fkey"
            columns: ["booking_type_id"]
            isOneToOne: false
            referencedRelation: "booking_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_bookings_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_classes: {
        Row: {
          class_id: string
          females_count: number | null
          males_count: number | null
          outing_id: string
          students_count: number
          students_with_disabilities: number
        }
        Insert: {
          class_id: string
          females_count?: number | null
          males_count?: number | null
          outing_id: string
          students_count: number
          students_with_disabilities?: number
        }
        Update: {
          class_id?: string
          females_count?: number | null
          males_count?: number | null
          outing_id?: string
          students_count?: number
          students_with_disabilities?: number
        }
        Relationships: [
          {
            foreignKeyName: "outing_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_classes_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_companions: {
        Row: {
          outing_id: string
          person_id: string
        }
        Insert: {
          outing_id: string
          person_id: string
        }
        Update: {
          outing_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_companions_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_companions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_requests: {
        Row: {
          created_at: string
          departure_time: string
          destination: string
          end_date: string
          id: string
          lead_person_id: string
          needs: string | null
          notes: string | null
          objective: string
          other_services: string | null
          outing_type_id: string
          program: string
          project: string | null
          return_time: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          departure_time: string
          destination: string
          end_date: string
          id: string
          lead_person_id: string
          needs?: string | null
          notes?: string | null
          objective: string
          other_services?: string | null
          outing_type_id: string
          program: string
          project?: string | null
          return_time: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          departure_time?: string
          destination?: string
          end_date?: string
          id?: string
          lead_person_id?: string
          needs?: string | null
          notes?: string | null
          objective?: string
          other_services?: string | null
          outing_type_id?: string
          program?: string
          project?: string | null
          return_time?: string
          start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outing_requests_lead_person_id_fkey"
            columns: ["lead_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_requests_outing_type_id_fkey"
            columns: ["outing_type_id"]
            isOneToOne: false
            referencedRelation: "outing_types"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_transports: {
        Row: {
          departure_day: string
          departure_place: string
          departure_time: string
          destination: string
          id: string
          notes: string | null
          outing_id: string
          return_day: string | null
          return_required: boolean
          return_time: string | null
          transport_type_id: string
        }
        Insert: {
          departure_day: string
          departure_place: string
          departure_time: string
          destination: string
          id?: string
          notes?: string | null
          outing_id: string
          return_day?: string | null
          return_required?: boolean
          return_time?: string | null
          transport_type_id: string
        }
        Update: {
          departure_day?: string
          departure_place?: string
          departure_time?: string
          destination?: string
          id?: string
          notes?: string | null
          outing_id?: string
          return_day?: string | null
          return_required?: boolean
          return_time?: string | null
          transport_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_transports_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_transports_transport_type_id_fkey"
            columns: ["transport_type_id"]
            isOneToOne: false
            referencedRelation: "transport_types"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_types: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          active: boolean
          email: string | null
          first_name: string
          id: string
          last_name: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transport_types: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_outing_request: { Args: { payload: Json }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName] extends { Insert: infer I } ? I : never

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName] extends { Update: infer U } ? U : never
