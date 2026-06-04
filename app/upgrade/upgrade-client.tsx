'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// STRIPE TEMPORARILY DISABLED

export default function UpgradeClient() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

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
          EQHO Player
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        {/* Success Message */}
        <div className="text-center">
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
            }}
          >
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: 'var(--eqho-text-primary)' }}
          >
            Welcome to EQHO Player!
          </h2>
          
          <p 
            className="text-lg mb-8"
            style={{ color: 'var(--eqho-text-secondary)' }}
          >
            You have full access to all features. Enjoy managing your training sessions!
          </p>

          <Link href="/">
            <Button
              className="h-12 px-8 text-base font-semibold text-white border-0"
              style={{
                background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
                boxShadow: 'var(--eqho-btn-shadow)',
              }}
            >
              Go to Player
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
