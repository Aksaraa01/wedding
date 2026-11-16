// Asserts the event-family rules that a string comparison gets wrong.
//
// Written after two production bugs: `eventFamily("kids")` returned "wedding"
// (templates store the family, profiles store the rite), which emptied the
// template picker, and a shared MSG_VARS list was edited for one product.
//
// Run: node --experimental-strip-types scripts/event-family-check.mjs
import assert from "node:assert/strict"
import { eventFamily, eventLabels, isKidsEvent, normalizeEventType } from "../src/lib/eventType.ts"

let passed = 0
const check = (name, fn) => {
  fn()
  passed++
  console.log("  ok", name)
}

// --- families accept BOTH the rite and the stored family value
check('eventFamily("kids") is kids', () => assert.equal(eventFamily("kids"), "kids"))
check('eventFamily("khitanan") is kids', () => assert.equal(eventFamily("khitanan"), "kids"))
check('eventFamily("aqiqah") is kids', () => assert.equal(eventFamily("aqiqah"), "kids"))
check('eventFamily("birthday") is kids', () => assert.equal(eventFamily("birthday"), "kids"))
check('eventFamily("wedding") is wedding', () => assert.equal(eventFamily("wedding"), "wedding"))
check("eventFamily(undefined) is wedding", () => assert.equal(eventFamily(undefined), "wedding"))
check('isKidsEvent("kids") is true', () => assert.equal(isKidsEvent("kids"), true))
check('normalizeEventType("kids") is wedding (rites only)', () =>
  assert.equal(normalizeEventType("kids"), "wedding"))


// profileView() is exercised by tsc + the ops/editor UI checks. Its assertions
// belong in a Vitest suite (it imports @/lib/*, which node cannot resolve):
//   kids: subject=child, partner="", signOff=parents, no hashtag/initials/
//   secondPerson/packageButton/guestGallery, messageCategory="khitanan"
//   wedding: displayName="A & B", all chrome on, messageCategory=null
//   gates beat toggles in both directions

console.log(`\n${passed} assertions passed`)
