"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import UpgradePackageModal from "@/components/UpgradePackageModal"
import { pollWpJob } from "@/lib/wpJobPoll"
import { getTemplateComponent } from "@/components/templates"
import TemplateGallery from "@/components/template-gallery/TemplateGallery"
import { packageDisplayName, lowestEligiblePackage } from "@/lib/packages"
import { templateUpgradeWaLink } from "@/lib/contact"

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
  category?: string | null
  tier?: string | null
  source_type?: string | null
  wp_master_slug?: string | null
  // Tanpa-photo group: separate dimension from category/tier (never a badge).
  no_photo?: boolean | null
  // Package gate: empty/absent ⇒ available to everyone. Otherwise the couple's
  // package_type must be in the list, or Pilih opens the upgrade popup.
  package_eligibility?: string[] | null
}

type Profile = {
  package_type?: string | null
  groom_name?: string | null
  bride_name?: string | null
  estimated_wedding_date?: string | null
}

function TemplatesInner({ id }: { id: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)
  const [upgradeTpl, setUpgradeTpl] = useState<Template | null>(null)
  useEffect(() => {
    ;(async () => {
      const invData = await fetch(`/api/dashboard/${id}/web-invitation`).then((r) => r.json())
      // Fetch unfiltered: ineligible templates stay visible and upsell on Pilih.
      // fresh=1 + no-store so ops package_eligibility edits reflect immediately.
      const tplData = await fetch(`/api/web-templates?fresh=1`, { cache: "no-store" }).then((r) => r.json())
      setTemplates(tplData.templates || [])
      setProfile(invData.profile || null)
      if (invData.template) setSelectedId(invData.template.id)
    })()
  }, [id])

  // Empty/absent eligibility = available to all. Otherwise the couple's package
  // must be listed. A missing package_type degrades to ineligible only when the
  // template is explicitly restricted.
  const isEligible = (tpl: Template): boolean => {
    const elig = tpl.package_eligibility
    if (!Array.isArray(elig) || elig.length === 0) return true
    return !!profile?.package_type && elig.includes(profile.package_type)
  }

  const upgradeMinLabel = (tpl: Template): string => {
    const elig = tpl.package_eligibility || []
    const min = lowestEligiblePackage(elig)
    if (min) return packageDisplayName(min)
    return elig.length > 0 ? packageDisplayName(elig[0]) : "tertentu"
  }

  const upgradeCtaHref = `/customize?edit=true&tab=undangan&user=${encodeURIComponent(profile?.groom_name || "")}&partner=${encodeURIComponent(profile?.bride_name || "")}&date=${encodeURIComponent(profile?.estimated_wedding_date || "")}&profile_id=${id}`

  const handleSelect = async (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId)
    // Package gate: keep the card visible, but route Pilih to the upsell popup.
    // The already-active template is grandfathered — a couple that picked it
    // before eligibility changed can keep using it without an upsell.
    if (tpl && selectedId !== tpl.id && !isEligible(tpl)) {
      setUpgradeTpl(tpl)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const inhouse = tpl?.source_type === "inhouse" ||
        (!!tpl?.code && !!getTemplateComponent(tpl.code) && !tpl?.wp_master_slug)

      // In-house template: assign + clear any prior WP duplicate — no job to poll.
      if (inhouse) {
        const res = await fetch(`/api/web-invitation/template-select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: id, template_id: templateId, source: "dashboard" }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || res.statusText)
        }
        setSelectedId(templateId)
        router.push(`/dashboard/${id}/web-invitation/editor?preview=1`)
        return
      }

      // WP template: duplicate the master and poll until applied.
      const res = await fetch(`/api/wp/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, profile_id: id, source: "dashboard" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      const { job_id } = await res.json()
      await pollWpJob(job_id, { interval: 800 })
      setSelectedId(templateId)
      router.push(`/dashboard/${id}/web-invitation/editor?preview=1`)
    } catch (err) {
      console.error("[templates] duplicate failed", err)
      setError(err instanceof Error ? err.message : "Gagal menyimpan template")
      setSaving(false)
    }
  }

  return (
    <>
      <PageTheme mode="light" />
      <main className="pt-8 pb-32 px-edge-margin-mobile max-w-container-max mx-auto bg-[#FAF7F2]">
        <section className="mb-10 fade-in">
          <h1 className="font-headline-lg text-[18px] sm:text-[28px] leading-tight mb-3">Pilih Undangan Digital Anda</h1>
        </section>

        <TemplateGallery
          templates={templates}
          showSearch
          selectedId={selectedId}
          isLocked={(t) => !!profile?.package_type && !isEligible(t as Template)}
          onPreview={(t) => setPreviewTpl(t as Template)}
          onSelect={(t) => handleSelect(t.id)}
          saving={saving}
        />

        {error && (
          <div className="mt-8 p-4 border border-error bg-error/10 text-on-surface">
            <p className="font-label-md text-[11px] uppercase tracking-widest text-error mb-1">Sinkronisasi Gagal</p>
            <p className="text-[13px]">{error}</p>
          </div>
        )}
      </main>

      {saving && (
        <div className="fixed inset-0 z-[80] bg-[#2C2A29]/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl px-8 py-10 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full text-center">
            <span className="w-10 h-10 border-[3px] border-[#B34E3F] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2C2A29] font-medium">Undangan Anda sedang diproses..</p>
          </div>
        </div>
      )}

      {previewTpl && (
        <TemplatePreviewModal
          name={previewTpl.name}
          demoUrl={previewTpl.demo_url}
          onClose={() => setPreviewTpl(null)}
        />
      )}

      {upgradeTpl && (
        <UpgradePackageModal
          open
          showClose
          onClose={() => setUpgradeTpl(null)}
          ctaHref={upgradeCtaHref}
          waHref={templateUpgradeWaLink(upgradeTpl.name, upgradeMinLabel(upgradeTpl))}
          content={{
            title: `Mau tema ${upgradeTpl.name}?`,
            lockLabel: `Paket ${upgradeMinLabel(upgradeTpl)}`,
            benefits: [
              "Akses koleksi template eksklusif",
              "Bebas ganti tema kapan saja",
              "Desain responsif dengan musik & animasi",
            ],
            eligiblePackages: (upgradeTpl.package_eligibility || []).map((c) => packageDisplayName(c)),
            cta: "Lihat Paket",
          }}
        />
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <TemplatesInner id={id} />
}
