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
      bookings: {
        Row: {
          created_at: string
          daily_rate: number
          days: number
          dropoff_location: string | null
          end_date: string
          id: string
          notes: string | null
          owner_payout: number
          pickup_location: string | null
          renter_id: string
          service_fee: number
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          daily_rate: number
          days: number
          dropoff_location?: string | null
          end_date: string
          id?: string
          notes?: string | null
          owner_payout: number
          pickup_location?: string | null
          renter_id: string
          service_fee: number
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          daily_rate?: number
          days?: number
          dropoff_location?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          owner_payout?: number
          pickup_location?: string | null
          renter_id?: string
          service_fee?: number
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      comparisons: {
        Row: {
          created_at: string
          id: string
          name: string | null
          user_id: string
          vehicle_ids: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          user_id: string
          vehicle_ids?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          user_id?: string
          vehicle_ids?: string[]
        }
        Relationships: []
      }
      dealers: {
        Row: {
          about: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          hours: Json | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          region: string | null
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          region?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          region?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          owner_payout: number
          platform_fee: number
          provider_ref: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          owner_payout: number
          platform_fee: number
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          owner_payout?: number
          platform_fee?: number
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Relationships: []
      }
      finance_applications: {
        Row: {
          annual_income: number | null
          apr: number
          created_at: string
          down_payment: number
          email: string
          employer: string | null
          employment_years: number | null
          full_name: string
          id: string
          job_title: string | null
          monthly_payment: number
          notes: string | null
          phone: string
          status: Database["public"]["Enums"]["finance_status"]
          term_months: number
          trade_in_value: number
          updated_at: string
          user_id: string
          vehicle_id: string
          vehicle_price: number
        }
        Insert: {
          annual_income?: number | null
          apr: number
          created_at?: string
          down_payment?: number
          email: string
          employer?: string | null
          employment_years?: number | null
          full_name: string
          id?: string
          job_title?: string | null
          monthly_payment: number
          notes?: string | null
          phone: string
          status?: Database["public"]["Enums"]["finance_status"]
          term_months: number
          trade_in_value?: number
          updated_at?: string
          user_id: string
          vehicle_id: string
          vehicle_price: number
        }
        Update: {
          annual_income?: number | null
          apr?: number
          created_at?: string
          down_payment?: number
          email?: string
          employer?: string | null
          employment_years?: number | null
          full_name?: string
          id?: string
          job_title?: string | null
          monthly_payment?: number
          notes?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["finance_status"]
          term_months?: number
          trade_in_value?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vehicle_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_applications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          offer_amount: number | null
          phone: string | null
          preferred_date: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          type: Database["public"]["Enums"]["inquiry_type"]
          updated_at: string
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          offer_amount?: number | null
          phone?: string | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          type?: Database["public"]["Enums"]["inquiry_type"]
          updated_at?: string
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          offer_amount?: number | null
          phone?: string | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          type?: Database["public"]["Enums"]["inquiry_type"]
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      saved_vehicles: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          owner_rating: number | null
          renter_id: string
          vehicle_id: string
          vehicle_rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          owner_rating?: number | null
          renter_id: string
          vehicle_id: string
          vehicle_rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          owner_rating?: number | null
          renter_id?: string
          vehicle_id?: string
          vehicle_rating?: number
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
      vehicle_reviews: {
        Row: {
          author: string
          body: string
          cons: string[] | null
          created_at: string
          hero_image: string | null
          id: string
          make: string
          model: string
          pros: string[] | null
          rating: number
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          author: string
          body: string
          cons?: string[] | null
          created_at?: string
          hero_image?: string | null
          id?: string
          make: string
          model: string
          pros?: string[] | null
          rating: number
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          author?: string
          body?: string
          cons?: string[] | null
          created_at?: string
          hero_image?: string | null
          id?: string
          make?: string
          model?: string
          pros?: string[] | null
          rating?: number
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type: Database["public"]["Enums"]["body_type"] | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          created_at: string
          daily_rate: number | null
          dealer_id: string | null
          description: string | null
          drivetrain: Database["public"]["Enums"]["drivetrain"] | null
          engine: string | null
          exterior_color: string | null
          features: string[] | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          interior_color: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          location: string | null
          make: string
          max_rental_days: number
          mileage: number | null
          min_rental_days: number
          model: string
          msrp: number | null
          owner_id: string | null
          photos: string[] | null
          price: number
          status: Database["public"]["Enums"]["vehicle_status"]
          stock_number: string | null
          transmission: Database["public"]["Enums"]["transmission_type"]
          trim: string | null
          updated_at: string
          views_count: number
          vin: string | null
          year: number
        }
        Insert: {
          body_type?: Database["public"]["Enums"]["body_type"] | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          daily_rate?: number | null
          dealer_id?: string | null
          description?: string | null
          drivetrain?: Database["public"]["Enums"]["drivetrain"] | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          interior_color?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location?: string | null
          make: string
          max_rental_days?: number
          mileage?: number | null
          min_rental_days?: number
          model: string
          msrp?: number | null
          owner_id?: string | null
          photos?: string[] | null
          price: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_number?: string | null
          transmission?: Database["public"]["Enums"]["transmission_type"]
          trim?: string | null
          updated_at?: string
          views_count?: number
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: Database["public"]["Enums"]["body_type"] | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          daily_rate?: number | null
          dealer_id?: string | null
          description?: string | null
          drivetrain?: Database["public"]["Enums"]["drivetrain"] | null
          engine?: string | null
          exterior_color?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          interior_color?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location?: string | null
          make?: string
          max_rental_days?: number
          mileage?: number | null
          min_rental_days?: number
          model?: string
          msrp?: number | null
          owner_id?: string | null
          photos?: string[] | null
          price?: number
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_number?: string | null
          transmission?: Database["public"]["Enums"]["transmission_type"]
          trim?: string | null
          updated_at?: string
          views_count?: number
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          location: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "renter" | "owner" | "driver" | "admin" | "customer" | "dealer"
      body_type:
        | "sedan"
        | "suv"
        | "hatchback"
        | "coupe"
        | "convertible"
        | "wagon"
        | "pickup"
        | "van"
        | "minivan"
        | "crossover"
      booking_status:
        | "pending"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
      drivetrain: "fwd" | "rwd" | "awd" | "4wd"
      escrow_status: "held" | "released" | "refunded"
      finance_status:
        | "submitted"
        | "reviewing"
        | "approved"
        | "declined"
        | "withdrawn"
      fuel_type: "petrol" | "diesel" | "hybrid" | "electric" | "plugin_hybrid"
      inquiry_status: "new" | "contacted" | "closed"
      inquiry_type: "info" | "test_drive" | "finance" | "offer"
      listing_type: "sale" | "rent" | "both"
      transmission_type: "automatic" | "manual" | "cvt" | "dct"
      vehicle_condition: "new" | "used" | "certified"
      vehicle_status: "available" | "pending" | "sold" | "draft"
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
      app_role: ["renter", "owner", "driver", "admin", "customer", "dealer"],
      body_type: [
        "sedan",
        "suv",
        "hatchback",
        "coupe",
        "convertible",
        "wagon",
        "pickup",
        "van",
        "minivan",
        "crossover",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
      ],
      drivetrain: ["fwd", "rwd", "awd", "4wd"],
      escrow_status: ["held", "released", "refunded"],
      finance_status: [
        "submitted",
        "reviewing",
        "approved",
        "declined",
        "withdrawn",
      ],
      fuel_type: ["petrol", "diesel", "hybrid", "electric", "plugin_hybrid"],
      inquiry_status: ["new", "contacted", "closed"],
      inquiry_type: ["info", "test_drive", "finance", "offer"],
      listing_type: ["sale", "rent", "both"],
      transmission_type: ["automatic", "manual", "cvt", "dct"],
      vehicle_condition: ["new", "used", "certified"],
      vehicle_status: ["available", "pending", "sold", "draft"],
    },
  },
} as const
