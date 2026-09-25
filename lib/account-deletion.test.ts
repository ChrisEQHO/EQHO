import { describe, it, expect, vi } from 'vitest'
import { runAccountDeletion, type AccountDeletionDeps } from '@/lib/account-deletion'

const USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

/**
 * Build a set of deletion deps whose default behaviour is the happy path, and
 * record the order in which the destructive/side-effecting steps run so tests
 * can assert the security-critical ordering (cancel before delete, Auth user
 * deleted LAST). Any dep can be overridden per test.
 */
function makeDeps(overrides: Partial<AccountDeletionDeps> = {}) {
  const order: string[] = []
  const deps: AccountDeletionDeps = {
    hasServiceKey: true,
    resolveUserId: vi.fn(async () => USER_ID),
    getStripeRefs: vi.fn(async () => ({ subscriptionId: null, customerId: null })),
    cancelSubscription: vi.fn(async (id: string) => {
      order.push(`cancel:${id}`)
    }),
    listCancellableSubscriptions: vi.fn(async () => []),
    deleteStorageObjects: vi.fn(async () => {
      order.push('storage')
    }),
    deleteUserRows: vi.fn(async () => {
      order.push('rows')
    }),
    deleteAuthUser: vi.fn(async () => {
      order.push('auth')
    }),
    captureAccountDeleted: vi.fn(async () => {
      order.push('capture')
    }),
    signOut: vi.fn(async () => {
      order.push('signout')
    }),
    ...overrides,
  }
  return { deps, order }
}

describe('runAccountDeletion — authentication', () => {
  it('returns 401 and deletes nothing when there is no server-verified user', async () => {
    const { deps } = makeDeps({ resolveUserId: vi.fn(async () => null) })
    const result = await runAccountDeletion(deps)

    expect(result).toEqual({ success: false, status: 401, error: 'Not authenticated' })
    expect(deps.deleteAuthUser).not.toHaveBeenCalled()
    expect(deps.deleteUserRows).not.toHaveBeenCalled()
    expect(deps.deleteStorageObjects).not.toHaveBeenCalled()
    expect(deps.cancelSubscription).not.toHaveBeenCalled()
    expect(deps.captureAccountDeleted).not.toHaveBeenCalled()
  })

  it('always targets the server-resolved id, never a client-supplied one', async () => {
    const { deps } = makeDeps()
    await runAccountDeletion(deps)
    // Every privileged operation is keyed by the resolved session id.
    expect(deps.deleteAuthUser).toHaveBeenCalledWith(USER_ID)
    expect(deps.deleteUserRows).toHaveBeenCalledWith(USER_ID)
    expect(deps.deleteStorageObjects).toHaveBeenCalledWith(USER_ID)
  })

  it('refuses (500) rather than half-deleting when the service key is absent', async () => {
    const { deps } = makeDeps({ hasServiceKey: false })
    const result = await runAccountDeletion(deps)

    expect(result.success).toBe(false)
    expect(result.status).toBe(500)
    expect(deps.deleteAuthUser).not.toHaveBeenCalled()
  })
})

describe('runAccountDeletion — Stripe cancellation', () => {
  it('cancels the profile subscription BEFORE deleting the account', async () => {
    const { deps, order } = makeDeps({
      getStripeRefs: vi.fn(async () => ({ subscriptionId: 'sub_1', customerId: 'cus_1' })),
      listCancellableSubscriptions: vi.fn(async () => ['sub_1']),
    })
    const result = await runAccountDeletion(deps)

    expect(result.success).toBe(true)
    expect(deps.cancelSubscription).toHaveBeenCalledWith('sub_1')
    // Ordering guarantee: billing stops before the account is removed.
    expect(order.indexOf('cancel:sub_1')).toBeLessThan(order.indexOf('auth'))
  })

  it('sweeps and cancels extra live customer subscriptions, skipping the primary', async () => {
    const cancelSubscription = vi.fn(async () => {})
    const { deps } = makeDeps({
      getStripeRefs: vi.fn(async () => ({ subscriptionId: 'sub_primary', customerId: 'cus_1' })),
      listCancellableSubscriptions: vi.fn(async () => ['sub_primary', 'sub_extra']),
      cancelSubscription,
    })
    await runAccountDeletion(deps)

    // Primary cancelled once (from the direct ref), extra cancelled once (from sweep);
    // the primary is skipped inside the sweep loop so it is not cancelled twice.
    expect(cancelSubscription).toHaveBeenCalledWith('sub_primary')
    expect(cancelSubscription).toHaveBeenCalledWith('sub_extra')
    expect(cancelSubscription).toHaveBeenCalledTimes(2)
  })

  it('still deletes the account when Stripe cancellation throws (best-effort)', async () => {
    const { deps } = makeDeps({
      getStripeRefs: vi.fn(async () => ({ subscriptionId: 'sub_1', customerId: 'cus_1' })),
      cancelSubscription: vi.fn(async () => {
        throw new Error('stripe down')
      }),
    })
    const result = await runAccountDeletion(deps)

    expect(result.success).toBe(true)
    expect(deps.deleteAuthUser).toHaveBeenCalledWith(USER_ID)
  })
})

describe('runAccountDeletion — deletion & ordering', () => {
  it('deletes storage and rows, then the Auth user LAST, then fires analytics', async () => {
    const { deps, order } = makeDeps()
    const result = await runAccountDeletion(deps)

    expect(result).toEqual({ success: true, status: 200 })
    expect(deps.deleteStorageObjects).toHaveBeenCalledTimes(1)
    expect(deps.deleteUserRows).toHaveBeenCalledTimes(1)
    expect(deps.deleteAuthUser).toHaveBeenCalledTimes(1)
    expect(deps.signOut).toHaveBeenCalledTimes(1)

    // Auth user is the last destructive step (after storage + rows).
    expect(order.indexOf('storage')).toBeLessThan(order.indexOf('auth'))
    expect(order.indexOf('rows')).toBeLessThan(order.indexOf('auth'))
    // Analytics + sign-out happen only after the authoritative deletion.
    expect(order.indexOf('auth')).toBeLessThan(order.indexOf('capture'))
    expect(order.indexOf('auth')).toBeLessThan(order.indexOf('signout'))
  })

  it('records account_deleted with anonymous metadata only (id + boolean)', async () => {
    const { deps } = makeDeps({
      getStripeRefs: vi.fn(async () => ({ subscriptionId: 'sub_1', customerId: null })),
    })
    await runAccountDeletion(deps)

    expect(deps.captureAccountDeleted).toHaveBeenCalledTimes(1)
    const [id, hadSubscription] = (deps.captureAccountDeleted as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(id).toBe(USER_ID)
    expect(hadSubscription).toBe(true)
    // No third argument — no free-form metadata can leak from the core.
    expect((deps.captureAccountDeleted as ReturnType<typeof vi.fn>).mock.calls[0]).toHaveLength(2)
  })

  it('reports had_subscription=false when the user never had a subscription', async () => {
    const { deps } = makeDeps()
    await runAccountDeletion(deps)
    expect(deps.captureAccountDeleted).toHaveBeenCalledWith(USER_ID, false)
  })

  it('still deletes the account when storage cleanup throws (best-effort)', async () => {
    const { deps } = makeDeps({
      deleteStorageObjects: vi.fn(async () => {
        throw new Error('r2 down')
      }),
    })
    const result = await runAccountDeletion(deps)
    expect(result.success).toBe(true)
    expect(deps.deleteAuthUser).toHaveBeenCalledWith(USER_ID)
  })
})

describe('runAccountDeletion — failure handling', () => {
  it('does NOT report success when the Auth-user deletion fails', async () => {
    const { deps } = makeDeps({
      deleteAuthUser: vi.fn(async () => {
        throw new Error('admin delete failed')
      }),
    })
    const result = await runAccountDeletion(deps)

    expect(result.success).toBe(false)
    expect(result.status).toBe(500)
    expect(result.error).toMatch(/could not fully delete/i)
    // No false-positive side effects: analytics and sign-out must not run.
    expect(deps.captureAccountDeleted).not.toHaveBeenCalled()
    expect(deps.signOut).not.toHaveBeenCalled()
  })
})

describe('runAccountDeletion — double submission / idempotency', () => {
  it('deletes exactly once across a duplicate submission, then safely 401s', async () => {
    // Models a real double-submit: the first call deletes the account; by the
    // second call the session is gone, so the caller resolves to null.
    let deleted = false
    const resolveUserId = vi.fn(async () => (deleted ? null : USER_ID))
    const deleteAuthUser = vi.fn(async () => {
      deleted = true
    })
    const { deps } = makeDeps({ resolveUserId, deleteAuthUser })

    const first = await runAccountDeletion(deps)
    const second = await runAccountDeletion(deps)

    expect(first).toEqual({ success: true, status: 200 })
    expect(second.success).toBe(false)
    expect(second.status).toBe(401)
    // The privileged deletion ran exactly once despite two submissions.
    expect(deleteAuthUser).toHaveBeenCalledTimes(1)
  })
})
