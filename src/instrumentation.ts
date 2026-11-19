export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWpSyncWorker } = await import("@/lib/wpSyncWorker")
    startWpSyncWorker()
    const { startProjectCompletionScheduler } = await import("@/lib/projectCompletion")
    startProjectCompletionScheduler()
    const { startReengageWorker } = await import("@/lib/cs/reengage")
    startReengageWorker()
  }
}