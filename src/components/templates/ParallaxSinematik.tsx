"use client"

import ThemeInjector from "./shared/ThemeInjector"
import MotionSection from "./shared/MotionSection"

interface Props {
  bride_name?: string
  groom_name?: string
  estimated_wedding_date?: string
  slug?: string
  guest_name?: string
}

export default function ParallaxSinematik({ bride_name, groom_name, estimated_wedding_date, guest_name }: Props) {
  const weddingDateFormatted = estimated_wedding_date
    ? new Date(estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <ThemeInjector display="Playfair Display" script="Great Vibes" body="Inter">
      <main className="min-h-screen bg-[#0a0a0f] text-[#f0eee6]">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#1a1520] to-[#0a0a0f]" />
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#c9a96e]/5 blur-[80px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#c9a96e]/5 blur-[100px]" />
          <div className="relative z-10 text-center px-6 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]/60 mb-4">The Wedding of</p>
            <h1 className="text-5xl md:text-7xl font-light tracking-wide leading-tight">{bride_name}</h1>
            <p className="font-script text-3xl md:text-4xl text-[#c9a96e] my-6">&amp;</p>
            <h2 className="text-5xl md:text-7xl font-light tracking-wide leading-tight">{groom_name}</h2>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-white/40 mt-8">{weddingDateFormatted}</p>
            <p className="font-sans text-sm mt-12 text-white/60">Kepada Yth. <span className="text-[#c9a96e]">{guest_name}</span></p>
          </div>
        </section>
        <MotionSection>
          <section className="py-24 px-6 text-center max-w-lg mx-auto">
            <p className="font-script text-2xl text-[#c9a96e] mb-6">&ldquo;</p>
            <p className="font-sans text-sm leading-relaxed text-white/60 italic">
              Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri...
            </p>
            <p className="font-sans text-[10px] uppercase tracking-[0.15em] mt-6 text-white/30">QS. Ar-Rum: 21</p>
            <div className="w-12 h-px bg-[#c9a96e]/40 mx-auto mt-8" />
          </section>
        </MotionSection>
        <MotionSection>
          <section className="py-20 px-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/40 text-center mb-12">Mempelai</p>
            <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto text-center">
              <div>
                <div className="w-40 h-56 mx-auto mb-5 bg-gradient-to-br from-[#c9a96e]/10 to-transparent" />
                <p className="font-sans text-2xl font-light">{bride_name}</p>
                <p className="font-sans text-xs text-white/40 italic mt-2">Putri dari Bpk. Ariffin & Ibu Nawen</p>
              </div>
              <div>
                <div className="w-40 h-56 mx-auto mb-5 bg-gradient-to-br from-[#c9a96e]/10 to-transparent" />
                <p className="font-sans text-2xl font-light">{groom_name}</p>
                <p className="font-sans text-xs text-white/40 italic mt-2">Putra dari Bpk. Syahrum & Ibu Tugini</p>
              </div>
            </div>
          </section>
        </MotionSection>
      </main>
    </ThemeInjector>
  )
}