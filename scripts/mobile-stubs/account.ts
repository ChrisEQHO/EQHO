// AUTO-SWAPPED STUB for Capacitor static export (`output: export`).
// The real implementation in app/actions/account.ts uses Next.js Server Actions
// ('use server' + next/headers), which cannot be statically exported. During the
// mobile build, prepare-mobile-build.js temporarily replaces the real file with
// this client-safe stub and restore-web-build.js puts the original back.
//
// Account management on mobile is handled by the hosted web app, so these stubs
// simply report that the action is unavailable in the packaged mobile client.

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Account deletion is available in the web app.' }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Sign out is handled locally on mobile.' }
}
