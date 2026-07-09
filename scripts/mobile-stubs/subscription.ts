// AUTO-SWAPPED STUB for Capacitor static export (`output: export`).
// The real implementation in app/actions/subscription.ts uses Next.js Server
// Actions ('use server' + Stripe + server Supabase), which cannot be statically
// exported. During the mobile build, prepare-mobile-build.js temporarily replaces
// the real file with this client-safe stub and restore-web-build.js restores it.
//
// Subscription/billing management on mobile is handled by the hosted web app.

import type { ProfileSubscription } from '@/lib/subscription-types'

export async function getSubscription(): Promise<ProfileSubscription | null> {
  return null
}

export async function createCustomerPortalSession(): Promise<{ url: string | null; error: string | null }> {
  return { url: null, error: 'Billing is managed in the web app.' }
}

export async function cancelSubscription(): Promise<{ success: boolean; error: string | null }> {
  return { success: false, error: 'Billing is managed in the web app.' }
}

export async function resumeSubscription(): Promise<{ success: boolean; error: string | null }> {
  return { success: false, error: 'Billing is managed in the web app.' }
}
