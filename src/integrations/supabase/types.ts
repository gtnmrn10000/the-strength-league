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
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_foods: {
        Row: {
          barcode: string | null
          brand: string | null
          carbs_100g: number
          created_at: string
          created_by: string | null
          fat_100g: number
          id: string
          image_url: string | null
          kcal_100g: number
          name: string
          protein_100g: number
          serving_size: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          carbs_100g?: number
          created_at?: string
          created_by?: string | null
          fat_100g?: number
          id?: string
          image_url?: string | null
          kcal_100g: number
          name: string
          protein_100g?: number
          serving_size?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          carbs_100g?: number
          created_at?: string
          created_by?: string | null
          fat_100g?: number
          id?: string
          image_url?: string | null
          kcal_100g?: number
          name?: string
          protein_100g?: number
          serving_size?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      custom_exercises: {
        Row: {
          created_at: string
          equipment: string
          id: string
          name: string
          primary_muscle: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment?: string
          id?: string
          name: string
          primary_muscle: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          name?: string
          primary_muscle?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_favorites: {
        Row: {
          created_at: string
          exercise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          difficulty: string
          equipment: string | null
          id: string
          instructions: string | null
          muscle_groups: string[]
          name: string
          recovery_hours: number
        }
        Insert: {
          created_at?: string
          difficulty?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[]
          name: string
          recovery_hours?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[]
          name?: string
          recovery_hours?: number
        }
        Relationships: []
      }
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
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          note: string | null
          target_id: string
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          note?: string | null
          target_id: string
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          note?: string | null
          target_id?: string
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          comments: boolean
          followers: boolean
          grades: boolean
          pr_votes: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
          workout_reminder: boolean
        }
        Insert: {
          comments?: boolean
          followers?: boolean
          grades?: boolean
          pr_votes?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
          workout_reminder?: boolean
        }
        Update: {
          comments?: boolean
          followers?: boolean
          grades?: boolean
          pr_votes?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
          workout_reminder?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          post_id: string | null
          pr_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id?: string | null
          pr_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id?: string | null
          pr_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          hidden_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
          comment_count: number
          created_at: string
          hidden_at: string | null
          hype_count: number
          id: string
          macros: Json | null
          media_type: string
          media_url: string | null
          muscle_groups: string[] | null
          pr_id: string | null
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Insert: {
          caption?: string | null
          comment_count?: number
          created_at?: string
          hidden_at?: string | null
          hype_count?: number
          id?: string
          macros?: Json | null
          media_type?: string
          media_url?: string | null
          muscle_groups?: string[] | null
          pr_id?: string | null
          type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Update: {
          caption?: string | null
          comment_count?: number
          created_at?: string
          hidden_at?: string | null
          hype_count?: number
          id?: string
          macros?: Json | null
          media_type?: string
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
      pr_votes: {
        Row: {
          created_at: string
          pr_id: string
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          pr_id: string
          user_id: string
          vote: string
        }
        Update: {
          created_at?: string
          pr_id?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_votes_pr_id_fkey"
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
          premium_expires_at: string | null
          premium_product_id: string | null
          premium_provider: string | null
          premium_store_user_id: string | null
          premium_updated_at: string | null
          premium_will_renew: boolean
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
          premium_expires_at?: string | null
          premium_product_id?: string | null
          premium_provider?: string | null
          premium_store_user_id?: string | null
          premium_updated_at?: string | null
          premium_will_renew?: boolean
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
          premium_expires_at?: string | null
          premium_product_id?: string | null
          premium_provider?: string | null
          premium_store_user_id?: string | null
          premium_updated_at?: string | null
          premium_will_renew?: boolean
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
          exercise_id: string | null
          exercise_name: string | null
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
          exercise_id?: string | null
          exercise_name?: string | null
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
          exercise_id?: string | null
          exercise_name?: string | null
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
      push_devices: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weigh_ins: {
        Row: {
          bodyfat_pct: number | null
          created_at: string
          id: string
          measured_at: string
          note: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          bodyfat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          bodyfat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_min: number | null
          exercises: Json
          id: string
          muscle_groups: string[]
          name: string
          notes: string | null
          scheduled_for: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json
          id?: string
          muscle_groups?: string[]
          name: string
          notes?: string | null
          scheduled_for?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json
          id?: string
          muscle_groups?: string[]
          name?: string
          notes?: string | null
          scheduled_for?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          day: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          day?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          current_grade: string | null
          followers_count: number | null
          following_count: number | null
          posts_count: number | null
          pseudo: string | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_grade?: string | null
          followers_count?: number | null
          following_count?: number | null
          posts_count?: number | null
          pseudo?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_grade?: string | null
          followers_count?: number | null
          following_count?: number | null
          posts_count?: number | null
          pseudo?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          current_grade: string
          pseudo: string
          user_id: string
          verified_prs: number
          verified_total: number
          xp: number
        }[]
      }
      get_my_entitlement: {
        Args: never
        Returns: {
          expires_at: string
          is_premium: boolean
          product_id: string
          provider: string
          updated_at: string
          will_renew: boolean
        }[]
      }
      get_my_profile: {
        Args: never
        Returns: {
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
          premium_expires_at: string | null
          premium_product_id: string | null
          premium_provider: string | null
          premium_store_user_id: string | null
          premium_updated_at: string | null
          premium_will_renew: boolean
          pseudo: string
          sexe: Database["public"]["Enums"]["sexe_type"] | null
          taille: number | null
          updated_at: string
          user_id: string
          xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_rank: {
        Args: never
        Returns: {
          participants: number
          rank: number
          total_kg: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_pair: { Args: { _a: string; _b: string }; Returns: boolean }
      is_current_user_premium: { Args: never; Returns: boolean }
      is_moderator: { Args: { _user_id: string }; Returns: boolean }
      is_obvious_spam: { Args: { _text: string }; Returns: boolean }
      moderate_hide_comment: {
        Args: { _comment_id: string; _note: string }
        Returns: undefined
      }
      moderate_hide_post: {
        Args: { _note: string; _post_id: string }
        Returns: undefined
      }
      push_notification: {
        Args: {
          _actor_id: string
          _meta: Json
          _post_id: string
          _pr_id: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_level:
        | "sedentaire"
        | "leger"
        | "modere"
        | "intense"
        | "tres_intense"
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      food_source: ["barcode", "photo", "manual"],
      goal_type: ["masse", "seche", "performance"],
      post_type: ["pr", "meal", "workout", "level_up"],
      sexe_type: ["homme", "femme"],
    },
  },
} as const
