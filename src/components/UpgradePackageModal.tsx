"use client"

import { useRouter } from "next/navigation"

export interface UpgradeModalContent {
  title: string
  lockLabel: string
  benefits: string[]
  eligiblePackages: string[]
  cta: string
}

interface UpgradePackageModalProps {
  open: boolean
  onClose: () => void
  content: UpgradeModalContent
  ctaHref: string
}

// Shared upsell shell: locked-feature popup showing what the feature does
// and which packages include it. Callers pass feature-specific content;
// the shell (overlay, card, CTA + "Nanti Saja") stays identical everywhere.
export default function UpgradePackageModal({ open, onClose, content, ctaHref }: UpgradePackageModalProps) {
  const router = useRouter()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[20px] text-[#B34E3F]">lock</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#B34E3F]">{content.lockLabel}</span>
        </div>
        <h3 className="font-headline-md text-lg font-medium text-primary mb-2">{content.title}</h3>
        <ul className="flex flex-col gap-1.5 mb-3">
          {content.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-on-surface-variant bg-[#FAF7F2] border border-[#E2D9CF] rounded-xl px-3 py-2 mb-4">
          Tersedia di paket: <span className="font-semibold text-[#2C2A29]">{content.eligiblePackages.join(", ")}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(ctaHref)}
            className="flex-1 py-2.5 rounded-full bg-[#B34E3F] text-white text-[13px] font-semibold hover:bg-[#9E3B2D] transition-colors"
          >
            {content.cta}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-[#E2D9CF] text-[#2C2A29] text-[13px] font-semibold hover:bg-[#F5EFE6] transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  )
}
