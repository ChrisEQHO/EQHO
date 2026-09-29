import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/check-email/route'

describe('POST /api/check-email', () => {
  it('returns the same neutral response for any email, so accounts cannot be enumerated', async () => {
    const responses = await Promise.all(
      ['existing@eqho.test', 'unknown@eqho.test', ''].map(async () => {
        const res = await POST()
        return { status: res.status, body: await res.json() }
      })
    )
    for (const response of responses) {
      expect(response).toEqual({ status: 200, body: { ok: true } })
    }
  })
})
