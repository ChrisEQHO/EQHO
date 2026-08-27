'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { handleSectionLinkClick } from '@/lib/utils/scroll-to-section'

type ScrollLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: ReactNode
}

/**
 * A same-page anchor that smooth-scrolls to its target section WITHOUT writing
 * the "#section" hash into the URL, keeping the homepage as a clean
 * "eqho-player.com". Falls back to normal anchor behaviour when the target
 * isn't on the current page. Use for in-page jump links in server components.
 */
export function ScrollLink({ href, children, onClick, ...rest }: ScrollLinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        handleSectionLinkClick(e, href)
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
