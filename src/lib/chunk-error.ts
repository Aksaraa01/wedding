const RELOAD_KEY = "aksaraa:chunk-reload-at"
const RELOAD_COOLDOWN_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false
  const candidate = error as { name?: string; message?: string }
  const message = typeof candidate.message === "string" ? candidate.message : ""
  return (
    candidate.name === "ChunkLoadError" ||
    /Loading chunk \S+ failed/i.test(message) ||
    /Failed to load chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  )
}

export function isNextStaticAsset(url: string | null | undefined): boolean {
  return typeof url === "string" && /\/_next\/static\//.test(url)
}

export function reloadForChunkError(): boolean {
  if (typeof window === "undefined") return false
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? "0")
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage unavailable (private mode): still reload, risk of a loop is low.
  }
  window.location.reload()
  return true
}
