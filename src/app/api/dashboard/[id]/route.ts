import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireProfileAccess } from "@/lib/requireProfileAccess"
import { getRowGates, getFeatureIncluded, getSelections } from "@/lib/featureGates"
import { parseVoucherTerms, voucherTermsFromRow } from "@/lib/voucherDiscount"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accessId } = await params
  const auth = await requireProfileAccess(req, accessId)
  if (auth) return auth
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Wedding profile not found" }, { status: 404 })
    }

    const { data: activeRedemption } = await supabaseAdmin
      .from("voucher_redemptions")
      .select("terms_snapshot, frozen_at, vouchers (discount_type, amount, percent, max_discount, include_wa_blast, include_express, include_galeri, package_eligibility)")
      .eq("wedding_profile_id", id)
      .eq("status", "active")
      .maybeSingle()
    const redemptionVoucher = activeRedemption
      ? (Array.isArray(activeRedemption.vouchers) ? activeRedemption.vouchers[0] : activeRedemption.vouchers)
      : null
    const voucherTerms =
      parseVoucherTerms(activeRedemption?.terms_snapshot) ??
      (redemptionVoucher ? voucherTermsFromRow(redemptionVoucher) : null)

    const packageType = profile.package_type || "signature"
    const packageGates = await getRowGates(packageType)
    const featureSet = Array.from(await getFeatureIncluded(packageType))
    // GT add-on (standalone bands carry it in package_features already).
    if (profile.galeri_addon === true && !featureSet.includes("galeri_foto_tamu")) {
      featureSet.push("galeri_foto_tamu")
    }

    const selections = await getSelections(
      profile.package_type || "signature",
      !!profile.undangan_fisik,
      !!profile.galeri_addon
    )

    let guestCount = 0, tableCount = 0, checkedInCount = 0, checkedInPax = 0, rsvpHadirCount = 0, rsvpHadirPax = 0, rsvpTotalPax = 0, pendingWishes = 0, totalWishes = 0
    try {
      const { data: rpc } = await supabaseAdmin.rpc("get_dashboard_counts", { p_profile_id: id })
      if (rpc) {
        guestCount = (rpc as any).guest_count ?? 0
        tableCount = (rpc as any).table_count ?? 0
        checkedInCount = (rpc as any).checked_in_count ?? 0
        checkedInPax = (rpc as any).checked_in_pax ?? 0
        rsvpHadirCount = (rpc as any).rsvp_hadir_count ?? 0
        rsvpHadirPax = (rpc as any).rsvp_hadir_pax ?? 0
        rsvpTotalPax = (rpc as any).rsvp_total_pax ?? 0
        pendingWishes = (rpc as any).pending_wishes ?? 0
        totalWishes = (rpc as any).total_wishes ?? 0
      } else throw new Error("no rpc")
    } catch {
      const { count: gc } = await supabaseAdmin.from("guests").select("id", { count: "exact", head: true }).eq("wedding_profile_id", id)
      guestCount = gc || 0
      const { data: tables } = await supabaseAdmin.from("guests").select("table_number").eq("wedding_profile_id", id).not("table_number", "is", null).neq("table_number", "")
      tableCount = tables ? new Set(tables.map(t => t.table_number?.toLowerCase().trim()).filter(Boolean)).size : 0
      const { data: ci } = await supabaseAdmin.from("guests").select("id, guest_count, rsvp_pax_count").eq("wedding_profile_id", id).eq("is_checked_in", true)
      const cg = ci || []; checkedInCount = cg.length; checkedInPax = cg.reduce((s, g: any) => s + (g.rsvp_pax_count || g.guest_count || 1), 0)
      const { data: rd } = await supabaseAdmin.from("guests").select("id, guest_count, rsvp_status, rsvp_pax_count").eq("wedding_profile_id", id)
      const re = rd || []; rsvpHadirCount = re.filter((g: any) => g.rsvp_status === "HADIR").length; rsvpHadirPax = re.filter((g: any) => g.rsvp_status === "HADIR").reduce((s, g: any) => s + (g.rsvp_pax_count || g.guest_count || 1), 0); rsvpTotalPax = re.reduce((s, g: any) => s + (g.guest_count || 1), 0)
      const { count: pw } = await supabaseAdmin.from("wishes").select("id", { count: "exact", head: true }).eq("wedding_profile_id", id).eq("status", "pending")
      pendingWishes = pw || 0
      const { count: tw } = await supabaseAdmin.from("wishes").select("id", { count: "exact", head: true }).eq("wedding_profile_id", id)
      totalWishes = tw || 0
    }

    return NextResponse.json({
      profile,
      selections,
      voucher_terms: voucherTerms,
      voucher_frozen: !!activeRedemption?.frozen_at,
      package_gates: packageGates,
      feature_set: featureSet,
      guest_count: guestCount || 0,
      table_count: tableCount,
      pending_wishes: pendingWishes || 0,
      total_wishes: totalWishes || 0,
      checked_in_count: checkedInCount,
      checked_in_pax: checkedInPax,
      rsvp_hadir_count: rsvpHadirCount,
      rsvp_hadir_pax: rsvpHadirPax,
      rsvp_total_pax: rsvpTotalPax,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
