import { ComponentType } from "react"
import type { TemplateConfig } from "@/types/template"
import HeritageJawa from "./HeritageJawa"
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
}

const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  "heritage-jawa": HeritageJawa,
  "parallax-sinematik": ParallaxSinematik,
  "editorial-modern": EditorialModern,
  "animasi-watercolor": AnimasiWatercolor,
  "heritage-dinamis": HeritageDinamis,
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    code: "heritage-jawa",
    name: "Heritage Jawa",
    description: "Nuansa tradisional Jawa dengan ornamen gunungan dan palet warna hangat",
    theme: {
      fonts: { display: "Cormorant Infant", script: "Alex Brush", body: "Plus Jakarta Sans" },
      colors: { surface: "#fdf9f0", text: "#1c1c16", accent: "#d4af37", accentMuted: "#8d4d39", overlay: "#1c1a15", dark: "#1c1a15" },
      ornaments: { divider: "gunungan", border: "ornate", frame: "arch" },
      motion: { enabled: true, duration: 0.6, stagger: 0.15 },
    },
  },
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