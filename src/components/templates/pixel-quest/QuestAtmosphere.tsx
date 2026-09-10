"use client"

export const QUEST_ATMOSPHERE_CSS = `
/* Quest card cap: at most half the device screen; the body scrolls inside. */
.pq-card { max-height: 50vh; max-height: 50dvh; }
@keyframes pqTwinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}
.pq-star-1 { animation: pqTwinkle 2.1s infinite steps(2, start); }
.pq-star-2 { animation: pqTwinkle 3.4s infinite steps(2, start) 0.8s; }
.pq-star-3 { animation: pqTwinkle 1.8s infinite steps(2, start) 1.2s; }
@keyframes pqFlyL2R {
  0% { transform: translateX(-120px); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.9; }
  100% { transform: translateX(460px); opacity: 0; }
}
@keyframes pqFlyR2L {
  0% { transform: translateX(460px) scaleX(-1); opacity: 0; }
  10% { opacity: 0.85; }
  90% { opacity: 0.85; }
  100% { transform: translateX(-120px) scaleX(-1); opacity: 0; }
}
.pq-car-1 { animation: pqFlyL2R 11s linear infinite; }
.pq-car-2 { animation: pqFlyR2L 14s linear infinite 5s; }
@keyframes pqNeonFlicker {
  0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 8px rgba(56,189,248,0.8)); }
  48% { opacity: 0.9; }
  50% { opacity: 0.35; filter: drop-shadow(0 0 2px rgba(56,189,248,0.2)); }
  52% { opacity: 0.95; filter: drop-shadow(0 0 10px rgba(56,189,248,0.9)); }
  54% { opacity: 0.6; }
  56% { opacity: 1; filter: drop-shadow(0 0 12px rgba(244,63,94,0.9)); }
  75% { opacity: 0.88; }
}
.pq-neon-flicker { animation: pqNeonFlicker 4.5s infinite steps(1, end); }
@keyframes pqParticle {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  20% { opacity: 0.9; }
  80% { opacity: 0.8; }
  100% { transform: translateY(-70px) translateX(12px); opacity: 0; }
}
.pq-particle-1 { animation: pqParticle 4s ease-out infinite; }
.pq-particle-2 { animation: pqParticle 5.5s ease-out infinite 1.8s; }
.pq-particle-3 { animation: pqParticle 3.8s ease-out infinite 2.6s; }
@keyframes pqConfetti {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(320px) rotate(360deg); opacity: 0; }
}
.pq-confetti { animation: pqConfetti 4s linear infinite; }
.pq-pixelated { image-rendering: pixelated; }
@media (prefers-reduced-motion: reduce) {
  .pq-atmos, .pq-atmos * { animation: none !important; }
}
`

// Ambient overlays above the bg frames: twinkling stars, flying cars, neon
// flicker aura, drifting particles, and celebratory confetti (steps 4-6).
export default function QuestAtmosphere({ celebrate }: { celebrate: boolean }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden pq-atmos">
      <div className="absolute top-[18px] left-[15%] w-1.5 h-1.5 bg-cyan-300 shadow-[0_0_6px_#38bdf8] pq-star-1" />
      <div className="absolute top-[32px] left-[32%] w-1 h-1 bg-pink-300 shadow-[0_0_5px_#f43f5e] pq-star-2" />
      <div className="absolute top-[22px] right-[28%] w-1.5 h-1.5 bg-amber-200 shadow-[0_0_5px_#fde047] pq-star-3" />
      <div className="absolute top-[48px] right-[16%] w-1 h-1 bg-cyan-200 shadow-[0_0_4px_#38bdf8] pq-star-1" />
      <div className="absolute top-[75px] left-[48%] w-1.5 h-1.5 bg-purple-300 shadow-[0_0_6px_#c084fc] pq-star-2" />
      <div className="absolute top-[82px] left-0 pq-car-1 flex items-center">
        <div className="h-1.5 w-6 bg-cyan-400 rounded-sm shadow-[0_0_8px_#38bdf8] relative">
          <span className="absolute -right-1 top-0.5 w-1.5 h-0.5 bg-pink-500 shadow-[0_0_4px_#f43f5e]" />
          <span className="absolute -left-1.5 top-0.5 w-1.5 h-0.5 bg-cyan-200 shadow-[0_0_6px_#38bdf8]" />
        </div>
      </div>
      <div className="absolute top-[96px] left-0 pq-car-2 flex items-center">
        <div className="h-1.5 w-5 bg-amber-400 rounded-sm shadow-[0_0_7px_#fbbf24] relative">
          <span className="absolute -right-1 top-0.5 w-1 h-0.5 bg-cyan-400 shadow-[0_0_4px_#38bdf8]" />
        </div>
      </div>
      <div className="absolute top-[28%] inset-x-0 h-40 pq-neon-flicker">
        <div className="mx-auto w-48 h-20 rounded-full bg-cyan-500/10 blur-2xl" />
      </div>
      <div className="absolute top-[52%] left-[22%] w-1.5 h-1.5 bg-pink-400 shadow-[0_0_6px_#f43f5e] pq-particle-1" />
      <div className="absolute top-[56%] right-[24%] w-1.5 h-1.5 bg-cyan-300 shadow-[0_0_6px_#38bdf8] pq-particle-2" />
      <div className="absolute top-[49%] left-[64%] w-1 h-1 bg-amber-300 shadow-[0_0_5px_#fde047] pq-particle-3" />
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${celebrate ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute top-10 left-[18%] w-1.5 h-2.5 bg-pink-400 pq-confetti shadow-[0_0_6px_#f43f5e]" />
        <div className="absolute top-8 left-[35%] w-2 h-2 bg-cyan-300 pq-confetti shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: "0.9s" }} />
        <div className="absolute top-12 left-[55%] w-1.5 h-2.5 bg-amber-400 pq-confetti shadow-[0_0_6px_#fbbf24]" style={{ animationDelay: "1.6s" }} />
        <div className="absolute top-6 left-[72%] w-2 h-2 bg-emerald-400 pq-confetti shadow-[0_0_6px_#34d399]" style={{ animationDelay: "0.4s" }} />
        <div className="absolute top-14 left-[86%] w-1.5 h-3 bg-purple-400 pq-confetti shadow-[0_0_6px_#c084fc]" style={{ animationDelay: "2.2s" }} />
      </div>
    </div>
  )
}