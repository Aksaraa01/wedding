"use client"

import { useState, use } from "react"
import PageTheme from "@/components/PageTheme"

export default function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [status, setStatus] = useState("")
  const [results, setResults] = useState<any[]>([])

  const runSetup = async () => {
    setStatus("Membuat bucket...")
    const res = await fetch("/api/media/setup", { method: "POST" })
    const data = await res.json()
    setStatus(data.ok ? "Bucket siap" : `Gagal: ${data.error}`)
  }

  const runMigrate = async () => {
    setStatus("Migrasi...")
    setResults([])
    const res = await fetch("/api/media/migrate", { method: "POST" })
    const data = await res.json()
    setStatus(data.ok ? `${data.migrated} file dimigrasi` : `Gagal: ${data.error}`)
    if (data.results) setResults(data.results)
  }

  return (
    <>
      <PageTheme mode="light" />
      <div className="min-h-screen bg-background px-edge-margin-mobile md:px-edge-margin-desktop py-16 max-w-container-max mx-auto">
        <h1 className="font-headline-md text-headline-md text-primary mb-8">Media Storage</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={runSetup}
            className="bg-primary text-on-primary font-label-md uppercase tracking-widest py-3 px-6 hover:bg-secondary transition-colors"
          >
            Setup Bucket
          </button>
          <button
            onClick={runMigrate}
            className="bg-surface-container-high text-primary font-label-md uppercase tracking-widest py-3 px-6 hover:bg-surface-container-hover transition-colors border border-outline-variant"
          >
            Migrate dari Google Drive
          </button>
        </div>

        {status && (
          <div className="bg-surface-container-low rounded p-4 mb-8 font-body-md">{status}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Hasil Migrasi</h2>
            {results.map((r, i) => (
              <div key={i} className="bg-surface-container-low rounded p-4 text-sm break-all">
                <p className="font-medium text-primary">{r.name}</p>
                <p className="text-on-surface-variant mt-1">Tipe: {r.type}</p>
                <p className="text-on-surface-variant">Lama: <span className="text-red-600">{r.old_url.slice(0, 60)}...</span></p>
                <p className="text-on-surface-variant">Baru: <span className="text-green-600">{r.new_url}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
