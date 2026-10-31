export default function ClosingCta() {
  return (
    <section className="relative z-10 w-full py-28 lg:py-36 bg-[#051711]/40 backdrop-blur-[2px] overflow-hidden text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#EAC082]/5 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#9B8F81]/40 bg-[#1C2D27]/80 backdrop-blur-md mb-2 mx-auto shadow-sm">
          <span className="font-serif text-[18px] tracking-tight text-[#D2E7DD] font-semibold">Aksaraa</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C29B61] inline-block" />
        </div>
        <h2 className="font-headline-lg text-headline-lg font-serif text-[#D2E7DD] tracking-tight">
          Mau event Anda lebih terencana?
        </h2>
        <p className="font-body-lg text-body-lg text-[#D2C4B5] max-w-xl mx-auto leading-relaxed">
          Hanya butuh 5 menit untuk membuat perayaan Anda tampil berkelas dan tak terlupakan. Tanpa keahlian desain.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://wa.me/6281161613071"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-label-lg text-label-lg transition-all duration-300 shadow-xl hover:shadow-[#0071e3]/30"
          >
            Lanjut
          </a>
        </div>
      </div>
    </section>
  )
}
