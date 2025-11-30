import { createClient } from '@/lib/supabase'

export async function seedDemoAccount() {
  const supabase = createClient()

  try {
    // Buat demo account
    const { data, error } = await supabase. auth.signUp({
      email: 'demo@example.com',
      password: 'demo123456',
      options: {
        data: {
          nama_lengkap: 'Demo User',
          role: 'petugas',
        },
      },
    })

    if (error) {
      console.error('Error creating demo account:', error. message)
      return
    }

    console.log('✅ Demo account created:', data.user?. email)
  } catch (error) {
    console.error('Error:', error)
  }
}
