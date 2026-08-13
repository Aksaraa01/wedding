export type FieldMapping = {
  elementId: string
  settings: string[]
}

export type SessionSlot = {
  name?: FieldMapping
  date?: FieldMapping
  time?: FieldMapping
  timezone?: FieldMapping
  venue?: FieldMapping
  address?: FieldMapping
  maps_url?: FieldMapping
}

export type GiftSlot = {
  provider_name?: FieldMapping
  account_number?: FieldMapping
  account_name?: FieldMapping
}

export type StorySlot = {
  title?: FieldMapping
  description?: FieldMapping
  image_url?: FieldMapping
}

// Array fields whose items are objects (each item has sub-fields).
export const OBJECT_ARRAY_FIELDS: Record<string, string[]> = {
  sessions: ["name", "date", "time", "timezone", "venue", "address", "maps_url"],
  gift_accounts: ["provider_name", "account_number", "account_name"],
  stories: ["title", "description", "image_url"],
}

// Array fields whose items are flat values (string) mapped to one element each.
export const SIMPLE_ARRAY_FIELDS = ["inviting_families", "cover_photos"]

// Bahasa labels for object-array sub-fields (used by the mapping UI).
export const SUBFIELD_LABELS: Record<string, string> = {
  name: "Nama",
  date: "Tanggal",
  time: "Jam",
  timezone: "Zona Waktu",
  venue: "Venue",
  address: "Alamat",
  maps_url: "Link Maps",
  provider_name: "Nama Bank",
  account_number: "Nomor Rekening",
  account_name: "Atas Nama",
  title: "Judul",
  description: "Deskripsi",
  image_url: "Gambar",
}
