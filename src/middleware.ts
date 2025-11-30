import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process. env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies. getAll()
        },
        setAll(cookiesToSet) {
          const response = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
          return response
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect ke login jika belum auth
  if (!user && request.nextUrl.pathname. startsWith('/dashboard')) {
    return NextResponse. redirect(new URL('/login', request.url))
  }

  if (! user && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (! user && request.nextUrl.pathname.startsWith('/ranking')) {
    return NextResponse. redirect(new URL('/login', request.url))
  }

  if (! user && request.nextUrl.pathname.startsWith('/laporan')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/ranking/:path*', '/laporan/:path*'],
}
