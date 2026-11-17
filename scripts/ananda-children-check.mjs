// Regression check for the Ceriavite ananda list.
//
// The editor derives its rows with `readChildren` (blank rows kept) while the
// templates and the API store/read with `parseChildren` (blank rows dropped).
// Mixing the two is what made "Tambah Ananda" look like a no-op: the freshly
// added empty row was filtered out of the very array the UI rendered.
//
// Run: node --experimental-strip-types scripts/ananda-children-check.mjs

import assert from "node:assert/strict"
import { MAX_CHILDREN, parseChildren, readChildren, resolveChildren } from "../src/lib/children.ts"

const blank = { name: "", full_name: "", photo_url: "", instagram: "" }
const legacy = {
  groom_name: "Raka",
  groom_full_name: "Raka Pratama",
  groom_photo_url: '["https://cdn.example/putra.webp"]',
  groom_instagram: "@raka",
}

// 1. A profile created before the column existed still resolves to one child.
assert.deepEqual(resolveChildren({ children: [], ...legacy }), [
  { name: "Raka", full_name: "Raka Pratama", photo_url: "https://cdn.example/putra.webp", instagram: "raka" },
])

// 2. "Tambah Ananda" must survive the next render: the base list comes from the
//    editor's reader, not the storage reader.
const added = [...readChildren([]).length ? readChildren([]) : resolveChildren({ children: [], ...legacy }), blank]
assert.equal(added.length, 2, "add appends to the legacy single child")
assert.equal(readChildren(added).length, 2, "the editor keeps the blank row on screen")
assert.equal(parseChildren(added).length, 1, "storage/render still drops the blank row")

// 2b. The editor's own derivation, after a click. This is the exact shape that
//     made the button a no-op when it read through `parseChildren`.
function editorRows(data) {
  const stored = readChildren(data.children)
  return stored.length > 0 ? stored : resolveChildren(data)
}
assert.equal(editorRows({ children: [], ...legacy }).length, 1)
assert.equal(editorRows({ ...legacy, children: [...resolveChildren({ children: [], ...legacy }), blank] }).length, 2)

// 3. Once the couple types, the row is stored for real.
const typed = added.map((c, i) => (i === 1 ? { ...c, name: "Rizky", full_name: "Rizky Pratama" } : c))
assert.equal(parseChildren(typed).length, 2)
assert.deepEqual(parseChildren(typed)[1], { name: "Rizky", full_name: "Rizky Pratama", photo_url: "", instagram: "" })

// 3b. The API stores the submitted list verbatim (blank rows included) and the
//     GET returns it the same way, so the editor's focus refetch cannot delete
//     an ananda that was added but not filled yet.
const stored = readChildren(typed)
assert.equal(stored.length, 2)
assert.equal(readChildren(JSON.parse(JSON.stringify(stored))).length, 2, "round-trips through the API")

// 4. A blank list never renders an empty frame — it falls back to groom_*.
assert.equal(resolveChildren({ children: [blank], ...legacy }).length, 1)
assert.equal(resolveChildren({ children: [blank], ...legacy })[0].name, "Raka")

// 5. The cap holds for both readers.
const many = Array.from({ length: MAX_CHILDREN + 3 }, (_, i) => ({ ...blank, name: `Anak ${i}` }))
assert.equal(readChildren(many).length, MAX_CHILDREN)
assert.equal(parseChildren(many).length, MAX_CHILDREN)

// 6. Both readers normalise the stored shapes (json string, @-prefixed handle).
const fromJson = readChildren(JSON.stringify([{ name: "Raka", instagram: "@raka" }]))
assert.equal(fromJson.length, 1)
assert.equal(fromJson[0].instagram, "raka")

console.log("ananda children: all checks passed")
