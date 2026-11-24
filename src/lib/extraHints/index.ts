import { HINTS as G1 } from "./group1"
import { HINTS as G2 } from "./group2"
import { HINTS as G3 } from "./group3"
import { HINTS as G4 } from "./group4"
import { HINTS as G5 } from "./group5"
import { HINTS as G6 } from "./group6"
import { HINTS as G7 } from "./group7"
import { HINTS as G8 } from "./group8"
import { HINTS as G9 } from "./group9"

export type HintMap = Record<string, Record<string, { id?: string; en?: string }>>

function merge(into: HintMap, from: HintMap) {
  for (const [code, fields] of Object.entries(from)) {
    into[code] = { ...(into[code] || {}) }
    for (const [key, value] of Object.entries(fields)) {
      into[code][key] = { ...(into[code][key] || {}), ...value }
    }
  }
}

const merged: HintMap = {}
for (const group of [G1, G2, G3, G4, G5, G6, G7, G8, G9]) merge(merged, group)
export const EXTRA_HINTS: HintMap = merged
