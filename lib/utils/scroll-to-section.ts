import type { MouseEvent } from 'react'

/**
 * Click handler for in-page section links (e.g. "/#audiences" or "#player-preview").
 *
 * When the link's target section lives on the page the user is ALREADY on, this
 * intercepts the click, smooth-scrolls to the element, and — crucially — keeps the
 * URL clean by NOT letting the "#section" hash get written into the address bar
 * (so the homepage stays "eqho-player.com" rather than "eqho-player.com/#audiences").
 *
 * For cross-page links (e.g. clicking "Who it's for" from /pricing) it does nothing
 * and lets Next.js navigate normally, so the section still resolves after the route
 * change.
 *
 * @returns true if it handled (scrolled) the click, false if it let the default happen.
 */
export function handleSectionLinkClick(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
): boolean {
  // Respect modified clicks (new tab / new window) and non-primary buttons.
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
    return false
  }

  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) return false // a normal route link — let it navigate.

  const targetPath = href.slice(0, hashIndex) || '/'
  const id = href.slice(hashIndex + 1)
  if (!id) return false

  // Only intercept when the section is on the current page.
  if (window.location.pathname !== targetPath) return false

  const el = document.getElementById(id)
  if (!el) return false

  e.preventDefault()
  el.scrollIntoView({ behavior: 'smooth' })
  // Strip any existing hash without adding a history entry, keeping the URL clean.
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return true
}
