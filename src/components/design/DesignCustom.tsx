import { waLink } from "@/lib/contact"

const WA_CUSTOM = waLink(
  "Halo Aksaraa, saya mau tanya soal undangan dengan desain custom. Saya belum menemukan desain yang pas di katalog. Mohon dibantu, terima kasih.",
)

// Closing panel under the catalogue, copied from the reference: the visitor who
// scrolled the whole list either found a design or needs a custom one.
export default function DesignCustom({ sampleImage }: { sampleImage: string | null }) {
  return (
    <section id="custom" className="px-4 pb-12 pt-6 sm:px-6 md:px-10 md:pb-16 lg:px-16">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[26px] border border-[#EFE4D2] bg-[#FBF6EC] md:rounded-[32px]">
        <div className="grid items-stretch gap-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div
            className="relative flex min-h-[240px] items-center justify-center overflow-hidden px-6 py-8 md:min-h-[320px]"
            style={{ background: "radial-gradient(60% 60% at 50% 45%, #fde0e6 0, transparent 70%)" }}
          >
            {sampleImage && (
              <span className="relative block w-[min(46%,170px)] rotate-[4deg] overflow-hidden rounded-[22px] border-[5px] border-white bg-white shadow-[0_30px_50px_-24px_rgba(110,24,44,0.45)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleImage}
                  alt="Contoh desain undangan Aksaraa"
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[480/1039] h-auto w-full object-cover object-top"
                />
              </span>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8D4D39]">Desain custom</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-[26px] font-semibold leading-[1.1] tracking-tight text-[#1A1817] md:text-[34px]">
              Tidak ada yang pas di hati?
            </h2>
            <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-[#6E6A63] md:text-[14.5px]">
              Tim desain kami bisa membuatkan undangan khusus: warna, ilustrasi, dan nuansa sesuai keinginan kalian.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap md:mt-6">
              <a
                href={WA_CUSTOM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1A1817] px-5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
                Konsultasi desain custom
              </a>
              <a
                href="/portofolio"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DCD2C2] bg-white px-5 text-[12.5px] font-bold text-[#1A1817] transition-colors hover:border-[#1A1817]"
              >
                Lihat undangan klien
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
