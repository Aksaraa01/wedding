export default function FeatureBento() {
  return (
    <section className="relative z-10 w-full py-24 bg-[#051711]/40 backdrop-blur-[2px] scroll-mt-24" id="fitur-utama">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="font-headline-lg text-headline-lg text-[#D2E7DD] font-serif">Fitur Utama Untuk Anda</h2>
          <p className="font-body-lg text-body-lg text-[#D2C4B5]">Setiap detail dirancang dengan presisi sesuai kebutuhan Anda</p>
        </div>

        {/* 2-Column Grid (6 Large Apple-Style Feature Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Card 1: Digital Invitation */}
          <div className="relative overflow-hidden rounded-2xl min-h-[360px] flex flex-col justify-end p-8 border border-[#9B8F81]/30 hover:border-[#EAC082]/40 transition-all duration-300 group shadow-xl bg-[#02110C]/60">
            <img
              alt="Digital Invitation - Cinematic Atmosphere"
              className="absolute inset-0 w-full h-full object-cover scale-110 sm:scale-100 group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtf68NdD2KNx3pwSuGh_Qy1sKD85eCk9iGyNu7OZ3Rkj5HAVZLxyL1ET63Cw7-mmqM6fDOApHlaYRyvG_iJvMOflQZI-UOHuviMGMNT8qvTQcEmNvcwTlH8QMU8Zrj4TwF7T-csf-uLPKMj1s_RzjvtZVxXIcnxjNN_d9fSRxPRdaSXaIAdGkN_-olRMUdTENQBkA32CwoCkkBUKMgjad7sfPPlD-fLliIiHrtFabPFJLSf2lkPta4CK1j07Hkio95uXrPcNJXVssstA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/80 to-transparent" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-label-md text-label-md uppercase tracking-wider text-[#EAC082] font-semibold">DESAIN &amp; TIPOGRAFI SIGNATURE</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1C2D27]/80 backdrop-blur-md text-[#EAC082] font-label-sm text-label-sm border border-[#EAC082]/20 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  <span>Lossless 24-bit</span>
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white font-serif tracking-tight">Digital Invitation</h3>
              <p className="font-body-md text-body-md text-[#D2C4B5] leading-relaxed max-w-lg">
                <b>Undangan Sinematik yang Menghidupkan Momen.</b> Bukan sekadar tautan, tapi mahakarya visual dengan alunan musik <i>lossless</i> dan sapaan personal eksklusif untuk setiap tamu kehormatan Anda.
              </p>
            </div>
          </div>

          {/* Card 2: QR Pass Express */}
          <div className="relative overflow-hidden rounded-2xl min-h-[360px] flex flex-col justify-end p-8 border border-[#9B8F81]/30 hover:border-[#EAC082]/40 transition-all duration-300 group shadow-xl bg-[#02110C]/60">
            <img
              alt="QR Pass Express - Reception Gala"
              className="absolute inset-0 w-full h-full object-cover scale-110 sm:scale-100 group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbHk7JDQDxGNwgQROrDNl5wYWHFH9Lx1auoeaDRmapE1BYxYVQ3ZXIV1QjQH5AOSZO4UAzEQoFujCnhYvI5FUPi_KJ0UMj0KIDRzB2QvIGZiQ05uDNzyzRb3n4REsUeFGs2GXVNC56W8LMgINB_Fjp_6_d5XAfiEst0XhzIwreYlz5Ph3w5RjBAcj9XI9_KHkxbYnBke_cShzY7QpBSFDs-xvuqYkMl7eEcAKkbiFCLOfzqbigTVTLz8rf578sgHJbOJaRuefo_gzN4g"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/80 to-transparent" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-label-md text-label-md uppercase tracking-wider text-[#9FD1BB] font-semibold">BUKU TAMU VIP &amp; CHECK-IN</span>
                <span className="px-2.5 py-1 rounded-full bg-[#215240]/80 backdrop-blur-md text-[#9FD1BB] font-label-sm text-label-sm border border-[#9FD1BB]/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">qr_code_scanner</span>
                  <span>&lt; 1.8 Detik</span>
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white font-serif tracking-tight">QR Pass Express</h3>
              <p className="font-body-md text-body-md text-[#D2C4B5] leading-relaxed max-w-lg">
                <b>Penyambutan VIP Tanpa Antre.</b> Ucapkan selamat tinggal pada buku tamu manual. Check-in kilat berbasis QR code di meja resepsi, selesai dalam hitungan detik.
              </p>
            </div>
          </div>

          {/* Card 3: Reservasi */}
          <div className="relative overflow-hidden rounded-2xl min-h-[360px] flex flex-col justify-end p-8 border border-[#9B8F81]/30 hover:border-[#EAC082]/40 transition-all duration-300 group shadow-xl bg-[#02110C]/60">
            <img
              alt="RSVP Presisi - Islamic Family Celebration"
              className="absolute inset-0 w-full h-full object-cover scale-110 sm:scale-100 group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7AyJaUG-JP1cB0nOhdTV1Ehykx7XDS_OhlxUZBzzZ2eFiUZmaBC7HpgBRcwTgZi4X4T-eD539hGOc4kPQk2tnVk8W5NSj0T19OuVHfCN6ok59MHSjqYc5FDMv0xQO3AO6UuXBB1dhNfopZKWZq_MLYzoGF18yGItKzzQDLbAtD_iU2RZeaMeGqVJW41caHIbiR2TZIKUCcn1qSqnMf3gW52BL9z4wgMYPvBrlr2Y"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/80 to-transparent" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-label-md text-label-md uppercase tracking-wider text-[#EAC082] font-semibold">LIVE ACTIVITY &amp; KUOTA</span>
                <span className="px-2.5 py-1 rounded-full bg-[#215240]/80 backdrop-blur-md text-[#9FD1BB] font-label-sm text-label-sm border border-[#9FD1BB]/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9FD1BB] animate-pulse" />
                  <span>94% Hadir</span>
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white font-serif tracking-tight">Reservasi</h3>
              <p className="font-body-md text-body-md text-[#D2C4B5] leading-relaxed max-w-lg">
                <b>Kendali Penuh Kapasitas Acara.</b> Pantau kepastian kehadiran, alokasi kursi, dan estimasi porsi katering secara <i>real-time</i> langsung dalam genggapan Anda
              </p>
            </div>
          </div>

          {/* Card 4: Candid Camera */}
          <div className="relative overflow-hidden rounded-2xl min-h-[360px] flex flex-col justify-end p-8 border border-[#9B8F81]/30 hover:border-[#EAC082]/40 transition-all duration-300 group shadow-xl bg-[#02110C]/60">
            <img
              alt="Candid Camera - Live Guest Gallery"
              className="absolute inset-0 w-full h-full object-cover scale-110 sm:scale-100 group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuADcRr98SN7C8UB4f88t5DieiR7zA6pFn6g1kXALIVmrjRHPTE5U5RYD_Rnlongj3VGN15YG5FMP2jwlZahV1FaV3c47OcPo742P_CmQfovCASG9fDIwdm7OncR8KsW9AHA6zQxt5fTh7d_g_bV2Iky2f-tGdkBf9ixp8qLuaR8A1M5S7x_tZz6ZkG7TER-m9-r-aOMA2dfQD7yI_zzU9n4eDvO3lID8niWihWdR-Y"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/80 to-transparent" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-label-md text-label-md uppercase tracking-wider text-[#9FD1BB] font-semibold">LIVE GUEST GALLERY</span>
                <span className="px-2.5 py-1 rounded-full bg-[#215240]/80 backdrop-blur-md text-[#9FD1BB] font-label-sm text-label-sm border border-[#9FD1BB]/30 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                  <span>Live Stream</span>
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white font-serif tracking-tight">Candid Camera</h3>
              <p className="font-body-md text-body-md text-[#D2C4B5] leading-relaxed max-w-lg">
                <b>Galeri Hidup dari Sudut Pandang Tamu.</b> Biarkan para kerabat berbagi momen spontan dan potret <i>candid</i> secara langsung ke galeri interaktif selama acara berlangsung
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
