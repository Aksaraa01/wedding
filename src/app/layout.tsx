import type { Metadata } from "next"
import RouteUnlock from "@/components/RouteUnlock"
import CloudflareBeacon from "@/components/CloudflareBeacon"
import AudioWarmup from "@/components/AudioWarmup"
import ChunkErrorWatcher from "@/components/ChunkErrorWatcher"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo"
import "./globals.css"
import "./fonts.css"

export const metadata: Metadata = {
  title: {
    default: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    template: "%s | Aksaraa Wedding",
  },
  description:
    "Aksaraa Wedding: undangan pernikahan digital, buku tamu digital QR, galeri foto tamu, wish wall, dan reminder WhatsApp untuk hari bahagia Anda.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp, semua dalam satu genggaman.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp, semua dalam satu genggaman.",
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
  verification: { google: "ifDL7s6gKstun8HclzEYCap2-w4Ss1biIA5EtVlRVFg" },
  icons: { icon: "/icon.svg" },
}

export const viewport = {
  themeColor: "#4f1519",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        {/* Material Symbols is subset to the icons this app actually uses
            (167 of them, 179 KB instead of the full variable font's 1.1 MB).
            `scripts/check-material-icons.mjs` fails the deploy guard when a new
            icon name appears without being added here. */}
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=account_balance,account_circle,account_tree,add,add_a_photo,add_circle,add_photo_alternate,analytics,apartment,arrow_back,arrow_circle_right,arrow_downward,arrow_forward,arrow_left,arrow_right,arrow_right_alt,assignment_late,auto_awesome,auto_fix_high,auto_stories,badge,bar_chart,battery_full,block,bolt,burst_mode,calendar_month,calendar_today,call,camera,camera_roll,cameraswitch,card_giftcard,celebration,chat,check,check_circle,chevron_left,chevron_right,close,cloud_done,confirmation_number,content_copy,credit_card,crop_landscape,crop_portrait,dashboard,delete,delete_sweep,desktop_mac,directions,download,drag_indicator,eco,edit,edit_calendar,edit_note,error,error_outline,event,event_available,event_busy,expand_less,expand_more,face,favorite,featured_seasonal_and_gifts,fit_screen,flip_camera_ios,folder_zip,forum,graphic_eq,grid_view,group,group_add,group_off,groups,hide_image,high_quality,history,history_edu,home_pin,hourglass_disabled,hourglass_empty,hourglass_top,image,info,inventory_2,keyboard_arrow_down,keyboard_arrow_up,language,leaderboard,link,local_offer,local_shipping,location_on,lock,logout,magic_button,mail,map,mark_email_read,menu,menu_book,menu_open,movie,music_note,near_me,north_east,notifications_active,open_in_new,palette,pause_circle,payments,people_outline,person,person_add,person_search,phone_iphone,phone_missed,photo_camera,photo_library,play_arrow,play_disabled,print,progress_activity,public,push_pin,qr_code_2,qr_code_scanner,rate_review,refresh,replay,save,schedule,school,search,search_off,send,sensors,settings,share,shopping_bag,shopping_cart,signal_cellular_4_bar,smartphone,speed,sports_esports,star,stars,swap_horiz,sync,touch_app,tune,upgrade,upload_file,verified,verified_user,videocam,videocam_off,view_list,visibility,visibility_off,volunteer_activism,warning,waving_hand,wifi,wifi_off,workspace_premium,zoom_in,zoom_in_map&display=block`}
        />
        {/* Template previews are iframes on wp.aksaraa.com. Warm up DNS + TLS
            while the visitor is still scrolling so the modal opens sooner. */}
        <link rel="dns-prefetch" href="https://wp.aksaraa.com" />
        <link rel="preconnect" href="https://wp.aksaraa.com" />
      </head>
      <body
        className="font-body-md bg-background text-on-surface"
        data-mode="connect"
      >
        {children}
        <RouteUnlock />
        <ChunkErrorWatcher />
        <CloudflareBeacon />
        <AudioWarmup />
      </body>
    </html>
  )
}