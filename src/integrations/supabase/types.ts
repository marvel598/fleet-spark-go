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
          cancellation_reason: string | null
          cancelled_at: string | null
          car_id: string
          created_at: string
          daily_rate: number
          days: number
          end_date: string
          id: string
          owner_confirmed_at: string | null
          owner_id: string
          owner_payout: number
          payment_confirmed_at: string | null
          payment_method: string
          payment_phone: string | null
          payment_reference: string | null
          payment_submitted_at: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_odometer: number | null
          renter_confirmed_at: string | null
          renter_id: string
          return_lat: number | null
          return_lng: number | null
          return_odometer: number | null
          service_fee: number
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          car_id: string
          created_at?: string
          daily_rate: number
          days: number
          end_date: string
          id?: string
          owner_confirmed_at?: string | null
          owner_id: string
          owner_payout: number
          payment_confirmed_at?: string | null
          payment_method?: string
          payment_phone?: string | null
          payment_reference?: string | null
          payment_submitted_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_odometer?: number | null
          renter_confirmed_at?: string | null
          renter_id: string
          return_lat?: number | null
          return_lng?: number | null
          return_odometer?: number | null
          service_fee: number
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          car_id?: string
          created_at?: string
          daily_rate?: number
          days?: number
          end_date?: string
          id?: string
          owner_confirmed_at?: string | null
          owner_id?: string
          owner_payout?: number
          payment_confirmed_at?: string | null
          payment_method?: string
          payment_phone?: string | null
          payment_reference?: string | null
          payment_submitted_at?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_odometer?: number | null
          renter_confirmed_at?: string | null
          renter_id?: string
          return_lat?: number | null
          return_lng?: number | null
          return_odometer?: number | null
          service_fee?: number
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_odometer: number | null
          daily_price: number
          description: string | null
          features: string[] | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          last_location_update: string | null
          license_plate: string | null
          location: string
          make: string
          model: string
          owner_id: string
          photos: string[] | null
          seats: number
          status: Database["public"]["Enums"]["car_status"]
          tracking_enabled: boolean
          transmission: Database["public"]["Enums"]["transmission_type"]
          updated_at: string
          vehicle_status: Database["public"]["Enums"]["vehicle_status"]
          year: number
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_odometer?: number | null
          daily_price: number
          description?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          last_location_update?: string | null
          license_plate?: string | null
          location: string
          make: string
          model: string
          owner_id: string
          photos?: string[] | null
          seats?: number
          status?: Database["public"]["Enums"]["car_status"]
          tracking_enabled?: boolean
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          vehicle_status?: Database["public"]["Enums"]["vehicle_status"]
          year: number
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_odometer?: number | null
          daily_price?: number
          description?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          last_location_update?: string | null
          license_plate?: string | null
          location?: string
          make?: string
          model?: string
          owner_id?: string
          photos?: string[] | null
          seats?: number
          status?: Database["public"]["Enums"]["car_status"]
          tracking_enabled?: boolean
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          vehicle_status?: Database["public"]["Enums"]["vehicle_status"]
          year?: number
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          held_at: string | null
          id: string
          owner_payout: number
          refunded_at: string | null
          released_at: string | null
          service_fee: number
          status: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          held_at?: string | null
          id?: string
          owner_payout: number
          refunded_at?: string | null
          released_at?: string | null
          service_fee: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          held_at?: string | null
          id?: string
          owner_payout?: number
          refunded_at?: string | null
          released_at?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
      reviews: {
        Row: {
          booking_id: string
          car_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          renter_id: string
        }
        Insert: {
          booking_id: string
          car_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          renter_id: string
        }
        Update: {
          booking_id?: string
          car_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          renter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_logs: {
        Row: {
          booking_id: string | null
          car_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          odometer: number | null
          recorded_at: string
          speed_kmh: number | null
        }
        Insert: {
          booking_id?: string | null
          car_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          odometer?: number | null
          recorded_at?: string
          speed_kmh?: number | null
        }
        Update: {
          booking_id?: string | null
          car_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          odometer?: number | null
          recorded_at?: string
          speed_kmh?: number | null
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
    }
    Views: {
      cars_public: {
        Row: {
          created_at: string | null
          daily_price: number | null
          description: string | null
          features: string[] | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string | null
          license_plate: string | null
          location: string | null
          make: string | null
          model: string | null
          owner_id: string | null
          photos: string[] | null
          seats: number | null
          status: Database["public"]["Enums"]["car_status"] | null
          tracking_enabled: boolean | null
          transmission: Database["public"]["Enums"]["transmission_type"] | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string | null
          license_plate?: string | null
          location?: string | null
          make?: string | null
          model?: string | null
          owner_id?: string | null
          photos?: string[] | null
          seats?: number | null
          status?: Database["public"]["Enums"]["car_status"] | null
          tracking_enabled?: boolean | null
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          features?: string[] | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string | null
          license_plate?: string | null
          location?: string | null
          make?: string | null
          model?: string | null
          owner_id?: string | null
          photos?: string[] | null
          seats?: number | null
          status?: Database["public"]["Enums"]["car_status"] | null
          tracking_enabled?: boolean | null
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
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
      check_car_availability: {
        Args: { _car_id: string; _end: string; _start: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "renter" | "owner" | "driver" | "admin"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
        | "disputed"
      car_status: "draft" | "active" | "paused"
      escrow_status: "held" | "released" | "refunded"
      fuel_type: "petrol" | "diesel" | "hybrid" | "electric"
      transmission_type: "automatic" | "manual"
      vehicle_status:
        | "parked"
        | "on_rent"
        | "in_transit"
        | "maintenance"
        | "offline"
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
      app_role: ["renter", "owner", "driver", "admin"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "disputed",
      ],
      car_status: ["draft", "active", "paused"],
      escrow_status: ["held", "released", "refunded"],
      fuel_type: ["petrol", "diesel", "hybrid", "electric"],
      transmission_type: ["automatic", "manual"],
      vehicle_status: [
        "parked",
        "on_rent",
        "in_transit",
        "maintenance",
        "offline",
      ],
    },
  },
} as const
