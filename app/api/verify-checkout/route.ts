import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    console.log('[VERIFY-CHECKOUT] Called with session_id:', sessionId)

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Fetch the checkout session directly from Stripe
    console.log('[VERIFY-CHECKOUT] Fetching checkout session from Stripe...')
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })

    console.log('[VERIFY-CHECKOUT] Session retrieved:')
    console.log('[VERIFY-CHECKOUT]   payment_status:', session.payment_status)
    console.log('[VERIFY-CHECKOUT]   status:', session.status)
    console.log('[VERIFY-CHECKOUT]   client_reference_id:', session.client_reference_id)
    console.log('[VERIFY-CHECKOUT]   customer:', session.customer)
    console.log('[VERIFY-CHECKOUT]   customer_email:', session.customer_email)
    console.log('[VERIFY-CHECKOUT]   customer_details?.email:', session.customer_details?.email)
    console.log('[VERIFY-CHECKOUT]   subscription:', session.subscription)

    // Check if payment was successful
    if (session.status !== 'complete') {
      console.log('[VERIFY-CHECKOUT] Session not complete, status:', session.status)
      return NextResponse.json({ 
        success: false, 
        error: 'Checkout session not complete',
        status: session.status 
      })
    }

    // Get user ID and subscription details
    const userId = session.client_reference_id
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer?.id
    const customerEmail = session.customer_details?.email || session.customer_email
    
    // Get subscription details
    const subscription = session.subscription as any
    const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id
    const subscriptionStatus = typeof subscription === 'object' ? subscription?.status : 'trialing'
    const trialEnd = typeof subscription === 'object' && subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    console.log('[VERIFY-CHECKOUT] Extracted data:')
    console.log('[VERIFY-CHECKOUT]   userId:', userId)
    console.log('[VERIFY-CHECKOUT]   customerId:', customerId)
    console.log('[VERIFY-CHECKOUT]   customerEmail:', customerEmail)
    console.log('[VERIFY-CHECKOUT]   subscriptionId:', subscriptionId)
    console.log('[VERIFY-CHECKOUT]   subscriptionStatus:', subscriptionStatus)
    console.log('[VERIFY-CHECKOUT]   trialEnd:', trialEnd)

    if (!userId && !customerEmail) {
      return NextResponse.json({ 
        error: 'No user identifier found in checkout session' 
      }, { status: 400 })
    }

    // Profile data to update
    const profileData = {
      plan: 'pro',
      subscription_status: subscriptionStatus || 'trialing',
      trial_active: subscriptionStatus === 'trialing',
      trial_end: trialEnd,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }

    console.log('[VERIFY-CHECKOUT] Profile data to write:', profileData)

    let profileUpdated = false
    let updatedProfile = null

    // Try to find and update profile by userId first
    if (userId) {
      console.log('[VERIFY-CHECKOUT] Looking up profile by userId:', userId)
      
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, subscription_status')
        .eq('id', userId)
        .single()

      console.log('[VERIFY-CHECKOUT] Profile by userId:', existingProfile)

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          console.error('[VERIFY-CHECKOUT] Update error:', error.message)
        } else {
          console.log('[VERIFY-CHECKOUT] Profile updated:', data)
          profileUpdated = true
          updatedProfile = data
        }
      } else {
        // Create new profile with userId
        console.log('[VERIFY-CHECKOUT] Creating new profile with userId')
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: customerEmail?.toLowerCase(),
            full_name: '',
            ...profileData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error('[VERIFY-CHECKOUT] Insert error:', error.message)
        } else {
          console.log('[VERIFY-CHECKOUT] Profile created:', data)
          profileUpdated = true
          updatedProfile = data
        }
      }
    }

    // If no userId or update failed, try by email
    if (!profileUpdated && customerEmail) {
      console.log('[VERIFY-CHECKOUT] Looking up profile by email:', customerEmail)
      
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('id, email, subscription_status')
        .ilike('email', customerEmail)
        .single()

      console.log('[VERIFY-CHECKOUT] Profile by email:', profileByEmail)

      if (profileByEmail) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(profileData)
          .eq('id', profileByEmail.id)
          .select()
          .single()

        if (error) {
          console.error('[VERIFY-CHECKOUT] Update by email error:', error.message)
        } else {
          console.log('[VERIFY-CHECKOUT] Profile updated by email:', data)
          profileUpdated = true
          updatedProfile = data
        }
      }
    }

    if (!profileUpdated) {
      console.error('[VERIFY-CHECKOUT] Failed to update profile')
      return NextResponse.json({ 
        success: false, 
        error: 'Could not find or update profile',
        userId,
        customerEmail
      }, { status: 500 })
    }

    console.log('[VERIFY-CHECKOUT] Success!')
    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      subscription: {
        status: subscriptionStatus,
        trialEnd,
      }
    })

  } catch (error) {
    console.error('[VERIFY-CHECKOUT] Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
