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
@keyframes imPetal {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  20% { opacity: 0.85; }
  80% { opacity: 0.75; }
  100% { transform: translate(50px, -180px) rotate(240deg); opacity: 0; }
}
.im-petal-1 { animation: imPetal 9s ease-in-out infinite; }
.im-petal-2 { animation: imPetal 11s ease-in-out 3s infinite; }
.im-petal-3 { animation: imPetal 10.5s ease-in-out 6s infinite; }
@media (prefers-reduced-motion: reduce) {
  .im-atmos, .im-atmos * { animation: none !important; }
}
`

function Dove({ className, top, wingClass }: { className: string; top: string; wingClass: string }) {
  return (
    <div className={`absolute left-0 pointer-events-none ${className}`} style={{ top }}>
      <svg className="drop-shadow-md text-white/90" fill="none" viewBox="0 0 64 64" width="36" height="36">
        <path className={wingClass} fill="rgba(255,255,255,0.92)" d="M28 28 C26 18 18 8 6 6 C12 14 20 22 26 29 Z" />
        <path className={wingClass} fill="rgba(248,245,238,0.85)" d="M32 27 C36 17 46 7 58 5 C50 14 41 22 34 28 Z" />
        <path fill="rgba(255,255,255,0.96)" d="M24 38 C21 44 17 50 14 55 C20 52 26 46 29 41 C31 38 34 35 34 32 C34 29 32 27 30 27 C27 27 24 30 24 38 Z" />
        <circle cx="31" cy="25" r="3.2" fill="rgba(255,255,255,0.98)" />
      </svg>
    </div>
  )
}

// Ambient life above the shared mosque backdrop: gliding doves, gold sun
// motes and drifting petals. Pure CSS, pointer-transparent.
export default function ImpastoAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden im-atmos" style={{ zIndex: 5 }}>
      <Dove className="im-dove-1" top="12%" wingClass="im-wing-l" />
      <Dove className="im-dove-2" top="22%" wingClass="im-wing-l" />
      <Dove className="im-dove-3" top="6%" wingClass="im-wing-l" />
      <span className="absolute w-2 h-2 rounded-full bg-amber-200/70 blur-[0.8px] im-mote-1" style={{ top: "30%", left: "18%" }} />
      <span className="absolute w-2.5 h-2.5 rounded-full bg-yellow-100/80 blur-[1px] im-mote-2" style={{ top: "38%", right: "22%" }} />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60 blur-[0.5px] im-mote-3" style={{ top: "55%", left: "30%" }} />
      <span className="absolute w-3 h-2.5 rounded-full bg-[#f4b8c6] im-petal-1" style={{ bottom: "12%", left: "16%" }} />
      <span className="absolute w-3.5 h-3 rounded-full bg-[#faedd4] im-petal-2" style={{ bottom: "9%", right: "20%" }} />
      <span className="absolute w-2.5 h-2 rounded-full bg-[#e89db1] im-petal-3" style={{ bottom: "16%", left: "38%" }} />
    </div>
  )
}
