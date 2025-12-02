import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteksi Halaman Admin & Ranking
  if (!user && (
    request.nextUrl.pathname.startsWith('/admin') || 
    request.nextUrl.pathname.startsWith('/ranking') // ✅ Tambahkan ini
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // ✅ Tambahkan '/ranking/:path*' ke matcher
  matcher: [
    '/admin/:path*', 
    '/ranking/:path*'
  ],
}
