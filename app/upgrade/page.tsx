'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Cloud, Zap, Shield, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Stripe Payment Link with 30-day free trial
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_bIYeYb5lB1CS2LS145'

const features = [
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Sync your playlists across all your devices automatically',
  },
  {
    icon: Zap,
    title: 'Priority Support',
    description: 'Get help when you need it with priority customer support',
  },
  {
    icon: Shield,
    title: 'Secure Backup',
    description: 'Your data is safely backed up in the cloud',
  },
]

const comparisonFeatures = [
  { name: 'Local playlists', free: true, pro: true },
  { name: 'Audio playback', free: true, pro: true },
  { name: 'Session management', free: true, pro: true },
  { name: 'Cloud sync', free: false, pro: true },
  { name: 'Cross-device access', free: false, pro: true },
  { name: 'Automatic backups', free: false, pro: true },
  { name: 'Priority support', free: false, pro: true },
]

export default function UpgradePage() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get current user info to pass to Stripe
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || null)
      }
    }
    getUser()
  }, [])

  const handleUpgrade = () => {
    setIsLoading(true)
    
    // Build the Payment Link URL with prefilled email and client reference
    let paymentUrl = STRIPE_PAYMENT_LINK
    const params = new URLSearchParams()
    
    if (userEmail) {
      params.set('prefilled_email', userEmail)
    }
    if (userId) {
      params.set('client_reference_id', userId)
    }
    
    const queryString = params.toString()
    if (queryString) {
      paymentUrl += `?${queryString}`
    }
    
    // Redirect to Stripe Payment Link
    window.location.href = paymentUrl
  }

  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--eqho-bg-app)' }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--eqho-border)' }}>
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--eqho-text-primary)' }}>
          Upgrade to Pro
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Canceled notice */}
        {canceled && (
          <div 
            className="mb-8 p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'rgba(255, 138, 0, 0.1)',
              borderColor: 'var(--eqho-orange)',
              color: 'var(--eqho-orange)'
            }}
          >
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div 
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
              color: 'white',
            }}
          >
            30-Day Free Trial
          </div>
          <h2 
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--eqho-text-primary)' }}
          >
            Unlock the Full Experience
          </h2>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--eqho-text-secondary)' }}
          >
            Get cloud sync, cross-device access, and automatic backups. 
            Try it free for 30 days, then just £7.99/month.
          </p>
        </div>

        {/* Pricing Card */}
        <div 
          className="rounded-2xl p-8 mb-12"
          style={{
            backgroundColor: 'var(--eqho-bg-card)',
            boxShadow: 'var(--eqho-card-shadow)',
            border: '1px solid var(--eqho-border)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--eqho-text-primary)' }}
              >
                EQHO Player Pro
              </h3>
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: 'var(--eqho-text-primary)' }}
                >
                  £7.99
                </span>
                <span style={{ color: 'var(--eqho-text-muted)' }}>/month</span>
              </div>
              <p 
                className="mt-2 text-sm"
                style={{ color: 'var(--eqho-text-secondary)' }}
              >
                Cancel anytime. No commitment required.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="h-12 px-8 text-base font-semibold text-white border-0 gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
                  boxShadow: 'var(--eqho-btn-shadow)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Start 30-Day Free Trial
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center" style={{ color: 'var(--eqho-text-muted)' }}>
                You&apos;ll be redirected to Stripe for secure payment
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl"
              style={{
                backgroundColor: 'var(--eqho-bg-card-secondary)',
                border: '1px solid var(--eqho-border-soft)',
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
                }}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h4 
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--eqho-text-primary)' }}
              >
                {feature.title}
              </h4>
              <p style={{ color: 'var(--eqho-text-secondary)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--eqho-bg-card)',
            border: '1px solid var(--eqho-border)',
          }}
        >
          <div 
            className="grid grid-cols-3 px-6 py-4 border-b"
            style={{ borderColor: 'var(--eqho-border)' }}
          >
            <div 
              className="font-semibold"
              style={{ color: 'var(--eqho-text-primary)' }}
            >
              Feature
            </div>
            <div 
              className="text-center font-semibold"
              style={{ color: 'var(--eqho-text-muted)' }}
            >
              Free
            </div>
            <div 
              className="text-center font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Pro
            </div>
          </div>
          
          {comparisonFeatures.map((feature, index) => (
            <div 
              key={feature.name}
              className="grid grid-cols-3 px-6 py-4"
              style={{
                backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                borderBottom: index < comparisonFeatures.length - 1 ? '1px solid var(--eqho-border-soft)' : 'none',
              }}
            >
              <div style={{ color: 'var(--eqho-text-secondary)' }}>
                {feature.name}
              </div>
              <div className="flex justify-center">
                {feature.free ? (
                  <Check className="h-5 w-5" style={{ color: 'var(--eqho-cyan)' }} />
                ) : (
                  <span style={{ color: 'var(--eqho-text-muted)' }}>—</span>
                )}
              </div>
              <div className="flex justify-center">
                {feature.pro ? (
                  <Check className="h-5 w-5" style={{ color: 'var(--eqho-pink)' }} />
                ) : (
                  <span style={{ color: 'var(--eqho-text-muted)' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--eqho-text-muted)' }}
          >
            Have questions? <Link href="/" className="underline" style={{ color: 'var(--eqho-cyan)' }}>Contact support</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
