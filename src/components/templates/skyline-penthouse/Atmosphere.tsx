"use client"

export const SKYLINE_ATMOSPHERE_CSS = `
@keyframes spTwinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.85); }
  50% { opacity: 0.95; transform: scale(1.25); filter: drop-shadow(0 0 4px #38efff); }
}
@keyframes spLampBreathe {
  0%, 100% { opacity: 0.45; transform: scale(0.98); }
  50% { opacity: 0.75; transform: scale(1.05); }
}
@keyframes spFloatMote {
  0% { transform: translateY(0) translateX(0) scale(0.7); opacity: 0; }
  15% { opacity: 0.75; }
  80% { opacity: 0.85; }
  100% { transform: translateY(-90px) translateX(12px) scale(1.1); opacity: 0; }
}
@keyframes spCoupleSway {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes spMiniHeart {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 0.9; }
  100% { transform: translateY(-40px) translateX(8px) scale(1.1); opacity: 0; }
}
@keyframes spHeartBubble {
  0%, 78% { opacity: 0; transform: translateY(5px) scale(0.3); }
  82% { opacity: 1; transform: translateY(-4px) scale(1.15); }
  92% { opacity: 0.9; transform: translateY(-10px) scale(1); }
  98%, 100% { opacity: 0; transform: translateY(-16px) scale(0.6); }
}
@keyframes spDogPatrol {
  0% { left: 20%; top: 76%; transform: scaleX(1); }
  40% { left: 56%; top: 85%; transform: scaleX(1); }
  48% { left: 56%; top: 85%; transform: scaleX(1); }
  50% { left: 56%; top: 85%; transform: scaleX(-1); }
  90% { left: 20%; top: 76%; transform: scaleX(-1); }
  98% { left: 20%; top: 76%; transform: scaleX(-1); }
  100% { left: 20%; top: 76%; transform: scaleX(1); }
}
@keyframes spDogBob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(1.5deg); }
}
@keyframes spDogTail {
  0%, 100% { transform: rotate(-14deg); }
  50% { transform: rotate(26deg); }
}
@keyframes spDogLegF1 {
  0%, 100% { transform: rotate(-24deg); }
  50% { transform: rotate(24deg); }
}
@keyframes spDogLegF2 {
  0%, 100% { transform: rotate(24deg); }
  50% { transform: rotate(-24deg); }
}
@keyframes spDogLegB1 {
  0%, 100% { transform: rotate(22deg); }
  50% { transform: rotate(-22deg); }
}
@keyframes spDogLegB2 {
  0%, 100% { transform: rotate(-22deg); }
  50% { transform: rotate(22deg); }
}
.sp-dog-patrol { animation: spDogPatrol 15s infinite ease-in-out; }
.sp-dog-bob { animation: spDogBob 0.42s infinite ease-in-out; }
.sp-dog-tail { transform-origin: bottom left; animation: spDogTail 0.28s infinite ease-in-out; }
.sp-dog-leg-f1 { transform-origin: top center; animation: spDogLegF1 0.42s infinite ease-in-out; }
.sp-dog-leg-f2 { transform-origin: top center; animation: spDogLegF2 0.42s infinite ease-in-out; }
.sp-dog-leg-b1 { transform-origin: top center; animation: spDogLegB1 0.42s infinite ease-in-out; }
.sp-dog-leg-b2 { transform-origin: top center; animation: spDogLegB2 0.42s infinite ease-in-out; }
@keyframes spGuidePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(56, 189, 248, 0.35), inset 0 0 10px rgba(56, 189, 248, 0.12); }
  50% { transform: scale(1.02); box-shadow: 0 0 16px rgba(56, 189, 248, 0.45), inset 0 0 12px rgba(56, 189, 248, 0.15); }
}
.sp-hotspot { animation: spGuidePulse 2.6s infinite ease-in-out; }
@media (prefers-reduced-motion: reduce) {
  .sp-atmos, .sp-atmos * { animation: none !important; }
}
`

function Dog() {
  return (
    <div className="sp-dog-patrol absolute pointer-events-none" style={{ width: 48, height: 42, zIndex: 5 }}>
      <div className="absolute -top-3.5 right-1 pointer-events-none" style={{ animation: "spHeartBubble 15s infinite ease-in-out" }}>
        <div className="flex items-center space-x-0.5 bg-slate-900/90 border border-pink-400/60 px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]">
          <span className="text-[9px] leading-none">🐾</span>
          <span className="text-[8px] text-pink-300 font-bold leading-none">♥</span>
        </div>
      </div>
      <div className="sp-dog-bob w-full h-full relative">
        <div className="absolute bottom-0 left-1 w-9 h-2.5 bg-black/45 rounded-[50%] blur-[1.5px]" />
        <svg className="w-full h-full overflow-visible drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" viewBox="0 0 54 44">
          <g className="sp-dog-leg-b1">
            <rect fill="#d97706" height="9" rx="2" stroke="#451a03" strokeWidth="1" width="4.5" x="13" y="27" />
            <ellipse cx="14.5" cy="36" fill="#fef3c7" rx="2.5" ry="1.8" stroke="#451a03" strokeWidth="0.8" />
          </g>
          <g className="sp-dog-leg-f1">
            <rect fill="#d97706" height="9" rx="2" stroke="#451a03" strokeWidth="1" width="4.5" x="32" y="28" />
            <ellipse cx="33.5" cy="37" fill="#fef3c7" rx="2.5" ry="1.8" stroke="#451a03" strokeWidth="0.8" />
          </g>
          <g className="sp-dog-tail" style={{ transformOrigin: "10px 21px" }}>
            <path d="M10 21 C6 18 4 12 8 8 C11 5 13 9 11 15" fill="#f59e0b" stroke="#78350f" strokeLinecap="round" strokeWidth="1.2" />
            <circle cx="8" cy="8" fill="#fef3c7" r="2.2" />
          </g>
          <ellipse cx="24" cy="24" fill="#f59e0b" rx="14" ry="10" stroke="#78350f" strokeWidth="1.2" />
          <ellipse cx="24" cy="27" fill="#fef3c7" rx="9" ry="5.5" />
          <g className="sp-dog-leg-b2">
            <rect fill="#f59e0b" height="10" rx="2" stroke="#78350f" strokeWidth="1" width="4.5" x="17" y="28" />
            <ellipse cx="18.5" cy="38" fill="#fef3c7" rx="2.8" ry="2" stroke="#78350f" strokeWidth="0.8" />
          </g>
          <g className="sp-dog-leg-f2">
            <rect fill="#f59e0b" height="10" rx="2" stroke="#78350f" strokeWidth="1" width="4.5" x="28" y="29" />
            <ellipse cx="29.5" cy="39" fill="#fef3c7" rx="2.8" ry="2" stroke="#78350f" strokeWidth="0.8" />
          </g>
          <path d="M32 17 C34 23 37 25 39 20" stroke="#ef4444" strokeLinecap="round" strokeWidth="2.5" />
          <circle cx="37" cy="22" fill="#fbbf24" r="1.8" stroke="#78350f" strokeWidth="0.7" />
          <circle cx="39" cy="15" fill="#f59e0b" r="10" stroke="#78350f" strokeWidth="1.2" />
          <ellipse cx="40" cy="18" fill="#fef3c7" rx="7" ry="5.5" />
          <polygon fill="#d97706" points="31,10 35,2 38,9" stroke="#78350f" strokeLinejoin="round" strokeWidth="1" />
          <polygon fill="#fbcfe8" points="33,9 35,4 37,8" />
          <polygon fill="#f59e0b" points="40,8 45,1 48,9" stroke="#78350f" strokeLinejoin="round" strokeWidth="1" />
          <polygon fill="#fbcfe8" points="42,7 45,3 47,8" />
          <circle cx="42" cy="13" fill="#1e1b4b" r="2.2" />
          <circle cx="42.7" cy="12.3" fill="#ffffff" r="0.8" />
          <path d="M40 10 Q42.5 8.5 44 10" fill="none" stroke="#78350f" strokeLinecap="round" strokeWidth="0.9" />
          <ellipse cx="46" cy="16.5" fill="#ffffff" rx="3.5" ry="2.8" stroke="#78350f" strokeWidth="0.8" />
          <ellipse cx="47" cy="15.2" fill="#1e1b4b" rx="1.3" ry="0.9" />
          <path d="M46 17 Q47 18.5 48 17" fill="none" stroke="#78350f" strokeLinecap="round" strokeWidth="0.8" />
          <ellipse cx="37" cy="17" fill="#fb7185" opacity="0.65" rx="1.8" ry="1.1" />
        </svg>
      </div>
    </div>
  )
}

// Living overlays, calibrated to the room art box (% coordinates). Renders
// above the art, below hotspots; fully pointer-transparent.
export default function SkylineAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none sp-atmos" style={{ zIndex: 10 }}>
      {/* Twinkling skyline lights & stars */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <span className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full" style={{ top: "38%", left: "6%", animation: "spTwinkle 2.4s infinite ease-in-out", opacity: 0.6, boxShadow: "0 0 6px #38efff" }} />
        <span className="absolute w-1 h-1 bg-amber-200 rounded-full" style={{ top: "42%", left: "9%", animation: "spTwinkle 3.1s infinite ease-in-out 0.8s", opacity: 0.7 }} />
        <span className="absolute w-1.5 h-1.5 bg-rose-300 rounded-full" style={{ top: "49%", left: "4%", animation: "spTwinkle 2.7s infinite ease-in-out 1.2s", opacity: 0.5 }} />
        <span className="absolute w-1 h-1 bg-cyan-200 rounded-full" style={{ top: "55%", left: "8%", animation: "spTwinkle 1.9s infinite ease-in-out 0.4s", opacity: 0.8 }} />
        <span className="absolute w-2 h-2 bg-blue-400/50 rounded-full blur-[1px]" style={{ top: "52%", left: "18%", animation: "spTwinkle 3.5s infinite ease-in-out 1.6s" }} />
        <span className="absolute w-1 h-1 bg-emerald-200 rounded-full" style={{ top: "33%", left: "16%", animation: "spTwinkle 2.2s infinite ease-in-out 0.7s" }} />
        <span className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full" style={{ top: "59%", left: "24%", animation: "spTwinkle 2.8s infinite ease-in-out 1.9s", boxShadow: "0 0 4px #fbbf24" }} />
        <span className="absolute w-1 h-1 bg-cyan-100 rounded-full" style={{ top: "46%", left: "28%", animation: "spTwinkle 2.1s infinite ease-in-out 0.2s" }} />
      </div>
      {/* Warm lamp breathing glows */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: "8%", left: "58%", width: 55, height: 55, background: "radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(251, 191, 36, 0.12) 60%, transparent 80%)", filter: "blur(6px)", animation: "spLampBreathe 4s infinite ease-in-out" }} />
        <div className="absolute rounded-full pointer-events-none" style={{ top: "18%", left: "79%", width: 65, height: 65, background: "radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, rgba(251, 191, 36, 0.15) 60%, transparent 80%)", filter: "blur(7px)", animation: "spLampBreathe 4.5s infinite ease-in-out 1.5s" }} />
      </div>
      {/* Floating dust motes */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/80 shadow-[0_0_6px_#fde047]" style={{ top: "45%", left: "63%", animation: "spFloatMote 5s infinite linear 0.3s" }} />
        <span className="absolute w-1 h-1 rounded-full bg-cyan-300/90 shadow-[0_0_5px_#38efff]" style={{ top: "55%", left: "45%", animation: "spFloatMote 6s infinite linear 1.8s" }} />
        <span className="absolute w-2 h-2 rounded-full bg-rose-300/70 shadow-[0_0_8px_#fda4af]" style={{ top: "60%", left: "52%", animation: "spFloatMote 7s infinite linear 3.2s" }} />
        <span className="absolute w-1 h-1 rounded-full bg-amber-200/80 shadow-[0_0_4px_#fef08a]" style={{ top: "35%", left: "70%", animation: "spFloatMote 5.5s infinite linear 2.1s" }} />
        <span className="absolute w-1.5 h-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_6px_#67e8f9]" style={{ top: "68%", left: "72%", animation: "spFloatMote 6.5s infinite linear 0.9s" }} />
      </div>
      {/* Couple sway + rising heart */}
      <div className="absolute" style={{ left: "35%", top: "54%", width: "26%", height: "30%", animation: "spCoupleSway 3.2s infinite ease-in-out", zIndex: 3 }}>
        <span className="absolute text-[11px] text-pink-400 select-none drop-shadow-[0_0_4px_rgba(244,63,94,0.7)]" style={{ top: -6, left: "44%", animation: "spMiniHeart 3.4s infinite ease-out" }}>❤️</span>
      </div>
      <Dog />
    </div>
  )
}