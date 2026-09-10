"use client"

// Frame-specific pixel people cameos (decorative, cross-fade with backgrounds).
// 1: strolling couple + waving fan · 2: cheering spectator + bench reader ·
// 3: usher + arriving guest · 4: photographer + cheering guests.
export function CameoFrame1({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 15 }}>
      <div className="absolute bottom-[36%] left-[12%] flex items-end gap-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ animation: "pqCameoWalk 1.2s infinite ease-in-out" }}>
        <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#60a5fa" height="4" width="4" x="4" y="1" />
          <rect fill="#fed7aa" height="4" width="6" x="3" y="3" />
          <rect fill="#1e293b" height="1" width="1" x="7" y="4" />
          <rect fill="#0284c7" height="6" width="6" x="3" y="7" />
          <rect fill="#0369a1" height="4" width="2" x="1" y="8" />
          <rect fill="#0369a1" height="4" width="2" x="9" y="8" />
          <rect fill="#1e293b" height="6" width="2" x="4" y="13" />
          <rect fill="#334155" height="6" width="2" x="7" y="13" />
        </svg>
        <svg className="w-6 h-10 pq-pixelated -ml-1.5" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#a855f7" height="4" width="5" x="4" y="2" />
          <rect fill="#fed7aa" height="4" width="5" x="3" y="4" />
          <rect fill="#1e293b" height="1" width="1" x="4" y="5" />
          <rect fill="#f472b6" height="5" width="6" x="3" y="8" />
          <rect fill="#ec4899" height="3" width="8" x="2" y="13" />
          <rect fill="#fed7aa" height="3" width="1.5" x="4" y="16" />
          <rect fill="#fed7aa" height="3" width="1.5" x="7" y="16" />
        </svg>
      </div>
      <div className="absolute top-[39%] right-[14%] flex flex-col items-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
        <div className="w-2 h-3 bg-cyan-300 rounded-[1px] shadow-[0_0_8px_#38efff] mb-0.5 animate-pulse" />
        <div style={{ animation: "pqCameoWave 1.5s infinite ease-in-out", transformOrigin: "bottom center" }}>
          <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#f97316" height="4" width="6" x="3" y="1" />
            <rect fill="#fed7aa" height="4" width="5" x="4" y="4" />
            <rect fill="#0f172a" height="1" width="1" x="5" y="5" />
            <rect fill="#10b981" height="6" width="6" x="3" y="8" />
            <rect fill="#059669" height="4" width="2" x="1" y="7" />
            <rect fill="#1e293b" height="5" width="2" x="4" y="14" />
            <rect fill="#1e293b" height="5" width="2" x="7" y="14" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export function CameoFrame2({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 15 }}>
      <div className="absolute top-[41%] right-[25%] flex flex-col items-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
        <div className="px-1 py-0.5 rounded bg-slate-950/90 border border-cyan-400 text-cyan-300 text-[6px] tracking-wider mb-0.5 shadow-[0_0_6px_#38bdf8]" style={{ fontFamily: "'Press Start 2P', monospace", animation: "pqCameoPop 3s infinite ease-in-out" }}>
          GG!
        </div>
        <div style={{ animation: "pqCameoCheer 1.1s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#eab308" height="4" width="5" x="4" y="1" />
            <rect fill="#fed7aa" height="4" width="6" x="3" y="4" />
            <rect fill="#020617" height="1" width="1" x="7" y="5" />
            <rect fill="#8b5cf6" height="5" width="6" x="3" y="8" />
            <rect fill="#a78bfa" height="4" width="2" x="1" y="6" />
            <rect fill="#a78bfa" height="4" width="2" x="9" y="6" />
            <rect fill="#0f172a" height="5" width="2" x="4" y="13" />
            <rect fill="#0f172a" height="5" width="2" x="7" y="13" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[35%] left-[17%] flex flex-col items-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
        <span className="text-[8px] text-pink-400 animate-pulse">♪</span>
        <svg className="w-7 h-9 pq-pixelated" fill="none" viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#475569" height="4" width="6" x="4" y="1" />
          <rect fill="#fed7aa" height="4" width="5" x="4" y="4" />
          <rect fill="#020617" height="1" width="1" x="5" y="5" />
          <rect fill="#f43f5e" height="5" width="7" x="3" y="8" />
          <rect fill="#fff" height="2" width="2" x="10" y="8" />
          <rect fill="#1e293b" height="3" width="6" x="4" y="13" />
        </svg>
      </div>
    </div>
  )
}

export function CameoFrame3({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 15 }}>
      <div className="absolute top-[42%] left-[16%] flex flex-col items-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        <div className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-400 text-amber-300 text-[6px] tracking-wider mb-0.5 shadow-[0_0_6px_rgba(251,191,36,0.5)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          WELCOME!
        </div>
        <div style={{ animation: "pqCameoWave 1.5s infinite ease-in-out", transformOrigin: "bottom center" }}>
          <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#0f172a" height="4" width="4" x="4" y="1" />
            <rect fill="#fed7aa" height="4" width="6" x="3" y="4" />
            <rect fill="#020617" height="1" width="1" x="5" y="5" />
            <rect fill="#090e1c" height="6" width="6" x="3" y="8" />
            <rect fill="#f59e0b" height="2" width="2" x="5" y="9" />
            <rect fill="#fed7aa" height="5" width="2" x="9" y="6" />
            <rect fill="#090e1c" height="5" width="2" x="4" y="14" />
            <rect fill="#090e1c" height="5" width="2" x="7" y="14" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[35%] right-[16%] flex items-end filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" style={{ animation: "pqCameoWalk 1.2s infinite ease-in-out" }}>
        <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#b45309" height="4" width="6" x="3" y="2" />
          <rect fill="#fed7aa" height="4" width="5" x="3" y="5" />
          <rect fill="#020617" height="1" width="1" x="4" y="6" />
          <rect fill="#06b6d4" height="5" width="6" x="3" y="9" />
          <rect fill="#0891b2" height="3" width="7" x="2" y="14" />
          <rect fill="#fed7aa" height="2" width="1.5" x="4" y="17" />
          <rect fill="#fed7aa" height="2" width="1.5" x="7" y="17" />
        </svg>
      </div>
    </div>
  )
}

export function CameoFrame4({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 15 }}>
      <div className="absolute top-[43%] left-[15%] flex flex-col items-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
        <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_#fff,0_0_25px_#38bdf8] -mb-1.5 z-20" style={{ animation: "pqCameoFlash 2.8s infinite steps(1, start)" }} />
        <svg className="w-7 h-10 pq-pixelated" fill="none" viewBox="0 0 14 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#334155" height="4" width="5" x="4" y="1" />
          <rect fill="#fed7aa" height="4" width="5" x="4" y="4" />
          <rect fill="#020617" height="1" width="1" x="7" y="5" />
          <rect fill="#0f172a" height="3" width="6" x="3" y="7" />
          <rect fill="#38bdf8" height="2" width="2" x="9" y="8" />
          <rect fill="#3b82f6" height="5" width="7" x="3" y="10" />
          <rect fill="#1e293b" height="4" width="2" x="4" y="15" />
          <rect fill="#1e293b" height="4" width="2" x="7" y="15" />
        </svg>
      </div>
      <div className="absolute top-[41%] right-[23%] flex flex-col items-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
        <div style={{ animation: "pqCameoCheer 1.1s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#be185d" height="4" width="6" x="3" y="2" />
            <rect fill="#fed7aa" height="4" width="5" x="4" y="4" />
            <rect fill="#020617" height="1" width="1" x="5" y="5" />
            <rect fill="#f43f5e" height="6" width="6" x="3" y="8" />
            <rect fill="#fed7aa" height="4" width="2" x="1" y="6" />
            <rect fill="#fed7aa" height="4" width="2" x="9" y="6" />
            <rect fill="#fb7185" height="5" width="2" x="4" y="14" />
            <rect fill="#fb7185" height="5" width="2" x="7" y="14" />
          </svg>
        </div>
      </div>
      <div className="absolute top-[44%] right-[11%] flex flex-col items-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
        <div style={{ animation: "pqCameoCheer 1.3s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.35s" }}>
          <svg className="w-6 h-10 pq-pixelated" fill="none" viewBox="0 0 12 20" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#374151" height="4" width="5" x="3" y="1" />
            <rect fill="#fed7aa" height="4" width="6" x="3" y="4" />
            <rect fill="#020617" height="1" width="1" x="4" y="5" />
            <rect fill="#eab308" height="5" width="6" x="3" y="8" />
            <rect fill="#ca8a04" height="4" width="2" x="1" y="6" />
            <rect fill="#ca8a04" height="4" width="2" x="9" y="6" />
            <rect fill="#111827" height="6" width="2" x="4" y="13" />
            <rect fill="#111827" height="6" width="2" x="7" y="13" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export const CAMEO_CSS = `
@keyframes pqCameoWalk { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes pqCameoWave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-18deg); } 75% { transform: rotate(18deg); } }
@keyframes pqCameoCheer { 0%, 100% { transform: translateY(0) scale(1); } 35% { transform: translateY(-6px) scale(1.06); } 60% { transform: translateY(-2px) scale(1.02); } }
@keyframes pqCameoFlash { 0%, 82%, 100% { opacity: 0; transform: scale(0.6); } 85% { opacity: 1; transform: scale(1.4); } 92% { opacity: 0.3; transform: scale(1); } }
@keyframes pqCameoPop { 0%, 100% { transform: translateY(0) scale(0.85); opacity: 0; } 20%, 75% { transform: translateY(-5px) scale(1); opacity: 1; } 85% { transform: translateY(-10px) scale(0.9); opacity: 0; } }
`
