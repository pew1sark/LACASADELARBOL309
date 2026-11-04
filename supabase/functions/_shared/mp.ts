// Utilidades compartidas por las funciones de Mercado Pago.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

export const MP_API = 'https://api.mercadopago.com'

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
}

export function mpToken(): string | null {
  return Deno.env.get('MP_ACCESS_TOKEN') || null
}

export const SITE_URL = (Deno.env.get('SITE_URL') || 'https://pew1sark.github.io/LACASADELARBOL309').replace(/\/$/, '')

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
