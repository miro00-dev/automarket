import { getSupabaseClient } from './supabase-client.js'

export async function isCurrentUserAdmin() {
  const { data, error } = await getSupabaseClient().rpc('is_current_user_admin')
  if (error) throw error
  return data === true
}

export async function getAdminDashboardData({ carsPage = 1, usersPage = 1, pageSize = 20 } = {}) {
  const { data, error } = await getSupabaseClient().rpc('admin_get_dashboard_data', {
    p_cars_page: carsPage,
    p_users_page: usersPage,
    p_page_size: pageSize,
  })
  if (error) throw error
  return data
}

export async function setAdminCarStatus(carId, status) {
  const { error } = await getSupabaseClient().rpc('admin_set_car_status', {
    p_car_id: String(carId),
    p_status: status,
  })
  if (error) throw error
}

export async function deleteAdminCar(carId) {
  const supabase = getSupabaseClient()
  const { data: imagePaths, error: pathsError } = await supabase.rpc('admin_prepare_car_deletion', {
    p_car_id: String(carId),
  })
  if (pathsError) throw pathsError

  if (imagePaths?.length) {
    const { error: storageError } = await supabase.storage.from('car-images').remove(imagePaths)
    if (storageError) throw storageError
  }

  const { error } = await supabase.rpc('admin_delete_car', { p_car_id: String(carId) })
  if (error) throw error
}

export async function setUserAccountStatus(userId, status, reason = null) {
  const { error } = await getSupabaseClient().rpc('admin_set_user_status', {
    p_user_id: userId,
    p_status: status,
    p_reason: reason,
  })
  if (error) throw error
}
