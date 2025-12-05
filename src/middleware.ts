import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Buat response awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Setup Supabase Client (Wajib untuk Auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Cek User Login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. ATURAN KEAMANAN (Route Protection)
  // 🔥 PERUBAHAN PENTING:
  // Kita HANYA mengunci halaman '/admin' dan '/ranking'.
  // '/dashboard' DIBUANG dari sini agar jadi PUBLIK.
  
  if (!user && (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/ranking')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // Matcher: Halaman mana saja yang dicek middleware
  // Hapus '/dashboard/:path*' dari sini!
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, signup, auth (halaman auth)
     * - / (landing page)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|signup|auth|$).*)',
  ],
}
