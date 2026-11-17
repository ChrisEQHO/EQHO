import { describe, expect, it } from "vitest"
import { canMoveHiddenToBottom, moveHiddenToBottom } from "./queue-grouping"

const list = (ids: string[]) => ids.map((id) => ({ id }))
const ids = (tracks: { id: string }[]) => tracks.map((t) => t.id)

describe("moveHiddenToBottom", () => {
  it("groups hidden tracks underneath, keeping order within each group", () => {
    const result = moveHiddenToBottom(list(["A", "B", "C", "D"]), new Set(["B", "D"]))
    expect(ids(result)).toEqual(["A", "C", "B", "D"])
  })

  it("handles hidden tracks scattered through a longer queue", () => {
    const result = moveHiddenToBottom(list(["H1", "A", "H2", "H3", "B", "C", "H4", "D"]), new Set(["H1", "H2", "H3", "H4"]))
    expect(ids(result)).toEqual(["A", "B", "C", "D", "H1", "H2", "H3", "H4"])
  })

  it("returns the same array when there is nothing to move", () => {
    const already = list(["A", "B", "C"])
    expect(moveHiddenToBottom(already, new Set())).toBe(already)
    expect(moveHiddenToBottom(already, new Set(["C"]))).toBe(already)
    expect(moveHiddenToBottom(already, new Set(["A", "B", "C"]))).toBe(already)
  })

  it("keeps the same track objects", () => {
    const tracks = list(["A", "B", "C"])
    const result = moveHiddenToBottom(tracks, new Set(["A"]))
    expect(result[2]).toBe(tracks[0])
  })
})

describe("canMoveHiddenToBottom", () => {
  it("is false with no hidden tracks", () => {
    expect(canMoveHiddenToBottom(list(["A", "B"]), new Set())).toBe(false)
  })

  it("is false when hidden tracks are already at the bottom", () => {
    expect(canMoveHiddenToBottom(list(["A", "B", "C"]), new Set(["B", "C"]))).toBe(false)
  })

  it("is false when every track is hidden", () => {
    expect(canMoveHiddenToBottom(list(["A", "B"]), new Set(["A", "B"]))).toBe(false)
  })

  it("is true when a hidden track sits above an included one", () => {
    expect(canMoveHiddenToBottom(list(["A", "B", "C"]), new Set(["B"]))).toBe(true)
  })

  it("ignores hidden ids that are not in the queue", () => {
    expect(canMoveHiddenToBottom(list(["A", "B"]), new Set(["Z"]))).toBe(false)
  })
})
