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

export default function AnimasiWatercolor({ bride_name, groom_name, estimated_wedding_date, guest_name }: Props) {
  const weddingDateFormatted = estimated_wedding_date
    ? new Date(estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <ThemeInjector display="Quicksand" script="Dancing Script" body="Quicksand">
      <main className="min-h-screen bg-[#faf5f0] text-[#3d2c2e]">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#d4a5a5]/20 blur-[60px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#d4a5a5]/20 blur-[80px]" />
          <div className="absolute top-1/3 right-10 w-20 h-20 opacity-20"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#d4a5a5" strokeWidth="0.5"/><circle cx="50" cy="50" r="25" fill="none" stroke="#d4a5a5" strokeWidth="0.3"/></svg></div>
          <div className="relative z-10 text-center px-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#d4a5a5] mb-4">The Wedding of</p>
            <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">{bride_name}</h1>
            <p className="font-script text-3xl text-[#d4a5a5] my-4">&amp;</p>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-tight">{groom_name}</h2>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#3d2c2e]/50 mt-6">{weddingDateFormatted}</p>
            <p className="font-sans text-sm mt-10 text-[#3d2c2e]/60">Kepada Yth. <span className="text-[#d4a5a5]">{guest_name}</span></p>
          </div>
        </section>
        <MotionSection>
          <section className="py-24 px-6 text-center max-w-lg mx-auto">
            <p className="font-script text-3xl text-[#d4a5a5] mb-6">&ldquo;</p>
            <p className="font-sans text-sm leading-relaxed text-[#3d2c2e]/70 italic">&ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri...&rdquo;</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.15em] mt-6 text-[#3d2c2e]/40">QS. Ar-Rum: 21</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#d4a5a5] to-transparent mx-auto mt-8" />
          </section>
        </MotionSection>
        <MotionSection>
          <section className="py-20 px-6 bg-white/60">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-center text-[#3d2c2e]/40 mb-12">Mempelai</p>
            <div className="grid md:grid-cols-2 gap-10 max-w-2xl mx-auto text-center">
              <div>
                <div className="w-36 h-44 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#d4a5a5]/20 to-transparent" />
                <p className="font-display text-lg">{bride_name}</p>
                <p className="font-sans text-xs text-[#3d2c2e]/50 italic mt-1">Putri dari Bpk. Ariffin & Ibu Nawen</p>
              </div>
              <div>
                <div className="w-36 h-44 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#d4a5a5]/20 to-transparent" />
                <p className="font-display text-lg">{groom_name}</p>
                <p className="font-sans text-xs text-[#3d2c2e]/50 italic mt-1">Putra dari Bpk. Syahrum & Ibu Tugini</p>
              </div>
            </div>
          </section>
        </MotionSection>
      </main>
    </ThemeInjector>
  )
}