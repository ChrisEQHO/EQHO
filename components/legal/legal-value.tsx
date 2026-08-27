import type { ReactNode } from 'react'

/**
 * Renders a legal/company detail. When the underlying value is missing (null),
 * it shows a clearly-marked, highlighted placeholder instead of silently
 * omitting the field — so anyone reviewing the page immediately sees what still
 * needs to be filled in with real registered company information before launch.
 */
export function LegalValue({
  value,
  placeholder,
}: {
  value: string | null | undefined
  /** What the missing detail is, e.g. "registered company name". */
  placeholder: string
}): ReactNode {
  if (value) return <>{value}</>
  return (
    <mark
      className="rounded bg-[#ff8a00]/15 px-1.5 py-0.5 text-[#ffb673] ring-1 ring-inset ring-[#ff8a00]/30"
      title="Placeholder — replace with the confirmed detail before launch"
    >
      {`[${placeholder} — to be added before launch]`}
    </mark>
  )
}
