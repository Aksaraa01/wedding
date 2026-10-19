import { ComponentType } from "react"
import type { TemplateConfig, TemplateProps } from "@/types/template"
import SkylinePenthouse from "./skyline-penthouse"
import PixelParadise from "./pixel-paradise"
import PixelQuest from "./pixel-quest"
import ImpastoMosque from "./impasto-mosque"
import PastelDreamCathedral from "./pastel-dream-cathedral"
import PastelCoastal from "./pastel-coastal-cut"
import DarkSplitRail from "./dark-split-rail"

export type { TemplateProps } from "@/types/template"

const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  "skyline-penthouse": SkylinePenthouse,
  "pixel-paradise": PixelParadise,
  "pixel_quest": PixelQuest,
  "impasto-mosque-dark-gold": ImpastoMosque,
  "pastel-dream-cathedral": PastelDreamCathedral,
  "pastel-coastal-cut": PastelCoastal,
  "dark-split-rail": DarkSplitRail,
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
  {
    code: "skyline-penthouse",
    name: "Skyline Penthouse",
    description: "Penthouse metropolitan gelap interaktif — hotspot menyala membuka galeri, kisah cinta, acara, mempelai & kado.",
    theme: {
      fonts: { display: "Playfair Display", script: "Playfair Display", body: "Plus Jakarta Sans" },
      colors: {
        surface: "#0e1321",
        text: "#dee2f6",
        accent: "#38bdf8",
        accentMuted: "#7bd0ff",
        overlay: "#000000",
        dark: "#05070c",
      },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: true,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "pixel-paradise",
    name: "Pixel Paradise",
    description: "Penthouse arcade retro — ruang piksel interaktif dengan neon cyan/pink; buka galeri, kisah cinta, acara, kado lewat objek di dinding ruangan.",
    theme: {
      fonts: { display: "Playfair Display", script: "Playfair Display", body: "Plus Jakarta Sans" },
      colors: {
        surface: "#0e1321",
        text: "#dee2f6",
        accent: "#38bdf8",
        accentMuted: "#f472b6",
        overlay: "#000000",
        dark: "#05070c",
      },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: false,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "pixel_quest",
    name: "Pixel Quest Level Up Together",
    description: "Petualangan 6 langkah bergaya arcade retro — latar dan karakter berubah tiap tahap, dari Press Start hingga Quest Complete.",
    theme: {
      fonts: { display: "Playfair Display", script: "Playfair Display", body: "Plus Jakarta Sans" },
      colors: {
        surface: "#0e1321",
        text: "#dee2f6",
        accent: "#38bdf8",
        accentMuted: "#f472b6",
        overlay: "#000000",
        dark: "#05070c",
      },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: true,
        countdown: false,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "impasto-mosque-dark-gold",
    name: "Impasto Mosque Dark Gold",
    description: "Undangan gulir bernuansa lukisan minyak masjid — halaman per halaman dengan transisi mulus di atas satu latar.",
    theme: {
      fonts: { display: "Cormorant Garamond", script: "Alex Brush", body: "Montserrat" },
      colors: {
        surface: "#F5EDDC",
        text: "#4A3427",
        accent: "#8E6B3D",
        accentMuted: "#d4af37",
        overlay: "#2A1F18",
        dark: "#2A1F18",
      },
      ornaments: { divider: "line", border: "minimal", frame: "arch" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: true,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "pastel-dream-cathedral",
    name: "Pastel Dream Cathedral",
    description: "Undangan gulir bernuansa lukisan minyak katedral — halaman per halaman dengan transisi mulus di atas satu latar.",
    theme: {
      fonts: { display: "Cormorant Garamond", script: "Alex Brush", body: "Montserrat" },
      colors: {
        surface: "#F5EDDC",
        text: "#4A3427",
        accent: "#8E6B3D",
        accentMuted: "#d4af37",
        overlay: "#2A1F18",
        dark: "#2A1F18",
      },
      ornaments: { divider: "line", border: "minimal", frame: "arch" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: true,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "pastel-coastal-cut",
    name: "Pastel Coastal Cut",
    description: "Undangan gulir bernuansa papercraft pantai pastel — awan kertas, kerang mutiara, dan burung camar di atas satu lukisan pesisir.",
    theme: {
      fonts: { display: "Cormorant Garamond", script: "Alex Brush", body: "Montserrat" },
      colors: {
        surface: "#FBF6EC",
        text: "#4A3427",
        accent: "#B37A56",
        accentMuted: "#8E6B3D",
        overlay: "#2A1F18",
        dark: "#2A1F18",
      },
      ornaments: { divider: "line", border: "minimal", frame: "arch" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "single",
      bride_photo: "single",
      sections: {
        opening_description: false,
        quote: true,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
  {
    code: "dark-split-rail",
    name: "Dark Split Rail",
    description: "Undangan split-screen gelap sinematik — panel foto/video di kiri dan rel konten elegan di kanan, dengan animasi reveal blur.",
    theme: {
      fonts: { display: "Times New Roman", script: "Baskervville", body: "Public Sans" },
      colors: {
        surface: "#000000",
        text: "#F2F1EE",
        accent: "#F2F1EE",
        accentMuted: "#AFACA6",
        overlay: "#000000",
        dark: "#1B1B18",
      },
      ornaments: { divider: "line", border: "minimal", frame: "square" },
      motion: { enabled: true, duration: 0.5, stagger: 0.12 },
    },
    content: {
      cover_slots: 1,
      groom_photo: "slideshow",
      bride_photo: "slideshow",
      sections: {
        opening_description: true,
        quote: true,
        countdown: true,
        inviting: true,
        video: true,
        story: true,
        gallery: true,
        gift: true,
      },
    },
  },
]

export function getTemplateConfig(code: string): TemplateConfig | undefined {
  return TEMPLATE_CONFIGS.find((t) => t.code === code)
}

export function getTemplateContentSpec(code: string | null) {
  if (!code) return undefined
  return getTemplateConfig(code)?.content
}

export function getTemplateComponent(code: string | null): ComponentType<TemplateProps> | null {
  if (!code) return null
  return TEMPLATE_MAP[code] || null
}

export function hasTemplate(code: string | null): boolean {
  return !!code && code in TEMPLATE_MAP
}

export default TEMPLATE_MAP
