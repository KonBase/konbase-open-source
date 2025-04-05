
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
    // Create a Supabase client
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

    // Get the secret and recovery keys from the request
    const { secret, recoveryKeys } = await req.json();

    if (!secret || !recoveryKeys || !Array.isArray(recoveryKeys) || recoveryKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Encrypt the TOTP secret using bcrypt (not ideal but works for this demo)
    const encryptedSecret = await bcrypt.hash(secret);
    
    // Hash each recovery key
    const hashedRecoveryKeys = await Promise.all(
      recoveryKeys.map(async (key) => await bcrypt.hash(key))
    );

    // Store 2FA details in a new table
    const { error: insertError } = await supabaseClient
      .from('user_2fa')
      .upsert({
        user_id: user.id,
        totp_secret: encryptedSecret,
        recovery_keys: hashedRecoveryKeys,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Error storing 2FA details: ${insertError.message}`);
    }

    // Update user profile to enable 2FA
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Error updating profile: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
