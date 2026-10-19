import { ASSETS } from "@/lib/assets"

// Shown on /w/[slug] after Ops executes the invitation teardown
// (wedding_profiles.invitation_disabled_at). Read-only, no data fetches.

export default function InvitationExpired({ coupleName }: { coupleName?: string | null }) {
  const waHref =
    "https://wa.me/6281234567890?text=" +
    encodeURIComponent("Halo Aksaraa, saya ingin menanyakan masa aktif undangan digital saya.")

  return (
    <main className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white border border-surface-variant shadow-sm px-8 py-10 text-center">
        <img
          src={ASSETS.galeriEnvelope?.aksaraaLogo || "/defaults/aksaraa-logo.png"}
          alt="Aksaraa Wedding"
          className="h-14 w-14 rounded-full object-cover mx-auto"
        />
        <p className="mt-3 text-[10px] tracking-[0.3em] uppercase text-brand-slate">Aksaraa Wedding</p>

        <div className="w-12 h-px bg-brand-goldMuted mx-auto my-6" />

        <h1 className="font-headline-md text-2xl text-brand-charcoal">Masa Aktif Berakhir</h1>
        {coupleName ? (
          <p className="mt-2 font-body-md text-brand-terracotta italic">{coupleName}</p>
        ) : null}

        <p className="mt-5 text-[14px] leading-relaxed text-brand-slate">
          Masa aktif undangan digital ini telah berakhir, sehingga tautan undangan sudah tidak dapat
          diakses. Terima kasih atas kepercayaan Anda kepada Aksaraa.
        </p>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-brand-charcoal text-white text-[11px] uppercase tracking-widest font-semibold"
        >
          Hubungi Aksaraa
        </a>
      </div>
    </main>
  )
}
