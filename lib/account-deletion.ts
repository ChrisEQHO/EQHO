/**
 * Pure, dependency-injected orchestration for permanent account deletion.
 *
 * All side effects (auth resolution, Stripe, storage, DB, analytics, sign-out)
 * are injected, so this module contains ONLY the security-critical ordering and
 * best-effort/failure semantics — and can be unit-tested without Next.js,
 * Supabase, Stripe, or the network. The API route (`app/api/account/delete`)
 * provides the real implementations.
 *
 * Security guarantees enforced here:
 * - The target user id comes exclusively from `resolveUserId()`, which the route
 *   derives from the server-verified session/token. No client-supplied id is
 *   ever accepted, so a caller can only ever delete itself.
 * - Deleting the Auth login requires the service role key; without it we refuse
 *   rather than half-delete (which would leave an account that can still log in).
 * - The Auth user is deleted LAST and is the authoritative step: only if it
 *   succeeds do we report success, fire analytics, and sign out.
 * - External steps (Stripe cancel, storage wipe, row deletes) are best-effort:
 *   a failure there is swallowed so it can never leave a user unable to delete
 *   their account. DB rows also cascade from the Auth-user deletion.
 */

export interface AccountDeletionDeps {
  /** Server-verified caller id, or null when unauthenticated. Never from the client. */
  resolveUserId: () => Promise<string | null>
  /** Whether SUPABASE_SERVICE_ROLE_KEY (required to delete the Auth login) is present. */
  hasServiceKey: boolean
  /** Read the user's Stripe references from their profile row. */
  getStripeRefs: (
    userId: string,
  ) => Promise<{ subscriptionId: string | null; customerId: string | null }>
  /** Immediately cancel a single subscription. May throw; caller treats as best-effort. */
  cancelSubscription: (subscriptionId: string) => Promise<void>
  /** Return every still-cancellable subscription id for a customer (sweep/safety net). */
  listCancellableSubscriptions: (customerId: string) => Promise<string[]>
  /** Delete all stored (R2) objects owned by the user. Best-effort. */
  deleteStorageObjects: (userId: string) => Promise<void>
  /** Delete the user's DB rows (tracks, playlists, profile). Best-effort. */
  deleteUserRows: (userId: string) => Promise<void>
  /** Delete the Supabase Auth user. MUST throw on failure — this is authoritative. */
  deleteAuthUser: (userId: string) => Promise<void>
  /** Fire the anonymous `account_deleted` analytics event. Never throws. */
  captureAccountDeleted: (userId: string, hadSubscription: boolean) => Promise<void>
  /** Clear the local (web) session. Best-effort. */
  signOut: () => Promise<void>
}

export interface AccountDeletionResult {
  success: boolean
  status: number
  error?: string
}

export async function runAccountDeletion(
  deps: AccountDeletionDeps,
): Promise<AccountDeletionResult> {
  // 1) Identify the caller from the server-verified session ONLY.
  const userId = await deps.resolveUserId()
  if (!userId) {
    return { success: false, status: 401, error: 'Not authenticated' }
  }

  // 2) Refuse rather than half-delete when we can't remove the login itself.
  if (!deps.hasServiceKey) {
    return {
      success: false,
      status: 500,
      error: 'Account deletion is temporarily unavailable. Please contact support.',
    }
  }

  // 3) Cancel Stripe subscription(s) BEFORE deletion so billing stops immediately.
  //    Entirely best-effort: never block account removal on a billing error.
  let hadSubscription = false
  try {
    const { subscriptionId, customerId } = await deps.getStripeRefs(userId)

    if (subscriptionId) {
      hadSubscription = true
      try {
        await deps.cancelSubscription(subscriptionId)
      } catch {
        // Already-cancelled/nonexistent subscriptions throw — billing is stopped.
      }
    }

    // Safety net: sweep the customer for any OTHER live subscriptions so the
    // user cannot be left subscribed after deleting their account.
    if (customerId) {
      try {
        const extra = await deps.listCancellableSubscriptions(customerId)
        for (const id of extra) {
          if (id === subscriptionId) continue
          hadSubscription = true
          try {
            await deps.cancelSubscription(id)
          } catch {
            // best-effort per subscription
          }
        }
      } catch {
        // could not list — nothing more we can safely do here
      }
    }
  } catch {
    // Never block account deletion on a Stripe error.
  }

  // 4) Delete stored objects (best-effort).
  try {
    await deps.deleteStorageObjects(userId)
  } catch {
    // orphaned objects can be swept later; do not block deletion
  }

  // 5) Delete DB rows (best-effort — also cascades from the Auth-user deletion).
  try {
    await deps.deleteUserRows(userId)
  } catch {
    // cascade will still remove FK-linked rows when the Auth user is deleted
  }

  // 6) Delete the Auth user LAST. This is the step that truly removes the
  //    account, so a failure here must NOT report success.
  try {
    await deps.deleteAuthUser(userId)
  } catch {
    return {
      success: false,
      status: 500,
      error: 'We could not fully delete your account. Please contact support.',
    }
  }

  // 7) Record the deletion with anonymous metadata only (never throws).
  try {
    await deps.captureAccountDeleted(userId, hadSubscription)
  } catch {
    // analytics must never affect the deletion result
  }

  // 8) Clear the local session (best-effort — session is already invalid).
  try {
    await deps.signOut()
  } catch {
    // safe to ignore once the user is gone
  }

  return { success: true, status: 200 }
}
