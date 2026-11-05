import { getSupabaseClient } from './supabase-client.js'

export async function getSellerProfile(ownerId) {
  if (!ownerId) return null

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('seller_profiles')
    .select('id,full_name,phone,city,avatar_url')
    .eq('id', ownerId)
    .maybeSingle()

  if (error) throw error
  return data
}
