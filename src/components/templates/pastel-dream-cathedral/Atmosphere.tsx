"use client"

export const IM_ATMOSPHERE_CSS = `
@keyframes imFly1 {
  0% { transform: translate(-90px, 40px) scale(0.95); opacity: 0; }
  8% { opacity: 0.95; }
  25% { transform: translate(60px, 12px) scale(0.98); }
  50% { transform: translate(190px, -20px) scale(1); }
  75% { transform: translate(320px, 10px) scale(0.96); }
  92% { opacity: 0.95; }
  100% { transform: translate(460px, -35px) scale(0.92); opacity: 0; }
}
@keyframes imFly2 {
  0% { transform: translate(-80px, 20px) scale(0.75); opacity: 0; }
  8% { opacity: 0.9; }
  30% { transform: translate(70px, -18px) scale(0.78); }
  65% { transform: translate(240px, 14px) scale(0.76); }
  90% { opacity: 0.9; }
  100% { transform: translate(460px, -25px) scale(0.72); opacity: 0; }
}
@keyframes imFly3 {
  0% { transform: translate(-100px, 60px) scale(1.05); opacity: 0; }
  10% { opacity: 1; }
  40% { transform: translate(120px, -22px) scale(1.08); }
  75% { transform: translate(290px, 18px) scale(1.02); }
  90% { opacity: 1; }
  100% { transform: translate(470px, -50px) scale(0.98); opacity: 0; }
}
@keyframes imFly4 {
  0% { transform: translate(-70px, 30px) scale(0.68); opacity: 0; }
  10% { opacity: 0.85; }
  35% { transform: translate(90px, -25px) scale(0.7); }
  70% { transform: translate(250px, 5px) scale(0.72); }
  90% { opacity: 0.85; }
  100% { transform: translate(460px, -20px) scale(0.65); opacity: 0; }
}
@keyframes imFly5 {
  0% { transform: translate(-90px, 15px) scale(0.86); opacity: 0; }
  10% { opacity: 0.95; }
  45% { transform: translate(150px, 35px) scale(0.9); }
  80% { transform: translate(330px, -15px) scale(0.88); }
  92% { opacity: 0.95; }
  100% { transform: translate(470px, 20px) scale(0.82); opacity: 0; }
}
@keyframes imFly6 {
  0% { transform: translate(-60px, 90px) scale(0.6); opacity: 0; }
  12% { opacity: 0.85; }
  50% { transform: translate(200px, 50px) scale(0.62); }
  86% { opacity: 0.85; }
  100% { transform: translate(460px, 10px) scale(0.55); opacity: 0; }
}
@keyframes imDoveFlapL {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  50% { transform: rotate(-36deg) scaleY(0.42); }
}
@keyframes imDoveFlapR {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  50% { transform: rotate(36deg) scaleY(0.42); }
}
.im-dove-1 { animation: imFly1 8.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; animation-delay: -2s; will-change: transform; }
.im-dove-2 { animation: imFly2 11s cubic-bezier(0.38, 0, 0.22, 1) infinite; animation-delay: -6s; will-change: transform; }
.im-dove-3 { animation: imFly3 7.5s cubic-bezier(0.42, 0, 0.18, 1) infinite; animation-delay: -4.5s; will-change: transform; }
.im-dove-4 { animation: imFly4 13.5s cubic-bezier(0.35, 0, 0.25, 1) infinite; animation-delay: -9s; will-change: transform; }
.im-dove-5 { animation: imFly5 9.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; animation-delay: -1.2s; will-change: transform; }
.im-dove-6 { animation: imFly6 14s linear infinite; animation-delay: -9.5s; will-change: transform; }
.im-dove-wing-l { transform-origin: 16px 12px; animation: imDoveFlapL 0.35s ease-in-out infinite; }
.im-dove-wing-r { transform-origin: 18px 12px; animation: imDoveFlapR 0.35s ease-in-out infinite; }
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
.im-sway-c { transform-origin: bottom center; animation: imSwayL 5.8s ease-in-out infinite reverse; }
@keyframes imGoldPulse {
  0%, 100% { opacity: 0.65; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.35); }
}
.im-gold-pulse { animation: imGoldPulse 2.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .im-atmos, .im-atmos * { animation: none !important; }
}
`

type DoveSpec = {
  flight: string
  top: string
  width: number
  opacity: number
  wingL: string
  wingR: string
  body: string
  glow: string
}

const DOVES: DoveSpec[] = [
  { flight: "im-dove-1", top: "8%", width: 40, opacity: 1, wingL: "#FFFDF7", wingR: "#ffffff", body: "#FAF6ED", glow: "drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]" },
  { flight: "im-dove-2", top: "17%", width: 28, opacity: 0.85, wingL: "#FBF8F0", wingR: "#ffffff", body: "#ffffff", glow: "drop-shadow-[0_2px_6px_rgba(255,255,255,0.75)]" },
  { flight: "im-dove-3", top: "27%", width: 44, opacity: 1, wingL: "#FFFDF5", wingR: "#ffffff", body: "#ffffff", glow: "drop-shadow-[0_3px_10px_rgba(255,255,255,0.95)]" },
  { flight: "im-dove-4", top: "38%", width: 24, opacity: 0.8, wingL: "#ffffff", wingR: "#F5EFE1", body: "#ffffff", glow: "drop-shadow-[0_2px_5px_rgba(255,255,255,0.7)]" },
  { flight: "im-dove-5", top: "22%", width: 36, opacity: 0.95, wingL: "#ffffff", wingR: "#FFFDF8", body: "#ffffff", glow: "drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)]" },
  { flight: "im-dove-6", top: "30%", width: 32, opacity: 0.9, wingL: "#FFFDF7", wingR: "#ffffff", body: "#FAF6ED", glow: "drop-shadow-[0_2px_6px_rgba(255,255,255,0.8)]" },
]

function Dove({ spec }: { spec: DoveSpec }) {
  return (
    <div className={`absolute left-0 pointer-events-none ${spec.flight}`} style={{ top: spec.top, opacity: spec.opacity }}>
      <svg width={spec.width} viewBox="0 0 36 28" fill="none" className={spec.glow}>
        <path className="im-dove-wing-l" d="M16 12 C12 5 3 1 0 5 C5 9 11 12 16 13 Z" fill={spec.wingL} />
        <path className="im-dove-wing-r" d="M18 12 C23 4 32 0 36 4 C31 8 25 12 18 13 Z" fill={spec.wingR} />
        <path d="M13 13 C15 11 18 11 20 13 C21 15 20 18 17 22 C15 19 14 16 13 13 Z" fill={spec.body} />
        <ellipse cx="16.5" cy="11.5" rx="2.5" ry="3" fill="#ffffff" />
      </svg>
    </div>
  )
}

// Per-page ambient life above the shared mosque backdrop, using the groom
// reference doves. Each page picks its own mix (dove count, falling petals,
// gold motes) to mirror the reference designs; pure CSS, pointer-transparent.
export default function ImpastoAtmosphere({
  doves = 5,
  petals = true,
  motes = true,
}: {
  doves?: number
  petals?: boolean
  motes?: boolean
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden im-atmos" style={{ zIndex: 5 }}>
      {DOVES.slice(0, Math.max(0, Math.min(6, doves))).map((d) => (
        <Dove key={d.flight} spec={d} />
      ))}
      {motes && (
        <>
          <span className="absolute w-2 h-2 rounded-full bg-amber-200/70 blur-[0.8px] im-mote-1" style={{ top: "30%", left: "18%" }} />
          <span className="absolute w-2.5 h-2.5 rounded-full bg-yellow-100/80 blur-[1px] im-mote-2" style={{ top: "38%", right: "22%" }} />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60 blur-[0.5px] im-mote-3" style={{ top: "55%", left: "30%" }} />
          <svg className="absolute im-sparkle-1" style={{ bottom: "28%", left: "8%" }} fill="none" height="16" viewBox="0 0 24 24" width="16">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#ffe088" />
          </svg>
          <svg className="absolute im-sparkle-2" style={{ bottom: "36%", right: "10%" }} fill="none" height="14" viewBox="0 0 24 24" width="14">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#f2ca50" />
          </svg>
        </>
      )}
      {petals && (
        <>
          <span className="absolute w-3 h-2.5 rounded-full bg-[#f4b8c6] im-drift-1" style={{ bottom: "12%", left: "16%" }} />
          <span className="absolute w-3.5 h-3 rounded-full bg-[#faedd4] im-drift-2" style={{ bottom: "9%", right: "20%" }} />
          <span className="absolute w-2.5 h-2 rounded-full bg-[#e89db1] im-drift-3" style={{ bottom: "16%", left: "38%" }} />
          <span className="absolute w-2.5 h-3 rounded-full bg-[#FFF9F0] im-fall-1" style={{ top: "-4%", left: "12%" }} />
          <span className="absolute w-2 h-2.5 rounded-full bg-[#F7E7DC] im-fall-2" style={{ top: "-4%", left: "64%" }} />
          <span className="absolute w-2 h-2.5 rounded-full bg-[#FFE8B8] im-fall-3" style={{ top: "-4%", left: "85%" }} />
        </>
      )}
    </div>
  )
}

// Layered painted foreground blossoms: pink/white blooms + green leaves,
// left/right swaying stems plus a center hydrangea cluster.
export function ImpastoFlowers() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <div className="im-sway-l absolute -bottom-2 -left-3 w-36 h-36 opacity-80">
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" viewBox="0 0 120 120">
          <path d="M10 120 Q30 70 65 50" stroke="#374f34" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M65 50 C70 45, 80 48, 78 58 C72 65, 60 62, 65 50 Z" fill="#e8a8b8" />
          <circle cx="68" cy="54" fill="#f8d778" r="3.5" />
          <path d="M20 120 Q40 85 85 75" stroke="#2a3f28" strokeLinecap="round" strokeWidth="3" />
          <path d="M85 75 C92 70, 100 76, 96 84 C90 90, 80 84, 85 75 Z" fill="#f5ede0" />
          <circle cx="89" cy="78" fill="#e8ba4c" r="3" />
          <path d="M14 120 Q28 95 52 88 C48 96, 30 104, 18 118 Z" fill="#3a4e3c" opacity="0.85" />
          <path d="M55 62 C62 56, 72 60, 70 68 C64 74, 54 70, 55 62 Z" fill="#f2c4d0" />
          <circle cx="62" cy="64" fill="#f8d778" r="2.5" />
        </svg>
      </div>
      <div className="im-sway-r absolute -bottom-2 -right-4 w-40 h-40 opacity-80">
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" viewBox="0 0 120 120">
          <path d="M110 120 Q85 65 45 45" stroke="#31482f" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M45 45 C38 38, 28 44, 32 54 C38 62, 50 56, 45 45 Z" fill="#e2899e" />
          <circle cx="39" cy="48" fill="#f3ce69" r="3.5" />
          <path d="M100 120 Q75 80 35 78" stroke="#253a23" strokeLinecap="round" strokeWidth="3" />
          <path d="M35 78 C28 72, 20 80, 24 88 C32 94, 40 87, 35 78 Z" fill="#fcf9f2" />
          <circle cx="30" cy="82" fill="#dfad38" r="3" />
          <path d="M106 120 Q92 95 68 88 C72 96, 90 104, 102 118 Z" fill="#33482f" opacity="0.85" />
          <path d="M62 58 C55 52, 45 56, 47 64 C53 70, 63 66, 62 58 Z" fill="#f7dce4" />
          <circle cx="55" cy="60" fill="#f3ce69" r="2.5" />
        </svg>
      </div>
      <div className="im-sway-c absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-28 opacity-70">
        <svg className="w-full h-full" fill="none" viewBox="0 0 160 80">
          <path d="M70 80 Q80 40 82 30" stroke="#385135" strokeLinecap="round" strokeWidth="3" />
          <circle cx="82" cy="28" fill="#d2e3f5" opacity="0.9" r="7" />
          <circle cx="90" cy="34" fill="#e5effa" opacity="0.85" r="6.5" />
          <circle cx="75" cy="35" fill="#bfd6ee" opacity="0.9" r="6" />
          <circle cx="83" cy="38" fill="#f5ce7b" r="5" />
          <path d="M95 80 Q92 55 100 44" stroke="#2f452c" strokeLinecap="round" strokeWidth="2.5" />
          <path d="M100 44 C106 38, 114 42, 112 50 C108 56, 99 52, 100 44 Z" fill="#e8a8b8" />
          <circle cx="105" cy="47" fill="#f8d778" r="2.5" />
        </svg>
      </div>
    </div>
  )
}
