
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Get secret and recovery keys from request
    const { secret, recoveryKeys } = await req.json();

    // Validate input
    if (!secret || !recoveryKeys || !Array.isArray(recoveryKeys) || recoveryKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store 2FA information
    const { error: insertError } = await supabaseClient
      .from('user_2fa')
      .upsert({
        user_id: user.id,
        totp_secret: secret,
        recovery_keys: recoveryKeys,
        used_recovery_keys: [],
        last_used_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error("Error storing user 2FA data:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store 2FA data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user profile to enable 2FA
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', user.id);
      
    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add an audit log
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'enable_2fa',
        entity: 'user_2fa',
        entity_id: user.id,
        changes: { two_factor_enabled: true }
      });

    return new Response(
      JSON.stringify({ success: true }),
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
