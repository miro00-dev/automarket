import { getSupabaseClient } from './supabase-client.js'

const FAVORITE_CAR_COLUMNS = 'id,created_at,make,model,year,price,mileage,fuel_type,transmission,engine,power_hp,location,description,image_url,status,owner_id'

export async function getFavoriteCarIds(userId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('favorites').select('car_id').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((favorite) => String(favorite.car_id))
}

export async function addFavorite(userId, carId) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('favorites').insert({ user_id: userId, car_id: carId })
  if (error && error.code !== '23505') throw error
}

export async function removeFavorite(userId, carId) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('car_id', carId)
  if (error) throw error
}

export async function getFavoriteCars(userId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('favorites')
    .select(`created_at,car:cars!favorites_car_id_fkey(${FAVORITE_CAR_COLUMNS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((favorite) => favorite.car).filter(Boolean)
}
