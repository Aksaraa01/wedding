"use client"

import { useEffect, useRef, useState } from "react"

export const PIXEL_ATMOSPHERE_CSS = `
@keyframes ppHoverCar1 {
  0% { transform: translate(-120%, 0) scale(0.9); opacity: 0; }
  10% { opacity: 0.85; }
  85% { opacity: 0.85; }
  100% { transform: translate(250%, -24px) scale(0.85); opacity: 0; }
}
@keyframes ppHoverCar2 {
  0% { transform: translate(240%, 15px) scale(0.75); opacity: 0; }
  12% { opacity: 0.75; }
  88% { opacity: 0.75; }
  100% { transform: translate(-130%, -10px) scale(0.7); opacity: 0; }
}
.pp-hovercar-1 { animation: ppHoverCar1 9.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.pp-hovercar-2 { animation: ppHoverCar2 14s cubic-bezier(0.4, 0, 0.6, 1) 3.5s infinite; }
@keyframes ppStarBlink {
  0%, 100% { opacity: 0.2; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 6px rgba(255,255,255,0.9); }
}
.pp-star-1 { animation: ppStarBlink 2.2s infinite ease-in-out; }
.pp-star-2 { animation: ppStarBlink 3.1s 1.1s infinite ease-in-out; }
.pp-star-3 { animation: ppStarBlink 2.7s 0.6s infinite ease-in-out; }
@keyframes ppCityLights {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; filter: drop-shadow(0 0 4px rgba(56,189,248,0.8)); }
}
.pp-city-lights { animation: ppCityLights 4s infinite ease-in-out; }
@keyframes ppLampWarmth {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  30% { opacity: 0.68; transform: scale(1.03); }
  70% { opacity: 0.5; transform: scale(0.98); }
}
.pp-lamp-glow { animation: ppLampWarmth 3.6s infinite ease-in-out; }
@keyframes ppFairyTwinkle {
  0%, 100% { opacity: 0.45; filter: drop-shadow(0 0 3px rgba(251,191,36,0.5)); }
  50% { opacity: 0.85; filter: drop-shadow(0 0 7px rgba(251,191,36,0.95)); }
}
.pp-fairy { animation: ppFairyTwinkle 2.5s infinite ease-in-out alternate; }
@keyframes ppNeonCyan {
  0%, 100% { opacity: 0.4; filter: blur(4px); }
  50% { opacity: 0.8; filter: blur(5px); }
  82% { opacity: 0.75; }
  84% { opacity: 0.3; }
  86% { opacity: 0.8; }
}
.pp-neon-cyan { animation: ppNeonCyan 4.5s infinite ease-in-out; }
@keyframes ppNeonPink {
  0%, 100% { opacity: 0.4; filter: blur(5px); }
  50% { opacity: 0.85; filter: blur(6px); }
  35% { opacity: 0.8; }
  36% { opacity: 0.35; }
  38% { opacity: 0.85; }
}
.pp-neon-pink { animation: ppNeonPink 3.8s infinite ease-in-out; }
@keyframes ppNote1 {
  0% { transform: translate(0, 0) scale(0.6) rotate(0deg); opacity: 0; }
  20% { opacity: 0.95; }
  80% { opacity: 0.7; }
  100% { transform: translate(-12px, -36px) scale(1) rotate(-15deg); opacity: 0; }
}
@keyframes ppNote2 {
  0% { transform: translate(0, 0) scale(0.6) rotate(0deg); opacity: 0; }
  25% { opacity: 0.95; }
  85% { opacity: 0.6; }
  100% { transform: translate(14px, -42px) scale(1.1) rotate(18deg); opacity: 0; }
}
.pp-note-1 { animation: ppNote1 3.2s infinite ease-out; }
.pp-note-2 { animation: ppNote2 3.8s 1.6s infinite ease-out; }
@keyframes ppCoupleBreathe {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-1.5px) scale(1.008); }
}
.pp-couple-breathe { animation: ppCoupleBreathe 3.4s ease-in-out infinite; transform-origin: bottom center; }
@keyframes ppHeartFloat {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  25% { opacity: 0.9; }
  80% { opacity: 0.8; }
  100% { transform: translate(8px, -28px) scale(1); opacity: 0; }
}
.pp-heart-1 { animation: ppHeartFloat 3.8s infinite ease-out; }
.pp-heart-2 { animation: ppHeartFloat 4.2s 2s infinite ease-out; }
.pp-pixelated { image-rendering: pixelated; }
@keyframes ppCatPatrol {
  0% { transform: translate(0px, 0px) scaleX(1); }
  28% { transform: translate(56px, 28px) scaleX(1); }
  33% { transform: translate(56px, 28px) scaleX(1); }
  48% { transform: translate(56px, 28px) scaleX(1); }
  51% { transform: translate(56px, 28px) scaleX(-1); }
  78% { transform: translate(0px, 0px) scaleX(-1); }
  83% { transform: translate(0px, 0px) scaleX(-1); }
  96% { transform: translate(0px, 0px) scaleX(-1); }
  100% { transform: translate(0px, 0px) scaleX(1); }
}
@keyframes ppCatStepF {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(14deg); }
}
@keyframes ppCatStepB {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(-14deg); }
}
@keyframes ppCatTail {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(18deg); }
}
@keyframes ppCatEars {
  0%, 88%, 100% { transform: rotate(0deg); }
  92% { transform: rotate(-8deg); }
  96% { transform: rotate(6deg); }
}
.pp-cat-walker { animation: ppCatPatrol 19s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95); transform-origin: center bottom; }
.pp-cat-step-f { animation: ppCatStepF 0.55s infinite ease-in-out; transform-origin: top center; }
.pp-cat-step-b { animation: ppCatStepB 0.55s infinite ease-in-out; transform-origin: top center; }
.pp-cat-tail { animation: ppCatTail 1.8s infinite ease-in-out; transform-origin: bottom left; }
.pp-cat-ears { animation: ppCatEars 3.2s infinite ease-in-out; }
.pp-cat-shadow { width: 28px; height: 10px; background: rgba(10, 15, 30, 0.65); border-radius: 50%; filter: blur(1.5px); transform: skewX(-30deg); }
@keyframes ppCatEmote {
  0%, 100% { opacity: 0; transform: translate(0, 0) scale(0.6); }
  20% { opacity: 0; }
  35% { opacity: 0.95; transform: translate(4px, -14px) scale(1); }
  48% { opacity: 0.95; transform: translate(6px, -20px) scale(1.05); }
  54% { opacity: 0; transform: translate(8px, -26px) scale(0.7); }
  84% { opacity: 0; }
  89% { opacity: 0.9; transform: translate(-2px, -12px) scale(1); }
  96% { opacity: 0.9; transform: translate(-4px, -18px) scale(1.05); }
  99% { opacity: 0; transform: translate(-6px, -22px) scale(0.6); }
}
.pp-cat-emote { animation: ppCatEmote 19s infinite ease-out; }
@keyframes ppCatPetted {
  0% { transform: scale(1); }
  30% { transform: scale(1.28) translateY(-6px); }
  60% { transform: scale(0.92) translateY(2px); }
  80% { transform: scale(1.08) translateY(-2px); }
  100% { transform: scale(1); }
}
.pp-cat-petted { animation: ppCatPetted 0.55s ease-out; }
@keyframes ppHotspotPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(56, 239, 255, 0.75), 0 0 24px rgba(56, 239, 255, 0.4), inset 0 0 10px rgba(56, 239, 255, 0.25); border-color: rgba(103, 232, 249, 0.85); }
  50% { box-shadow: 0 0 20px rgba(56, 239, 255, 1), 0 0 38px rgba(56, 239, 255, 0.65), inset 0 0 16px rgba(56, 239, 255, 0.45); border-color: rgba(255, 255, 255, 1); }
}
@keyframes ppHotspotPulsePink {
  0%, 100% { box-shadow: 0 0 12px rgba(244, 114, 182, 0.75), 0 0 24px rgba(244, 114, 182, 0.4), inset 0 0 10px rgba(244, 114, 182, 0.25); border-color: rgba(244, 114, 182, 0.85); }
  50% { box-shadow: 0 0 20px rgba(244, 114, 182, 1), 0 0 38px rgba(244, 114, 182, 0.65), inset 0 0 16px rgba(244, 114, 182, 0.45); border-color: rgba(255, 255, 255, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .pp-atmos, .pp-atmos * { animation: none !important; }
}
`

function Sparkles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const W = 390
    const H = 700
    canvas.width = W
    canvas.height = H
    const colors = ["rgba(56, 239, 255, ", "rgba(244, 114, 182, ", "rgba(251, 191, 36, ", "rgba(255, 255, 255, "]
    const parts = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() < 0.25 ? 2.5 : 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.7 + 0.2,
      speedY: -(Math.random() * 0.35 + 0.12),
      speedX: (Math.random() - 0.5) * 0.25,
      pulse: Math.random() * 0.025 + 0.01,
      angle: Math.random() * Math.PI * 2,
    }))
    let raf = 0
    const render = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.y += p.speedY
        p.x += p.speedX
        p.angle += p.pulse
        const a = Math.max(0.05, Math.min(0.85, p.alpha + Math.sin(p.angle) * 0.3))
        if (p.y < 0) {
          p.y = H + 10
          p.x = Math.random() * W
        }
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        ctx.fillStyle = p.color + a + ")"
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size)
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} />
}

function PixelCat() {
  const [petted, setPetted] = useState(false)
  const [bubble, setBubble] = useState(false)
  const pet = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPetted(true)
    setBubble(true)
    try {
      navigator.vibrate?.([40, 60, 40])
    } catch {}
    setTimeout(() => setPetted(false), 600)
    setTimeout(() => setBubble(false), 1800)
  }
  return (
<div
      className="absolute z-20"
      style={{ left: "24%", top: "76.5%", width: 54, height: 42 }}
      title="Pet the Pixel Cat! 🐱"
    >
      <div className="relative w-full h-full pp-cat-walker cursor-pointer pointer-events-auto" onClick={pet}>
        <div className="pp-cat-shadow absolute left-1 bottom-0 pointer-events-none" />
        <div
          className={`absolute -top-7 -left-3.5 z-30 pointer-events-none transition-all duration-300 transform ${
            bubble ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div className="bg-slate-900/95 border border-cyan-300 text-[9px] text-amber-200 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(56,239,255,0.7)] flex items-center gap-1 whitespace-nowrap" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            <span>Meow!</span>
            <span className="text-[8px] text-pink-400">🐾</span>
          </div>
          <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-cyan-300 transform rotate-45 ml-4 -mt-1" />
        </div>
        <div className="absolute -top-3.5 right-1 pointer-events-none pp-cat-emote z-20">
          <span className="text-[9px] font-bold text-pink-300 drop-shadow-[0_0_6px_#f472b6]">♥</span>
        </div>
        <div className={`relative w-9 h-7 pp-pixelated transition-transform ${petted ? "pp-cat-petted" : ""}`}>
          <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg">
            <g className="pp-cat-tail" style={{ transformOrigin: "5px 14px" }}>
              <rect fill="#B45309" height="3" width="3" x="0" y="10" />
              <rect fill="#D97706" height="3" width="3" x="2" y="7" />
              <rect fill="#F59E0B" height="3" width="3" x="4" y="5" />
              <rect fill="#FEF3C7" height="3" width="3" x="6" y="4" />
            </g>
            <g className="pp-cat-step-b">
              <rect fill="#B45309" height="5" width="3" x="9" y="19" />
              <rect fill="#FEF3C7" height="2" width="4" x="8" y="24" />
              <rect fill="#92400E" height="5" width="3" x="15" y="19" />
              <rect fill="#FEF3C7" height="2" width="4" x="14" y="24" />
            </g>
            <rect fill="#F59E0B" height="11" rx="1" width="18" x="8" y="10" />
            <rect fill="#FFFBEB" height="7" width="8" x="12" y="14" />
            <rect fill="#B45309" height="5" width="5" x="8" y="10" />
            <rect fill="#78350F" height="4" width="4" x="18" y="10" />
            <rect fill="#F59E0B" height="4" width="4" x="20" y="12" />
            <g className="pp-cat-step-f">
              <rect fill="#D97706" height="5" width="3" x="20" y="19" />
              <rect fill="#FFFBEB" height="2" width="4" x="20" y="24" />
              <rect fill="#F59E0B" height="5" width="3" x="24" y="19" />
              <rect fill="#FFFBEB" height="2" width="4" x="24" y="24" />
            </g>
            <g className="pp-cat-ears" style={{ transformOrigin: "27px 11px" }}>
              <polygon fill="#B45309" points="23,6 26,1 28,6" />
              <polygon fill="#F472B6" points="24,5 26,2 27,5" />
              <polygon fill="#F59E0B" points="29,6 32,1 34,6" />
              <polygon fill="#F472B6" points="30,5 32,2 33,5" />
              <rect fill="#F59E0B" height="10" rx="1" width="12" x="22" y="5" />
              <rect fill="#FFFBEB" height="5" width="8" x="25" y="10" />
              <rect fill="#F59E0B" height="4" width="2" x="21" y="8" />
              <rect fill="#F59E0B" height="4" width="2" x="33" y="8" />
              <line stroke="#FFFFFF" strokeWidth="0.8" x1="20" x2="23" y1="11" y2="10.5" />
              <line stroke="#FFFFFF" strokeWidth="0.8" x1="20" x2="23" y1="13" y2="12.5" />
              <line stroke="#FFFFFF" strokeWidth="0.8" x1="33" x2="36" y1="10.5" y2="11" />
              <line stroke="#FFFFFF" strokeWidth="0.8" x1="33" x2="36" y1="12.5" y2="13" />
              <rect fill="#10B981" height="2.5" width="2.5" x="25" y="8" />
              <rect fill="#10B981" height="2.5" width="2.5" x="29" y="8" />
              <rect fill="#064E3B" height="1" width="1" x="26" y="8" />
              <rect fill="#064E3B" height="1" width="1" x="30" y="8" />
              <rect fill="#FFFFFF" height="0.8" width="0.8" x="25.5" y="8" />
              <rect fill="#FFFFFF" height="0.8" width="0.8" x="29.5" y="8" />
              <rect fill="#F43F5E" height="1.2" width="1.5" x="28" y="11" />
              <rect fill="#06B6D4" height="1.5" width="9" x="23" y="14.5" />
              <circle cx="28" cy="16.5" fill="#FBBF24" r="1.2" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

// Living overlays, calibrated to the room art box (% coordinates). Renders
// above the art, below hotspots; pointer-events-none except the cat.
export default function PixelAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none pp-atmos" style={{ zIndex: 10 }}>
      {/* Outside window: stars, city lights, hovercars (left 0.5%, top 40.5%, w 42%, h 28%) */}
      <div className="absolute overflow-hidden" style={{ left: "0.5%", top: "40.5%", width: "42%", height: "28%", clipPath: "polygon(0% 0%, 100% 0%, 100% 86%, 0% 98%)" }}>
        <div className="absolute w-1 h-1 bg-white rounded-full pp-star-1" style={{ left: "14%", top: "12%", boxShadow: "0 0 4px #fff" }} />
        <div className="absolute w-1 h-1 bg-cyan-200 rounded-full pp-star-2" style={{ left: "38%", top: "18%", boxShadow: "0 0 3px #38bdf8" }} />
        <div className="absolute w-1 h-1 bg-pink-200 rounded-full pp-star-3" style={{ left: "72%", top: "8%", boxShadow: "0 0 4px #f472b6" }} />
        <div className="absolute w-1 h-1 bg-white rounded-full pp-star-2" style={{ left: "85%", top: "22%" }} />
        <div className="absolute w-6 h-12 bg-cyan-400/25 blur-[3px] pp-city-lights" style={{ left: "48%", top: "38%" }} />
        <div className="absolute w-5 h-8 bg-pink-500/20 blur-[2px] pp-city-lights" style={{ left: "18%", top: "46%", animationDelay: "1.5s" }} />
        <div className="absolute flex items-center pp-hovercar-1" style={{ left: "5%", top: "28%" }}>
          <div className="w-7 h-2.5 rounded-full bg-cyan-300/80 shadow-[0_0_10px_#38efff,0_0_18px_#38efff] flex items-center justify-between px-0.5">
            <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]" />
            <span className="w-1.5 h-1 rounded-sm bg-pink-400 shadow-[0_0_6px_#f43f5e]" />
          </div>
          <div className="w-6 h-0.5 bg-gradient-to-r from-transparent to-cyan-400/90 blur-[0.5px] -ml-1" />
        </div>
        <div className="absolute flex items-center flex-row-reverse pp-hovercar-2" style={{ left: "12%", top: "54%" }}>
          <div className="w-6 h-2 rounded-full bg-pink-400/80 shadow-[0_0_10px_#f472b6,0_0_16px_#ec4899] flex items-center justify-between px-0.5">
            <span className="w-1 h-1 rounded-full bg-amber-200 shadow-[0_0_4px_#fef08a]" />
            <span className="w-1.5 h-0.5 rounded-sm bg-cyan-300 shadow-[0_0_5px_#38bdf8]" />
          </div>
          <div className="w-5 h-0.5 bg-gradient-to-l from-transparent to-pink-500/80 blur-[0.5px] -mr-1" />
        </div>
      </div>
      {/* Lamp glow + fairy lights */}
      <div className="absolute rounded-full bg-amber-400/25 blur-md pp-lamp-glow" style={{ left: "46%", top: "51.5%", width: 34, height: 34 }} />
      <div className="absolute pp-fairy" style={{ left: "50%", top: "35%", width: "48%", height: "16%", background: "radial-gradient(ellipse at 40% 30%, rgba(251, 191, 36, 0.18) 0%, transparent 70%)" }} />
      {/* Neon breathing accents */}
      <div className="absolute rounded-full bg-pink-500/30 blur-md pp-neon-pink" style={{ left: "45%", top: "3%", width: 48, height: 48 }} />
      <div className="absolute rounded-full bg-pink-500/25 blur-md pp-neon-pink" style={{ left: "60%", top: "3%", width: 42, height: 42, animationDelay: "1.2s" }} />
      <div className="absolute rounded-full bg-cyan-400/25 blur-md pp-neon-cyan" style={{ left: "70%", top: "5%", width: 50, height: 38 }} />
      <div className="absolute rounded-xl bg-cyan-400/20 blur-md pp-neon-cyan" style={{ left: "10%", top: "12%", width: 88, height: 68, animationDelay: "0.8s" }} />
      <div className="absolute rounded-lg bg-pink-500/20 blur-md pp-neon-pink" style={{ left: "55%", top: "14%", width: 70, height: 90, animationDelay: "2s" }} />
      {/* Jukebox music notes */}
      <div className="absolute" style={{ left: "82%", top: "21%", width: 60, height: 80 }}>
        <div className="absolute text-[12px] font-bold text-cyan-300 drop-shadow-[0_0_8px_#38efff] pp-note-1" style={{ left: "15%", top: "30%" }}>♪</div>
        <div className="absolute text-[14px] font-bold text-pink-300 drop-shadow-[0_0_8px_#f472b6] pp-note-2" style={{ left: "42%", top: "36%" }}>♫</div>
        <div className="absolute w-7 h-7 rounded-full bg-cyan-400/20 blur-sm animate-pulse" style={{ left: "20%", top: "40%", animationDuration: "1.8s" }} />
      </div>
      {/* Couple breathing + hearts */}
      <div className="absolute" style={{ left: "32%", top: "55%", width: "18%", height: "15%" }}>
        <div className="w-full h-full pp-couple-breathe rounded-2xl bg-pink-400/10 blur-[2px]" />
        <div className="absolute text-[11px] text-pink-400 drop-shadow-[0_0_6px_#ec4899] pp-heart-1" style={{ left: "55%", top: "15%" }}>♥</div>
        <div className="absolute text-[9px] text-cyan-300 drop-shadow-[0_0_6px_#38bdf8] pp-heart-2" style={{ left: "25%", top: "20%" }}>♥</div>
      </div>
      <PixelCat />
      <Sparkles />
    </div>
  )
}