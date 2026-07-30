"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { TemplateTheme } from "@/types/template"
import ThemeInjector from "./shared/ThemeInjector"

interface Props {
  bride_name: string
  groom_name: string
  estimated_wedding_date: string
  slug: string
  guest_name: string
  theme?: TemplateTheme
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
  sessions?: { name: string; date: string; time: string; timezone: string; venue: string; address: string; maps_url: string }[]
  quote_text?: string
  quote_source?: string
  stories?: { year: string; title: string; description: string; image_url: string }[]
  gallery_photos?: string[]
  gift_accounts?: { provider_name: string; account_number: string; account_name: string; type: string }[]
  gift_address?: string
  track_url?: string
  auto_play?: boolean
  inviting_families?: string[]
}

const IMG = {
  parchment: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrV_0lYgYUkE4VlvVBI8uKfbS0s-GuC6g52rlYebAdp0DCqHYlZwTiIVkkkT8WmZouCHy4L8pBmhpT-mgEz5hv88N4bFTKtBBL5hxHddm0wfFHT0_zMJ2TbbaeqhHN0SKqXZayappZDK82zHV3uPHdEBVYHoRRZPIm9tssJGXCHK668NZnoY4D_o7rhjYvylJUNs9-k2o4YEYvzXn_hijhzKA_IkcUlVLDTtks9zt95s2n1f3Zjn7Ltq74tNeD3vakaG8",
  heroBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtauSat3IABhE81EPzyujWU2U08RAlwTNnWVZU54NK155Bngz7kkwULzyUcB8DhyIvj_nFHW4azPl9ecqIL_vsTY7lPYE1aIl3hkEhimh_bu62fzNfFVj2sjOIuKNiwZRPYNcvc3MFXz8MNEh2o3trTyNUW8V9N3XRrQ-wcahIGKKX21dtbd6Hhff4TTooFbzzYHS5Fdjjfz2qY2XIFtttLT3wk5ug_4uljOKTyY3kgoiaWD92Ph0UeobRUmeJ28XrOC4",
  groomFrame: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtyVbbVHfQmirQaXKgujvUj9Ilr6U_cTJPClLt74tzGX5oCuMH3y2g4MN5Hpbyb4qVRX4VB7Xj1c6A6h1R-mkgTKHtm40w1cJ7UoIGnjHlByg3VF-UkMK2tqz6Xrb7OIW_gwzVORQYZ3yS3yrihf-kw2fsQCQ0E1k3ai8tVbQweir5ykHIk0Zh5cNyXGHwWZmrIAv6-pL0rrBfGHOtwTJbfvK8DRJZSJrfNef4GgsE9SwWE_-d_gFvJLljXQ5LSi0bf9A",
  brideFrame: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcNMbjTZJMg4Z5Dwn2OJ6KjYPq_SIY-RV_CsMY97HAeNNldN-1XMW9VtgkgX4FQ2gwjCI*NdOrijgt9-ftXteim4fA6A863MxA6wAFZsU1AcXFDJRVP2qpZtBDHiI3cnE8rj8Rc7MJwnuyol_-sWdLtB_1_KHGPfoleuvNMG_0dfHFv2ui9rjewifHZBDIYANfoclIO2j9XQy1bT_g7mrJJwhSNLL1qadVdfEEvxgEui4DaWrGeRWo-D-9EdZj4kL9--4",
  eventsTexture: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqtYoGFRapKObd6D3UFaZxuFaECJcYVbAt-6plfsDCIVoMEAzQBHGaRsuNXJBUKCJplBUox4lwYMm_K8Nr1OSZ_3oHn89bA_OgXiqqqC6HGgNxxrGIj1dUBSUPzs8jWSUGk2ZuNrhLrLFkkJIxyM-4VUfLBxPyVwbCycU7LqtG3IKe-TbKQTP0pkbpFbV6v-OVWS1MdYncvq2ILlyvTaDymiV8iiruledMuUf06qJtUb4TqdaPYic2hpSC0GD6oHEiWBo",
  storyBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMU6e-AOh9daqdJcdPtyYpoTO8WDTdpVIlBuVOzBwSJYz1FHUudacmPuYoNB7fCTxpOQLy-W4zPYVRmbfO_oZ5qHQym7vd9YzrQhP77xjLq85dlKfne-bU6FPVO9q_jOMXZH80g06wrNi0yOoV47KfauZ0fgoFsW3V70NAEtM6Y6Duh2__AuA37HRVFMbl7kWxJCJaPstuRCtRjQZDUYMOpgEIBfGQ_5TpB4cr8is1WuWh7OYRbEe0vG8k4w8nmfpg_jI",
  giftBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuBa5Xt9kvWEBKNIHCN9yXDaE94Rh7Jbb2h6D3o-pCQYmNiTCtDh39RMA5n5zujVe5_MJJVDl20sdE8cRWLeafeXxVfCVJy9zvXdOcw8p2QilXLMJkPuc9SOp1YMXwhSTUc6ukSiOd514gwmebjo17zAT-goAKhaSye74vAS1Mm0xmycN0V4koOtdYUfsll6HV-HXJof3CJWBvCPVXoQOwCDD421IjFqp8d4h7s_K2jLPUMK6OgRmRwyCr2qawVra3tBmFU",
  closingBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeVtV5TcCt1d5ddpteUVdd3e_dzNLMzsaHMtw7DyLEfbATKl_w3tsRvF-PPxKFqJM7HXAflqg4jxjq4Fv7QC4269i5cdHC0ROL5hW26JwlDl4zRV4s4ruxfSBuMU-s9nE1vZcLMfKDDDdh2KTCh3PjYsz0wB9Jpb-BI76soy8OiUU2aapAHjSGfRyL7Cy2ho3j8UU-7a-Tuhz7xMittGuaU5xNDk2_av8LsIiF7iqpOs2G8zQ81CN6e-wKluN1R-Ir6rw",
  gallery: [
    "https://lh3.googleusercontent.com/aida/AP1WRLurXrYx9c-UIVnKpMOIr2_OJrVxbvnlf51h85eBjeTObYFBRzeUeprIoU0jkX_aUmjNUy_S3KN870yZ3UYxpfKj5x6z73Hmb6NVdBPSM3P7uv_u4MvVuoHVHAbMlhzYIy2V-6HAk2k1bzCeYPMxEF6soMvqeeA3AaRWPFZg_dZVyYbPBl-xo-SQo1MWE8XNByxjmF8hYj2la6ytTne5of-s8YVU61nHYjixRuXLpm2EgsYOeRoFis7Wtxd-",
    "https://lh3.googleusercontent.com/aida/AP1WRLtdUdv0_ZZ4KZzwcqIchHavkoqu0Z97hzllK0PtuMTrUclGYn0YtTmSttZuW1UKUwWCiQUIHuEZqRyfM7hB3dkgotI1J-HrbmicCIpHA-PMvBV65FpKHFovig46ie76J8EObHKpPgCiOfXkLHPrmXshM2HH4eU4xRRyap8Hbti6GsmhaCMvRAixKhpDndBx1mXIRhlnVL0LQmsCTQwECUe8mF0hTAAymy465ReKc0640sVDD-W8Yx2ziT4",
    "https://lh3.googleusercontent.com/aida/AP1WRLs5MFdcLfOnJ67JNfcnEtlhc91W2gB5ddsCYDuOpLX7c5QJhkaGAjKWHP_YBL-A-_Wh2ztjCi8zi138U0ZQYS0YCYWG6vM-bYAJnSX6XBT9RsavMS2FWj5iQDEFhwZ3ajpn_dudYW_8AJ2e4RxYgoPbUsB4KZR7X-c_89FB5eDHHDNciLoqgnfIcMzd5EhfLhbxGYw3RZAhW9UN2IEEPnRoKgoZPNIXHxcTSfusMo9__-esT-QTE7G9Uoc",
    "https://lh3.googleusercontent.com/aida/AP1WRLt-Hp53pSkwoBUyyPo7vimrzSdDYagPSmX-XIpYeJeuGWr3dzBODvshnn18eDrGLecbAyzrTqN5O2iJSkJrwziAPKOWn1xr_q3rDulmU2LrpE44A-HXB132sUwm4DTYhZfKC9u1loEN203go15_1AKF3HQIculcIAj8XdGj4RaK69mq862cgGgpUsK0HhXoU4TeB67BcY8OuZJGdJSuQdS_bM1WwFB9rgO7q9vd9FdwicHhiBSdBeU2tJkM",
    "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI",
    "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI",
  ],
  story: [
    "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI",
    "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI",
    "https://lh3.googleusercontent.com/aida/AP1WRLs5MFdcLfOnJ67JNfcnEtlhc91W2gB5ddsCYDuOpLX7c5QJhkaGAjKWHP_YBL-A-_Wh2ztjCi8zi138U0ZQYS0YCYWG6vM-bYAJnSX6XBT9RsavMS2FWj5iQDEFhwZ3ajpn_dudYW_8AJ2e4RxYgoPbUsB4KZR7X-c_89FB5eDHHDNciLoqgnfIcMzd5EhfLhbxGYw3RZAhW9UN2IEEPnRoKgoZPNIXHxcTSfusMo9__-esT-QTE7G9Uoc",
  ],
  naturalPaper: "https://www.transparenttextures.com/patterns/natural-paper.png",
}

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0 })
  useEffect(() => {
    const target = new Date(targetDate).getTime()
    if (isNaN(target)) return
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

function Gunungan({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M50 0C50 0 35 30 20 40C10 47 2 55 2 70C2 90 15 105 28 112C38 117 50 120 50 120C50 120 62 117 72 112C85 105 98 90 98 70C98 55 90 47 80 40C65 30 50 0 50 0Z" fill="currentColor" opacity="0.08"/>
      <path d="M50 8C50 8 38 33 26 41C17 47 10 54 10 66C10 83 21 95 32 101C40 106 50 108 50 108C50 108 60 106 68 101C79 95 90 83 90 66C90 54 83 47 74 41C62 33 50 8 50 8Z" fill="currentColor" opacity="0.05"/>
    </svg>
  )
}

function Floral({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M60 0C60 0 50 10 40 14C32 17 26 20 26 28C26 36 34 40 60 40C86 40 94 36 94 28C94 20 88 17 80 14C70 10 60 0 60 0Z" fill="currentColor" opacity="0.06"/>
      <path d="M60 4C60 4 52 12 44 15C38 18 33 20 33 26C33 33 39 36 60 36C81 36 87 33 87 26C87 20 82 18 76 15C68 12 60 4 60 4Z" fill="currentColor" opacity="0.04"/>
      <circle cx="60" cy="20" r="2" fill="currentColor" opacity="0.06"/>
      <path d="M30 20L40 14L40 26L30 20Z" fill="currentColor" opacity="0.03"/>
      <path d="M90 20L80 14L80 26L90 20Z" fill="currentColor" opacity="0.03"/>
    </svg>
  )
}

function Motif({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M96 10C96 10 82 40 64 52C48 62 32 74 32 96C32 134 60 152 96 182C132 152 160 134 160 96C160 74 144 62 128 52C110 40 96 10 96 10Z" fill="currentColor" opacity="0.06"/>
      <path d="M96 20C96 20 85 44 70 54C56 63 42 73 42 96C42 128 68 144 96 168C124 144 150 128 150 96C150 73 136 63 122 54C107 44 96 20 96 20Z" fill="currentColor" opacity="0.04"/>
      <circle cx="96" cy="96" r="4" fill="currentColor" opacity="0.05"/>
    </svg>
  )
}

function GiftCard({ label, name, number, bg, accent, dark }: {
  label: string; name: string; number: string; bg: string; accent: string; dark: string
}) {
  const [copied, setCopied] = useState(false)
  const copyNum = () => {
    navigator.clipboard.writeText(number).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }
  return (
    <div className="bg-[#F9F6F0] p-8 rounded-3xl shadow-lg border flex flex-col items-center group overflow-hidden relative" style={{ borderColor: `${accent}44` }}>
      <Motif className="absolute -top-10 -right-10 w-32 opacity-[0.05] rotate-45 scale-125" />
      <div className="px-4 py-1 mb-6 rounded text-white font-bold tracking-widest text-[10px]" style={{ backgroundColor: bg }}>{label}</div>
      <p className="text-[10px] uppercase mb-1 tracking-widest" style={{ color: accent }}>{name}</p>
      <p className="font-['EB_Garamond'] text-2xl mb-8 tracking-widest" style={{ color: dark }}>{number}</p>
      <button
        onClick={copyNum}
        className="bg-white border-2 px-8 py-2.5 rounded-full text-[11px] hover:text-white transition-all flex items-center gap-2 shadow-md"
        style={{ borderColor: accent, color: dark }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = accent; (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.color = dark }}
      >
        <span className="material-symbols-outlined text-[16px]">content_copy</span>
        {copied ? "TERSALIN" : "SALIN REKENING"}
      </button>
    </div>
  )
}

const STORY_DATA = [
  { year: "2022", title: "Awal Mula Pertemuan", desc: "Pertemuan tak terduga di tahun 2022 membuka lembaran baru kisah kami. Berawal dari perkenalan melalui saudara, kami mulai saling menyapa di dunia maya." },
  { year: "April 2026", title: "Lamaran", desc: "Waktu berjalan membawa kami pada jeda komunikasi. Namun takdir berkata lain. Kami kembali terhubung dan menyadari rasa yang tak padam. Dia memberanikan diri datang melamar." },
  { year: "Juli 2026", title: "Menuju Ikatan Suci", desc: "Kini kami siap melangkah ke jenjang yang lebih serius, menyatukan dua hati dalam ikatan pernikahan yang sakral." },
]

export default function HeritageJawa({
  bride_name, groom_name, estimated_wedding_date, guest_name,
  theme: _theme, display_name,
  couple_illustration_url, grayscale: grayscaleProp,
  groom_full_name, bride_full_name,
  groom_photo_url, bride_photo_url,
  groom_parents, bride_parents,
  groom_instagram,
  sessions,
  quote_text,
  quote_source,
  stories,
  gallery_photos,
  gift_accounts,
  gift_address,
  track_url,
  auto_play: autoPlayProp,
  inviting_families,
}: Props) {
  const eventDate = sessions?.[0]?.date || estimated_wedding_date
  const countdown = useCountdown(eventDate)
  const [activeNav, setActiveNav] = useState("home")
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const weddingDateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""
  const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const dayName = eventDate ? daysOfWeek[new Date(eventDate).getDay()] : ""

  const coupleDisplay = display_name || `${bride_name} & ${groom_name}`
  const groomDisplayName = groom_full_name || groom_name
  const brideDisplayName = bride_full_name || bride_name

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "events", "story", "gift"]
      let current = "home"
      sections.forEach(s => {
        const el = document.getElementById(s)
        if (el) {
          const top = el.getBoundingClientRect().top
          if (top <= 200) current = s
        }
      })
      setActiveNav(current)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!audioRef.current || !track_url) return
    const audio = audioRef.current
    const wasPlaying = playing
    audio.src = track_url
    audio.load()
    if (wasPlaying) {
      const resumeAfterLoad = () => {
        audio.play().then(() => setPlaying(true)).catch(() => {})
        audio.removeEventListener("canplaythrough", resumeAfterLoad)
      }
      audio.addEventListener("canplaythrough", resumeAfterLoad)
    }
    if (autoPlayProp && !wasPlaying) {
      const play = () => {
        audio.play().catch(() => {})
        document.removeEventListener("click", play)
        document.removeEventListener("touchstart", play)
      }
      document.addEventListener("click", play, { once: true })
      document.addEventListener("touchstart", play, { once: true })
    }
  }, [track_url, autoPlayProp])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {
        if (audio.readyState < 2) {
          audio.load()
          const onReady = () => {
            audio.play().then(() => setPlaying(true)).catch(() => {})
            audio.removeEventListener("canplaythrough", onReady)
          }
          audio.addEventListener("canplaythrough", onReady)
        }
      })
    }
  }

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <ThemeInjector display="EB Garamond" script="Pinyon Script" body="Be Vietnam Pro">
      <style>{`
        .hj-glass-nav {
          background: rgba(249,246,240,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        @keyframes hj-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .hj-float { animation: hj-float 4s ease-in-out infinite; }
        .hj-no-scrollbar::-webkit-scrollbar { display: none; }
        .hj-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hj-parchment-bg {
          background-color: #fcf9f3;
          background-image: linear-gradient(rgba(252,249,243,0.92), rgba(252,249,243,0.92)), url(${IMG.parchment});
          background-size: cover;
          background-attachment: fixed;
        }
      `}</style>
      <main className="w-full max-w-[480px] min-h-screen shadow-2xl relative overflow-hidden mx-auto hj-parchment-bg" style={{ color: "#1c1c18" }}>
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: `url(${IMG.naturalPaper})`, opacity: 0.4 }} />
        <div className="relative z-10">

          {/* GLASS NAV */}
          <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex justify-between items-center px-6 py-1 hj-glass-nav border-b" style={{ borderColor: "#C1A05E33" }}>
            <span className="material-symbols-outlined text-[24px]" style={{ color: "#472A1C" }}>menu</span>
            <h1 className="font-['Pinyon_Script'] text-[32px] leading-none" style={{ color: "#C1A05E" }}>{coupleDisplay}</h1>
            <span className="material-symbols-outlined text-[24px]" style={{ color: "#472A1C" }}>favorite</span>
          </header>

          {/* HERO */}
          <section id="home" className="relative h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden" style={{ backgroundImage: `url(${IMG.heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "#F9F6F0", opacity: 0.6, backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />
            <div className="relative z-10 space-y-4 text-center w-full">
              <p className="text-[12px] uppercase tracking-[0.3em] text-center" style={{ color: "#472A1Ccc" }}>The Wedding of</p>
              <h2 className="font-['Pinyon_Script'] text-[64px] leading-none mb-4 text-center" style={{ color: "#472A1C" }}>{coupleDisplay}</h2>
              <div className="relative w-full max-w-[200px] mx-auto my-8 hj-float border-2 rounded-full p-4 shadow-2xl" style={{ borderColor: "#C1A05E33", backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                <div className="absolute inset-0 rounded-full scale-105 blur-xl" style={{ backgroundColor: "#C1A05E1a" }} />
                {couple_illustration_url ? (
                  <img alt="" className="w-full h-auto object-contain drop-shadow-2xl relative" src={couple_illustration_url} style={{ filter: grayscaleProp ? "grayscale(100%)" : undefined }} />
                ) : (
                  <div className="w-full aspect-square rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#fcf9f344" }}>
                    <svg className="w-20 h-24" viewBox="0 0 100 120" fill="none"><path d="M50 0C50 0 35 30 20 40C10 47 2 55 2 70C2 90 15 105 28 112C38 117 50 120 50 120C50 120 62 117 72 112C85 105 98 90 98 70C98 55 90 47 80 40C65 30 50 0 50 0Z" fill="#C1A05E" opacity="0.4"/></svg>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-['EB_Garamond'] text-[24px] italic" style={{ color: "#472A1C", fontWeight: 500 }}>{dayName}, {weddingDateFormatted}</p>
                <div className="flex items-center gap-3 justify-center">
                  <div className="h-px w-8" style={{ backgroundColor: "#C1A05E88" }} />
                  <span className="text-[10px] tracking-[0.1em]" style={{ color: "#C1A05E", fontWeight: 600 }}>SAVE THE DATE</span>
                  <div className="h-px w-8" style={{ backgroundColor: "#C1A05E88" }} />
                </div>
              </div>
              <div className="pt-8 text-center">
                <button
                  onClick={() => scrollTo("events")}
                  className="px-10 py-3 rounded-full text-[12px] uppercase tracking-[0.1em] flex items-center gap-3 transition-all active:scale-95 shadow-xl mx-auto font-semibold"
                  style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#C1A05E" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#472A1C" }}
                >
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  BUKA UNDANGAN
                </button>
              </div>
            </div>
          </section>

          {/* QUOTE */}
          <section className="py-20 px-6 text-center space-y-6 relative overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
            <div className="flex flex-col items-center">
              <Gunungan className="w-16 h-auto mb-6" style={{ color: "#C1A05Ecc", opacity: 0.8 }} />
              <p className="font-['EB_Garamond'] text-[18px] italic leading-relaxed max-w-sm mx-auto px-4" style={{ color: "#472A1Ce6" }}>
                &ldquo;{quote_text || "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."}&rdquo;
              </p>
              {quote_source && (
                <p className="text-[12px] tracking-[0.1em] font-bold mt-6" style={{ color: "#C1A05E", fontWeight: 700 }}>- {quote_source} -</p>
              )}
              <div className="w-16 h-px mt-8" style={{ backgroundColor: "#C1A05E55" }} />
            </div>
          </section>

          {/* PROFILE */}
          <section className="py-20 px-6 relative">
            <div className="text-center mb-12">
              <h3 className="font-['EB_Garamond'] text-[32px] mb-4" style={{ color: "#472A1C", fontWeight: 600 }}>Mempelai</h3>
              <p className="text-[16px] px-4 leading-relaxed" style={{ color: "#50443f" }}>Atas izin Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i dalam acara pernikahan kami:</p>
            </div>
            <div className="space-y-16">
              {/* Groom */}
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  <div className="w-56 h-56 rounded-full border-2 flex items-center justify-center relative p-1" style={{ borderColor: "#C1A05E55" }}>
                    <div className="absolute inset-0 rounded-full opacity-40 pointer-events-none scale-125" style={{ backgroundImage: `url(${IMG.groomFrame})`, backgroundSize: "contain", backgroundPosition: "center" }} />
                    <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl relative z-10">
                      {groom_photo_url ? (
                        <img alt="Portrait of Groom" className="w-full h-full object-cover" src={groom_photo_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fcf9f3, #C1A05E22)" }}>
                          <span className="material-symbols-outlined text-5xl" style={{ color: "#C1A05E44" }}>face_6</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <h4 className="font-['EB_Garamond'] text-[40px] mb-1" style={{ color: "#472A1C", fontWeight: 600 }}>{groomDisplayName}</h4>
                <p className="text-[12px] tracking-[0.1em] mb-2 font-semibold" style={{ color: "#C1A05E" }}>Putra bungsu dari</p>
                <p className="font-['EB_Garamond'] text-[16px] italic font-medium" style={{ color: "#50443f" }}>{groom_parents || "(Alm.) Bapak Ariffin & Ibu Nawen"}</p>
                <a href={groom_instagram ? `https://instagram.com/${groom_instagram.replace("@", "")}` : "#"} target={groom_instagram ? "_blank" : "_self"} rel="noopener noreferrer" className="mt-4 flex items-center gap-1 text-[10px] tracking-widest hover:underline" style={{ color: "#C1A05E" }}>
                  <span className="material-symbols-outlined text-[14px]">link</span> INSTAGRAM
                </a>
              </div>

              <div className="flex items-center justify-center py-4">
              <Floral className="w-24 opacity-50" style={{ color: "#C1A05E" }} />
            </div>
            {/* Bride */}
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  <div className="w-56 h-56 rounded-full border-2 flex items-center justify-center relative p-1" style={{ borderColor: "#C1A05E55" }}>
                    <div className="absolute inset-0 rounded-full opacity-40 pointer-events-none scale-125" style={{ backgroundImage: `url(${IMG.brideFrame})`, backgroundSize: "contain", backgroundPosition: "center", transform: "rotate(180deg)" }} />
                    <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl relative z-10">
                      {bride_photo_url ? (
                        <img alt="Portrait of Bride" className="w-full h-full object-cover" src={bride_photo_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fcf9f3, #C1A05E22)" }}>
                          <span className="material-symbols-outlined text-5xl" style={{ color: "#C1A05E44" }}>face_4</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <h4 className="font-['EB_Garamond'] text-[40px] mb-1" style={{ color: "#472A1C", fontWeight: 600 }}>{brideDisplayName}</h4>
                <p className="text-[12px] tracking-[0.1em] mb-2 font-semibold" style={{ color: "#C1A05E" }}>Putri bungsu dari</p>
                <p className="font-['EB_Garamond'] text-[16px] italic font-medium" style={{ color: "#50443f" }}>{bride_parents || "(Alm.) Bapak Syahrum & Ibu Tugini"}</p>
              </div>
            </div>
          </section>

          {/* TURUT MENGUNDANG */}
          <section className="py-20 px-6 relative" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
            <div className="text-center space-y-8 relative z-10">
              <Floral className="w-24 opacity-50 mx-auto" style={{ color: "#C1A05E" }} />
              <h3 className="font-['EB_Garamond'] text-[32px]" style={{ color: "#472A1C", fontWeight: 600 }}>Turut Mengundang</h3>
              <div className="space-y-4 text-[16px] leading-relaxed" style={{ color: "#50443f" }}>
                {inviting_families && inviting_families.filter(Boolean).length > 0 ? (
                  inviting_families.filter(Boolean).map((f, i) => (
                    <p key={i} className="italic">Keluarga Besar {f}</p>
                  ))
                ) : (
                  <>
                    <p className="italic">Keluarga Besar Bpk. Ariffin (Alm)</p>
                    <p className="italic">Keluarga Besar Bpk. Syahrum (Alm)</p>
                    <p className="italic">Serta segenap keluarga &amp; kerabat</p>
                  </>
                )}
              </div>
              <div className="w-16 h-px mx-auto mt-8" style={{ backgroundColor: "#C1A05E55" }} />
            </div>
          </section>

          {/* EVENTS */}
          <section id="events" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: "#f0eee8" }}>
            <div className="absolute inset-0 opacity-10 grayscale pointer-events-none bg-repeat" style={{ backgroundImage: `url(${IMG.eventsTexture})`, backgroundSize: "300px" }} />
            <h3 className="font-['EB_Garamond'] text-[32px] mb-12 text-center relative z-10" style={{ color: "#472A1C", fontWeight: 600 }}>Save The Date</h3>
            <div className="flex justify-between gap-4 mb-16 max-w-xs mx-auto relative z-10">
              {(["days", "hours", "minutes"] as const).map(unit => (
                <div key={unit} className="flex-1 p-4 rounded-xl border shadow-md text-center" style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: "#C1A05E44", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                  <div className="font-['EB_Garamond'] text-3xl" style={{ color: "#472A1C", fontWeight: 500 }}>{String(countdown[unit]).padStart(2, "0")}</div>
                  <div className="text-[10px] uppercase font-semibold" style={{ color: "#C1A05E" }}>{unit === "days" ? "Hari" : unit === "hours" ? "Jam" : "Menit"}</div>
                </div>
              ))}
            </div>
            <div className="space-y-10 relative z-10">
              {sessions && sessions.length > 0 ? sessions.map((session, i) => {
                const sessionDate = session.date
                  ? new Date(session.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : ""
                const sessionDay = session.date
                  ? daysOfWeek[new Date(session.date).getDay()]
                  : ""
                return (
                  <div key={i} className="bg-[#F9F6F0] p-8 rounded-3xl border shadow-xl relative overflow-hidden group" style={{ borderColor: "#C1A05E33" }}>
                    <div className={`absolute ${i % 2 === 0 ? '-right-16 -top-16' : '-left-16 -bottom-16'} opacity-10 transition-transform group-hover:scale-110 duration-700`}>
                      <Motif className={`w-48 ${i % 2 === 1 ? 'rotate-180' : ''}`} style={{ color: "#C1A05E" }} />
                    </div>
                    <span className="text-[12px] tracking-widest block mb-4 pb-2 border-b font-semibold" style={{ color: "#C1A05E", borderColor: "#C1A05E1a" }}>{session.name.toUpperCase()}</span>
                    <h4 className="font-['EB_Garamond'] text-[24px] mb-2" style={{ color: "#472A1C", fontWeight: 500 }}>{sessionDay ? `${sessionDay}, ${sessionDate}` : weddingDateFormatted ? `${dayName}, ${weddingDateFormatted}` : ""}</h4>
                    <p className="text-[16px] mb-6 italic leading-relaxed" style={{ color: "#50443f" }}>{session.time ? `Pukul ${session.time} ${session.timezone || ''}` : ''}</p>
                    <div className="space-y-1 mb-8">
                      <p className="text-[16px] font-bold" style={{ color: "#472A1C" }}>Lokasi</p>
                      <p className="text-[16px] text-sm leading-relaxed" style={{ color: "#50443f" }}>
                        {session.venue}{session.venue && session.address ? <br /> : null}{session.address}
                      </p>
                    </div>
                    {session.maps_url ? (
                      <a href={session.maps_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-[12px] tracking-[0.1em] shadow-lg transition-all font-semibold"
                        style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#C1A05E" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#472A1C" }}>
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        LIHAT LOKASI
                      </a>
                    ) : null}
                  </div>
                )
              }) : (
                <>
                  {/* Akad fallback */}
                  <div className="bg-[#F9F6F0] p-8 rounded-3xl border shadow-xl relative overflow-hidden group" style={{ borderColor: "#C1A05E33" }}>
                    <div className="absolute -right-16 -top-16 opacity-10 transition-transform group-hover:scale-110 duration-700">
                      <Motif className="w-48" style={{ color: "#C1A05E" }} />
                    </div>
                    <span className="text-[12px] tracking-widest block mb-4 pb-2 border-b font-semibold" style={{ color: "#C1A05E", borderColor: "#C1A05E1a" }}>AKAD NIKAH</span>
                    <h4 className="font-['EB_Garamond'] text-[24px] mb-2" style={{ color: "#472A1C", fontWeight: 500 }}>{dayName}, {weddingDateFormatted}</h4>
                    <p className="text-[16px] mb-6 italic leading-relaxed" style={{ color: "#50443f" }}>Pukul 08:00 WIB - Selesai</p>
                    <div className="space-y-1 mb-8">
                      <p className="text-[16px] font-bold" style={{ color: "#472A1C" }}>Lokasi</p>
                      <p className="text-[16px] text-sm leading-relaxed" style={{ color: "#50443f" }}>Jl. Blok 1 Dusun 1 Desa Wonosari<br/>Kecamatan Tanjung Morawa</p>
                    </div>
                    <a href="https://maps.app.goo.gl/JxDdCyvpvjbsQenAA" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-[12px] tracking-[0.1em] shadow-lg transition-all font-semibold"
                      style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#C1A05E" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#472A1C" }}>
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      LIHAT LOKASI
                    </a>
                  </div>
                  {/* Resepsi fallback */}
                  <div className="bg-[#F9F6F0] p-8 rounded-3xl border shadow-xl relative overflow-hidden group" style={{ borderColor: "#C1A05E33" }}>
                    <div className="absolute -left-16 -bottom-16 opacity-10 transition-transform group-hover:scale-110 duration-700">
                      <Motif className="w-48 rotate-180" style={{ color: "#C1A05E" }} />
                    </div>
                    <span className="text-[12px] tracking-widest block mb-4 pb-2 border-b font-semibold" style={{ color: "#C1A05E", borderColor: "#C1A05E1a" }}>RESEPSI</span>
                    <h4 className="font-['EB_Garamond'] text-[24px] mb-2" style={{ color: "#472A1C", fontWeight: 500 }}>{dayName}, {weddingDateFormatted}</h4>
                    <p className="text-[16px] mb-6 italic leading-relaxed" style={{ color: "#50443f" }}>Pukul 11:00 WIB - Selesai</p>
                    <div className="space-y-1 mb-8">
                      <p className="text-[16px] font-bold" style={{ color: "#472A1C" }}>Lokasi</p>
                      <p className="text-[16px] text-sm leading-relaxed" style={{ color: "#50443f" }}>Jl. Blok 1 Dusun 1 Desa Wonoasari<br/>Kecamatan Tanjung Morawa</p>
                    </div>
                    <a href="https://maps.app.goo.gl/JxDdCyvpvjbsQenAA" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-[12px] tracking-[0.1em] shadow-lg transition-all font-semibold"
                      style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#C1A05E" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#472A1C" }}>
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      LIHAT LOKASI
                    </a>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* STORY */}
          <section id="story" className="py-20 px-6 relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url(${IMG.storyBg})`, backgroundSize: "cover" }} />
            <div className="text-center mb-16 relative">
              <h3 className="font-['EB_Garamond'] text-[32px]" style={{ color: "#472A1C", fontWeight: 600 }}>Love Story</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-12 h-px" style={{ backgroundColor: "#C1A05E" }} />
                <span className="material-symbols-outlined text-sm" style={{ color: "#C1A05E" }}>spa</span>
                <div className="w-12 h-px" style={{ backgroundColor: "#C1A05E" }} />
              </div>
            </div>
            <div className="relative border-l-2 ml-4 space-y-12" style={{ borderColor: "#C1A05E33" }}>
              {(stories && stories.length > 0 ? stories : STORY_DATA).map((s: any, i: number) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F9F6F0", borderColor: "#C1A05E", borderWidth: 2 }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C1A05E" }} />
                  </div>
                  <div className="p-6 rounded-2xl shadow-sm border" style={{ backgroundColor: "rgba(255,255,255,0.7)", borderColor: "#C1A05E1a", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    <span className="text-[12px] tracking-widest mb-2 block font-bold" style={{ color: "#C1A05E" }}>{s.year}</span>
                    <div className="mb-4 flex justify-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-2 shadow-lg relative" style={{ borderColor: "#C1A05E55" }}>
                        <img alt={s.title} className="w-full h-full object-cover" src={s.image_url || IMG.story[i] || IMG.story[0]} />
                      </div>
                    </div>
                    <h5 className="font-['EB_Garamond'] text-lg mb-3" style={{ color: "#472A1C" }}>{s.title}</h5>
                    <p className="text-[16px] text-sm leading-relaxed" style={{ color: "#50443f" }}>{s.description || s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* GALLERY */}
          <section className="py-20 px-0 relative overflow-hidden" id="gallery">
            <div className="text-center mb-12 px-6">
              <Gunungan className="w-16 h-auto mx-auto mb-4" style={{ color: "#C1A05Ecc", opacity: 0.8 }} />
              <h3 className="font-['EB_Garamond'] text-[32px]" style={{ color: "#472A1C", fontWeight: 600 }}>Galeri</h3>
              <div className="w-12 h-px mx-auto mt-4" style={{ backgroundColor: "#C1A05E55" }} />
            </div>
            <div className="relative w-full">
              <div className="flex overflow-x-auto snap-x snap-mandatory hj-no-scrollbar gap-4 px-6 pb-8">
                {(gallery_photos && gallery_photos.length > 0 ? gallery_photos : IMG.gallery).map((url: string, i: number) => (
                  <div key={i} className="snap-center shrink-0 w-4/5 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 relative group" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
                    <img alt={`Gallery Image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={url} />
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {(gallery_photos && gallery_photos.length > 0 ? gallery_photos : IMG.gallery).map((_: any, i: number) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "" : ""}`} style={{ backgroundColor: i === 0 ? "#472A1C99" : "#C1A05E55" }} />
                ))}
              </div>
            </div>
          </section>

          {/* GIFT */}
          <section id="gift" className="py-20 px-6 text-center relative" style={{ backgroundColor: "#e5e2dc" }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${IMG.giftBg})`, backgroundSize: "cover", backgroundPosition: "bottom" }} />
            <h3 className="font-['EB_Garamond'] text-[32px] mb-6 relative z-10" style={{ color: "#472A1C", fontWeight: 600 }}>Love Gift</h3>
            <p className="text-[16px] mb-12 max-w-[300px] mx-auto relative z-10 leading-relaxed" style={{ color: "#50443f" }}>
              Doa restu Anda adalah karunia terindah bagi kami. Namun jika Anda ingin memberi tanda kasih, kami menyediakan:
            </p>
            <div className="space-y-8 relative z-10">
              {gift_accounts && gift_accounts.length > 0 ? gift_accounts.map((acc, i) => (
                <GiftCard
                  key={i}
                  label={acc.provider_name?.toUpperCase() || (acc.type === "ewallet" ? "E-WALLET" : "BANK")}
                  name={`A/N ${acc.account_name?.toUpperCase() || ""}`}
                  number={acc.account_number || ""}
                  bg="#472A1C"
                  accent="#C1A05E"
                  dark="#472A1C"
                />
              )) : (
                <>
                  <GiftCard label="BANK MANDIRI" name="A/N TRIA AMANDA SARI" number="338001052747530" bg="#472A1C" accent="#C1A05E" dark="#472A1C" />
                  <GiftCard label="SHOPEEPAY" name="A/N TRIA AMANDA SARI" number="082361944259" bg="#C1A05E" accent="#C1A05E" dark="#472A1C" />
                </>
              )}
            </div>
            {gift_address && (
              <div className="mt-8 relative z-10">
                <button
                  onClick={() => {
                    const el = document.getElementById("gift-address")
                    if (el) el.classList.toggle("hidden")
                  }}
                  className="bg-white border-2 px-6 py-2.5 rounded-full text-[11px] text-[#472A1C] hover:text-white transition-all"
                  style={{ borderColor: "#C1A05E" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#C1A05E"; (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.color = '#472A1C' }}
                >
                  <span className="material-symbols-outlined text-[16px] align-middle mr-1">local_shipping</span>
                  LIHAT ALAMAT PENGIRIMAN
                </button>
                <div id="gift-address" className="hidden mt-4 p-6 rounded-2xl border text-left" style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "#C1A05E33" }}>
                  <p className="font-['EB_Garamond'] text-lg whitespace-pre-line" style={{ color: "#472A1C" }}>{gift_address}</p>
                </div>
              </div>
            )}
          </section>

          {/* WISHES & RSVP */}
          <section className="py-20 px-6 relative">
            <h3 className="font-['EB_Garamond'] text-[32px] mb-8 text-center" style={{ color: "#472A1C", fontWeight: 600 }}>Wishes &amp; RSVP</h3>
            <form className="space-y-6 text-left p-8 rounded-3xl border" style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "#C1A05E33", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onSubmit={e => e.preventDefault()}>
              <div>
                <label className="text-[10px] block mb-2 tracking-[0.2em] font-bold" style={{ color: "#C1A05E" }}>NAMA LENGKAP</label>
                <input className="w-full bg-transparent border-0 border-b-2 px-0 py-2 font-['EB_Garamond'] text-base outline-none focus:outline-none" style={{ borderColor: "#C1A05E33", color: "#472A1C" }} placeholder="Masukan nama anda" type="text" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] block mb-2 tracking-[0.2em] font-bold" style={{ color: "#C1A05E" }}>KEHADIRAN</label>
                  <select className="w-full bg-transparent border-0 border-b-2 px-0 py-2 font-['EB_Garamond'] text-base outline-none focus:outline-none" style={{ borderColor: "#C1A05E33", color: "#472A1C" }}>
                    <option>Hadir</option>
                    <option>Tidak Hadir</option>
                    <option>Ragu-ragu</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] block mb-2 tracking-[0.2em] font-bold" style={{ color: "#C1A05E" }}>JUMLAH TAMU</label>
                  <select className="w-full bg-transparent border-0 border-b-2 px-0 py-2 font-['EB_Garamond'] text-base outline-none focus:outline-none" style={{ borderColor: "#C1A05E33", color: "#472A1C" }}>
                    <option>1 orang</option>
                    <option>2 orang</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] block mb-2 tracking-[0.2em] font-bold" style={{ color: "#C1A05E" }}>DOA &amp; UCAPAN</label>
                <textarea className="w-full bg-transparent border-0 border-b-2 px-0 py-2 outline-none focus:outline-none" style={{ borderColor: "#C1A05E33", color: "#472A1C", fontFamily: "Be Vietnam Pro, sans-serif" }} placeholder="Tulis ucapan anda..." rows={3} />
              </div>
              <button type="submit" className="w-full py-4 rounded-full text-sm tracking-[0.2em] shadow-xl transition-all active:scale-95 font-semibold" style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#2f1609" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#472A1C" }}>
                KIRIM UCAPAN
              </button>
            </form>
          </section>

          {/* CLOSING */}
          <section className="py-20 px-6 text-center relative overflow-hidden" style={{ backgroundColor: "#472A1C", color: "#F9F6F0" }}>
            <div className="absolute inset-0 opacity-20">
              <img alt="Background pattern" className="w-full h-full object-cover scale-110" src={IMG.closingBg} />
            </div>
            <div className="relative z-10 space-y-10">
              <Motif className="w-20 mx-auto" style={{ color: "#C1A05Ecc", opacity: 0.8 }} />
              <p className="font-['EB_Garamond'] text-lg italic leading-relaxed px-6" style={{ color: "rgba(249,246,240,0.8)" }}>
                Suatu kebahagiaan &amp; kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan do'a restu kepada kami.
              </p>
              <div className="space-y-4">
                <p className="text-xs tracking-[0.4em] font-bold" style={{ color: "#C1A05E" }}>KAMI YANG BERBAHAGIA</p>
                <h3 className="font-['Pinyon_Script'] text-[56px]" style={{ color: "#ffffff" }}>{coupleDisplay}</h3>
              </div>
              <div className="w-12 h-px mx-auto" style={{ backgroundColor: "#C1A05E" }} />
            </div>
          </section>

        </div>
      </main>

      {/* BOTTOM NAV — outside main to avoid iOS fixed-position clipping */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex justify-around items-center px-4 py-3 hj-glass-nav rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t" style={{ borderColor: "#C1A05E1a" }}>
        {[
          { id: "home", icon: "home", target: "home" },
          { id: "events", icon: "calendar_today", target: "events" },
          { id: "story", icon: "auto_stories", target: "story" },
          { id: "gift", icon: "card_giftcard", target: "gift" },
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => scrollTo(nav.target)}
            className="flex flex-col items-center justify-center transition-all w-12 h-12"
            style={{
              backgroundColor: activeNav === nav.id ? "#C1A05E1a" : "transparent",
              color: activeNav === nav.id ? "#472A1C" : "#50443f",
              borderRadius: activeNav === nav.id ? "9999px" : "0",
            }}
          >
            <span className="material-symbols-outlined text-[20px]">{nav.icon}</span>
          </button>
        ))}
      </nav>

      {/* MUSIC BUTTON — outside main to avoid iOS fixed-position clipping */}
      <audio ref={audioRef} loop />
      <button
        onClick={toggleMusic}
        className="fixed bottom-24 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hj-float border" style={{ backgroundColor: "#472A1C", color: "#C1A05E", borderColor: "#C1A05E55", right: "24px" }}>
        <span className="material-symbols-outlined">{playing ? "music_note" : "music_off"}</span>
      </button>
    </ThemeInjector>
  )
}
