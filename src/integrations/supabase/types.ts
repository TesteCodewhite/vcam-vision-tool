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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      changelogs: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          release_date: string
          technical_changes: string[]
          title: string
          type: string
          updated_at: string
          user_facing_changes: string[]
          version: string
          version_number: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          release_date?: string
          technical_changes?: string[]
          title: string
          type: string
          updated_at?: string
          user_facing_changes?: string[]
          version: string
          version_number: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          release_date?: string
          technical_changes?: string[]
          title?: string
          type?: string
          updated_at?: string
          user_facing_changes?: string[]
          version?: string
          version_number?: string
        }
        Relationships: []
      }
      learned_objects: {
        Row: {
          avg_height_cm: number
          avg_width_cm: number
          brand: string | null
          color: string | null
          confidence_threshold: number | null
          created_at: string
          detection_count: number | null
          id: string
          last_seen: string
          model: string | null
          object_type: string
          updated_at: string
        }
        Insert: {
          avg_height_cm: number
          avg_width_cm: number
          brand?: string | null
          color?: string | null
          confidence_threshold?: number | null
          created_at?: string
          detection_count?: number | null
          id?: string
          last_seen?: string
          model?: string | null
          object_type: string
          updated_at?: string
        }
        Update: {
          avg_height_cm?: number
          avg_width_cm?: number
          brand?: string | null
          color?: string | null
          confidence_threshold?: number | null
          created_at?: string
          detection_count?: number | null
          id?: string
          last_seen?: string
          model?: string | null
          object_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      object_detections: {
        Row: {
          actual_height_cm: number | null
          actual_width_cm: number | null
          camera_distance: number | null
          confidence: number
          created_at: string
          distance_cm: number | null
          id: string
          learned_size: boolean | null
          object_type: string
          pixel_height: number
          pixel_width: number
          updated_at: string
        }
        Insert: {
          actual_height_cm?: number | null
          actual_width_cm?: number | null
          camera_distance?: number | null
          confidence: number
          created_at?: string
          distance_cm?: number | null
          id?: string
          learned_size?: boolean | null
          object_type: string
          pixel_height: number
          pixel_width: number
          updated_at?: string
        }
        Update: {
          actual_height_cm?: number | null
          actual_width_cm?: number | null
          camera_distance?: number | null
          confidence?: number
          created_at?: string
          distance_cm?: number | null
          id?: string
          learned_size?: boolean | null
          object_type?: string
          pixel_height?: number
          pixel_width?: number
          updated_at?: string
        }
        Relationships: []
      }
      object_tracking: {
        Row: {
          avg_confidence: number
          color: string | null
          created_at: string
          detection_count: number
          first_seen: string
          id: string
          last_seen: string
          object_type: string
          session_id: string | null
          total_time_seconds: number
          updated_at: string
        }
        Insert: {
          avg_confidence: number
          color?: string | null
          created_at?: string
          detection_count?: number
          first_seen?: string
          id?: string
          last_seen?: string
          object_type: string
          session_id?: string | null
          total_time_seconds?: number
          updated_at?: string
        }
        Update: {
          avg_confidence?: number
          color?: string | null
          created_at?: string
          detection_count?: number
          first_seen?: string
          id?: string
          last_seen?: string
          object_type?: string
          session_id?: string | null
          total_time_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          algorithm_version: string
          created_at: string
          description: string | null
          features_enabled: Json
          id: string
          is_active: boolean | null
          version_name: string
        }
        Insert: {
          algorithm_version?: string
          created_at?: string
          description?: string | null
          features_enabled?: Json
          id?: string
          is_active?: boolean | null
          version_name: string
        }
        Update: {
          algorithm_version?: string
          created_at?: string
          description?: string | null
          features_enabled?: Json
          id?: string
          is_active?: boolean | null
          version_name?: string
        }
        Relationships: []
      }
      text_detections: {
        Row: {
          confidence: number
          created_at: string
          detected_text: string
          height: number
          id: string
          is_license_plate: boolean | null
          object_type: string | null
          width: number
          x_position: number
          y_position: number
        }
        Insert: {
          confidence: number
          created_at?: string
          detected_text: string
          height: number
          id?: string
          is_license_plate?: boolean | null
          object_type?: string | null
          width: number
          x_position: number
          y_position: number
        }
        Update: {
          confidence?: number
          created_at?: string
          detected_text?: string
          height?: number
          id?: string
          is_license_plate?: boolean | null
          object_type?: string | null
          width?: number
          x_position?: number
          y_position?: number
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
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
