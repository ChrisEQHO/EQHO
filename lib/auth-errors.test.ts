import { describe, it, expect } from 'vitest'
import {
  classifyAuthMessage,
  classifyThrown,
  isAuthConfigured,
  loginError,
  LOGIN_TIMEOUT_SENTINEL,
} from './auth-errors'

describe('isAuthConfigured', () => {
  it('is false when either Supabase value is missing or blank', () => {
    expect(isAuthConfigured({ url: undefined, anonKey: 'k' })).toBe(false)
    expect(isAuthConfigured({ url: 'https://x.supabase.co', anonKey: '' })).toBe(false)
    expect(isAuthConfigured({ url: '   ', anonKey: 'k' })).toBe(false)
  })

  it('is true when both values are present', () => {
    expect(isAuthConfigured({ url: 'https://x.supabase.co', anonKey: 'k' })).toBe(true)
  })
})

describe('classifyAuthMessage', () => {
  it('recognises invalid credentials', () => {
    expect(classifyAuthMessage('Invalid login credentials').kind).toBe('invalid-credentials')
  })

  it('recognises unconfirmed email', () => {
    expect(classifyAuthMessage('Email not confirmed').kind).toBe('email-not-confirmed')
  })

  it('recognises network failures including WebKit wording', () => {
    expect(classifyAuthMessage('Failed to fetch').kind).toBe('network')
    expect(classifyAuthMessage('Load failed').kind).toBe('network')
  })

  it('passes other messages through unchanged', () => {
    expect(classifyAuthMessage('Too many requests')).toEqual({
      kind: 'other',
      message: 'Too many requests',
    })
  })
})

describe('classifyThrown', () => {
  it('maps the timeout sentinel to a timeout', () => {
    expect(classifyThrown(new Error(LOGIN_TIMEOUT_SENTINEL)).kind).toBe('timeout')
  })

  it('maps any other exception to a network failure', () => {
    expect(classifyThrown(new TypeError('Failed to fetch')).kind).toBe('network')
    expect(classifyThrown('boom').kind).toBe('network')
  })
})

describe('messages', () => {
  it('keeps the three required failure types distinct', () => {
    const messages = new Set([
      loginError('missing-config').message,
      loginError('invalid-credentials').message,
      loginError('network').message,
    ])
    expect(messages.size).toBe(3)
  })
})
