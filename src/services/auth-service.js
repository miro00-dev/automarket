import { getSupabaseClient } from './supabase-client.js'

const PASSWORD_RECOVERY_REDIRECT_URL = 'https://automarket-miro.netlify.app/pages/update-password.html'

export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function registerWithEmail(email, password) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function loginWithEmail(email, password) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data
}

export function subscribeToPasswordRecovery(callback) {
  const supabase = getSupabaseClient()
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') callback(session)
  })
  return () => data.subscription.unsubscribe()
}

export async function logout() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function subscribeToAuthChanges(callback) {
  const supabase = getSupabaseClient()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
