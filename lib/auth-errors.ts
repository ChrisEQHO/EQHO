export type LoginErrorKind =
  | 'missing-config'
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'network'
  | 'timeout'
  | 'no-session'
  | 'other'

export interface LoginError {
  kind: LoginErrorKind
  message: string
}

export const LOGIN_TIMEOUT_SENTINEL = '__timeout__'

const MESSAGES: Record<Exclude<LoginErrorKind, 'other'>, string> = {
  'missing-config':
    'Sign-in is not configured for this build. Please update the app or contact support.',
  'invalid-credentials': 'Invalid email or password.',
  'email-not-confirmed':
    'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
  network: 'Network error. Please check your connection and try again.',
  timeout: 'The request timed out. Please check your connection and try again.',
  'no-session': 'Could not start your session. Please try again.',
}

export function loginError(kind: Exclude<LoginErrorKind, 'other'>): LoginError {
  return { kind, message: MESSAGES[kind] }
}

export function isAuthConfigured(
  env: { url?: string | undefined; anonKey?: string | undefined } = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): boolean {
  return Boolean(env.url?.trim() && env.anonKey?.trim())
}

/** Classifies an error message returned by Supabase auth. */
export function classifyAuthMessage(message: string): LoginError {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed')) return loginError('email-not-confirmed')
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return loginError('invalid-credentials')
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return loginError('network')
  }
  return { kind: 'other', message }
}

/** Classifies an exception thrown while signing in (fetch failure, timeout, etc.). */
export function classifyThrown(err: unknown): LoginError {
  if (err instanceof Error && err.message === LOGIN_TIMEOUT_SENTINEL) return loginError('timeout')
  return loginError('network')
}
