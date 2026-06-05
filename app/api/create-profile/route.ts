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
    const { userId, email } = body

    console.log('[v0] API create-profile called for:', email, 'userId:', userId)

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    // Calculate trial dates
    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14)

    // First check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_status')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('[v0] Profile already exists, updating subscription_status to trialing')
      
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'trialing',
          plan: 'pro',
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.log('[v0] Update error:', updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'updated' })
    }

    // Check if profile exists by email (might have different ID from webhook)
    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_status, stripe_customer_id, stripe_subscription_id')
      .ilike('email', email)
      .single()

    if (profileByEmail && profileByEmail.id !== userId) {
      console.log('[v0] Profile exists by email with different ID, migrating...')
      
      // Delete old profile and create new one with correct ID
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', profileByEmail.id)

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          full_name: '',
          plan: 'pro',
          subscription_status: profileByEmail.subscription_status || 'trialing',
          stripe_customer_id: profileByEmail.stripe_customer_id,
          stripe_subscription_id: profileByEmail.stripe_subscription_id,
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.log('[v0] Migration insert error:', insertError.message)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'migrated' })
    }

    // Create new profile
    console.log('[v0] Creating new profile for user:', userId)
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: '',
        plan: 'pro',
        subscription_status: 'trialing',
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.log('[v0] Insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('[v0] Profile created successfully')
    return NextResponse.json({ success: true, action: 'created' })

  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
