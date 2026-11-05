import { getSupabaseClient } from './supabase-client.js'

const AVATAR_BUCKET = 'profile-pictures'
const ALLOWED_AVATAR_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

export async function getProfile(userId) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,phone,city,avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveProfile(userId, profile) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select('id,full_name,phone,city,avatar_url')
    .single()

  if (error) throw error
  return data
}

export function validateProfilePicture(file) {
  if (!file) return ''
  if (!ALLOWED_AVATAR_TYPES[file.type]) return 'Choose a JPG, PNG, or WebP image.'
  if (file.size > MAX_AVATAR_SIZE) return 'The profile picture must be 5 MB or smaller.'
  return ''
}

export async function uploadProfilePicture(userId, file) {
  const validationError = validateProfilePicture(file)
  if (validationError) throw new Error(validationError)

  const supabase = getSupabaseClient()
  const extension = ALLOWED_AVATAR_TYPES[file.type]
  const path = `${userId}/avatar-${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function removeProfilePicture(path) {
  if (!path) return
  const supabase = getSupabaseClient()
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path])
  if (error) throw error
}

export function getProfilePicturePath(publicUrl) {
  if (!publicUrl) return null
  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)
    return markerIndex === -1 ? null : decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}
