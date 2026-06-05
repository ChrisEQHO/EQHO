'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

interface DebugData {
  // Auth data
  authUserId: string | null
  authEmail: string | null
  authError: string | null
  
  // Profile data
  profileExists: boolean
  profileId: string | null
  profileEmail: string | null
  subscriptionStatus: string | null
  plan: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  trialStart: string | null
  trialEnd: string | null
  trialActive: boolean | null
  currentPeriodEnd: string | null
  createdAt: string | null
  updatedAt: string | null
  profileError: string | null
  
  // Access calculation
  isProAccess: boolean
  accessDeniedReason: string | null
}

export default function DebugSubscriptionPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    const supabase = createClient()
    if (!supabase) {
      setData({
        authUserId: null,
        authEmail: null,
        authError: 'Supabase client not initialized',
        profileExists: false,
        profileId: null,
        profileEmail: null,
        subscriptionStatus: null,
        plan: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialStart: null,
        trialEnd: null,
        trialActive: null,
        currentPeriodEnd: null,
        createdAt: null,
        updatedAt: null,
        profileError: null,
        isProAccess: false,
        accessDeniedReason: 'Supabase client not initialized',
      })
      setLoading(false)
      return
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setData({
        authUserId: null,
        authEmail: null,
        authError: authError?.message || 'Not logged in',
        profileExists: false,
        profileId: null,
        profileEmail: null,
        subscriptionStatus: null,
        plan: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialStart: null,
        trialEnd: null,
        trialActive: null,
        currentPeriodEnd: null,
        createdAt: null,
        updatedAt: null,
        profileError: null,
        isProAccess: false,
        accessDeniedReason: authError?.message || 'User not logged in',
      })
      setLoading(false)
      return
    }

    // Fetch profile by user id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Calculate access
    let isProAccess = false
    let accessDeniedReason: string | null = null

    if (profileError) {
      accessDeniedReason = `Profile fetch error: ${profileError.message}`
    } else if (!profile) {
      accessDeniedReason = 'No profile record found for this user'
    } else {
      const status = profile.subscription_status
      const plan = profile.plan
      
      if (status === 'active' || status === 'trialing') {
        isProAccess = true
      } else {
        const reasons: string[] = []
        
        if (!status) {
          reasons.push('subscription_status is null/empty')
        } else if (status === 'none') {
          reasons.push('subscription_status is "none"')
        } else if (status === 'canceled') {
          reasons.push('subscription_status is "canceled"')
        } else if (status === 'past_due') {
          reasons.push('subscription_status is "past_due"')
        } else {
          reasons.push(`subscription_status is "${status}" (not active/trialing)`)
        }
        
        if (plan !== 'pro') {
          reasons.push(`plan is "${plan || 'null'}" (not "pro")`)
        }
        
        accessDeniedReason = reasons.join('; ')
      }
    }

    setData({
      authUserId: user.id,
      authEmail: user.email || null,
      authError: null,
      profileExists: !!profile,
      profileId: profile?.id || null,
      profileEmail: profile?.email || null,
      subscriptionStatus: profile?.subscription_status || null,
      plan: profile?.plan || null,
      stripeCustomerId: profile?.stripe_customer_id || null,
      stripeSubscriptionId: profile?.stripe_subscription_id || null,
      trialStart: profile?.trial_start || null,
      trialEnd: profile?.trial_end || null,
      trialActive: profile?.trial_active ?? null,
      currentPeriodEnd: profile?.current_period_end || null,
      createdAt: profile?.created_at || null,
      updatedAt: profile?.updated_at || null,
      profileError: profileError?.message || null,
      isProAccess,
      accessDeniedReason,
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'null'
    try {
      const date = new Date(dateStr)
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    } catch {
      return dateStr
    }
  }

  const Row = ({ label, value, isGood, isBad }: { label: string; value: string | null | boolean; isGood?: boolean; isBad?: boolean }) => (
    <div className="flex justify-between py-2 border-b border-[#1e293b]">
      <span className="text-[#94a3b8]">{label}</span>
      <span className={`font-mono text-sm ${isGood ? 'text-green-400' : isBad ? 'text-red-400' : 'text-white'}`}>
        {value === null ? <span className="text-[#64748b]">null</span> : value === true ? 'true' : value === false ? 'false' : value}
      </span>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg hover:bg-[#334155] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2">Subscription Debug</h1>
        <p className="text-[#94a3b8] mb-6">Raw database values for the current user</p>

        {/* Access Status Banner */}
        <div className={`p-4 rounded-xl mb-6 ${data?.isProAccess ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data?.isProAccess ? 'bg-green-400' : 'bg-red-400'}`} />
            <div>
              <p className={`font-semibold ${data?.isProAccess ? 'text-green-400' : 'text-red-400'}`}>
                {data?.isProAccess ? 'Access Granted' : 'Access Denied'}
              </p>
              {data?.accessDeniedReason && (
                <p className="text-sm text-[#94a3b8] mt-1">{data.accessDeniedReason}</p>
              )}
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Supabase Auth</h2>
          <Row label="User ID" value={data?.authUserId} />
          <Row label="Email" value={data?.authEmail} />
          {data?.authError && <Row label="Auth Error" value={data.authError} isBad />}
        </div>

        {/* Profile Section */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Profile Record</h2>
          <Row label="Profile Exists" value={data?.profileExists} isGood={data?.profileExists} isBad={!data?.profileExists} />
          <Row label="Profile ID" value={data?.profileId} />
          <Row label="Profile Email" value={data?.profileEmail} />
          {data?.profileError && <Row label="Profile Error" value={data.profileError} isBad />}
        </div>

        {/* Subscription Section */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Subscription Data</h2>
          <Row 
            label="subscription_status" 
            value={data?.subscriptionStatus} 
            isGood={data?.subscriptionStatus === 'active' || data?.subscriptionStatus === 'trialing'}
            isBad={!data?.subscriptionStatus || data?.subscriptionStatus === 'none' || data?.subscriptionStatus === 'canceled'}
          />
          <Row 
            label="plan" 
            value={data?.plan}
            isGood={data?.plan === 'pro'}
            isBad={!data?.plan || data?.plan === 'none'}
          />
          <Row label="trial_active" value={data?.trialActive} />
        </div>

        {/* Stripe Section */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Stripe IDs</h2>
          <Row label="stripe_customer_id" value={data?.stripeCustomerId} />
          <Row label="stripe_subscription_id" value={data?.stripeSubscriptionId} />
        </div>

        {/* Dates Section */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Dates</h2>
          <Row label="trial_start" value={formatDate(data?.trialStart || null)} />
          <Row label="trial_end" value={formatDate(data?.trialEnd || null)} />
          <Row label="current_period_end" value={formatDate(data?.currentPeriodEnd || null)} />
          <Row label="created_at" value={formatDate(data?.createdAt || null)} />
          <Row label="updated_at" value={formatDate(data?.updatedAt || null)} />
        </div>

        {/* Access Calculation */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3 text-[#22d3ee]">Access Calculation</h2>
          <Row 
            label="is_pro_access" 
            value={data?.isProAccess} 
            isGood={data?.isProAccess}
            isBad={!data?.isProAccess}
          />
          <div className="pt-2 mt-2 border-t border-[#1e293b]">
            <p className="text-xs text-[#64748b]">
              Access is granted when subscription_status = &quot;active&quot; OR &quot;trialing&quot;
            </p>
          </div>
        </div>

        <p className="text-xs text-[#64748b] mt-6 text-center">
          Last fetched: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
