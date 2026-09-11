"use client"

export const IM_ATMOSPHERE_CSS = `
@keyframes imFlyA {
  0% { transform: translate(-100px, 30px) scale(0.95); opacity: 0; }
  10% { opacity: 0.95; }
  90% { opacity: 0.95; }
  100% { transform: translate(460px, -45px) scale(1.1); opacity: 0; }
}
@keyframes imFlyB {
  0% { transform: translate(-100px, 70px) scale(0.85); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.9; }
  100% { transform: translate(460px, -20px) scale(1); opacity: 0; }
}
@keyframes imFlyC {
  0% { transform: translate(-100px, -10px) scale(1.05); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(450px, -90px) scale(1.15); opacity: 0; }
}
@keyframes imFlapL {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(0.4) rotate(-18deg); }
}
@keyframes imFlapR {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(0.4) rotate(18deg); }
}
.im-dove-1 { animation: imFlyA 12s linear infinite; animation-delay: -3s; will-change: transform; }
.im-dove-2 { animation: imFlyB 15s linear infinite; animation-delay: -8s; will-change: transform; }
.im-dove-3 { animation: imFlyC 10s linear infinite; animation-delay: -6s; will-change: transform; }
.im-wing-l { transform-origin: 17px 12px; animation: imFlapL 0.38s ease-in-out infinite; }
.im-wing-r { transform-origin: 17px 12px; animation: imFlapR 0.38s ease-in-out infinite; }
@keyframes imMote {
  0%, 100% { opacity: 0.2; transform: translateY(0) scale(0.8); }
  50% { opacity: 0.85; transform: translateY(-16px) scale(1.15); }
}
.im-mote-1 { animation: imMote 4.5s ease-in-out infinite; }
.im-mote-2 { animation: imMote 6s ease-in-out 1.5s infinite; }
.im-mote-3 { animation: imMote 5.2s ease-in-out 3s infinite; }
@keyframes imDrift {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  20% { opacity: 0.85; }
  80% { opacity: 0.75; }
  100% { transform: translate(50px, -180px) rotate(240deg); opacity: 0; }
}
.im-drift-1 { animation: imDrift 9s ease-in-out infinite; }
.im-drift-2 { animation: imDrift 11s ease-in-out 3s infinite; }
.im-drift-3 { animation: imDrift 10.5s ease-in-out 6s infinite; }
@keyframes imFall {
  0% { transform: translateY(-10%) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.85; }
  100% { transform: translateY(110vh) rotate(200deg); opacity: 0; }
}
.im-fall-1 { animation: imFall 12s linear infinite; }
.im-fall-2 { animation: imFall 14s linear infinite 4s; }
.im-fall-3 { animation: imFall 11s linear infinite 8s; }
@keyframes imSparkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.25); filter: drop-shadow(0 0 4px #f2ca50); }
}
.im-sparkle-1 { animation: imSparkle 3s ease-in-out 0.5s infinite; }
.im-sparkle-2 { animation: imSparkle 3.6s ease-in-out 2s infinite; }
@keyframes imSwayL {
  0%, 100% { transform: rotate(0deg) skewX(0deg); }
  50% { transform: rotate(2.8deg) skewX(1.5deg); }
}
@keyframes imSwayR {
  0%, 100% { transform: rotate(0deg) skewX(0deg); }
  50% { transform: rotate(-3.2deg) skewX(-1.8deg); }
}
.im-sway-l { transform-origin: bottom left; animation: imSwayL 6.5s ease-in-out infinite; }
.im-sway-r { transform-origin: bottom right; animation: imSwayR 7.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .im-atmos, .im-atmos * { animation: none !important; }
}
`

function Dove({ className, top, size }: { className: string; top: string; size: number }) {
  return (
    <div className={`absolute left-0 pointer-events-none ${className}`} style={{ top }}>
      <svg width={size} height={size * 0.75} viewBox="0 0 34 26" fill="none">
        <path className="im-wing-l" d="M17 12 C13 6, 6 2, 1 5 C5 9, 12 12, 17 13 Z" fill="rgba(255,255,255,0.92)" />
        <path className="im-wing-r" d="M17 12 C21 6, 28 2, 33 5 C29 9, 22 12, 17 13 Z" fill="rgba(248,245,238,0.85)" />
        <path d="M15 11 C16 9, 18 9, 19 11 C18 16, 17 23, 17 25 C17 23, 16 16, 15 11 Z" fill="rgba(255,255,255,0.96)" />
        <circle cx="17" cy="8.5" r="2" fill="rgba(255,255,255,0.98)" />
      </svg>
    </div>
  )
}

// Ambient life above the shared mosque backdrop: gliding doves, gold sun
// motes, drifting + falling petals, sparkles. Pure CSS, pointer-transparent.
export default function ImpastoAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden im-atmos" style={{ zIndex: 5 }}>
      <Dove className="im-dove-1" top="12%" size={34} />
      <Dove className="im-dove-2" top="22%" size={28} />
      <Dove className="im-dove-3" top="6%" size={38} />
      <span className="absolute w-2 h-2 rounded-full bg-amber-200/70 blur-[0.8px] im-mote-1" style={{ top: "30%", left: "18%" }} />
      <span className="absolute w-2.5 h-2.5 rounded-full bg-yellow-100/80 blur-[1px] im-mote-2" style={{ top: "38%", right: "22%" }} />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60 blur-[0.5px] im-mote-3" style={{ top: "55%", left: "30%" }} />
      <span className="absolute w-3 h-2.5 rounded-full bg-[#f4b8c6] im-drift-1" style={{ bottom: "12%", left: "16%" }} />
      <span className="absolute w-3.5 h-3 rounded-full bg-[#faedd4] im-drift-2" style={{ bottom: "9%", right: "20%" }} />
      <span className="absolute w-2.5 h-2 rounded-full bg-[#e89db1] im-drift-3" style={{ bottom: "16%", left: "38%" }} />
      <span className="absolute w-2.5 h-3 rounded-full bg-[#FFF9F0] im-fall-1" style={{ top: "-4%", left: "12%" }} />
      <span className="absolute w-2 h-2.5 rounded-full bg-[#F7E7DC] im-fall-2" style={{ top: "-4%", left: "64%" }} />
      <span className="absolute w-2 h-2.5 rounded-full bg-[#FFE8B8] im-fall-3" style={{ top: "-4%", left: "85%" }} />
      <svg className="absolute im-sparkle-1" style={{ bottom: "28%", left: "8%" }} fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#ffe088" />
      </svg>
      <svg className="absolute im-sparkle-2" style={{ bottom: "36%", right: "10%" }} fill="none" height="14" viewBox="0 0 24 24" width="14">
        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#f2ca50" />
      </svg>
    </div>
  )
}

// Swaying foreground flower clusters for the cover (simplified from design).
export function ImpastoFlowers() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <div className="im-sway-l absolute -bottom-2 -left-3 w-36 h-36 opacity-75">
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" viewBox="0 0 120 120">
          <path d="M10 120 Q30 70 65 50" stroke="#374f34" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M65 50 C70 45, 80 48, 78 58 C72 65, 60 62, 65 50 Z" fill="#e8a8b8" />
          <circle cx="68" cy="54" fill="#f8d778" r="3.5" />
          <path d="M20 120 Q40 85 85 75" stroke="#2a3f28" strokeLinecap="round" strokeWidth="3" />
          <path d="M85 75 C92 70, 100 76, 96 84 C90 90, 80 84, 85 75 Z" fill="#f5ede0" />
          <circle cx="89" cy="78" fill="#e8ba4c" r="3" />
        </svg>
      </div>
      <div className="im-sway-r absolute -bottom-2 -right-4 w-40 h-40 opacity-75">
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" viewBox="0 0 120 120">
          <path d="M110 120 Q85 65 45 45" stroke="#31482f" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M45 45 C38 38, 28 44, 32 54 C38 62, 50 56, 45 45 Z" fill="#e2899e" />
          <circle cx="39" cy="48" fill="#f3ce69" r="3.5" />
          <path d="M100 120 Q75 80 35 78" stroke="#253a23" strokeLinecap="round" strokeWidth="3" />
          <path d="M35 78 C28 72, 20 80, 24 88 C32 94, 40 87, 35 78 Z" fill="#fcf9f2" />
          <circle cx="30" cy="82" fill="#dfad38" r="3" />
        </svg>
      </div>
    </div>
  )
}
