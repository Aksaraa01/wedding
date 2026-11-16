import type { Metadata } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import { KIDS_SITE } from "@/lib/eventType"

export const metadata: Metadata = {
  title: "Ceriavite — Undangan Digital Khitanan, Aqiqah & Ulang Tahun",
  description:
    "Undangan website untuk khitanan, aqiqah, dan ulang tahun ananda. Satu paket Rp 199.000 dengan RSVP, doa & ucapan, tautan tamu, dan tanda kasih.",
  alternates: { canonical: KIDS_SITE },
  openGraph: {
    title: "Ceriavite — Undangan Digital Acara Anak",
    description:
      "Undangan digital khitanan, aqiqah, dan ulang tahun. RSVP online, doa & ucapan, dan tanda kasih dalam satu tautan.",
    url: KIDS_SITE,
  },
}

export const revalidate = 3600

type KidsTemplate = {
  id: string
  code: string
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
}

async function getTemplates(): Promise<KidsTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,description,preview_image_url,demo_url")
    .eq("is_active", true)
    .eq("event_type", "kids")
    .order("sort_order", { ascending: true })
  return (data as KidsTemplate[] | null) || []
}

const FEATURES = [
  {
    icon: "how_to_reg",
    title: "Konfirmasi Kehadiran",
    body: "Tamu mengonfirmasi hadir atau tidak lewat satu tombol, lengkap dengan jumlah orang. Rekapnya rapi di dashboard.",
  },
  {
    icon: "favorite",
    title: "Doa & Ucapan",
    body: "Doa restu tamu terkumpul di satu halaman. Anda bisa memilih ucapan mana yang tampil di undangan.",
  },
  {
    icon: "redeem",
    title: "Tanda Kasih",
    body: "Rekening atau e-wallet tampil rapi. Tamu menyalin nomor dengan satu ketukan, tanpa salah ketik.",
  },
]

const STEPS = [
  { n: "01", title: "Daftar", body: "Isi nama ananda, orang tua, jenis acara, dan tanggal. Selesai dalam satu menit." },
  { n: "02", title: "Pilih desain & isi data", body: "Pilih template, unggah foto, lengkapi waktu dan tempat acara." },
  { n: "03", title: "Bagikan", body: "Kirim satu tautan ke WhatsApp. Setiap tamu membuka undangan dengan namanya sendiri." },
]

export default async function CeriaviteLandingPage() {
  const templates = await getTemplates()

  return (
    <div className="min-h-[100dvh] bg-[#320a11] text-[#f8f0e2]">
      <header className="border-b border-[#c9a227]/20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-headline-md text-lg tracking-tight">Ceriavite</span>
          <nav className="flex items-center gap-5">
            <a href="#desain" className="hidden text-[11px] uppercase tracking-[0.18em] text-[#f8f0e2]/70 sm:block">
              Desain
            </a>
            <a href="#harga" className="hidden text-[11px] uppercase tracking-[0.18em] text-[#f8f0e2]/70 sm:block">
              Harga
            </a>
            <Link href="/login" className="text-[11px] uppercase tracking-[0.18em] text-[#e6cd8b]">
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-full bg-[#c9a227] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#320a11]"
            >
              Buat undangan
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(201,162,39,0.22) 0 1px, transparent 1px 12px), repeating-linear-gradient(-45deg, rgba(201,162,39,0.16) 0 1px, transparent 1px 12px)",
              maskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 75%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#e6cd8b]">Undangan acara anak</p>
            <h1 className="mt-5 font-headline-md text-3xl leading-tight text-[#f8f0e2] sm:text-5xl">
              Undangan digital untuk
              <br />
              <span className="italic">khitanan, aqiqah,</span> dan ulang tahun
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#f8f0e2]/70 sm:text-base">
              Satu tautan untuk seluruh keluarga: kabar acara, konfirmasi kehadiran, doa restu,
              dan tanda kasih. Rapi di layar HP tamu, mudah diatur dari dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/daftar"
                className="w-full rounded-full bg-[#c9a227] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#320a11] sm:w-auto"
              >
                Buat undangan — Rp 199.000
              </Link>
              <a
                href="#desain"
                className="w-full rounded-full border border-[#c9a227]/45 px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-[#e6cd8b] sm:w-auto"
              >
                Lihat desain
              </a>
            </div>
            <p className="mt-4 text-[11px] tracking-wide text-[#f8f0e2]/45">
              Bayar sekali, tanpa biaya bulanan. Revisi data kapan saja.
            </p>
          </div>
        </section>

        <section id="desain" className="px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#e6cd8b]">Desain</p>
              <h2 className="mt-3 font-headline-md text-2xl sm:text-3xl">Pilih suasana acara ananda</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#f8f0e2]/65">
                Setiap desain sudah lengkap dengan RSVP, doa &amp; ucapan, galeri, dan tanda kasih.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(templates.length > 0 ? templates : PLACEHOLDER_TEMPLATES).map((tpl) => (
                <article key={tpl.code} className="overflow-hidden rounded-2xl border border-[#c9a227]/25 bg-[#3d0d16]">
                  <div className="relative aspect-[9/19] bg-[#4c1119]">
                    {tpl.preview_image_url && (
                      <img
                        src={tpl.preview_image_url}
                        alt={tpl.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-headline-md text-base text-[#f8f0e2]">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[#f8f0e2]/60">
                        {tpl.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        href={`/daftar?template=${tpl.code}`}
                        className="rounded-full bg-[#c9a227] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#320a11]"
                      >
                        Pakai desain ini
                      </Link>
                      {tpl.demo_url && (
                        <a
                          href={tpl.demo_url}
                          className="text-[10px] uppercase tracking-[0.16em] text-[#e6cd8b] underline-offset-4 hover:underline"
                        >
                          Pratinjau
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#c9a227]/20 px-6 py-14">
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#c9a227]/20 p-6">
                <span className="material-symbols-outlined text-[#e6cd8b]">{f.icon}</span>
                <h3 className="mt-3 font-headline-md text-base text-[#f8f0e2]">{f.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#f8f0e2]/65">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="harga" className="px-6 py-16">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#c9a227]/35 bg-[#3d0d16] p-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#e6cd8b]">Harga</p>
            <p className="mt-4 font-headline-md text-4xl text-[#f8f0e2]">Rp 199.000</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#f8f0e2]/45">sekali bayar</p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-[13px] leading-relaxed text-[#f8f0e2]/75">
              {[
                "Undangan website dengan tautan tamu",
                "Konfirmasi kehadiran (RSVP) tanpa batas tamu",
                "Doa & ucapan dengan moderasi",
                "Galeri foto ananda",
                "Tanda kasih: rekening, e-wallet, dan alamat kirim",
                "Musik latar dan hitung mundur",
                "Revisi data kapan saja",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#c9a227]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/daftar"
              className="mt-7 block rounded-full bg-[#c9a227] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#320a11]"
            >
              Buat undangan sekarang
            </Link>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#e6cd8b]">Cara Kerja</p>
              <h2 className="mt-3 font-headline-md text-2xl sm:text-3xl">Tiga langkah, selesai</h2>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-[#c9a227]/20 p-6">
                  <span className="font-headline-md text-sm tracking-[0.3em] text-[#c9a227]">{s.n}</span>
                  <h3 className="mt-3 font-headline-md text-base">{s.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#f8f0e2]/65">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c9a227]/20 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-headline-md text-base">Ceriavite</p>
            <p className="mt-1 text-[11px] text-[#f8f0e2]/45">
              Undangan digital acara anak oleh Aksaraa.
            </p>
          </div>
          <div className="flex gap-5 text-[11px] uppercase tracking-[0.16em] text-[#f8f0e2]/55">
            <Link href="/daftar">Daftar</Link>
            <Link href="/login">Masuk</Link>
            <a href="https://wedding.aksaraa.com">Aksaraa Wedding</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

const PLACEHOLDER_TEMPLATES: KidsTemplate[] = [
  {
    id: "songket-marun",
    code: "songket-marun",
    name: "Songket Marun",
    description:
      "Marun dan emas bergaya songket Melayu, bingkai lengkung masjid, tipografi serif klasik.",
    preview_image_url: "/templates/songket-marun/thumbnail.svg",
    demo_url: "/templates/songket-marun/preview",
  },
]
