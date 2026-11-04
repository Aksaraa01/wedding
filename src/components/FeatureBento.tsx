const FEATURES = [
  {
    label: "Desain & Tipografi Signature",
    badge: "Lossless 24-bit",
    badgeIcon: "graphic_eq",
    title: "Digital Invitation",
    lead: "Undangan Sinematik yang Menghidupkan Momen.",
    text: "Bukan sekadar tautan, tapi mahakarya visual dengan alunan musik lossless dan sapaan personal eksklusif untuk setiap tamu kehormatan Anda.",
    accent: "#9A7333",
    href: "/premium-web-invitation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtf68NdD2KNx3pwSuGh_Qy1sKD85eCk9iGyNu7OZ3Rkj5HAVZLxyL1ET63Cw7-mmqM6fDOApHlaYRyvG_iJvMOflQZI-UOHuviMGMNT8qvTQcEmNvcwTlH8QMU8Zrj4TwF7T-csf-uLPKMj1s_RzjvtZVxXIcnxjNN_d9fSRxPRdaSXaIAdGkN_-olRMUdTENQBkA32CwoCkkBUKMgjad7sfPPlD-fLliIiHrtFabPFJLSf2lkPta4CK1j07Hkio95uXrPcNJXVssstA",
    alt: "Undangan digital sinematik dengan suasana hangat",
  },
  {
    label: "Buku Tamu VIP & Check-in",
    badge: "< 1.8 Detik",
    badgeIcon: "qr_code_scanner",
    title: "QR Pass Express",
    lead: "Penyambutan VIP Tanpa Antre.",
    text: "Ucapkan selamat tinggal pada buku tamu manual. Check-in kilat berbasis QR code di meja resepsi, selesai dalam hitungan detik.",
    accent: "#2F6B54",
    href: "/qr-digital-buku-tamu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbHk7JDQDxGNwgQROrDNl5wYWHFH9Lx1auoeaDRmapE1BYxYVQ3ZXIV1QjQH5AOSZO4UAzEQoFujCnhYvI5FUPi_KJ0UMj0KIDRzB2QvIGZiQ05uDNzyzRb3n4REsUeFGs2GXVNC56W8LMgINB_Fjp_6_d5XAfiEst0XhzIwreYlz5Ph3w5RjBAcj9XI9_KHkxbYnBke_cShzY7QpBSFDs-xvuqYkMl7eEcAKkbiFCLOfzqbigTVTLz8rf578sgHJbOJaRuefo_gzN4g",
    alt: "Meja resepsi dengan check-in QR tamu",
  },
  {
    label: "Live Activity & Kuota",
    badge: "94% Hadir",
    badgeIcon: "sensors",
    title: "Reservasi",
    lead: "Kendali Penuh Kapasitas Acara.",
    text: "Pantau kepastian kehadiran, alokasi kursi, dan estimasi porsi katering secara real-time langsung dalam genggaman Anda.",
    accent: "#9A7333",
    href: "/premium-web-invitation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7AyJaUG-JP1cB0nOhdTV1Ehykx7XDS_OhlxUZBzzZ2eFiUZmaBC7HpgBRcwTgZi4X4T-eD539hGOc4kPQk2tnVk8W5NSj0T19OuVHfCN6ok59MHSjqYc5FDMv0xQO3AO6UuXBB1dhNfopZKWZq_MLYzoGF18yGItKzzQDLbAtD_iU2RZeaMeGqVJW41caHIbiR2TZIKUCcn1qSqnMf3gW52BL9z4wgMYPvBrlr2Y",
    alt: "Perayaan keluarga dengan pencatatan kehadiran",
  },
  {
    label: "Live Guest Gallery",
    badge: "Live Stream",
    badgeIcon: "photo_camera",
    title: "Candid Camera",
    lead: "Galeri Hidup dari Sudut Pandang Tamu.",
    text: "Biarkan para kerabat berbagi momen spontan dan potret candid secara langsung ke galeri interaktif selama acara berlangsung.",
    accent: "#2F6B54",
    href: "/galeri-kenangan-tamu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADcRr98SN7C8UB4f88t5DieiR7zA6pFn6g1kXALIVmrjRHPTE5U5RYD_Rnlongj3VGN15YG5FMP2jwlZahV1FaV3c47OcPo742P_CmQfovCASG9fDIwdm7OncR8KsW9AHA6zQxt5fTh7d_g_bV2Iky2f-tGdkBf9ixp8qLuaR8A1M5S7x_tZz6ZkG7TER-m9-r-aOMA2dfQD7yI_zzU9n4eDvO3lID8niWihWdR-Y",
    alt: "Galeri foto candid dari tamu undangan",
  },
] as const

export default function FeatureBento() {
  return (
    <section className="relative z-10 w-full scroll-mt-24 bg-white py-14 md:py-24" id="fitur-utama">
      <div className="mx-auto max-w-7xl space-y-7 px-6 md:space-y-12 lg:px-12">
        {/* Section Header */}
        <div className="space-y-2 md:mx-auto md:max-w-2xl md:space-y-3 md:text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D4D39] md:text-[11px]">
            Semua dalam satu undangan
          </p>
          <h2 className="font-headline-lg text-[24px] leading-[1.2] tracking-tight text-[#1A1817] md:text-headline-lg">
            Fitur utama untuk Anda
          </h2>
          <p className="text-[12.5px] leading-relaxed text-[#6E6A63] md:text-body-lg">
            Setiap detail dirancang presisi agar hari Anda berjalan tenang.
          </p>
        </div>

        {/* Mobile: swipeable cards · Desktop: 2-column grid */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {FEATURES.map((f) => (
            <a
              key={f.title}
              href={f.href}
              className="group flex w-[80%] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-[#EDE7DC] bg-white shadow-[0_1px_2px_rgba(26,24,23,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(26,24,23,0.35)] md:w-auto"
            >
              <div className="relative h-[150px] w-full shrink-0 overflow-hidden bg-[#F6F1E8] md:h-[190px]">
                <img
                  alt={f.alt}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  src={f.image}
                  loading="lazy"
                />
                <span
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/90 px-2 py-1 text-[9px] font-semibold text-[#1A1817] shadow-sm backdrop-blur-md md:right-5 md:top-5 md:gap-1.5 md:px-2.5 md:text-label-sm"
                  style={{ color: f.accent }}
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[13px]">{f.badgeIcon}</span>
                  <span>{f.badge}</span>
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3 md:p-7 md:pt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] md:text-label-md md:tracking-wider" style={{ color: f.accent }}>
                  {f.label}
                </p>
                <h3 className="mt-1 font-headline-md text-[18px] leading-tight tracking-tight text-[#1A1817] md:mt-2 md:text-headline-md">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.6] text-[#6E6A63] md:mt-2.5 md:text-[14px] md:leading-relaxed">
                  <b className="font-semibold text-[#3B3833]">{f.lead}</b> {f.text}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#8D4D39] md:pt-4 md:text-[11px]">
                  Selengkapnya
                  <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] text-[#A39B8E] md:hidden">
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          Geser untuk lihat semua
        </p>
      </div>
    </section>
  )
}
