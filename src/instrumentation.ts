export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWpSyncWorker } = await import("@/lib/wpSyncWorker")
    startWpSyncWorker()
  }
}