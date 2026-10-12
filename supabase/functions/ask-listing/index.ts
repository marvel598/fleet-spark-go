import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { z } from "npm:zod@3.23.8";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/run-id.ts";

const BodySchema = z.object({
  vehicleId: z.string().uuid(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!KEY) return json({ error: "Service not configured" }, 500);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid question" }, 400);
    const { vehicleId, messages } = parsed.data;
    if (messages[messages.length - 1].role !== "user") return json({ error: "Invalid question" }, 400);

    const auth = req.headers.get("Authorization");
    const supabase = createClient(URL_, ANON, auth ? { global: { headers: { Authorization: auth } } } : {});
    const { data: v } = await supabase
      .from("vehicles")
      .select(
        "make, model, year, trim, price, daily_rate, listing_type, status, condition, mileage, body_type, fuel_type, transmission, location, features, description, min_rental_days, max_rental_days, delivery_available",
      )
      .eq("id", vehicleId)
      .maybeSingle();
    if (!v) return json({ error: "Listing not found" }, 404);

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: KEY,
      headers: { "Lovable-API-Key": KEY, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system:
        "You are the Quick Ride listing assistant for a Kenyan car sale and hire marketplace. " +
        "Answer the renter's questions using ONLY the listing details below (specs, pricing in KSh, pickup location, rental terms). " +
        "If the answer isn't in the details, say so and suggest contacting the owner. Be brief and friendly. " +
        "Never invent prices, availability or features.\n\nLISTING:\n" + JSON.stringify(v),
      messages,
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

    return result.toTextStreamResponse({ headers: corsHeaders });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 402) return json({ error: "AI credits are exhausted. Please try again later." }, 402);
    if (status === 429) return json({ error: "The assistant is busy. Please try again shortly." }, 429);
    return json({ error: "Could not answer right now" }, 500);
  }
});
