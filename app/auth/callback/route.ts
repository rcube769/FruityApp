import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user to check if profile exists
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        // Create profile if it doesn't exist
        if (!profile) {
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            display_name: user.email?.split('@')[0] || 'User'
          })
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
