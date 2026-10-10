import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const destination = request.nextUrl.searchParams.get('next') ?? '/dashboard'
  const safeDestination = new URL(destination, request.nextUrl.origin)

  if (safeDestination.origin !== request.nextUrl.origin) {
    safeDestination.pathname = '/dashboard'
    safeDestination.search = ''
    safeDestination.hash = ''
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  return NextResponse.redirect(safeDestination)
}
