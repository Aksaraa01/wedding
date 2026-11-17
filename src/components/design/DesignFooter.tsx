import Link from "next/link"
import { waLink } from "@/lib/contact"

const WA_SUPPORT = waLink("Halo Aksaraa, saya mau tanya soal desain undangan.")

const PRODUCT = [
  { label: "Desain undangan", href: "/" },
  { label: "Buku Tamu Digital", href: "/fitur/buku-tamu-qr" },
  { label: "Galeri Foto Tamu", href: "/fitur/galeri-foto-tamu" },
  { label: "Daftar harga", href: "/customize" },
  { label: "Portofolio", href: "/portofolio" },
]

const HELP = [
  { label: "Chat tim support", href: WA_SUPPORT, external: true },
  { label: "Artikel & panduan", href: "/artikel" },
  { label: "Kalkulator budget", href: "/kalkulator-budget" },
  { label: "Checklist nikah", href: "/checklist-nikah" },
]

const MORE = [
  { label: "Masuk", href: "/login" },
  { label: "Aksaraa Wedding", href: "https://wedding.aksaraa.com", external: true },
  { label: "Ceriavite", href: "https://ceriavite.aksaraa.com", external: true },
  { label: "Beranda", href: "/landing" },
]

function FooterColumn({ title, items }: { title: string; items: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <h2 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8B857C]">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${title}-${item.label}`}>
            {item.external ? (
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-[12.5px] text-[#3B3833] transition-colors hover:text-[#8D4D39]"
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} className="text-[12.5px] text-[#3B3833] transition-colors hover:text-[#8D4D39]">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DesignFooter() {
  return (
    <footer className="border-t border-[#EFE9DD] bg-[#F8F3E9] px-4 pb-8 pt-10 sm:px-6 md:px-10 md:pt-14 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-8 border-b border-[#EFE9DD] pb-8 sm:grid-cols-4 md:gap-10 md:pb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-[17px] tracking-tight text-[#1A1817]">Aksaraa</span>
              <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
            </div>
            <p className="mt-2.5 max-w-[30ch] text-[12px] leading-relaxed text-[#6E6A63]">
              Platform undangan digital untuk pernikahan dan acara keluarga.
            </p>
            <a
              href={WA_SUPPORT}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#3B3833] transition-colors hover:text-[#8D4D39]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#2F6B54]">chat</span>
              +62 811-6161-3071
            </a>
          </div>

          <FooterColumn title="Produk" items={PRODUCT} />
          <FooterColumn title="Bantuan" items={HELP} />
          <FooterColumn title="Lainnya" items={MORE} />
        </div>

        <div className="flex flex-col gap-2 pt-5 text-[11px] text-[#8B857C] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aksaraa. Seluruh hak cipta dilindungi.</p>
          <p className="sm:text-right">Undangan digital pernikahan, khitanan, aqiqah, dan ulang tahun.</p>
        </div>
      </div>
    </footer>
  )
}
