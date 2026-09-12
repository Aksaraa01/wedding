"use client"

import type { CSSProperties } from "react"
import { ASSETS } from "@/lib/assets"

export const PC_ATMOSPHERE_CSS = `
@keyframes pcFlock1 {
  0% { transform: translate(-100px, 40px) scale(0.75); opacity: 0; }
  10% { opacity: 0.95; }
  85% { opacity: 0.9; }
  100% { transform: translate(460px, -65px) scale(1.05); opacity: 0; }
}
@keyframes pcFlock2 {
  0% { transform: translate(-120px, 25px) scale(0.65); opacity: 0; }
  12% { opacity: 0.85; }
  80% { opacity: 0.85; }
  100% { transform: translate(450px, -45px) scale(0.9); opacity: 0; }
}
@keyframes pcDoveFlap {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(0.35) translateY(2.5px) rotate(-3deg); }
}
.pc-flock-1 { animation: pcFlock1 16s cubic-bezier(0.25, 1, 0.5, 1) infinite; will-change: transform, opacity; }
.pc-flock-2 { animation: pcFlock2 22s cubic-bezier(0.2, 0.8, 0.4, 1) 7s infinite; will-change: transform, opacity; }
.pc-flap-fast { animation: pcDoveFlap 0.62s ease-in-out infinite; transform-origin: center; }
.pc-flap-med { animation: pcDoveFlap 0.78s ease-in-out infinite; transform-origin: center; }
.pc-flap-slow { animation: pcDoveFlap 0.92s ease-in-out infinite; transform-origin: center; }
@keyframes pcFly1 {
  0% { transform: translate3d(-100px, 30px, 0) scale(0.95); opacity: 0; }
  12% { opacity: 0.9; }
  50% { transform: translate3d(160px, -15px, 0) scale(1.05); }
  88% { opacity: 0.9; }
  100% { transform: translate3d(450px, -45px, 0) scale(1.15); opacity: 0; }
}
@keyframes pcFly2 {
  0% { transform: translate3d(-100px, 70px, 0) scale(0.85); opacity: 0; }
  12% { opacity: 0.85; }
  50% { transform: translate3d(170px, 15px, 0) scale(0.92); }
  88% { opacity: 0.85; }
  100% { transform: translate3d(460px, -20px, 0) scale(1); opacity: 0; }
}
@keyframes pcFly3 {
  0% { transform: translate3d(-100px, -10px, 0) scale(1.05); opacity: 0; }
  12% { opacity: 0.9; }
  50% { transform: translate3d(150px, -60px, 0) scale(1.12); }
  88% { opacity: 0.9; }
  100% { transform: translate3d(450px, -90px, 0) scale(1.2); opacity: 0; }
}
@keyframes pcFly4 {
  0% { transform: translate3d(-100px, 110px, 0) scale(0.75); opacity: 0; }
  12% { opacity: 0.85; }
  50% { transform: translate3d(180px, 45px, 0) scale(0.82); }
  88% { opacity: 0.85; }
  100% { transform: translate3d(460px, 10px, 0) scale(0.9); opacity: 0; }
}
@keyframes pcWingL {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(0.4) rotate(-18deg); }
}
@keyframes pcWingR {
  0%, 100% { transform: scaleY(1) rotate(0deg); }
  50% { transform: scaleY(0.4) rotate(18deg); }
}
.pc-dove-1 { animation: pcFly1 10s linear infinite; animation-delay: -3s; will-change: transform; }
.pc-dove-2 { animation: pcFly2 12s linear infinite; animation-delay: -7s; will-change: transform; }
.pc-dove-3 { animation: pcFly3 9s linear infinite; animation-delay: -1s; will-change: transform; }
.pc-dove-4 { animation: pcFly4 11s linear infinite; animation-delay: -9.5s; will-change: transform; }
.pc-wing-l { animation: pcWingL 0.38s ease-in-out infinite; transform-origin: 17px 12px; will-change: transform; }
.pc-wing-r { animation: pcWingR 0.38s ease-in-out infinite; transform-origin: 17px 12px; will-change: transform; }
@keyframes pcCloudGlideL {
  0% { transform: translateX(-110%) scale(0.85); opacity: 0; }
  70% { transform: translateX(-8%) scale(1.02); opacity: 0.98; }
  100% { transform: translateX(-15%) scale(1); opacity: 0.95; }
}
@keyframes pcCloudGlideR {
  0% { transform: translateX(110%) scaleX(-1) scale(0.85); opacity: 0; }
  70% { transform: translateX(8%) scaleX(-1) scale(1.02); opacity: 0.98; }
  100% { transform: translateX(15%) scaleX(-1) scale(1); opacity: 0.92; }
}
@keyframes pcCloudBobL {
  0%, 100% { transform: translateX(-15%) translateY(0px) scale(1); }
  50% { transform: translateX(-13%) translateY(-4px) scale(1.015); }
}
@keyframes pcCloudBobR {
  0%, 100% { transform: translateX(15%) scaleX(-1) translateY(0px) scale(1); }
  50% { transform: translateX(13%) scaleX(-1) translateY(4px) scale(1.015); }
}
.pc-cloud-left { animation: pcCloudGlideL 4.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, pcCloudBobL 6s ease-in-out 4.8s infinite; will-change: transform, opacity; }
.pc-cloud-right { animation: pcCloudGlideR 4.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, pcCloudBobR 6s ease-in-out 4.8s infinite; will-change: transform, opacity; }
@keyframes pcCloudSlideL {
  0% { transform: translate3d(-140px, 0, 0) scale(0.82); opacity: 0; }
  70% { transform: translate3d(6px, 0, 0) scale(1.02); opacity: 0.95; }
  100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.95; }
}
@keyframes pcCloudSlideR {
  0% { transform: translate3d(140px, 0, 0) scale(0.82); opacity: 0; }
  70% { transform: translate3d(-6px, 0, 0) scale(1.02); opacity: 0.95; }
  100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.95; }
}
@keyframes pcCloudDriftL {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(-4px, -3px, 0) rotate(-0.6deg); }
}
@keyframes pcCloudDriftR {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(4px, -2px, 0) rotate(0.6deg); }
}
@keyframes pcCloudFloat {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
  100% { transform: translateY(3px) scale(0.995); }
}
.pc-cloud-wing-l { animation: pcCloudSlideL 2.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, pcCloudDriftL 5s ease-in-out infinite 2.6s; will-change: transform, opacity; }
.pc-cloud-wing-r { animation: pcCloudSlideR 2.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, pcCloudDriftR 5.5s ease-in-out infinite 2.6s; will-change: transform, opacity; }
.pc-cloud-stage { animation: pcCloudFloat 4.2s ease-in-out infinite alternate; will-change: transform; }
@keyframes pcFallDown {
  0% { transform: translateY(-10%) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.85; }
  100% { transform: translateY(110vh) rotate(200deg); opacity: 0; }
}
.pc-fall-1 { animation: pcFallDown 12s linear infinite; }
.pc-fall-2 { animation: pcFallDown 14s linear infinite 4s; }
.pc-fall-3 { animation: pcFallDown 11s linear infinite 8s; }
@keyframes pcPetalSway1 {
  0%, 100% { transform: translateX(0px) rotateZ(0deg); }
  25% { transform: translateX(28px) rotateZ(45deg); }
  50% { transform: translateX(-18px) rotateZ(110deg); }
  75% { transform: translateX(34px) rotateZ(210deg); }
}
@keyframes pcPetalSway2 {
  0%, 100% { transform: translateX(0px) rotateZ(0deg); }
  30% { transform: translateX(-32px) rotateZ(-55deg); }
  60% { transform: translateX(22px) rotateZ(120deg); }
  85% { transform: translateX(-26px) rotateZ(240deg); }
}
@keyframes pcShimmer {
  0%, 100% { opacity: 0.2; transform: translateY(0) scale(0.8); }
  50% { opacity: 0.85; transform: translateY(-16px) scale(1.15); }
}
.pc-mote-1 { animation: pcShimmer 4.5s ease-in-out infinite; }
.pc-mote-2 { animation: pcShimmer 6s ease-in-out 1.5s infinite; }
.pc-mote-3 { animation: pcShimmer 5.2s ease-in-out 3s infinite; }
@keyframes pcPearl1 {
  0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
  20% { opacity: 0.75; }
  80% { opacity: 0.75; }
  100% { transform: translate3d(18px, -140px, 0) scale(1.1); opacity: 0; }
}
@keyframes pcPearl2 {
  0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
  30% { opacity: 0.9; }
  70% { opacity: 0.9; }
  100% { transform: translate3d(-22px, -170px, 0) scale(1); opacity: 0; }
}
.pc-pearl-1 { animation: pcPearl1 7s ease-in-out infinite; }
.pc-pearl-2 { animation: pcPearl2 8.5s ease-in-out 1.8s infinite; }
.pc-pearl-3 { animation: pcPearl1 6.5s ease-in-out 3.2s infinite; }
.pc-pearl-4 { animation: pcPearl2 9s ease-in-out 4.6s infinite; }
.pc-pearl-5 { animation: pcPearl1 8s ease-in-out 2.2s infinite; }
@keyframes pcPearlPulse {
  0% { transform: translateY(0px) scale(0.85); opacity: 0.35; }
  50% { transform: translateY(-5px) scale(1.35); opacity: 1; box-shadow: 0 0 14px rgba(255, 235, 170, 0.95), 0 0 24px rgba(212, 175, 55, 0.6); }
  100% { transform: translateY(0px) scale(0.85); opacity: 0.35; }
}
.pc-pearl-node { animation: pcPearlPulse 3.4s ease-in-out infinite; will-change: transform, opacity; }
@keyframes pcSandFloat {
  0% { transform: translate(0px, 0px) scale(0.7); opacity: 0.25; }
  50% { transform: translate(3px, -8px) scale(1.3); opacity: 0.95; box-shadow: 0 0 10px rgba(255, 248, 220, 0.8); }
  100% { transform: translate(0px, 0px) scale(0.7); opacity: 0.25; }
}
.pc-sand-1 { animation: pcSandFloat 4s ease-in-out infinite; }
.pc-sand-2 { animation: pcSandFloat 3.2s ease-in-out 1.2s infinite; }
@keyframes pcShellSway {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(0.4deg); }
}
.pc-shell-sway { animation: pcShellSway 7s ease-in-out infinite; }
@keyframes pcFrameGlow {
  0%, 100% { box-shadow: 0 15px 35px rgba(0,0,0,0.25), 0 0 15px rgba(242, 202, 80, 0.2), 0 0 30px rgba(255, 235, 180, 0.15); transform: translateY(0px); }
  50% { box-shadow: 0 20px 42px rgba(0,0,0,0.28), 0 0 24px rgba(242, 202, 80, 0.45), 0 0 45px rgba(255, 235, 180, 0.3); transform: translateY(-4px); }
}
.pc-frame-pulse { animation: pcFrameGlow 6s ease-in-out infinite; }
@keyframes pcCardBobA {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(0.4deg); }
}
@keyframes pcCardBobB {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-0.4deg); }
}
@keyframes pcCardBobC {
  0%, 100% { transform: translateY(-4px); }
  50% { transform: translateY(4px); }
}
.pc-bob-1 { animation: pcCardBobA 5.5s ease-in-out infinite; }
.pc-bob-2 { animation: pcCardBobB 6.8s ease-in-out infinite 0.8s; }
.pc-bob-3 { animation: pcCardBobC 6.2s ease-in-out infinite 1.5s; }
.pc-bob-4 { animation: pcCardBobA 7.4s ease-in-out infinite 2.2s; }
.pc-bob-5 { animation: pcCardBobB 5.8s ease-in-out infinite 1s; }
@keyframes pcWave1 {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50% { transform: translateX(-24px) scaleY(1.12); }
}
@keyframes pcWave2 {
  0%, 100% { transform: translateX(-15px) scaleY(1.05); }
  50% { transform: translateX(20px) scaleY(0.92); }
}
@keyframes pcRipple {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.85; }
}
.pc-wave-1 { animation: pcWave1 7s ease-in-out infinite; will-change: transform; }
.pc-wave-2 { animation: pcWave2 9s ease-in-out infinite; will-change: transform; }
.pc-ripple { animation: pcRipple 4.5s ease-in-out infinite; }
@keyframes pcSeaShimmer {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.65; }
}
.pc-sea-shimmer { animation: pcSeaShimmer 4s ease-in-out infinite alternate; }
@keyframes pcGoldPulse {
  0% { box-shadow: 0 0 0 0 rgba(242, 202, 80, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(242, 202, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(242, 202, 80, 0); }
}
.pc-node-pulse { animation: pcGoldPulse 2.4s infinite cubic-bezier(0.4, 0, 0.6, 1); }
@keyframes pcFlyA1 {
  0% { transform: translate(-60px, 45px) scale(0.7) rotate(5deg); opacity: 0; }
  8% { opacity: 0.95; }
  88% { opacity: 0.95; }
  100% { transform: translate(470px, -25px) scale(0.7) rotate(-5deg); opacity: 0; }
}
@keyframes pcFlyA2 {
  0% { transform: translate(-50px, 120px) scale(0.52) rotate(3deg); opacity: 0; }
  12% { opacity: 0.85; }
  85% { opacity: 0.85; }
  100% { transform: translate(460px, 40px) scale(0.52) rotate(-4deg); opacity: 0; }
}
@keyframes pcFlyA3 {
  0% { transform: translate(-60px, 175px) scale(0.42) rotate(6deg); opacity: 0; }
  15% { opacity: 0.75; }
  82% { opacity: 0.75; }
  100% { transform: translate(450px, 95px) scale(0.42) rotate(-3deg); opacity: 0; }
}
@keyframes pcFlyA4 {
  0% { transform: translate(470px, 25px) scale(-0.58, 0.58) rotate(-4deg); opacity: 0; }
  10% { opacity: 0.85; }
  85% { opacity: 0.85; }
  100% { transform: translate(-50px, 110px) scale(-0.58, 0.58) rotate(4deg); opacity: 0; }
}
@keyframes pcFlapL {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  50% { transform: rotate(-38deg) scaleY(0.35); }
}
@keyframes pcFlapR {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  50% { transform: rotate(38deg) scaleY(0.35); }
}
.pc-fly-a1 { animation: pcFlyA1 15s cubic-bezier(0.4, 0, 0.6, 1) infinite; will-change: transform; }
.pc-fly-a2 { animation: pcFlyA2 19s cubic-bezier(0.35, 0, 0.65, 1) 4s infinite; will-change: transform; }
.pc-fly-a3 { animation: pcFlyA3 24s cubic-bezier(0.4, 0, 0.6, 1) 10s infinite; will-change: transform; }
.pc-fly-a4 { animation: pcFlyA4 21s cubic-bezier(0.35, 0, 0.65, 1) 7s infinite; will-change: transform; }
@keyframes pcBird1 {
  0% { transform: translate3d(-60px, 0, 0) scale(0.75); opacity: 0; }
  10% { opacity: 0.85; }
  50% { transform: translate3d(210px, -18px, 0) scale(0.82); }
  90% { opacity: 0.85; }
  100% { transform: translate3d(450px, -32px, 0) scale(0.9); opacity: 0; }
}
@keyframes pcBird2 {
  0% { transform: translate3d(-70px, 20px, 0) scale(0.6); opacity: 0; }
  12% { opacity: 0.75; }
  55% { transform: translate3d(200px, 6px, 0) scale(0.65); }
  88% { opacity: 0.75; }
  100% { transform: translate3d(460px, -10px, 0) scale(0.7); opacity: 0; }
}
@keyframes pcBird3 {
  0% { transform: translate3d(-60px, -10px, 0) scale(0.5); opacity: 0; }
  15% { opacity: 0.65; }
  50% { transform: translate3d(220px, 12px, 0) scale(0.55); }
  85% { opacity: 0.65; }
  100% { transform: translate3d(450px, 2px, 0) scale(0.6); opacity: 0; }
}
@keyframes pcWingFL {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-35deg); }
}
@keyframes pcWingFR {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(35deg); }
}
.pc-bird-1 { animation: pcBird1 16s cubic-bezier(0.4, 0, 0.2, 1) infinite; will-change: transform; }
.pc-bird-2 { animation: pcBird2 19s cubic-bezier(0.38, 0, 0.22, 1) 4.5s infinite; will-change: transform; }
.pc-bird-3 { animation: pcBird3 23s cubic-bezier(0.42, 0, 0.24, 1) 9s infinite; will-change: transform; }
.pc-wing-fl { transform-origin: right bottom; animation: pcWingFL 0.7s ease-in-out infinite alternate; }
.pc-wing-fr { transform-origin: left bottom; animation: pcWingFR 0.7s ease-in-out infinite alternate; }
@keyframes pcPetalFall {
  0% { top: -10%; opacity: 0; }
  8% { opacity: var(--pc-petal-max, 0.9); }
  88% { opacity: var(--pc-petal-max, 0.9); }
  100% { top: 108%; opacity: 0; }
}
@keyframes pcSway1 {
  0%, 100% { transform: translateX(0px) rotateZ(0deg) rotateX(0deg); }
  25% { transform: translateX(28px) rotateZ(45deg) rotateX(40deg); }
  50% { transform: translateX(-18px) rotateZ(110deg) rotateY(60deg); }
  75% { transform: translateX(34px) rotateZ(210deg) rotateX(30deg); }
}
@keyframes pcSway2 {
  0%, 100% { transform: translateX(0px) rotateZ(0deg) rotateY(0deg); }
  30% { transform: translateX(-32px) rotateZ(-55deg) rotateX(50deg); }
  60% { transform: translateX(22px) rotateZ(120deg) rotateY(45deg); }
  85% { transform: translateX(-26px) rotateZ(240deg) rotateX(35deg); }
}
@keyframes pcSway3 {
  0%, 100% { transform: translateX(0px) rotateZ(10deg) rotateX(20deg); }
  33% { transform: translateX(38px) rotateZ(90deg) rotateY(70deg); }
  66% { transform: translateX(-30px) rotateZ(190deg) rotateX(55deg); }
}
.pc-petal-container { position: absolute; will-change: top, transform, opacity; pointer-events: none; animation-name: pcPetalFall; animation-timing-function: linear; animation-iteration-count: infinite; }
.pc-petal-inner { width: 100%; height: 100%; will-change: transform; transform-style: preserve-3d; }
@keyframes pcShellIn {
  0% { opacity: 0; transform: translateY(100px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes pcPhotoIn {
  0% { opacity: 0; transform: translateY(40px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.pc-shell-in { opacity: 0; animation: pcShellIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.pc-photo-in { opacity: 0; animation: pcPhotoIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes pcGoldPulse {
  0% { box-shadow: 0 0 0 0 rgba(242, 202, 80, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(242, 202, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(242, 202, 80, 0); }
}
.pc-node-pulse { animation: pcGoldPulse 2.4s infinite cubic-bezier(0.4, 0, 0.6, 1); }
@keyframes pcFadeUp {
  0% { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
}
.pc-stagger-1 { opacity: 0; animation: pcFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s forwards; }
.pc-stagger-2 { opacity: 0; animation: pcFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards; }
.pc-stagger-3 { opacity: 0; animation: pcFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.95s forwards; }
.pc-stagger-4 { opacity: 0; animation: pcFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.1s forwards; }
.pc-stagger-5 { opacity: 0; animation: pcFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.25s forwards; }
@keyframes pcQuoteIn {
  0% { opacity: 0; transform: translateY(12px) scale(0.92); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
}
.pc-quote-in { animation: pcQuoteIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) 4.5s forwards; opacity: 0; will-change: transform, opacity, filter; }
@keyframes pcContentIn {
  0% { opacity: 0; transform: scale(0.88) translateY(12px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.pc-content-in { animation: pcContentIn 1.4s cubic-bezier(0.2, 0.8, 0.25, 1) 1.1s forwards; opacity: 0; }
@keyframes pcSparkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.25); }
}
.pc-sparkle-1 { animation: pcSparkle 3s ease-in-out 0.5s infinite; }
.pc-sparkle-2 { animation: pcSparkle 3.6s ease-in-out 2s infinite; }
@media (prefers-reduced-motion: reduce) {
  .pc-atmos, .pc-atmos * { animation: none !important; }
}
`

type DoveSpec = {
  flight: string
  top: string
  width: number
  opacity: number
}

const DOVES: DoveSpec[] = [
  { flight: "pc-dove-1", top: "8%", width: 32, opacity: 1 },
  { flight: "pc-dove-2", top: "14%", width: 28, opacity: 0.9 },
  { flight: "pc-dove-3", top: "5%", width: 36, opacity: 1 },
  { flight: "pc-dove-4", top: "19%", width: 24, opacity: 0.85 },
]

function Dove({ spec }: { spec: DoveSpec }) {
  return (
    <div className={`absolute left-0 pointer-events-none ${spec.flight}`} style={{ top: spec.top, opacity: spec.opacity }}>
      <svg width={spec.width} viewBox="0 0 34 26" className="fill-[#fffdfa] drop-shadow-md">
        <path className="pc-wing-l" d="M17 12 C13 6, 6 2, 1 5 C5 9, 12 12, 17 13 Z" />
        <path className="pc-wing-r" d="M17 12 C21 6, 28 2, 33 5 C29 9, 22 12, 17 13 Z" />
        <path d="M15 11 C16 9, 18 9, 19 11 C18 16, 17 23, 17 25 C17 23, 16 16, 15 11 Z" />
        <circle cx="17" cy="8.5" r="2" />
      </svg>
    </div>
  )
}

const MAIN_BIRDS = [
  { flight: "pc-fly-a1", width: 46, height: 34, flap: 0.52, tail: "#FFF9F0", tailOp: 0.95, wingR: "#F6F3EC", glow: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" },
  { flight: "pc-fly-a2", width: 44, height: 32, flap: 0.46, tail: "#FFF9F0", tailOp: 0.9, wingR: "#F3EFE6", glow: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))" },
  { flight: "pc-fly-a3", width: 40, height: 30, flap: 0.4, tail: "#FFF9F0", tailOp: 0.85, wingR: "#EFEAE0", glow: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" },
  { flight: "pc-fly-a4", width: 44, height: 32, flap: 0.48, tail: "#FFF9F0", tailOp: 0.9, wingR: "#F3EFE6", glow: "drop-shadow(0 1px 3px rgba(0,0,0,0.2))" },
]

function MainBird({ spec }: { spec: (typeof MAIN_BIRDS)[number] }) {
  return (
    <div className={`absolute ${spec.flight}`} style={{ willChange: "transform" }}>
      <svg width={spec.width} height={spec.height} viewBox="0 0 50 38" fill="none" style={{ filter: spec.glow }}>
        <path d="M25 19 C23 23, 20 28, 14 31 C19 28, 23 25, 25 21 C27 25, 31 28, 36 31 C30 28, 27 23, 25 19 Z" fill={spec.tail} opacity={spec.tailOp} />
        <path
          d="M25 21 C21 16, 11 9, 2 12 C10 13, 18 17, 23 21 Z"
          fill="#FFFFFF"
          style={{ transformOrigin: "24px 20px", animation: `pcFlapL ${spec.flap}s ease-in-out infinite` }}
        />
        <path
          d="M25 21 C29 16, 39 9, 48 12 C40 13, 32 17, 27 21 Z"
          fill={spec.wingR}
          style={{ transformOrigin: "26px 20px", animation: `pcFlapR ${spec.flap}s ease-in-out infinite` }}
        />
        <ellipse cx="25" cy="18" rx="2.5" ry="4.5" fill="#FFFDF8" />
      </svg>
    </div>
  )
}

export function MainBirds() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ height: "55%" }}>
      {MAIN_BIRDS.map((b) => (
        <MainBird key={b.flight} spec={b} />
      ))}
    </div>
  )
}

const GUEST_BIRDS = [
  { flight: "pc-bird-1", top: "8%", cls: "w-7 h-5", glow: "drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]", op: 0.95 },
  { flight: "pc-bird-2", top: "14%", cls: "w-6 h-4", glow: "drop-shadow-[0_2px_3px_rgba(255,255,255,0.35)]", op: 0.9 },
  { flight: "pc-bird-3", top: "19%", cls: "w-5 h-3.5", glow: "", op: 0.8 },
]

export function GuestBirds() {
  return (
    <>
      {GUEST_BIRDS.map((b) => (
        <div key={b.flight} className={`absolute left-0 pointer-events-none ${b.flight}`} style={{ top: b.top, opacity: b.op }}>
          <svg className={`${b.cls} ${b.glow}`} fill="none" viewBox="0 0 40 24">
            <path className="pc-wing-fl" d="M19 13 C14 8, 7 3, 2 6 C7 11, 13 14, 19 13 Z" fill="#ffffff" fillOpacity={b.op} />
            <path className="pc-wing-fr" d="M21 13 C26 8, 33 3, 38 6 C33 11, 27 14, 21 13 Z" fill="#ffffff" fillOpacity={b.op} />
            <path d="M18 12 C19.5 10, 20.5 10, 22 12 C21 15, 19 15, 18 12 Z" fill="#f8fafc" />
          </svg>
        </div>
      ))}
    </>
  )
}

const PETALS: { left: string; dur: string; delay: string; max: number; sway: string; swayDur: string; shape: number }[] = [
  { left: "8%", dur: "12.5s", delay: "0s", max: 0.85, sway: "pcSway1", swayDur: "5.8s", shape: 0 },
  { left: "24%", dur: "13.8s", delay: "3.5s", max: 0.8, sway: "pcSway2", swayDur: "6.2s", shape: 1 },
  { left: "38%", dur: "10.4s", delay: "1.2s", max: 0.75, sway: "pcSway3", swayDur: "5.4s", shape: 2 },
  { left: "55%", dur: "14.2s", delay: "5.8s", max: 0.82, sway: "pcSway1", swayDur: "6.6s", shape: 3 },
  { left: "70%", dur: "11.6s", delay: "2.1s", max: 0.88, sway: "pcSway2", swayDur: "5.9s", shape: 4 },
  { left: "85%", dur: "13s", delay: "7.2s", max: 0.78, sway: "pcSway3", swayDur: "5.2s", shape: 5 },
  { left: "16%", dur: "11.2s", delay: "8.5s", max: 0.82, sway: "pcSway1", swayDur: "6s", shape: 1 },
  { left: "92%", dur: "12.8s", delay: "4.2s", max: 0.75, sway: "pcSway2", swayDur: "5.5s", shape: 2 },
]

function PetalShape({ shape }: { shape: number }) {
  switch (shape) {
    case 0:
      return (
        <svg width="18" height="20" viewBox="0 0 24 26" fill="none" style={{ filter: "drop-shadow(0 2px 4px rgba(212,175,55,0.25))" }}>
          <path d="M12 2 C19 6, 23 15, 16 23 C10 26, 4 21, 2 13 C1 7, 7 2, 12 2 Z" fill="#FFF9F0" opacity="0.9" />
          <path d="M12 4 C14 10, 14 16, 12 22" opacity="0.5" stroke="#ECC99F" strokeLinecap="round" strokeWidth="0.8" />
        </svg>
      )
    case 1:
      return (
        <svg width="14" height="16" viewBox="0 0 20 22" fill="none" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))" }}>
          <path d="M10 2 C16 5, 19 13, 14 19 C9 22, 4 18, 2 11 C1 6, 6 2, 10 2 Z" fill="#F7E7DC" opacity="0.85" />
        </svg>
      )
    case 2:
      return (
        <svg width="10" height="12" viewBox="0 0 16 18" fill="none">
          <path d="M8 1 C13 4, 15 11, 11 16 C7 18, 3 15, 1 9 C0 5, 4 1, 8 1 Z" fill="#FFF2D6" opacity="0.85" />
        </svg>
      )
    case 3:
      return (
        <svg width="16" height="18" viewBox="0 0 20 22" fill="none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" }}>
          <path d="M10 2 C16 5, 19 13, 14 20 C8 22, 3 17, 2 11 C1 5, 6 2, 10 2 Z" fill="#FCECE6" opacity="0.85" />
        </svg>
      )
    case 4:
      return (
        <svg width="19" height="20" viewBox="0 0 24 26" fill="none" style={{ filter: "drop-shadow(0 2px 5px rgba(242,202,80,0.3))" }}>
          <path d="M12 2 C19 6, 23 15, 16 23 C10 26, 4 21, 2 13 C1 7, 7 2, 12 2 Z" fill="#FDFBF7" opacity="0.9" />
          <path d="M12 3 C14 10, 14 17, 12 23" opacity="0.45" stroke="#D4AF37" strokeLinecap="round" strokeWidth="0.8" />
        </svg>
      )
    default:
      return (
        <svg width="11" height="13" viewBox="0 0 16 18" fill="none">
          <path d="M8 1 C13 4, 15 11, 11 16 C7 18, 3 15, 1 9 C0 5, 4 1, 8 1 Z" fill="#FFE8B8" opacity="0.85" />
        </svg>
      )
  }
}

export function Petals8() {
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="pc-petal-container"
          style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay, "--pc-petal-max": p.max } as CSSProperties}
        >
          <div className="pc-petal-inner" style={{ animation: `${p.sway} ${p.swayDur} ease-in-out infinite` }}>
            <PetalShape shape={p.shape} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FlockDove({ flap, size, delay }: { flap: string; size: number; delay?: string }) {
  return (
    <div className={`${flap} drop-shadow-[0_2px_4px_rgba(40,30,20,0.35)]`} style={delay ? { animationDelay: delay } : undefined}>
      <svg width={size} height={size} viewBox="0 0 48 48" className="fill-[#FFFDF8]">
        <path d="M4 25 C12 23, 17 21, 23 18 C26 13, 30 7, 36 3 C36 8, 34 14, 30 19 C35 18, 42 16, 46 17 C42 20, 37 22, 33 24 C36 26, 40 30, 44 34 C38 32, 31 29, 27 28 C23 31, 16 34, 11 36 C13 32, 17 28, 20 27 C15 27, 8 26, 4 25 Z" />
      </svg>
    </div>
  )
}

export function PastelCloud({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ASSETS.pastelCoastal.cloud}
      alt=""
      draggable={false}
      loading="lazy"
      className={`pointer-events-none select-none ${flip ? "-scale-x-100" : ""} ${className}`}
    />
  )
}

export default function PastelAtmosphere({
  doves = 4,
  clouds = 0,
  petals = false,
  motes = false,
  pearls = false,
  waves = false,
  flocks = false,
  mainBirds = false,
  guestBirds = false,
  petals8 = false,
}: {
  doves?: number
  clouds?: number
  petals?: boolean
  motes?: boolean
  pearls?: boolean
  waves?: boolean
  flocks?: boolean
  mainBirds?: boolean
  guestBirds?: boolean
  petals8?: boolean
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden pc-atmos" style={{ zIndex: 5 }}>
      {mainBirds && <MainBirds />}
      {guestBirds && <GuestBirds />}
      {petals8 && <Petals8 />}
      {flocks && (
        <>
          <div className="pc-flock-1 absolute top-[28%] left-0 flex items-center">
            <FlockDove flap="pc-flap-fast" size={32} />
            <FlockDove flap="pc-flap-med" size={24} delay="0.18s" />
            <FlockDove flap="pc-flap-slow" size={20} delay="0.35s" />
          </div>
          <div className="pc-flock-2 absolute top-[21%] left-0 flex items-center">
            <FlockDove flap="pc-flap-med" size={24} />
            <FlockDove flap="pc-flap-fast" size={28} delay="0.22s" />
            <FlockDove flap="pc-flap-slow" size={16} delay="0.4s" />
          </div>
        </>
      )}
      {DOVES.slice(0, Math.max(0, Math.min(4, doves))).map((d) => (
        <Dove key={d.flight} spec={d} />
      ))}
      {clouds > 0 && (
        <>
          <PastelCloud className="absolute -left-10 top-[6%] w-44 opacity-80 pc-cloud-stage" />
          {clouds > 1 && <PastelCloud flip className="absolute -right-10 top-[16%] w-36 opacity-70 pc-cloud-stage" />}
        </>
      )}
      {motes && (
        <>
          <span className="absolute w-2 h-2 rounded-full bg-amber-200/70 blur-[0.8px] pc-mote-1" style={{ top: "28%", left: "16%" }} />
          <span className="absolute w-2.5 h-2.5 rounded-full bg-yellow-100/80 blur-[1px] pc-mote-2" style={{ top: "36%", right: "20%" }} />
          <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/60 blur-[0.5px] pc-mote-3" style={{ top: "52%", left: "32%" }} />
          <svg className="absolute pc-sparkle-1" style={{ bottom: "28%", left: "8%" }} fill="none" height="16" viewBox="0 0 24 24" width="16">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#d4af37" opacity="0.85" />
          </svg>
          <svg className="absolute pc-sparkle-2" style={{ bottom: "36%", right: "10%" }} fill="none" height="14" viewBox="0 0 24 24" width="14">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#f2ca50" />
          </svg>
        </>
      )}
      {petals && (
        <>
          <span className="absolute w-3 h-2.5 rounded-full bg-[#FFF9F0] pc-fall-1" style={{ top: "-4%", left: "12%" }} />
          <span className="absolute w-2 h-2.5 rounded-full bg-[#F7E7DC] pc-fall-2" style={{ top: "-4%", left: "64%" }} />
          <span className="absolute w-2 h-2.5 rounded-full bg-[#FFE8B8] pc-fall-3" style={{ top: "-4%", left: "85%" }} />
        </>
      )}
      {pearls && (
        <>
          <span className="absolute bottom-[38%] left-[16%] w-2 h-2 rounded-full bg-gradient-to-r from-amber-200 to-white pc-pearl-1" />
          <span className="absolute bottom-[28%] right-[20%] w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-100 to-white pc-pearl-2" />
          <span className="absolute bottom-[46%] right-[14%] w-1.5 h-1.5 rounded-full bg-white pc-pearl-3" />
          <span className="absolute bottom-[34%] left-[26%] w-2 h-2 rounded-full bg-amber-100 pc-pearl-4" />
          <span className="absolute bottom-[22%] left-[48%] w-1.5 h-1.5 rounded-full bg-white pc-pearl-5" />
        </>
      )}
      {waves && (
        <div className="absolute inset-x-[-30px] bottom-[8%] pointer-events-none">
          <svg className="w-[130%] h-10 pc-wave-1" viewBox="0 0 430 40" fill="none" preserveAspectRatio="none">
            <path d="M0 22 Q 30 12 60 22 T 120 22 T 180 22 T 240 22 T 300 22 T 360 22 T 420 22 T 480 22" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
          </svg>
          <svg className="w-[130%] h-8 pc-wave-2 -mt-4" viewBox="0 0 430 32" fill="none" preserveAspectRatio="none">
            <path className="pc-ripple" d="M0 16 Q 40 8 80 16 T 160 16 T 240 16 T 320 16 T 400 16 T 480 16" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
        </div>
      )}
    </div>
  )
}
