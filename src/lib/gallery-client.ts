// Client-safe gallery helpers (no server imports).

export const GALLERY_DEVICE_KEY = "aksaraa_gt_device"

// Fallback when crypto.randomUUID is unavailable (non-secure contexts
// like http LAN URLs): UUIDv4-shaped hex so it always passes the
// /^[0-9a-f-]{8,64}$/ device validation here and server-side. The old
// `dev-...` base36 fallback contained g-z and NEVER validated, minting a
// fresh device (fresh quota) on every identitas submit.
function fallbackDeviceId(): string {
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  return `00000000-0000-4000-8000-${hex(12)}`
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(GALLERY_DEVICE_KEY)
    if (existing && /^[0-9a-f-]{8,64}$/i.test(existing)) return existing
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackDeviceId()
    localStorage.setItem(GALLERY_DEVICE_KEY, fresh)
    return fresh
  } catch {
    return fallbackDeviceId()
  }
}

export function newCaptureId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  } catch {}
  return `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export type GalleryIdentity = { name: string; category: string; device_id: string }

export function identityKey(token: string): string {
  return `aksaraa_gt_identity_${token}`
}

// Identity lives in localStorage (shared across tabs) with sessionStorage
// as a same-tab fast path. sessionStorage-only lost the identity on every
// link reopen/new tab, forcing reinput even in the same browser. The home
// page's "Bukan {nama}?" escape covers shared devices.
function parseIdentity(raw: string | null): GalleryIdentity | null {
  try {
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GalleryIdentity>
    if (!parsed.name || !parsed.category || !parsed.device_id) return null
    return parsed as GalleryIdentity
  } catch {
    return null
  }
}

export function loadIdentity(token: string): GalleryIdentity | null {
  const key = identityKey(token)
  try {
    const fromSession = parseIdentity(sessionStorage.getItem(key))
    if (fromSession) return fromSession
  } catch {}
  try {
    return parseIdentity(localStorage.getItem(key))
  } catch {
    return null
  }
}

export function saveIdentity(token: string, identity: GalleryIdentity): void {
  const raw = JSON.stringify(identity)
  try {
    sessionStorage.setItem(identityKey(token), raw)
  } catch {}
  try {
    localStorage.setItem(identityKey(token), raw)
  } catch {}
}

// Share a photo + caption via the OS share sheet. Returns "shared" when the
// native sheet handled it, "unsupported" when the caller should fall back to
// download + copy-caption.
export async function sharePhoto(args: { file: File; title: string; text: string }): Promise<"shared" | "unsupported"> {
  try {
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean }
    if (typeof nav.share !== "function") return "unsupported"
    if (typeof nav.canShare === "function" && !nav.canShare({ files: [args.file] })) {
      return "unsupported"
    }
    await nav.share({ files: [args.file], title: args.title, text: args.text })
    return "shared"
  } catch (err) {
    // AbortError = user dismissed the sheet; treat as handled, not fallback.
    if (err instanceof DOMException && err.name === "AbortError") return "shared"
    return "unsupported"
  }
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}

export async function downloadUrl(url: string, filename: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  await downloadBlob(blob, filename)
}

// Flexible-link rows are provisioned with category "Fleksibel" so RSVP,
// wishes, and check-in have a guest row to attach to — but it is not a real
// category. Display layers treat it (any case, trimmed) as no category;
// ops keeps the raw DB value for forensics.
export function displayCategory(value: unknown): string | null {
  const s = String(value ?? "").trim()
  if (!s || s.toLowerCase() === "fleksibel") return null
  return s
}
