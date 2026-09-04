"use client"

import { useState } from "react"

const MODULES = [
  {
    icon: "language",
    title: "Web Invitation & RSVP",
    desc: "Manjakan tamu dengan undangan sinematik personal, lengkap dengan RSVP real-time untuk katering dan acara presisi",
  },
  {
    icon: "qr_code_2",
    title: "VIP Reception QR Pass",
    desc: "Berikan kesan pertama yang mewah dan istimewa bagi tamu undangan Anda dengan proses masuk yang super cepat dan elegan",
  },
  {
    icon: "settings_input_component",
    title: "Virtual Wish Wall",
    desc: "Hadirkan pengalaman interaktif, ucapan dari HP tamu tayang seketika di layar LED venue, menciptakan momen tak terlupakan",
  },
  {
    icon: "chat_bubble_outline",
    title: "Auto-Reminder WhatsApp",
    desc: "Pastikan tamu penting hadir melalui reminder dan undangan digital otomatis berisi lokasi, waktu, dan QR Pass cepat.",
  },
]

export default function FeaturesSection() {
  const [name, setName] = useState("")
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!name.trim()) return
    setIframeSrc(`/welcome?name=${encodeURIComponent(name.trim())}`)
  }

  return (
    <>
      {/* Ecosystem Matrix */}
      <section className="py-20 md:py-section-gap px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto bg-surface-container-low">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-24 gap-6 md:gap-8">
          <div className="max-w-2xl">
            <span className="font-label-md text-[11px] md:text-label-md text-secondary uppercase tracking-[0.3em] mb-3 md:mb-4 block">
              The Ecosystem
            </span>
            <h2 className="font-headline-xl text-[26px] leading-[1.2] md:text-headline-xl text-primary">
              Simfoni dalam Satu Genggaman.
            </h2>
          </div>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant max-w-xs italic border-l border-secondary pl-4 md:pl-6">
            Setiap fitur hadir untuk melancarkan seluruh rangkaian acara, sehingga Anda dan pasangan bisa menikmati pernikahan tanpa beban.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter">
          {MODULES.map((m) => (
            <div
              key={m.title}
              className="group bg-surface p-6 md:p-10 border border-outline-variant/30 flex flex-col justify-between hover:bg-primary transition-all duration-700 md:h-[420px] rounded-none"
            >
              <div>
                <span className="material-symbols-outlined text-3xl md:text-headline-md text-secondary group-hover:text-on-primary transition-colors">
                  {m.icon}
                </span>
                <h3 className="font-headline-md text-lg leading-snug md:text-headline-md mt-4 md:mt-6 group-hover:text-on-primary">
                  {m.title}
                </h3>
              </div>
              <p className="font-body-md text-sm md:text-body-md leading-relaxed text-on-surface-variant group-hover:text-[#ffffff]/70 transition-colors mt-6 md:mt-0">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Try-It-Now Widget */}
      <section className="py-20 md:py-section-gap px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto">
        <div className="bg-primary text-on-primary flex flex-col lg:flex-row items-center overflow-hidden">
          <div className="lg:w-1/2 w-full p-6 sm:p-10 md:p-24 space-y-5 md:space-y-8">
            <span className="font-label-md text-[11px] md:text-label-md text-secondary uppercase tracking-widest">
              Interactive Demo
            </span>
            <h2 className="font-headline-xl text-[26px] leading-[1.2] md:text-headline-xl">
              Rasakan Sentuhan Personalnya.
            </h2>
            <p className="font-body-lg text-base md:text-body-lg leading-relaxed text-on-primary/70">
              Coba ketik nama Anda untuk melihat bagaimana sistem kami merespons setiap tamu secara personal.
            </p>
            <div className="space-y-5 md:space-y-6 pt-4 md:pt-6">
              <div className="relative group">
                <label className="font-label-md text-label-md text-on-primary/50 uppercase tracking-widest block mb-2">
                  Nama Tamu
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b border-on-primary/30 text-2xl md:text-headline-md font-headline-md focus:ring-0 focus:border-secondary transition-all placeholder:text-on-primary/20 p-0 pb-3 md:pb-4 outline-none"
                  placeholder="dela"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <button
                onClick={handleGenerate}
                className="w-full md:w-auto justify-center bg-secondary text-on-secondary px-8 py-4 min-h-[48px] font-label-md text-label-md uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3"
              >
                Generate Link & QR{" "}
                <span className="material-symbols-outlined">magic_button</span>
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 w-full h-[420px] md:h-[650px] lg:min-h-[800px] bg-surface-container-highest flex items-center justify-center p-0 relative overflow-hidden">
            {iframeSrc ? (
              <iframe
                src={iframeSrc}
                className="w-full h-full border-0"
                title="Welcome Preview"
              />
            ) : (
              <>
                <div className="absolute top-0 right-0 w-64 h-64 border-[0.5px] border-primary/10 rounded-full -mr-32 -mt-32" />
                <div className="text-center p-6 md:p-12 z-10">
                  <span className="material-symbols-outlined text-6xl text-primary/20 mb-4 block">
                    magic_button
                  </span>
                  <p className="font-body-md text-sm md:text-body-md text-primary/30 px-4">
                    Masukkan nama dan klik Generate
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
