const FEATURES = [
  {
    label: "Desain & Tipografi Signature",
    badge: { icon: "auto_awesome", text: "Lossless 24-bit" },
    title: "Digital Invitation",
    lead: "Undangan Sinematik yang Menghidupkan Momen.",
    text: "Bukan sekadar tautan, tapi mahakarya visual dengan alunan musik lossless dan sapaan personal eksklusif untuk setiap tamu kehormatan Anda.",
    accent: "#EAC082",
    href: "/premium-web-invitation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtf68NdD2KNx3pwSuGh_Qy1sKD85eCk9iGyNu7OZ3Rkj5HAVZLxyL1ET63Cw7-mmqM6fDOApHlaYRyvG_iJvMOflQZI-UOHuviMGMNT8qvTQcEmNvcwTlH8QMU8Zrj4TwF7T-csf-uLPKMj1s_RzjvtZVxXIcnxjNN_d9fSRxPRdaSXaIAdGkN_-olRMUdTENQBkA32CwoCkkBUKMgjad7sfPPlD-fLliIiHrtFabPFJLSf2lkPta4CK1j07Hkio95uXrPcNJXVssstA",
    alt: "Undangan digital sinematik dengan suasana hangat",
  },
  {
    label: "Buku Tamu VIP & Check-in",
    badge: { icon: "qr_code_scanner", text: "< 1.8 Detik" },
    title: "QR Pass Express",
    lead: "Penyambutan VIP Tanpa Antre.",
    text: "Ucapkan selamat tinggal pada buku tamu manual. Check-in kilat berbasis QR code di meja resepsi, selesai dalam hitungan detik.",
    accent: "#9FD1BB",
    href: "/qr-digital-buku-tamu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbHk7JDQDxGNwgQROrDNl5wYWHFH9Lx1auoeaDRmapE1BYxYVQ3ZXIV1QjQH5AOSZO4UAzEQoFujCnhYvI5FUPi_KJ0UMj0KIDRzB2QvIGZiQ05uDNzyzRb3n4REsUeFGs2GXVNC56W8LMgINB_Fjp_6_d5XAfiEst0XhzIwreYlz5Ph3w5RjBAcj9XI9_KHkxbYnBke_cShzY7QpBSFDs-xvuqYkMl7eEcAKkbiFCLOfzqbigTVTLz8rf578sgHJbOJaRuefo_gzN4g",
    alt: "Meja resepsi dengan check-in QR tamu",
  },
  {
    label: "Live Activity & Kuota",
    badge: { icon: "sensors", text: "94% Hadir" },
    title: "Reservasi",
    lead: "Kendali Penuh Kapasitas Acara.",
    text: "Pantau kepastian kehadiran, alokasi kursi, dan estimasi porsi katering secara real-time langsung dalam genggaman Anda.",
    accent: "#EAC082",
    href: "/premium-web-invitation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7AyJaUG-JP1cB0nOhdTV1Ehykx7XDS_OhlxUZBzzZ2eFiUZmaBC7HpgBRcwTgZi4X4T-eD539hGOc4kPQk2tnVk8W5NSj0T19OuVHfCN6ok59MHSjqYc5FDMv0xQO3AO6UuXBB1dhNfopZKWZq_MLYzoGF18yGItKzzQDLbAtD_iU2RZeaMeGqVJW41caHIbiR2TZIKUCcn1qSqnMf3gW52BL9z4wgMYPvBrlr2Y",
    alt: "Perayaan keluarga dengan pencatatan kehadiran",
  },
  {
    label: "Live Guest Gallery",
    badge: { icon: "photo_camera", text: "Live Stream" },
    title: "Candid Camera",
    lead: "Galeri Hidup dari Sudut Pandang Tamu.",
    text: "Biarkan para kerabat berbagi momen spontan dan potret candid secara langsung ke galeri interaktif selama acara berlangsung.",
    accent: "#9FD1BB",
    href: "/galeri-kenangan-tamu",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADcRr98SN7C8UB4f88t5DieiR7zA6pFn6g1kXALIVmrjRHPTE5U5RYD_Rnlongj3VGN15YG5FMP2jwlZahV1FaV3c47OcPo742P_CmQfovCASG9fDIwdm7OncR8KsW9AHA6zQxt5fTh7d_g_bV2Iky2f-tGdkBf9ixp8qLuaR8A1M5S7x_tZz6ZkG7TER-m9-r-aOMA2dfQD7yI_zzU9n4eDvO3lID8niWihWdR-Y",
    alt: "Galeri foto candid dari tamu undangan",
  },
] as const

export default function FeatureBento() {
  return (
    <section className="relative z-10 w-full scroll-mt-24 bg-[#051711]/40 py-14 backdrop-blur-[2px] md:py-24" id="fitur-utama">
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 lg:px-12 md:space-y-12">
        {/* Section Header */}
        <div className="space-y-2 md:mx-auto md:max-w-3xl md:space-y-3 md:text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#EAC082] md:text-[11px]">
            Semua dalam satu undangan
          </p>
          <h2 className="font-headline-lg text-[24px] leading-[1.2] text-[#D2E7DD] font-serif md:text-headline-lg">
            Fitur Utama Untuk Anda
          </h2>
          <p className="text-[12.5px] leading-relaxed text-[#D2C4B5] md:text-body-lg">
            Setiap detail dirancang dengan presisi sesuai kebutuhan Anda
          </p>
        </div>

        {/* Mobile: swipeable app cards · Desktop: 2-column bento */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {FEATURES.map((f) => (
            <a
              key={f.title}
              href={f.href}
              className="group flex w-[80%] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-[#9B8F81]/30 bg-[#02110C]/80 shadow-xl transition-colors hover:border-[#EAC082]/40 md:w-auto"
            >
              <div className="relative h-[150px] w-full shrink-0 overflow-hidden md:h-[190px]">
                <img
                  alt={f.alt}
                  className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  src={f.image}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/25 to-transparent" />
                <span
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold backdrop-blur-md md:right-5 md:top-5 md:gap-1.5 md:px-2.5 md:text-label-sm"
                  style={{
                    color: f.accent,
                    borderColor: `${f.accent}33`,
                    backgroundColor: f.accent === "#EAC082" ? "rgba(28,45,39,0.8)" : "rgba(33,82,64,0.8)",
                  }}
                >
                  <span className="material-symbols-outlined text-[12px] md:text-[13px]">{f.badge.icon}</span>
                  <span>{f.badge.text}</span>
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3 md:p-7 md:pt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] md:text-label-md md:tracking-wider" style={{ color: f.accent }}>
                  {f.label}
                </p>
                <h3 className="mt-1 font-headline-md text-[18px] leading-tight text-white font-serif tracking-tight md:mt-2 md:text-headline-md">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.6] text-[#D2C4B5] md:mt-2.5 md:text-body-md md:leading-relaxed">
                  <b className="font-semibold text-[#EDE6DC]">{f.lead}</b> {f.text}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#EAC082] md:pt-4 md:text-[11px]">
                  Selengkapnya
                  <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] text-[#D2C4B5]/60 md:hidden">
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          Geser untuk lihat semua
        </p>
      </div>
    </section>
  )
}
