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

export default function EditorialModern({ bride_name, groom_name, estimated_wedding_date, guest_name }: Props) {
  const weddingDateFormatted = estimated_wedding_date
    ? new Date(estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <ThemeInjector display="Libre Baskerville" script="Great Vibes" body="Inter">
      <main className="min-h-screen bg-white text-[#1a1a1a] font-serif">
        <section className="grid md:grid-cols-2 min-h-screen">
          <div className="flex items-center justify-center p-12">
            <div className="max-w-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#b8860b] mb-4">The Wedding of</p>
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">{bride_name}</h1>
              <p className="font-script text-3xl text-[#b8860b] my-4">&amp;</p>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight">{groom_name}</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mt-6">{weddingDateFormatted}</p>
              <p className="text-sm mt-10 text-gray-500">Kepada Yth. <span className="text-[#b8860b]">{guest_name}</span></p>
            </div>
          </div>
          <div className="bg-[#faf8f4] flex items-center justify-center p-12">
            <div className="w-64 h-80 bg-gradient-to-br from-[#b8860b]/10 to-transparent border border-[#b8860b]/20" />
          </div>
        </section>
        <MotionSection>
          <section className="py-20 px-6 text-center max-w-lg mx-auto">
            <p className="text-sm italic leading-relaxed text-gray-500">&ldquo;...supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.&rdquo;</p>
            <p className="text-[10px] uppercase tracking-[0.15em] mt-4 text-gray-400">QS. Ar-Rum: 21</p>
          </section>
        </MotionSection>
        <MotionSection>
          <section className="py-16 px-6 bg-[#faf8f4]">
            <p className="text-[10px] uppercase tracking-[0.25em] text-center text-gray-400 mb-12">Mempelai</p>
            <div className="grid md:grid-cols-2 gap-10 max-w-2xl mx-auto text-center">
              <div>
                <div className="w-36 h-48 mx-auto mb-4 bg-gradient-to-br from-[#b8860b]/10 to-transparent" />
                <p className="text-lg font-serif">{bride_name}</p>
                <p className="text-xs text-gray-400 italic mt-1">Putri dari Bpk. Ariffin & Ibu Nawen</p>
              </div>
              <div>
                <div className="w-36 h-48 mx-auto mb-4 bg-gradient-to-br from-[#b8860b]/10 to-transparent" />
                <p className="text-lg font-serif">{groom_name}</p>
                <p className="text-xs text-gray-400 italic mt-1">Putra dari Bpk. Syahrum & Ibu Tugini</p>
              </div>
            </div>
          </section>
        </MotionSection>
      </main>
    </ThemeInjector>
  )
}