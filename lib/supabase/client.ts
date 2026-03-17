import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase environment variables not found')
    throw new Error('Supabase configuration missing')
  }
  
  // Use default browser client without custom storage adapter
  // The custom adapter was causing session persistence issues
  return createBrowserClient(url, key)
}