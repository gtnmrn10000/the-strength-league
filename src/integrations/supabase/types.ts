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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          barcode: string | null
          calories: number
          carbs_g: number
          created_at: string
          fats_g: number
          id: string
          logged_at: string
          product_name: string
          proteins_g: number
          quantity_g: number
          source: Database["public"]["Enums"]["food_source"]
          user_id: string
        }
        Insert: {
          barcode?: string | null
          calories?: number
          carbs_g?: number
          created_at?: string
          fats_g?: number
          id?: string
          logged_at?: string
          product_name: string
          proteins_g?: number
          quantity_g: number
          source?: Database["public"]["Enums"]["food_source"]
          user_id: string
        }
        Update: {
          barcode?: string | null
          calories?: number
          carbs_g?: number
          created_at?: string
          fats_g?: number
          id?: string
          logged_at?: string
          product_name?: string
          proteins_g?: number
          quantity_g?: number
          source?: Database["public"]["Enums"]["food_source"]
          user_id?: string
        }
        Relationships: []
      }
      post_hypes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hypes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          hype_count: number
          id: string
          macros: Json | null
          media_url: string | null
          muscle_groups: string[] | null
          pr_id: string | null
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          hype_count?: number
          id?: string
          macros?: Json | null
          media_url?: string | null
          muscle_groups?: string[] | null
          pr_id?: string | null
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          hype_count?: number
          id?: string
          macros?: Json | null
          media_url?: string | null
          muscle_groups?: string[] | null
          pr_id?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "prs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          current_grade: string
          followers_count: number
          following_count: number
          goal: Database["public"]["Enums"]["goal_type"] | null
          id: string
          is_premium: boolean
          last_pr_at: string | null
          niveau_activite: Database["public"]["Enums"]["activity_level"] | null
          onboarded: boolean
          poids: number | null
          posts_count: number
          pseudo: string
          sexe: Database["public"]["Enums"]["sexe_type"] | null
          taille: number | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          current_grade?: string
          followers_count?: number
          following_count?: number
          goal?: Database["public"]["Enums"]["goal_type"] | null
          id?: string
          is_premium?: boolean
          last_pr_at?: string | null
          niveau_activite?: Database["public"]["Enums"]["activity_level"] | null
          onboarded?: boolean
          poids?: number | null
          posts_count?: number
          pseudo: string
          sexe?: Database["public"]["Enums"]["sexe_type"] | null
          taille?: number | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          current_grade?: string
          followers_count?: number
          following_count?: number
          goal?: Database["public"]["Enums"]["goal_type"] | null
          id?: string
          is_premium?: boolean
          last_pr_at?: string | null
          niveau_activite?: Database["public"]["Enums"]["activity_level"] | null
          onboarded?: boolean
          poids?: number | null
          posts_count?: number
          pseudo?: string
          sexe?: Database["public"]["Enums"]["sexe_type"] | null
          taille?: number | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      prs: {
        Row: {
          created_at: string
          exercise: string
          hype_count: number
          id: string
          reps: number
          status: string
          user_id: string
          video_url: string | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise: string
          hype_count?: number
          id?: string
          reps?: number
          status?: string
          user_id: string
          video_url?: string | null
          weight_kg: number
        }
        Update: {
          created_at?: string
          exercise?: string
          hype_count?: number
          id?: string
          reps?: number
          status?: string
          user_id?: string
          video_url?: string | null
          weight_kg?: number
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
      activity_level:
        | "sedentaire"
        | "leger"
        | "modere"
        | "intense"
        | "tres_intense"
      food_source: "barcode" | "photo" | "manual"
      goal_type: "masse" | "seche" | "performance"
      post_type: "pr" | "meal" | "workout" | "level_up"
      sexe_type: "homme" | "femme"
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
    Enums: {
      activity_level: [
        "sedentaire",
        "leger",
        "modere",
        "intense",
        "tres_intense",
      ],
      food_source: ["barcode", "photo", "manual"],
      goal_type: ["masse", "seche", "performance"],
      post_type: ["pr", "meal", "workout", "level_up"],
      sexe_type: ["homme", "femme"],
    },
  },
} as const
