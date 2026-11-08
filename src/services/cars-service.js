import { getSupabaseClient } from './supabase-client.js'

export async function createCarListing(listing) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('cars').insert(listing)

  if (error) throw error
}

const CAR_COLUMNS = [
  'id',
  'created_at',
  'make',
  'model',
  'year',
  'price',
  'mileage',
  'fuel_type',
  'transmission',
  'engine',
  'power_hp',
  'location',
  'description',
  'image_url',
  'status',
  'owner_id',
].join(',')

export async function getMyCars(ownerId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_COLUMNS)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getOwnedCarById(id, ownerId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_COLUMNS)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateOwnedCar(id, ownerId, listing) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .update(listing)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select(CAR_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('This listing was not found or you do not have permission to edit it.')
  return data
}

export async function deleteOwnedCar(id, ownerId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('This listing was not found or you do not have permission to delete it.')
}

export async function getActiveCars() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_COLUMNS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getActiveCarById(id) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cars')
    .select(CAR_COLUMNS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data
}
