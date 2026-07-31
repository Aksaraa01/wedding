export interface GuestRecord {
  id: string
  wedding_profile_id: string
  name: string
  phone_number: string | null
  table_number: string | null
  category: string | null
  guest_count: number
  rsvp_status?: string | null
  rsvp_pax_count?: number | null
  qr_token: string | null
  is_checked_in: boolean
  checkin_timestamp: string | null
  checked_in_by: string | null
  souvenir_claimed: boolean
}

interface SyncAction {
  id?: number
  action: "checkin" | "souvenir"
  guest_id: string
  qr_token?: string
  checked_in_by?: string
  timestamp: string
}

const DB_NAME = "aksaraa-scanner"
const DB_VERSION = 1
const STORE_GUESTS = "guests"
const STORE_SYNC = "sync_queue"
const STORE_META = "meta"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_GUESTS)) {
        const store = db.createObjectStore(STORE_GUESTS, { keyPath: "id" })
        store.createIndex("qr_token", "qr_token", { unique: true })
      }
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        db.createObjectStore(STORE_SYNC, { keyPath: "id", autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function cacheGuests(guests: GuestRecord[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUESTS, "readwrite")
    const store = tx.objectStore(STORE_GUESTS)
    for (const g of guests) store.put(g)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getGuestByToken(token: string): Promise<GuestRecord | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUESTS, "readonly")
    const store = tx.objectStore(STORE_GUESTS)
    const index = store.index("qr_token")
    const req = index.get(token)
    req.onsuccess = () => { db.close(); resolve(req.result || null) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function getGuestById(id: string): Promise<GuestRecord | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUESTS, "readonly")
    const store = tx.objectStore(STORE_GUESTS)
    const req = store.get(id)
    req.onsuccess = () => { db.close(); resolve(req.result || null) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function markCheckedIn(guestId: string, qrToken: string, operatorName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_GUESTS, STORE_SYNC], "readwrite")
    const guestStore = tx.objectStore(STORE_GUESTS)
    const getReq = guestStore.get(guestId)
    getReq.onsuccess = () => {
      const guest = getReq.result
      if (guest) {
        guest.is_checked_in = true
        guest.checkin_timestamp = new Date().toISOString()
        guest.checked_in_by = operatorName
        guestStore.put(guest)
      }
    }
    const syncStore = tx.objectStore(STORE_SYNC)
    syncStore.add({
      action: "checkin",
      guest_id: guestId,
      qr_token: qrToken,
      checked_in_by: operatorName,
      timestamp: new Date().toISOString(),
    } as SyncAction)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function claimSouvenirLocal(guestId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_GUESTS, STORE_SYNC], "readwrite")
    const guestStore = tx.objectStore(STORE_GUESTS)
    const getReq = guestStore.get(guestId)
    getReq.onsuccess = () => {
      const guest = getReq.result
      if (guest) {
        guest.souvenir_claimed = true
        guestStore.put(guest)
      }
    }
    const syncStore = tx.objectStore(STORE_SYNC)
    syncStore.add({
      action: "souvenir",
      guest_id: guestId,
      timestamp: new Date().toISOString(),
    } as SyncAction)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function syncPending(profileId: string): Promise<{ synced: number; failed: number; offline?: true }> {
  const db = await openDB()
  const actions: SyncAction[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC, "readonly")
    const store = tx.objectStore(STORE_SYNC)
    const req = store.getAll()
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })

  if (actions.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const action of actions) {
    if (action.action === "checkin") {
      try {
        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_token: action.qr_token,
            checked_in_by: action.checked_in_by,
            wedding_profile_id: profileId,
          }),
        })
        if (res.ok) synced++
        else failed++
      } catch {
        return { synced, failed, offline: true }
      }
    } else if (action.action === "souvenir") {
      try {
        const res = await fetch("/api/check-in", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guest_id: action.guest_id }),
        })
        if (res.ok) synced++
        else failed++
      } catch {
        return { synced, failed, offline: true }
      }
    }
  }

  const db2 = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db2.transaction(STORE_SYNC, "readwrite")
    const store = tx.objectStore(STORE_SYNC)
    store.clear()
    tx.oncomplete = () => { db2.close(); resolve() }
    tx.onerror = () => { db2.close(); reject(tx.error) }
  })

  const db3 = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db3.transaction(STORE_META, "readwrite")
    const store = tx.objectStore(STORE_META)
    store.put({ key: "synced_at", value: new Date().toISOString() })
    tx.oncomplete = () => { db3.close(); resolve() }
    tx.onerror = () => { db3.close(); reject(tx.error) }
  })

  return { synced, failed }
}

export async function storeMeta(key: string, value: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite")
    const store = tx.objectStore(STORE_META)
    store.put({ key, value })
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly")
    const store = tx.objectStore(STORE_META)
    const req = store.get(key)
    req.onsuccess = () => { db.close(); resolve(req.result?.value ?? null) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function getPendingCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SYNC, "readonly")
    const store = tx.objectStore(STORE_SYNC)
    const req = store.count()
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}
