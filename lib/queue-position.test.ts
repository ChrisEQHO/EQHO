import { describe, expect, it } from "vitest"
import { getQueueColour, getQueuePosition, QUEUE_NUMBER_COLOURS } from "./queue-position"

const list = (ids: string[]) => ids.map((id) => ({ id }))

describe("getQueuePosition", () => {
  it("returns the 1-based playlist position and matching colour", () => {
    expect(getQueuePosition(list(["a", "b", "c"]), "c")).toEqual({
      number: 3,
      colourClass: "text-purple-400",
    })
  })

  it("follows reordering", () => {
    expect(getQueuePosition(list(["c", "a", "b"]), "c")?.number).toBe(1)
  })

  it("recalculates when a track is removed", () => {
    expect(getQueuePosition(list(["a", "c"]), "c")).toEqual({
      number: 2,
      colourClass: "text-blue-500",
    })
  })

  it("returns null for missing or unknown tracks", () => {
    expect(getQueuePosition(list(["a"]), null)).toBeNull()
    expect(getQueuePosition(list(["a"]), "zzz")).toBeNull()
  })

  it("cycles colours past the end of the palette", () => {
    expect(getQueueColour(QUEUE_NUMBER_COLOURS.length)).toBe(QUEUE_NUMBER_COLOURS[0])
    expect(getQueueColour(8)).toBe(QUEUE_NUMBER_COLOURS[2])
  })
})
