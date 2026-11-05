import { createClient } from '@supabase/supabase-js'

let supabaseClient

const environment = {
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY,
}

function getRequiredEnvironmentVariable(name) {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and add your Supabase project value.`,
    )
  }

  return value
}

function getSupabaseUrl() {
  const value = getRequiredEnvironmentVariable('VITE_SUPABASE_URL')

  try {
    const url = new URL(value)
    const isLocalUrl = ['localhost', '127.0.0.1'].includes(url.hostname)
    const isAllowedProtocol = url.protocol === 'https:' || (isLocalUrl && url.protocol === 'http:')
    if (!isAllowedProtocol) throw new Error()
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS Supabase project URL.')
  }

  return value
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = getSupabaseUrl()
    const supabasePublishableKey = getRequiredEnvironmentVariable(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    )

    supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseClient
}
