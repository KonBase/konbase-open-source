
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret, token } = await req.json();
    
    if (!secret || !token) {
      throw new Error('Secret and token are required');
    }

    console.log(`Verifying TOTP with token: ${token} and secret (length): ${secret.length}`);

    // Create a new TOTP object with the provided secret
    const secretObj = new OTPAuth.Secret({ base32: secret });
    
    const totp = new OTPAuth.TOTP({
      issuer: 'KonBase',
      label: 'KonBase Account',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretObj
    });

    // Verify the provided token with a window of 1 to account for time drift
    const delta = totp.validate({ token, window: 1 });
    const verified = delta !== null;

    console.log(`TOTP verification ${verified ? 'successful' : 'failed'} with delta: ${delta}`);
    
    return new Response(
      JSON.stringify({
        verified,
        delta
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error verifying TOTP:', error.message);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
