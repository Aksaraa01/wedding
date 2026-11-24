"use client"

import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function GalleryModal({
  profile,
  templateContent,
  onClose,
}: {
  profile: TemplateProps
  templateContent?: Record<string, string>
  onClose: () => void
}) {
  const photos: string[] = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  if (photos.length === 0) return null
  const lang = normalizeLanguage(profile.language)
  const tc = templateContent || {}
  return (
    <ModalShell icon="photo_library" eyebrow="OUR MOMENTS" title={tc.gallery_title || t("secGallery", lang)} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3.5">
        {photos.map((src, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-[#38bdf8]/40 bg-slate-900/50 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Galeri ${i + 1}`}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 430px) 45vw, 180px"
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    </ModalShell>
  )
}