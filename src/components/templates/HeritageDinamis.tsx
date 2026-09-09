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

function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10" stroke="#b8956a" strokeWidth="0.4" fill="none" opacity="0.3"/>
      <circle cx="50" cy="10" r="1.2" fill="#b8956a" opacity="0.25"/>
      <circle cx="100" cy="10" r="1.5" fill="#b8956a" opacity="0.35"/>
      <circle cx="150" cy="10" r="1.2" fill="#b8956a" opacity="0.25"/>
    </svg>
  )
}

export default function HeritageDinamis({ bride_name, groom_name, estimated_wedding_date, guest_name }: Props) {
  const weddingDateFormatted = estimated_wedding_date
    ? new Date(estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <ThemeInjector display="Marcellus" script="Alex Brush" body="Nunito">
      <main className="min-h-screen bg-[#f8f4ed] text-[#2b241c] font-serif">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4ed_0%,#ede6d8_50%,#f8f4ed_100%)]" />
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#b8956a] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#b8956a] to-transparent" />
          <div className="relative z-10 text-center px-6 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#b8956a]/70 mb-4">The Wedding of</p>
            <h1 className="text-4xl md:text-6xl font-serif tracking-wide leading-tight">{bride_name}</h1>
            <p className="font-script text-3xl md:text-4xl text-[#b8956a] my-5">&amp;</p>
            <h2 className="text-4xl md:text-6xl font-serif tracking-wide leading-tight">{groom_name}</h2>
            <Ornament className="w-40 h-4 mx-auto mt-8" />
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#2b241c]/50 mt-6">{weddingDateFormatted}</p>
            <p className="font-sans text-sm mt-12 text-[#2b241c]/60">Kepada Yth. <span className="text-[#b8956a]">{guest_name}</span></p>
          </div>
        </section>
        <MotionSection>
          <section className="py-24 px-6 text-center max-w-lg mx-auto">
            <Ornament className="w-32 h-4 mx-auto mb-8" />
            <p className="text-sm italic leading-relaxed text-[#2b241c]/60">&ldquo;...Dia menciptakan untukmu pasangan dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya...&rdquo;</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.15em] mt-6 text-[#2b241c]/40">QS. Ar-Rum: 21</p>
          </section>
        </MotionSection>
        <MotionSection>
          <section className="py-20 px-6 bg-white/50">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-center text-[#2b241c]/40 mb-12">Mempelai</p>
            <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto text-center">
              <div>
                <div className="w-40 h-52 mx-auto mb-5 border border-[#b8956a]/20 bg-gradient-to-br from-[#b8956a]/5 to-transparent" />
                <p className="text-xl font-serif">{bride_name}</p>
                <p className="font-sans text-xs text-[#2b241c]/50 italic mt-2">Putri dari Bpk. Ariffin & Ibu Nawen</p>
              </div>
              <div>
                <div className="w-40 h-52 mx-auto mb-5 border border-[#b8956a]/20 bg-gradient-to-br from-[#b8956a]/5 to-transparent" />
                <p className="text-xl font-serif">{groom_name}</p>
                <p className="font-sans text-xs text-[#2b241c]/50 italic mt-2">Putra dari Bpk. Syahrum & Ibu Tugini</p>
              </div>
            </div>
          </section>
        </MotionSection>
        <section className="py-16 text-center bg-[#2b241c] text-white/80">
          <p className="font-script text-2xl text-[#b8956a] mb-4">{bride_name} & {groom_name}</p>
          <p className="font-sans text-[10px] tracking-wider text-white/30">&copy; {new Date().getFullYear()} Aksaraa</p>
        </section>
      </main>
    </ThemeInjector>
  )
}