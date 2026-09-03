import { ComponentType } from "react"
import type { TemplateConfig } from "@/types/template"
import ParallaxSinematik from "./ParallaxSinematik"
import EditorialModern from "./EditorialModern"
import AnimasiWatercolor from "./AnimasiWatercolor"
import HeritageDinamis from "./HeritageDinamis"

export interface TemplateProps {
  bride_name: string
  groom_name: string
  estimated_wedding_date: string
  slug: string
  guest_name: string
  display_name?: string
  couple_illustration_url?: string
  grayscale?: boolean
  groom_full_name?: string
  bride_full_name?: string
  groom_photo_url?: string
  bride_photo_url?: string
  groom_parents?: string
  bride_parents?: string
  groom_instagram?: string
  sessions?: {
    name: string
    date: string
    time: string
    venue: string
    address: string
    maps_url: string
  }[]
  quote_text?: string
  quote_source?: string
  stories?: {
    title: string
    description: string
    image_url: string
  }[]
  gallery_photos?: string[]
  gift_accounts?: { provider_name: string; account_number: string; account_name: string; type: string }[]
  gift_address?: string
  track_url?: string
  auto_play?: boolean
  inviting_families?: string[]
  wedding_profile_id?: string
  guest_id?: string
  guest_qr_token?: string
  guest_qr_url?: string
  guest_qr_content?: string
  guest_table_number?: string
  guest_rsvp_status?: string
  rsvp_max_pax?: number
  feature_gates?: {
    story?: boolean
    gift_address?: boolean
    inviting_families?: boolean
    qr_code_book?: boolean
  }
}

const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  "parallax-sinematik": ParallaxSinematik,
  "editorial-modern": EditorialModern,
  "animasi-watercolor": AnimasiWatercolor,
  "heritage-dinamis": HeritageDinamis,
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    code: "parallax-sinematik",
    name: "Parallax Sinematik",
    description: "Gaya modern dengan efek parallax dan tipografi berani",
    theme: {
      fonts: { display: "Playfair Display", script: "Great Vibes", body: "Inter" },
      colors: { surface: "#0a0a0f", text: "#f0eee6", accent: "#c9a96e", accentMuted: "#8a7350", overlay: "#000000", dark: "#0a0a0f" },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.7, stagger: 0.2 },
    },
  },
  {
    code: "editorial-modern",
    name: "Editorial Modern",
    description: "Tata letak seperti majalah dengan grid asimetris dan foto besar",
    theme: {
      fonts: { display: "Libre Baskerville", script: "Great Vibes", body: "Inter" },
      colors: { surface: "#ffffff", text: "#1a1a1a", accent: "#b8860b", accentMuted: "#6b4e0a", overlay: "#00000080", dark: "#1a1a1a" },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.5, stagger: 0.1 },
    },
  },
  {
    code: "animasi-watercolor",
    name: "Animasi Watercolor",
    description: "Lembut seperti cat air dengan gradien pastel dan ilustrasi bunga",
    theme: {
      fonts: { display: "Quicksand", script: "Dancing Script", body: "Quicksand" },
      colors: { surface: "#faf5f0", text: "#3d2c2e", accent: "#d4a5a5", accentMuted: "#b8737a", overlay: "#2c1b1d80", dark: "#3d2c2e" },
      ornaments: { divider: "floral", border: "ornate", frame: "circle" },
      motion: { enabled: true, duration: 0.8, stagger: 0.25 },
    },
  },
  {
    code: "heritage-dinamis",
    name: "Heritage Dinamis",
    description: "Perpaduan tradisional dan modern dengan aksen emas dinamis",
    theme: {
      fonts: { display: "Marcellus", script: "Alex Brush", body: "Nunito" },
      colors: { surface: "#f8f4ed", text: "#2b241c", accent: "#b8956a", accentMuted: "#7a5c3a", overlay: "#1a1510", dark: "#2b241c" },
      ornaments: { divider: "gunungan", border: "ornate", frame: "arch" },
      motion: { enabled: true, duration: 0.6, stagger: 0.15 },
    },
  },
]

export function getTemplateConfig(code: string): TemplateConfig | undefined {
  return TEMPLATE_CONFIGS.find((t) => t.code === code)
}

export function getTemplateComponent(code: string | null): ComponentType<TemplateProps> | null {
  if (!code) return null
  return TEMPLATE_MAP[code] || null
}

export function hasTemplate(code: string | null): boolean {
  return !!code && code in TEMPLATE_MAP
}

export default TEMPLATE_MAP