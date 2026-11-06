"use client"

import { MAX_COUPLE_SLUG_LENGTH, coupleSlugError, slugifyCouple } from "@/lib/slug"

interface CoupleSlugHintProps {
  name1: string
  name2: string
  className?: string
}

/**
 * Registration guidance for the couple names: the two fields are not just a
 * label, they become the invitation address ({slug}.wedding.aksaraa.com), and a
 * DNS label cannot exceed 63 characters. Full names belong in the editor, after
 * the account exists.
 */
export function CoupleSlugHint({ name1, name2, className = "" }: CoupleSlugHintProps) {
  const slug = slugifyCouple(name1, name2)
  const error = coupleSlugError(name1, name2)
  const over = Boolean(error)

  return (
    <div className={`text-left ${className}`}>
      <p className="font-label-md text-[11px] leading-relaxed text-on-surface-variant">
        Isi dengan nama panggilan saja. Nama ini menjadi alamat undangan digital Anda.
      </p>
      <div className="mt-1.5 flex items-baseline gap-2 font-mono text-[11px]">
        <span className={`min-w-0 break-all ${over ? "text-red-400" : "text-on-surface-variant/70"}`}>
          {slug ? `${slug}.wedding.aksaraa.com` : "alamat-undangan.wedding.aksaraa.com"}
        </span>
        <span className={`shrink-0 ${over ? "font-semibold text-red-400" : "text-on-surface-variant/50"}`}>
          {slug.length}/{MAX_COUPLE_SLUG_LENGTH}
        </span>
      </div>
      {error && (
        <p className="mt-1 font-label-md text-[11px] leading-relaxed text-red-400">{error}</p>
      )}
    </div>
  )
}
