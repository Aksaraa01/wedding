export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWpSyncWorker } = await import("@/lib/wpSyncWorker")
    // Reclaims jobs left in `processing` by the previous process before the
    // deploy reload, then starts polling. A failure here must not take the app
    // down: the worker is not on any request path.
    startWpSyncWorker().catch((err) => console.error("[wpSync] start failed", err))
    const { startProjectCompletionScheduler } = await import("@/lib/projectCompletion")
    startProjectCompletionScheduler()
    const { startReengageWorker } = await import("@/lib/cs/reengage")
    startReengageWorker()
  }
}