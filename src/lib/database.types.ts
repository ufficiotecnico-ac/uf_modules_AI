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
