export type TemplateTheme = {
  fonts: {
    display: string
    script: string
    body: string
  }
  colors: {
    surface: string
    text: string
    accent: string
    accentMuted: string
    overlay: string
    dark: string
  }
  ornaments: {
    divider: "gunungan" | "floral" | "line"
    border: "ornate" | "minimal" | "none"
    frame: "arch" | "square" | "circle"
  }
  motion: {
    enabled: boolean
    duration: number
    stagger: number
  }
}

export type TemplateConfig = {
  code: string
  name: string
  description: string
  theme: TemplateTheme
}