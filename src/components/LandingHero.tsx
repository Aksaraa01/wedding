import { waLink } from "@/lib/contact"

const WA_MULAI_LINK = waLink("Halo Aksaraa Wedding, saya ingin membuat undangan pernikahan digital untuk momen saya.")

const AVATARS = [
  "/templates/imagine/thumbnail.webp",
  "/templates/manjari/thumbnail.webp",
  "/templates/lace/thumbnail.webp",
  "/templates/ivory-lace/thumbnail.webp",
]

export default function LandingHero() {
  return (
    <section className="relative z-10 w-full overflow-hidden bg-white pb-14 pt-8 sm:pb-20 lg:pb-24 lg:pt-12">
      {/* Warm wash behind the hero, fading into white */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-[#FBF6EC] via-[#FDFAF4] to-white"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-12">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8DFCE] bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-sm sm:mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
            <span className="font-label-md text-[10px] uppercase tracking-[0.16em] text-[#8D4D39] sm:text-label-md">
              Undangan digital &amp; manajemen tamu
            </span>
          </div>

          <h1 className="font-display-hero text-display-hero-mobile tracking-tight text-[#1A1817] md:text-display-hero">
            Momen berharga.
            <span
              className="mt-1 block text-[#8D4D39]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Kini jauh lebih berkesan.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl font-body-lg text-[15px] leading-relaxed text-[#6E6A63] sm:text-body-lg lg:mx-0">
            Lebih dari sekadar undangan. Satu sistem rapi untuk resepsi, RSVP, buku tamu QR,
            galeri tamu, dan pengingat WhatsApp dalam satu tautan.
          </p>

          <div className="mt-6 flex flex-row items-stretch justify-center gap-2 sm:mt-7 sm:gap-3 lg:justify-start">
            <a
              href={WA_MULAI_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#1A1817] px-4 py-2.5 font-label-lg text-[11.5px] text-white shadow-[0_10px_24px_-12px_rgba(26,24,23,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8D4D39] sm:flex-none sm:gap-2 sm:px-6 sm:py-3 sm:text-label-lg"
            >
              Mulai Sekarang
              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
            </a>
            <a
              href="/templates"
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#DDD5C7] bg-white px-4 py-2.5 font-label-lg text-[11.5px] text-[#1A1817] transition-colors duration-200 hover:border-[#1A1817] sm:flex-none sm:px-6 sm:py-3 sm:text-label-lg"
            >
              Lihat 100+ Tema
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 lg:justify-start">
            <div className="flex -space-x-2.5">
              {AVATARS.map((src, i) => (
                <span key={i} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-[#F3EEE5] shadow-sm">
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </span>
              ))}
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#F3EEE5] text-[11px] font-semibold text-[#8D4D39] shadow-sm">
                +
              </span>
            </div>
            <p className="text-left text-[12px] leading-tight text-[#6E6A63] sm:text-sm">
              <span className="font-semibold text-[#1A1817]">1.000+</span> undangan terkirim minggu ini
            </p>
          </div>
        </div>

        {/* Device stage */}
        <div className="relative flex justify-center lg:justify-end">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-0 mx-auto h-[420px] w-[420px] max-w-full rounded-full bg-[radial-gradient(circle,#F2E8D5_0%,transparent_70%)] opacity-80 blur-2xl"
          />

          {/* Floating card: RSVP */}
          <div className="absolute -left-2 top-16 z-20 hidden w-[190px] rounded-2xl border border-[#EDE7DC] bg-white/95 p-3.5 shadow-[0_18px_40px_-24px_rgba(26,24,23,0.4)] backdrop-blur lg:block xl:-left-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF4EF] text-[#2F6B54]">
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              </span>
              <div>
                <p className="font-label-sm text-[9px] uppercase tracking-[0.12em] text-[#8A847A]">RSVP masuk</p>
                <p className="text-[12px] font-semibold text-[#1A1817]">182 tamu konfirmasi</p>
              </div>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F1ECE2]">
              <div className="h-full w-4/5 rounded-full bg-[#2F6B54]" />
            </div>
          </div>

          {/* Floating card: QR */}
          <div className="absolute -bottom-5 right-0 z-20 hidden w-[190px] xl:-right-8 rounded-2xl border border-[#EDE7DC] bg-white/95 p-3.5 shadow-[0_18px_40px_-24px_rgba(26,24,23,0.4)] backdrop-blur lg:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7EFE2] text-[#8D4D39]">
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              </span>
              <div>
                <p className="font-label-sm text-[9px] uppercase tracking-[0.12em] text-[#8A847A]">Check-in tamu</p>
                <p className="text-[12px] font-semibold text-[#1A1817]">QR pass • &lt; 1,8 detik</p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="relative z-10 w-[min(250px,72vw)] rounded-[42px] border border-[#EDE7DC] bg-[#F4EFE6] p-2.5 shadow-[0_40px_80px_-40px_rgba(26,24,23,0.45)] sm:w-[290px] lg:w-[310px]">
            <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[34px] bg-[#1A1817]">
              <img
                src="/templates/imagine/thumbnail.webp"
                alt="Contoh undangan pernikahan digital Aksaraa di layar ponsel"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/45 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-3.5">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-white/12 p-2.5 backdrop-blur-md">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAC082] text-[#4A3505]">
                      <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold text-white">Claire de Lune</p>
                      <p className="truncate text-[9px] text-white/70">Simfoni pengiring resepsi</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#EAC082]">pause_circle</span>
                </div>
                <div className="w-full rounded-full bg-[#EAC082] py-2.5 text-center font-label-md text-[10px] font-bold tracking-wide text-[#442C00]">
                  Buka Surat &amp; RSVP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick value strip */}
      <div className="relative mx-auto mt-12 max-w-7xl px-6 lg:mt-16 lg:px-12">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[#F0EAE0] pt-6 sm:grid-cols-4 sm:gap-6">
          {[
            { icon: "event_available", title: "RSVP real-time" },
            { icon: "qr_code_scanner", title: "Buku tamu QR" },
            { icon: "photo_library", title: "Galeri foto tamu" },
            { icon: "chat", title: "Reminder WhatsApp" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF6EE] text-[#8D4D39]">
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              </span>
              <span className="text-[11.5px] font-semibold text-[#3B3833] sm:text-[13px]">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
