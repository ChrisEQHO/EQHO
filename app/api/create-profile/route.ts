import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, fullName } = body

    console.log('[v0] API create-profile called for:', email, 'userId:', userId)

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    // First check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_status, plan')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('[v0] Profile already exists:', existingProfile)
      // Don't modify existing profile - return as is
      return NextResponse.json({ success: true, action: 'exists', profile: existingProfile })
    }

    // Check if profile exists by email (might have been created by webhook with temp ID)
    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_status, plan, stripe_customer_id, stripe_subscription_id, trial_end')
      .ilike('email', email)
      .single()

    if (profileByEmail && profileByEmail.id !== userId) {
      console.log('[v0] Profile exists by email with different ID, migrating to auth user ID...')
      
      // Delete old profile and create new one with correct ID, preserving subscription data
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', profileByEmail.id)

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          full_name: fullName || '',
          plan: profileByEmail.plan || 'none',
          subscription_status: profileByEmail.subscription_status || 'none',
          trial_active: profileByEmail.subscription_status === 'trialing',
          stripe_customer_id: profileByEmail.stripe_customer_id,
          stripe_subscription_id: profileByEmail.stripe_subscription_id,
          trial_end: profileByEmail.trial_end,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.log('[v0] Migration insert error:', insertError.message)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'migrated' })
    }

    // Create new profile with initial values (no subscription yet)
    console.log('[v0] Creating new profile for user:', userId)
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName || '',
        plan: 'none',
        subscription_status: 'none',
        trial_active: false,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.log('[v0] Insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('[v0] Profile created successfully with plan=none, subscription_status=none')
    return NextResponse.json({ success: true, action: 'created' })

  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
