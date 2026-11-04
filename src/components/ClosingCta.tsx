import { waLink } from "@/lib/contact"

const WA_LINK = waLink("Halo Aksaraa Wedding, saya ingin berkonsultasi mengenai undangan dan manajemen tamu.")

export default function ClosingCta() {
  return (
    <section className="relative z-10 w-full bg-white pb-14 md:pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl border border-[#EDE4D5] bg-[#FBF6EC] px-6 py-10 text-center md:px-12 md:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#EFE1C9] opacity-60 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto mb-4 inline-flex items-center gap-2">
              <span className="font-headline-sm text-[18px] font-semibold tracking-tight text-[#1A1817]">Aksaraa</span>
              <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
            </div>
            <h2 className="font-headline-lg text-[24px] leading-[1.2] tracking-tight text-[#1A1817] md:text-[36px]">
              Mau event Anda lebih terencana?
            </h2>
            <p className="mx-auto mt-2.5 max-w-xl text-[12.5px] leading-relaxed text-[#6E6A63] md:text-[15px]">
              Lima menit untuk membuat perayaan tampil berkelas: tanpa keahlian desain,
              tanpa antre cetak, tanpa ribet.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1817] px-7 py-3 font-label-lg text-label-lg text-white transition-colors hover:bg-[#8D4D39]"
              >
                Mulai Sekarang
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
              <a
                href="/templates"
                className="inline-flex items-center justify-center rounded-full border border-[#DCD2C2] bg-white px-7 py-3 font-label-lg text-label-lg text-[#1A1817] transition-colors hover:border-[#1A1817]"
              >
                Lihat Template
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
