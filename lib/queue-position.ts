// Colour cycle for queue numbers in the "Up Next" lists. The full-screen
// player reads from the same list so a track's number and colour always match.
export const QUEUE_NUMBER_COLOURS = [
  "text-[#ff8a00]",
  "text-blue-500",
  "text-purple-400",
  "text-[#ff4fa3]",
  "text-cyan-400",
  "text-green-400",
] as const

export function getQueueColour(originalIndex: number): string {
  const len = QUEUE_NUMBER_COLOURS.length
  return QUEUE_NUMBER_COLOURS[((originalIndex % len) + len) % len]
}

export interface QueuePosition {
  number: number
  colourClass: string
}

// A track's position is its index in the full playlist (hidden tracks keep
// their slot), matching the numbers shown beside each Up Next row.
export function getQueuePosition(
  playlist: ReadonlyArray<{ id: string }>,
  trackId: string | null | undefined,
): QueuePosition | null {
  if (!trackId) return null
  const index = playlist.findIndex((t) => t.id === trackId)
  if (index < 0) return null
  return { number: index + 1, colourClass: getQueueColour(index) }
}
