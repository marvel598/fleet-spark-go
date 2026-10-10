import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { Output, streamText } from "npm:ai@5";
import { z } from "npm:zod@3.23.8";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "../_shared/run-id.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const BodySchema = z.object({
  trip: z
    .string()
    .trim()
    .min(10, { message: "Describe your trip in at least 10 characters" })
    .max(1000, { message: "Keep your trip description under 1000 characters" })
    .refine((v) => !/[<>]/.test(v), { message: "Trip description cannot contain HTML" }),
  passengers: z.number().int().min(1).max(12).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  budgetPerDay: z.number().positive().max(1000000).nullable().optional(),
  pickupCity: z.string().trim().max(100).nullable().optional(),
});

const RecommendationSchema = z.object({
  trip_summary: z.string(),
  recommendations: z.array(
    z.object({
      vehicle_id: z.string(),
      reason: z.string(),
      pickup_location: z.string(),
      match_score: z.number(),
    }),
  ),
});

type Listing = {
  id: string;
  make: string;
  model: string;
  year: number;
  body_type: string | null;
  fuel_type: string;
  transmission: string;
  daily_rate: number | null;
  location: string | null;
  features: string[] | null;
  description: string | null;
  photos: string[] | null;
  min_rental_days: number;
  max_rental_days: number;
  delivery_available: boolean;
};

function json(body: unknown, status = 200, extraHeaders?: Headers) {
  const headers = new Headers({ ...corsHeaders, "Content-Type": "application/json" });
  extraHeaders?.forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) headers.set(name, value);
  });
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Service not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Sign in to get trip recommendations" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Sign in to get trip recommendations" }, 401);
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", fieldErrors: parsed.error.flatten().fieldErrors },
        400,
      );
    }
    const { trip, passengers, startDate, endDate, budgetPerDay, pickupCity } = parsed.data;

    const { data: listings, error: listingsError } = await supabase
      .from("vehicles")
      .select(
        "id, make, model, year, body_type, fuel_type, transmission, daily_rate, location, features, description, photos, min_rental_days, max_rental_days, delivery_available",
      )
      .eq("status", "available")
      .in("listing_type", ["rent", "both"])
      .order("created_at", { ascending: false })
      .limit(60);

    if (listingsError) {
      return json({ error: "Could not load listings" }, 500);
    }
    if (!listings || listings.length === 0) {
      return json({ error: "No rental cars are available right now" }, 404);
    }

    const catalog = (listings as Listing[]).map((v) => ({
      id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      body_type: v.body_type,
      fuel: v.fuel_type,
      transmission: v.transmission,
      daily_rate_kes: v.daily_rate,
      pickup_location: v.location,
      rental_days: `${v.min_rental_days}-${v.max_rental_days}`,
      delivery_available: v.delivery_available,
      features: (v.features ?? []).slice(0, 10),
      description: (v.description ?? "").slice(0, 300),
    }));

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: GATEWAY_URL,
      apiKey: LOVABLE_API_KEY,
      headers: { "Lovable-API-Key": LOVABLE_API_KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: provider.responses(MODEL),
      system:
        "You are the Quick Ride trip planner for a Kenyan car rental marketplace. " +
        "Given a renter's trip plans and a catalog of available rental cars, recommend the best matches. " +
        "Pick up to 5 cars, best first. Only use vehicle_id values from the catalog exactly as given. " +
        "For each pick, give a short friendly reason tied to the trip (roads, group size, luggage, budget, fuel), " +
        "the pickup location to use (the car's own pickup_location, or a more convenient spot in the same town if delivery_available is true), " +
        "and a match_score from 0 to 100. If nothing fits well, return an empty recommendations list and explain why in trip_summary.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            trip_plans: trip,
            passengers: passengers ?? null,
            dates: startDate && endDate ? { start: startDate, end: endDate } : null,
            budget_per_day_kes: budgetPerDay ?? null,
            preferred_pickup_city: pickupCity ?? null,
            available_cars: catalog,
          }),
        },
      ],
      experimental_output: Output.object({ schema: RecommendationSchema }),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const output = await result.output;
    const gatewayHeaders = new Headers();
    const runId = runIdFetch.getRunId();
    if (runId) gatewayHeaders.set("X-Lovable-AIG-Run-ID", runId);

    if (!output) {
      return json({ error: "The planner could not produce recommendations. Please try again." }, 502, gatewayHeaders);
    }

    const byId = new Map((listings as Listing[]).map((v) => [v.id, v]));
    const recommendations = output.recommendations
      .filter((r) => byId.has(r.vehicle_id))
      .slice(0, 5)
      .map((r) => {
        const v = byId.get(r.vehicle_id)!;
        return {
          vehicle: {
            id: v.id,
            name: `${v.year} ${v.make} ${v.model}`,
            body_type: v.body_type,
            fuel_type: v.fuel_type,
            transmission: v.transmission,
            daily_rate: v.daily_rate,
            location: v.location,
            photo: v.photos?.[0] ?? null,
          },
          reason: r.reason,
          pickup_location: r.pickup_location,
          match_score: Math.round(r.match_score),
        };
      });

    return json({ trip_summary: output.trip_summary, recommendations }, 200, gatewayHeaders);
  } catch (e) {
    const err = e as { status?: number; message?: string; responseBody?: string };
    const status = err?.status;
    if (status === 402) {
      return json({ error: "AI credits are exhausted. Please try again later." }, 402);
    }
    if (status === 429) {
      return json({ error: "The planner is busy right now. Please try again in a moment." }, 429);
    }
    return json({ error: err?.message ?? "Recommendation failed" }, 500);
  }
});
