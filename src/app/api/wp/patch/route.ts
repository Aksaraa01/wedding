import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { formatDateUpper } from "@/lib/formatDate"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

export async function POST(req: Request) {
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi" }, { status: 501 })
  }

  try {
    const body = await req.json()
    const { profile_id } = body

    if (!profile_id) {
      return NextResponse.json({ error: "profile_id wajib diisi" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, slug, selected_template_id, active_wp_post_id, couple_illustration_url, cover_photos, couple_initials, display_name, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, estimated_wedding_date, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax")
      .eq("id", profile_id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    if (!profile.active_wp_post_id) {
      return NextResponse.json({ error: "Belum ada postingan WordPress aktif. Pilih template terlebih dahulu." }, { status: 400 })
    }

    // Load template manifest
    const { data: tpl } = await supabaseAdmin
      .from("web_templates")
      .select("wp_manifest")
      .eq("id", profile.selected_template_id)
      .maybeSingle()

    const manifest = tpl?.wp_manifest || {}

    // Gift accounts (bank/ewallet only)
    const { data: giftAccts } = await supabaseAdmin
      .from("gift_accounts")
      .select("provider_name, account_number, account_name, type")
      .eq("wedding_profile_id", profile.id)
      .eq("is_active", true)
    const giftAccounts = (giftAccts || []).filter(a => a.type === "bank" || a.type === "ewallet")

    // Gift shipping address (optional, gated by package)
    const { data: giftAddr } = await supabaseAdmin
      .from("gift_addresses")
      .select("full_address, recipient_name")
      .eq("wedding_profile_id", profile.id)
      .eq("is_active", true)
      .maybeSingle()
    const giftAddress = giftAddr?.full_address || ""
    const giftAddressName = giftAddr?.recipient_name || ""

    const parseList = (v: unknown): any[] => {
      if (Array.isArray(v)) return v
      if (typeof v === "string" && v.trim()) {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] }
      }
      return []
    }

    const sessions = parseList(profile.sessions).map((s: any) => ({
      name: s?.name || "",
      date: s?.date ? formatDateUpper(s.date) : "",
      time: s?.time || "",
      timezone: s?.timezone || "",
      venue: s?.venue || "",
      address: s?.address || "",
      maps_url: s?.maps_url || "",
    }))

    const stories = parseList(profile.stories).map((s: any) => ({
      title: s?.title || "",
      description: s?.description || "",
      image_url: s?.image_url || "",
    }))

    const fields: Record<string, any> = {
      couple_illustration_url: profile.couple_illustration_url || "",
      cover_photos: parseList(profile.cover_photos).filter(Boolean),
      couple_initials: profile.couple_initials || "",
      display_name: profile.display_name || (profile.bride_name && profile.groom_name ? `${profile.bride_name} & ${profile.groom_name}` : ""),
      groom_name: profile.groom_name || "",
      bride_name: profile.bride_name || "",
      groom_full_name: profile.groom_full_name || "",
      bride_full_name: profile.bride_full_name || "",
      groom_photo_url: profile.groom_photo_url || "",
      bride_photo_url: profile.bride_photo_url || "",
      groom_parents: profile.groom_parents || "",
      bride_parents: profile.bride_parents || "",
      groom_instagram: profile.groom_instagram || "",
      bride_instagram: profile.bride_instagram || "",
      video_url: profile.video_url || "",
      quote_text: profile.quote_text || "",
      quote_source: profile.quote_source || "",
      gift_address: giftAddress,
      gift_address_name: giftAddressName,
      date_upper: profile.estimated_wedding_date ? formatDateUpper(profile.estimated_wedding_date) : "",
      sessions,
      gallery_photos: parseList(profile.gallery_photos).filter(Boolean),
      inviting_families: parseList(profile.inviting_families).filter(Boolean),
      gift_accounts: giftAccounts.map(a => ({
        provider_name: a.provider_name,
        account_number: a.account_number,
        account_name: a.account_name,
      })),
      stories,
    }

    const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${profile.active_wp_post_id}/elements`, {
      method: "PATCH",
      headers: {
        "X-Aksaraa-Secret": WP_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, manifest }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[wp/patch] WP error", res.status, errText)
      let errMsg = "Gagal memperbarui konten WordPress"
      try { errMsg = JSON.parse(errText).message || errMsg } catch {}
      return NextResponse.json({ error: errMsg, detail: errText }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ patched: data.patched || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
