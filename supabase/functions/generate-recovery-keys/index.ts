
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Function to generate random recovery key
function generateRecoveryKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ2345679";
  let result = "";
  const keyLength = 12;
  const segmentLength = 4;
  
  // Generate random key with format XXXX-XXXX-XXXX
  for (let i = 0; i < keyLength; i++) {
    if (i > 0 && i % segmentLength === 0) {
      result += "-";
    }
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get number of keys to generate (default to 8)
    let count = 8;
    try {
      const { count: requestedCount } = await req.json();
      if (requestedCount && typeof requestedCount === 'number' && requestedCount > 0) {
        count = Math.min(requestedCount, 16); // Maximum 16 keys
      }
    } catch (e) {
      // Use default if request body parsing fails
    }

    // Generate recovery keys
    const keys = Array.from({ length: count }, () => generateRecoveryKey());

    return new Response(
      JSON.stringify({ keys }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
