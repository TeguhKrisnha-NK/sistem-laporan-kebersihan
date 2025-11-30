import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Gunakan data palsu jika env tidak terbaca saat build
  // Ini mencegah error "URL required" saat deploy Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbgGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_key_for_build_only'

  return createBrowserClient(supabaseUrl, supabaseKey)
}
