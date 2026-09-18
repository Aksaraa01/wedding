export interface OpeningPreset {
  title: string
  description: string
}

export const OPENING_PRESETS: OpeningPreset[] = [
  {
    title: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
    description:
      "Dengan memohon rahmat dan ridho Allah SWT, serta rasa syukur yang mendalam, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari istimewa kami. Kehadiran serta doa tulus Anda akan melengkapi kebahagiaan dan keberkahan acara kami.",
  },
  {
    title: "Om Swastyastu",
    description:
      "Semoga pikiran yang baik datang dari segala penjuru. Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari bahagia kami. Kehadiran Anda akan membawa keberkahan dan kehangatan bagi kami.",
  },
  {
    title: "Namo Buddhaya",
    description:
      "Terpujilah Sang Buddha. Berlandaskan rasa syukur, kasih, dan kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk hadir serta memberikan doa keselamatan dan kebahagiaan bagi momen istimewa kami. Kehadiran Anda sangat berarti bagi kami.",
  },
  {
    title: "Salam Kebajikan (Wei De Dong Tian)",
    description:
      "Dengan kebajikan dan rahmat Tian yang melimpah, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri momen bahagia ini. Kehadiran serta doa restu Anda akan mempererat tali silaturahmi dan melengkapi kebahagiaan keluarga kami.",
  },
  {
    title: "Salam Sejahtera",
    description:
      "Dengan penuh rasa syukur kepada Tuhan Yang Maha Esa, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari istimewa kami. Kehadiran serta kehangatan Anda akan melengkapi kebahagiaan kami dalam kebersamaan ini.",
  },
  {
    title: "Warmest Greetings",
    description:
      "Together with our families, we joyfully invite you to celebrate this special moment with us. Your presence, love, and warm wishes will complete our happiness on this memorable day.",
  },
]

export const OPENING_CUSTOM = "Custom"

export function matchOpeningPreset(title: string | null | undefined): OpeningPreset | null {
  if (!title) return null
  return OPENING_PRESETS.find((p) => p.title === title) || null
}
