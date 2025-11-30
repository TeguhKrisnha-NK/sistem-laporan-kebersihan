import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Gunakan '|| ""' (OR empty string) untuk mencegah crash saat build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createBrowserClient(supabaseUrl, supabaseKey)
}
