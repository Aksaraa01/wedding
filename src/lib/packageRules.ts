import { getFeatureIncluded } from "@/lib/featureGates"
import type { GaleriConfig } from "@/lib/gallery"

// Server-only carryover rules when a package changes (or add-ons are edited).
// Prevents stale add-ons surviving on packages that can't carry them — e.g.
// a WA tier kept after downgrading to a package without wa_blast, which then
// shows in Ops with no UI to remove it.
export type AddonExplicit = {
  waBlastTier?: number
  expressService?: boolean
  // undefined = untouched (carry stored); null = explicitly removed.
  galeri?: GaleriConfig | null
}

export type AddonStored = {
  waBlastTier: number
  expressService: boolean
  galeri: GaleriConfig | null
}

export type AddonEffective = {
  waBlastTier: number
  expressService: boolean
  galeri: GaleriConfig | null
}

export async function sanitizeAddonsForPackage(
  newPackage: string,
  explicit: AddonExplicit,
  stored: AddonStored
): Promise<AddonEffective> {
  const isGt = newPackage === "gt"
  const isDgb = newPackage.startsWith("dgb_")

  // Standalone GT carries nothing: no WA tiers, no express, and the slider
  // config only when explicitly (re)configured in the same call.
  if (isGt) {
    return {
      waBlastTier: 0,
      expressService: false,
      galeri: explicit.galeri !== undefined ? explicit.galeri : null,
    }
  }

  // Buku Tamu Digital bundles gallery via matrix, but additive top-ups
  // via galeri_tiers are allowed (quota = base + add-on).
  if (isDgb) {
    return {
      waBlastTier: explicit.waBlastTier ?? stored.waBlastTier,
      expressService: explicit.expressService ?? stored.expressService,
      galeri: explicit.galeri !== undefined ? explicit.galeri : stored.galeri,
    }
  }

  // Undangan Digital: WA tier survives only where the base includes it.
  const features = await getFeatureIncluded(newPackage)
  return {
    waBlastTier: features.has("wa_blast") ? (explicit.waBlastTier ?? stored.waBlastTier) : 0,
    expressService: explicit.expressService ?? stored.expressService,
    galeri: explicit.galeri !== undefined ? explicit.galeri : stored.galeri,
  }
}
