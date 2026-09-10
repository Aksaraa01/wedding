"use client"

import { useRef, useState } from "react"

export const QUEST_CAT_CSS = `
@keyframes pqCatBreathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes pqCatTail {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(18deg); }
}
@keyframes pqCatEars {
  0%, 90%, 100% { transform: scale(1); }
  95% { transform: translateY(-2px) scale(1.1); }
}
@keyframes pqCatEyes {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}
@keyframes pqCatHeart {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  50% { opacity: 1; transform: translateY(-16px) scale(1.1); }
  100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
}
.pq-cat-breathe { animation: pqCatBreathe 2s infinite ease-in-out; }
.pq-cat-tail { transform-origin: bottom left; animation: pqCatTail 1.8s infinite ease-in-out; }
.pq-cat-ears { animation: pqCatEars 3.5s infinite ease; }
.pq-cat-eyes { transform-origin: center; animation: pqCatEyes 4s infinite ease; }
.pq-cat-heart { animation: pqCatHeart 2.6s infinite ease-out; }
@keyframes pqCatJump {
  0% { transform: translateY(0) rotate(0deg) scale(1); }
  30% { transform: translateY(-22px) rotate(-15deg) scale(1.15); }
  60% { transform: translateY(-26px) rotate(15deg) scale(1.2); }
  85% { transform: translateY(-6px) rotate(0deg) scale(1.05); }
  100% { transform: translateY(0) rotate(0deg) scale(1); }
}
.pq-cat-jumping { animation: pqCatJump 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important; }
`

function playRetroMeow() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx: AudioContext = new AC()
    if (ctx.state === "suspended") void ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
    osc.frequency.exponentialRampToValueAtTime(659, now + 0.28)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch {}
}

// Orange tabby companion. Positioned per quest step by the parent; tap for a
// jump-spin + "MEOW!" bubble + 8-bit meow (WebAudio, no assets).
export default function QuestCat({ top, left, flip }: { top: string; left: string; flip: boolean }) {
  const [jumping, setJumping] = useState(false)
  const [bubble, setBubble] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pet = (e: React.MouseEvent) => {
    e.stopPropagation()
    playRetroMeow()
    setJumping(true)
    setBubble(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setJumping(false)
      setBubble(false)
    }, 1600)
  }

  return (
    <div
      className="absolute z-20 cursor-pointer select-none transition-all duration-700 ease-in-out group"
      style={{ top, left }}
      onClick={pet}
    >
      <div
        className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/90 border border-pink-400 text-pink-300 text-[7px] tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.6)] whitespace-nowrap transition-all duration-300 ${
          bubble ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        }`}
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        MEOW! ♥
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-950 border-r border-b border-pink-400 rotate-45" />
      </div>
      <div className="absolute -top-5 right-0 text-[10px] text-pink-400 pq-cat-heart select-none pointer-events-none">♥</div>
      <div className={`relative w-10 h-10 pq-cat-breathe filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${jumping ? "pq-cat-jumping" : ""}`} style={{ transform: flip ? "scaleX(-1)" : undefined }}>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] text-cyan-300/80 tracking-tighter opacity-0 group-hover:opacity-100 transition whitespace-nowrap" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          TAP ME
        </div>
        <svg className="w-full h-full pq-pixelated" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="22" fill="#000" opacity="0.45" rx="7" ry="1.8" />
          <g className="pq-cat-tail" style={{ transformOrigin: "6px 18px" }}>
            <rect fill="#ea580c" height="3" width="3" x="3" y="14" />
            <rect fill="#f97316" height="4" width="3" x="2" y="11" />
            <rect fill="#fed7aa" height="4" width="3" x="3" y="8" />
          </g>
          <rect fill="#f97316" height="7" rx="2" width="12" x="6" y="13" />
          <rect fill="#ea580c" height="2" width="10" x="7" y="12" />
          <rect fill="#c2410c" height="4" width="2" x="9" y="14" />
          <rect fill="#c2410c" height="4" width="2" x="13" y="14" />
          <rect fill="#fff7ed" height="4" width="4" x="14" y="15" />
          <rect fill="#ffedd5" height="2" width="3" x="7" y="19" />
          <rect fill="#ffedd5" height="2" width="3" x="15" y="19" />
          <rect fill="#fb923c" height="7" rx="2" width="9" x="11" y="7" />
          <rect fill="#c2410c" height="2" width="3" x="14" y="7" />
          <g className="pq-cat-ears">
            <polygon fill="#f97316" points="11,7 13,3 14,7" />
            <polygon fill="#f43f5e" points="12,6.5 13,4 13.5,6.5" />
          </g>
          <g className="pq-cat-ears">
            <polygon fill="#f97316" points="17,7 19,3 20,7" />
            <polygon fill="#f43f5e" points="17.5,6.5 19,4 19.5,6.5" />
          </g>
          <g className="pq-cat-eyes">
            <rect fill="#047857" height="2" width="2" x="14" y="9" />
            <rect fill="#047857" height="2" width="2" x="18" y="9" />
            <rect fill="#ecfdf5" height="1" width="1" x="15" y="9" />
            <rect fill="#ecfdf5" height="1" width="1" x="19" y="9" />
          </g>
          <polygon fill="#f43f5e" points="16.5,12 17.5,12 17,12.7" />
          <line stroke="#fed7aa" strokeWidth="0.8" x1="12" x2="10" y1="12" y2="11.5" />
          <line stroke="#fed7aa" strokeWidth="0.8" x1="12" x2="10" y1="13" y2="13.5" />
          <line stroke="#fed7aa" strokeWidth="0.8" x1="20" x2="22" y1="12" y2="11.5" />
          <line stroke="#fed7aa" strokeWidth="0.8" x1="20" x2="22" y1="13" y2="13.5" />
          <rect fill="#dc2626" height="1.2" width="7" x="12" y="14" />
          <circle cx="15.5" cy="15.5" fill="#fbbf24" r="1" />
        </svg>
      </div>
    </div>
  )
}