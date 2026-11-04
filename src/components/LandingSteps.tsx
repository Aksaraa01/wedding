const STEPS = [
  {
    icon: "palette",
    title: "Pilih tema",
    text: "100+ desain pernikahan, adat, modern, hingga tanpa foto. Preview langsung dari layar HP.",
  },
  {
    icon: "edit_note",
    title: "Isi data acara",
    text: "Mempelai, jadwal, lokasi maps, love story, dan galeri. Editor rapi tanpa keahlian desain.",
  },
  {
    icon: "send",
    title: "Bagikan & pantau",
    text: "Kirim tautan personal via WhatsApp, pantau RSVP real-time, dan check-in QR di hari-H.",
  },
]

export default function LandingSteps() {
  return (
    <section className="relative z-10 w-full bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col gap-2 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D4D39] md:text-[11px]">
              Cara kerjanya
            </p>
            <h2 className="mt-2 font-headline-lg text-[24px] leading-[1.2] tracking-tight text-[#1A1817] md:text-headline-lg">
              Tiga langkah, undangan siap dibagikan.
            </h2>
          </div>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-[#6E6A63] md:text-right md:text-[14px]">
            Dari nol sampai tamu menerima tautan personal, rata-rata selesai dalam 15 menit.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex items-start gap-3.5 rounded-2xl border border-[#F0EAE0] bg-[#FCFAF6] p-4 md:block md:p-7"
            >
              <div className="flex shrink-0 items-center gap-3 md:mb-6 md:justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8D4D39] shadow-sm md:h-11 md:w-11">
                  <span className="material-symbols-outlined text-[19px] md:text-[22px]">{step.icon}</span>
                </span>
                <span className="font-headline-lg text-[26px] leading-none text-[#E3D8C6] md:text-[32px]">
                  0{i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-[16px] leading-tight tracking-tight text-[#1A1817] md:text-[20px]">
                  {step.title}
                </h3>
                <p className="mt-1 text-[12px] leading-[1.6] text-[#6E6A63] md:mt-2 md:text-[13.5px] md:leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
