"use client"

import { MAX_COUPLE_SLUG_LENGTH, coupleSlugError, slugifyCouple } from "@/lib/slug"
import { isReservedSlug, reservedSlugMessage } from "@/lib/reservedSlugs"
import { COUPLE_DOMAIN } from "@/lib/coupleUrl"

interface CoupleSlugHintProps {
  name1: string
  name2: string
  className?: string
  /** Overrides the field guidance ("nama panggilan anak" for Ceriavite). */
  helpText?: string
  /** "dark" renders on the Ceriavite maroon surfaces. */
  variant?: "default" | "dark"
}

/**
 * Registration guidance for the names: the fields are not just a label, they
 * become the invitation address ({slug}.aksaraa.com), and a DNS label cannot
 * exceed 63 characters. Full names belong in the editor, after the account
 * exists.
 */
export function CoupleSlugHint({
  name1,
  name2,
  className = "",
  helpText,
  variant = "default",
}: CoupleSlugHintProps) {
  const slug = slugifyCouple(name1, name2)
  const lengthError = coupleSlugError(name1, name2)
  const reserved = Boolean(slug) && isReservedSlug(slug)
  const error = reserved ? reservedSlugMessage(slug) : lengthError
  const over = Boolean(error)
  const dark = variant === "dark"

  const help = dark ? "text-[#E0CDB6]/55" : "text-on-surface-variant"
  const ok = dark ? "text-[#E0CDB6]/60" : "text-on-surface-variant/70"
  const muted = dark ? "text-[#E0CDB6]/35" : "text-on-surface-variant/50"
  const bad = dark ? "text-red-300" : "text-red-400"

  return (
    <div className={`text-left ${className}`}>
      <p className={`font-label-md text-[11px] leading-relaxed ${help}`}>
        {helpText || "Isi dengan nama panggilan saja. Nama ini menjadi alamat undangan digital Anda."}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2 font-mono text-[11px]">
        <span className={`min-w-0 break-all ${over ? bad : ok}`}>
          {slug ? `${slug}.${COUPLE_DOMAIN}` : `alamat-undangan.${COUPLE_DOMAIN}`}
        </span>
        <span className={`shrink-0 ${over ? `font-semibold ${bad}` : muted}`}>
          {slug.length}/{MAX_COUPLE_SLUG_LENGTH}
        </span>
      </div>
      {error && <p className={`mt-1 font-label-md text-[11px] leading-relaxed ${bad}`}>{error}</p>}
    </div>
  )
}
