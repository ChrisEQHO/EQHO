type Identified = { id: string }

/**
 * Stable partition: included tracks first, hidden tracks after, each group
 * keeping its relative order. Returns the same array when nothing would move.
 */
export function moveHiddenToBottom<T extends Identified>(tracks: T[], hiddenIds: ReadonlySet<string>): T[] {
  if (!canMoveHiddenToBottom(tracks, hiddenIds)) return tracks
  const included: T[] = []
  const hidden: T[] = []
  for (const track of tracks) {
    if (hiddenIds.has(track.id)) hidden.push(track)
    else included.push(track)
  }
  return [...included, ...hidden]
}

/** True when at least one hidden track sits above an included track. */
export function canMoveHiddenToBottom(tracks: Identified[], hiddenIds: ReadonlySet<string>): boolean {
  let seenHidden = false
  for (const track of tracks) {
    if (hiddenIds.has(track.id)) seenHidden = true
    else if (seenHidden) return true
  }
  return false
}
