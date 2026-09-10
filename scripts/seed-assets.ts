/**
 * Seed external images to Supabase Storage.
 *
 * Usage: npx tsx scripts/seed-assets.ts
 *
 * This uploads all hardcoded lh3.googleusercontent.com / unsplash / drive
 * URLs to the "media" bucket under seeded/{category} so the app is no
 * longer dependent on third-party hosts.
 *
 * After running, the ASSETS config in src/lib/assets.ts will resolve
 * to the correct Supabase Storage URLs.
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const BUCKET = "media"

type AssetEntry = {
  source: string   // original URL
  folder: string   // subfolder under seeded/
  name: string     // filename
}

const ASSETS: AssetEntry[] = [
  // --- hero ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXu7JQKKST0iz1n9f7pP36a_q8xJ2bqTVrMzeoyK5evwNDjZZI3pzl-CuOI5sYxAPJrMgnUgEbmHFnP5pcqTcBulnbB64QCVFw9YM6562hqS1n6Pdh7q_c5q_AgGhJ-yagx4ICnHjMLbkgkpXtrGGLerk5C87-19CZGQzDGKRY5BaUJ3F0xuuKl8WqbDj0tcSg8Kwy-Y4iW8ZeaxqyVKJA0--9kc6S-fn0D_49lxtZ-2ECNSD6hNQZ3eWYRms5R2eQlAMHQt9moD2tVQ", folder: "hero", name: "hero-mockup-dark.png" },

  // --- heritage jawa ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrV_0lYgYUkE4VlvVBI8uKfbS0s-GuC6g52rlYebAdp0DCqHYlZwTiIVkkkT8WmZouCHy4L8pBmhpT-mgEz5hv88N4bFTKtBBL5hxHddm0wfFHT0_zMJ2TbbaeqhHN0SKqXZayappZDK82zHV3uPHdEBVYHoRRZPIm9tssJGXCHK668NZnoY4D_o7rhjYvylJUNs9-k2o4YEYvzXn_hijhzKA_IkcUlVLDTtks9zt95s2n1f3Zjn7Ltq74tNeD3vakaG8", folder: "heritage-jawa", name: "parchment.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtauSat3IABhE81EPzyujWU2U08RAlwTNnWVZU54NK155Bngz7kkwULzyUcB8DhyIvj_nFHW4azPl9ecqIL_vsTY7lPYE1aIl3hkEhimh_bu62fzNfFVj2sjOIuKNiwZRPYNcvc3MFXz8MNEh2o3trTyNUW8V9N3XRrQ-wcahIGKKX21dtbd6Hhff4TTooFbzzYHS5Fdjjfz2qY2XIFtttLT3wk5ug_4uljOKTyY3kgoiaWD92Ph0UeobRUmeJ28XrOC4", folder: "heritage-jawa", name: "hero-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtyVbbVHfQmirQaXKgujvUj9Ilr6U_cTJPClLt74tzGX5oCuMH3y2g4MN5Hpbyb4qVRX4VB7Xj1c6A6h1R-mkgTKHtm40w1cJ7UoIGnjHlByg3VF-UkMK2tqz6Xrb7OIW_gwzVORQYZ3yS3yrihf-kw2fsQCQ0E1k3ai8tVbQweir5ykHIk0Zh5cNyXGHwWZmrIAv6-pL0rrBfGHOtwTJbfvK8DRJZSJrfNef4GgsE9SwWE_-d_gFvJLljXQ5LSi0bf9A", folder: "heritage-jawa", name: "groom-frame.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcNMbjTZJMg4Z5Dwn2OJ6KjYPq_SIY-RV_CsMY97HAeNNldN-1XMW9VtgkgX4FQ2gwjCI*NdOrijgt9-ftXteim4fA6A863MxA6wAFZsU1AcXFDJRVP2qpZtBDHiI3cnE8rj8Rc7MJwnuyol_-sWdLtB_1_KHGPfoleuvNMG_0dfHFv2ui9rjewifHZBDIYANfoclIO2j9XQy1bT_g7mrJJwhSNLL1qadVdfEEvxgEui4DaWrGeRWo-D-9EdZj4kL9--4", folder: "heritage-jawa", name: "bride-frame.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqtYoGFRapKObd6D3UFaZxuFaECJcYVbAt-6plfsDCIVoMEAzQBHGaRsuNXJBUKCJplBUox4lwYMm_K8Nr1OSZ_3oHn89bA_OgXiqqqC6HGgNxxrGIj1dUBSUPzs8jWSUGk2ZuNrhLrLFkkJIxyM-4VUfLBxPyVwbCycU7LqtG3IKe-TbKQTP0pkbpFbV6v-OVWS1MdYncvq2ILlyvTaDymiV8iiruledMuUf06qJtUb4TqdaPYic2hpSC0GD6oHEiWBo", folder: "heritage-jawa", name: "events-texture.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMU6e-AOh9daqdJcdPtyYpoTO8WDTdpVIlBuVOzBwSJYz1FHUudacmPuYoNB7fCTxpOQLy-W4zPYVRmbfO_oZ5qHQym7vd9YzrQhP77xjLq85dlKfne-bU6FPVO9q_jOMXZH80g06wrNi0yOoV47KfauZ0fgoFsW3V70NAEtM6Y6Duh2__AuA37HRVFMbl7kWxJCJaPstuRCtRjQZDUYMOpgEIBfGQ_5TpB4cr8is1WuWh7OYRbEe0vG8k4w8nmfpg_jI", folder: "heritage-jawa", name: "story-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBa5Xt9kvWEBKNIHCN9yXDaE94Rh7Jbb2h6D3o-pCQYmNiTCtDh39RMA5n5zujVe5_MJJVDl20sdE8cRWLeafeXxVfCVJy9zvXdOcw8p2QilXLMJkPuc9SOp1YMXwhSTUc6ukSiOd514gwmebjo17zAT-goAKhaSye74vAS1Mm0xmycN0V4koOtdYUfsll6HV-HXJof3CJWBvCPVXoQOwCDD421IjFqp8d4h7s_K2jLPUMK6OgRmRwyCr2qawVra3tBmFU", folder: "heritage-jawa", name: "gift-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeVtV5TcCt1d5ddpteUVdd3e_dzNLMzsaHMtw7DyLEfbATKl_w3tsRvF-PPxKFqJM7HXAflqg4jxjq4Fv7QC4269i5cdHC0ROL5hW26JwlDl4zRV4s4ruxfSBuMU-s9nE1vZcLMfKDDDdh2KTCh3PjYsz0wB9Jpb-BI76soy8OiUU2aapAHjSGfRyL7Cy2ho3j8UU-7a-Tuhz7xMittGuaU5xNDk2_av8LsIiF7iqpOs2G8zQ81CN6e-wKluN1R-Ir6rw", folder: "heritage-jawa", name: "closing-bg.jpg" },

  // --- heritage jawa gallery (6 unique) ---
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLurXrYx9c-UIVnKpMOIr2_OJrVxbvnlf51h85eBjeTObYFBRzeUeprIoU0jkX_aUmjNUy_S3KN870yZ3UYxpfKj5x6z73Hmb6NVdBPSM3P7uv_u4MvVuoHVHAbMlhzYIy2V-6HAk2k1bzCeYPMxEF6soMvqeeA3AaRWPFZg_dZVyYbPBl-xo-SQo1MWE8XNByxjmF8hYj2la6ytTne5of-s8YVU61nHYjixRuXLpm2EgsYOeRoFis7Wtxd-", folder: "heritage-jawa", name: "gallery-1.jpg" },
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLtdUdv0_ZZ4KZzwcqIchHavkoqu0Z97hzllK0PtuMTrUclGYn0YtTmSttZuW1UKUwWCiQUIHuEZqRyfM7hB3dkgotI1J-HrbmicCIpHA-PMvBV65FpKHFovig46ie76J8EObHKpPgCiOfXkLHPrmXshM2HH4eU4xRRyap8Hbti6GsmhaCMvRAixKhpDndBx1mXIRhlnVL0LQmsCTQwECUe8mF0hTAAymy465ReKc0640sVDD-W8Yx2ziT4", folder: "heritage-jawa", name: "gallery-2.jpg" },
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLs5MFdcLfOnJ67JNfcnEtlhc91W2gB5ddsCYDuOpLX7c5QJhkaGAjKWHP_YBL-A-_Wh2ztjCi8zi138U0ZQYS0YCYWG6vM-bYAJnSX6XBT9RsavMS2FWj5iQDEFhwZ3ajpn_dudYW_8AJ2e4RxYgoPbUsB4KZR7X-c_89FB5eDHHDNciLoqgnfIcMzd5EhfLhbxGYw3RZAhW9UN2IEEPnRoKgoZPNIXHxcTSfusMo9__-esT-QTE7G9Uoc", folder: "heritage-jawa", name: "gallery-3.jpg" },
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLt-Hp53pSkwoBUyyPo7vimrzSdDYagPSmX-XIpYeJeuGWr3dzBODvshnn18eDrGLecbAyzrTqN5O2iJSkJrwziAPKOWn1xr_q3rDulmU2LrpE44A-HXB132sUwm4DTYhZfKC9u1loEN203go15_1AKF3HQIculcIAj8XdGj4RaK69mq862cgGgpUsK0HhXoU4TeB67BcY8OuZJGdJSuQdS_bM1WwFB9rgO7q9vd9FdwicHhiBSdBeU2tJkM", folder: "heritage-jawa", name: "gallery-4.jpg" },
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI", folder: "heritage-jawa", name: "gallery-5.jpg" },
  // gallery-6: same source as gallery-5 (duplicate), upload separately as unique name
  { source: "https://lh3.googleusercontent.com/aida/AP1WRLvxEaLuKHVfB9uLYrC-c1I8qLzn8abx7YZtevngLA99cV3tbLBEsSM4FoDW7GMpNtYE0of89OJMpe0699aSS3e7VOC6PPFWBzAtcQ6utQ69Bii9Bwg0J4UqxtYm14H_dYOvLhs_S_aXqx2g2PBrJw8JDJbPWUAMnjJdgBYVlr00GuLZD-LVI810d3-P6_DChT3PLBuaUdC2gdiV6WTOB65Frhuy5pWUVD8nvxUgIIxAez1r80zUpU5nf0PI", folder: "heritage-jawa", name: "gallery-6.jpg" },

  // --- features ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6JvU3E1i7nY3fG6fUkWjfs-rVnrXu7a8Pd5-tN3mGj0dBAd2GaY-4VgqlJg74SOGmFyZD2ssWBvnvDhS8eLBm1PvLi0dHxyE2bWGwhdYeygfNjsNl25xqJJYeyyRLDKn_gX7UiWfUUEMsuhW-8Scbfy58lRjfpRMDJsnyS3rcYoovgJfhpgyYfFDBuOAT_JVFezW7VqhYjppOeYSDyFBJJvSK6YPU5J73e0RJVMuzbGluy5x0FLnw", folder: "features", name: "invitation-showcase.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1GWVTUwBLSqgL7tsxpyFVk1CRKFGqtWF2db4xgNA2s1pkUWKdZGEZIq_7wkX45tihHNn6LnCYqUDgW4Hwn6Myiv4XPcAC6uFfmLNcxUo_ZdgmaQ4Lk7IdXxyF_IKqwA-ixzLeL464WNVxgtZnMkn5gfl59JbMapLk5w7UXZ1siObXHGf9zqLl80_hPwQNoYivHJsqxHqvUe-Ko5YBvEGJ6g5vM1xU4S1t0W_rPxkIvlFLZrJwYpXi", folder: "features", name: "stationery-texture.jpg" },

  // --- solution ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAaGj74j83onRJK8-W3eN89UfcAlyfcTX_gBLEqhmDPPbDFdu8E1BKm-0JmFNUg1JTDaRenCUptWGk_Dz18w3mIboLtWntN7XvUe0OoGjQ9va6b2IAQyrAuB_pRzO2JxRJu6ugieD7gn7rV3OoBoGfSihXweo1cORDGytuOtM2UtPnubOhaRqmffT4TdP9hYhr1u2-LJPfg_dLxzCulGlDUT79SGRjaZYRangi3UklDEpHaOOZ5c5tD", folder: "solution", name: "silk-texture.jpg" },

  // --- timeline ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1h2ovexaHT7k6SY5iIj5C1yiCe1XFs1uaWl-kfR_v-_IJBzBHOIIyIBijcFW_yWt9fsenx6L43p5iTxtWwirHJbJY5XA0Kjv9WP8KCLR938hrqi-Hd-1CYNRE-nzYfam3gLm4eYdVXoXeabg7ZhxZtanjYCxVsZFhzsRWVxlU0LofOR01gKrYT4l-ChNv0kisE1I2zqulJ5-JZuaDAbqUjDHMtKXmzVbm68yRCLSPyRcuWO4vlmZelGZNSI9JmjgNQ5tI4N-gtoWWKg", folder: "timeline", name: "web-invitation.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXTh5b0Vl-43zBlhF9sFVAmIci6ra_TpDP__V-35h6bsB0EEjeANRaXM8gjcM8WrejOKlusO4ikc4rwOrRqOwH8J_7gpGpYf52VOgwsNYIu-9Ylpo1e9zHppOPyT5-5bhXNHadYwGsN55mJYLqkI5-FUf2gy2Z_6xRpZrT-xlCQCBXIFQhOI2fn4FYaKSglm5rStH9Z-Ivnn8lfnk-24HBYk1EJ6sP-epQ66ADsqor1f9LTFQKBYgGeHlZ0CNShhi0NCJTJLVJCzHXHg", folder: "timeline", name: "rsvp-management.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtviFDch9dKVShZAfF6FPQxyecqrnK01LCdTRqs8vDNRuM6XgAErLuYKYU6kDT2F8beiYG-oM-5NjS-w0Pk9niZ858LgSVMcZ0D2YX03c2o7JJ9REZhsB69X3BJskhSc4PkxBxA6Xe2FYcSlpGGLGaiy0vzruGZ09FJvoJR-88fEb0oePEaNDIQc1gsjVqsDFbzIHlJ0yMvgf1zSs9GFZH0jPKFMHyvmgz7NJffuWIlNJvl5EPhD5VIOcT6uofyJUtflxP-rJ1WhCW_Q", folder: "timeline", name: "qr-checkin.jpg" },

  // --- register ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBj8xA01bPW2frcxd8AppILq6T5pdT3osSbWCleCUQfX6nGvmA4RJdlYgwshBghZM9yl5kclVR4mn_xtccVgBwKQq0_04j2WE5PeVVOhlMotREKUEXbMVeOQyIWlzmHSiKhCyOXy97-sm4h7Sv2zFyWQSTB93VAd3rUyfS9D8Ddd-17YQYn0XwHPzgaWxBVtNaDdOtBjpY9R6t5enSLcAuaYH330jRTDjYvN79xa68CWZ_ovTtuwHY1", folder: "register", name: "portrait-bg.jpg" },

  // --- qr guestbook ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEL3b2tP3ixaYDgjH1ck0NU8K6oGa8Ok9uqR7rQ_-5oA6dWz0SfprkjJ-hj6jXGWENwNwQdN1wQuieSyO-9U2oA5ZQqvBmxZfwIWHuiGQigjVswbr9yygOxGYHa1bdWPCSJrB6wm6IxPvzqj6qhOyPTCRD-PPhV0A8EJTcmtsSqYhA2tVZjfx6BubpdWl96Y5Jb9_GpdY9o_bbDqkD1stn1kuvs24ubZc9t9CV6SEvMmnNtY_6gnlk", folder: "qr-guestbook", name: "texture-bg.jpg" },

  // --- demo ---
  { source: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", folder: "demo", name: "groom.jpg" },
  { source: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face", folder: "demo", name: "bride.jpg" },
  { source: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop", folder: "demo", name: "story-1.jpg" },
  { source: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop", folder: "demo", name: "story-2.jpg" },
  { source: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=800&fit=crop", folder: "demo", name: "gallery-1.jpg" },
  { source: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop", folder: "demo", name: "gallery-2.jpg" },
  { source: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop", folder: "demo", name: "gallery-3.jpg" },
  { source: "https://drive.usercontent.google.com/download?id=1gyl4IppTKVm7jAldtHwvXWbQ8GO7jY20&export=download", folder: "demo", name: "audio.mp3" },

  // --- guest-gallery ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvQLKHqRnSKo9ZD1HFYE_qXaUdzJI3MZNx2coX3YXWgbiZ3ARieotLG5FN2p3f0DlgD8gYU4EOZbmy4QX3FtyuGquhIuEX_osMAIAmXXzs5f1qivAk2AuvouazOdX84AlB3nkR5Nsyz0at1ZztRrUvz7focvmC9F0egmKHfQ7R8g2u9AJa-jpJ8rlYavDuIYEpw7Az655GV43sX7OTOiaV3yfTh4pxKUkiGaBasWe_f6ohB5Znc29n", folder: "guest-gallery", name: "hero-side-1.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWZZYs7RbFgm7gMgiRrc8nUxg64telk7u7KG23Gf0QkSvKWUBJeN7UW4eN5kID_wk7qPjPle1-nB83Rsew0FZwNIq8DizWGkGe63wCDHvA2MX-wPfGPH9gDgqcCy026LtynHaIQWwiB9_t8Gzi493UQIO4pSGAPknhZ91mYpyVKhd971Y6hmdpTy8rfgVK17EILWA-r0RTIxACWMZDYmLqWmW4y0kgSKBxBVINrZ_OpdbbtX8Bf_W3", folder: "guest-gallery", name: "hero-side-2.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzANcL2z7GyTD2HCbepdzRMZUs8l_yc2sGvbLFFAaTmw8QIngWlS-MXehIfjSmDXyT0PWAUU_aAmeQT07-cQIRg-V01ea6PljLQIt8SuzK-AUP-eHDwjhyEt7I5nxlqIkfejjRfagdv0-KwNeGtaK3JqKSxkrK4kHPcaVhEJBjbCne7vbt0t8o-P2yE9dqqi-sm7uSu-jw59GcE9x25xC6TPuaY5agNtMCTmyrdkbiQrtGile7JzyB", folder: "guest-gallery", name: "hero-side-3.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIeFQBjDKmiJ1c6qQJDXUOwZWLr7GiDgjKH7fEUwmy2Vqupps0AFUV9NUdr1YC08fZvI1IzXTYddc9r42ENuANx-qZm8HVWSDmzTijQ3qHgWtsG_xKCo9PykqehvP-rtQHKPtaJMjaNwTpW3mS3HmUA5J0HwWDPJnuMgVxf-HkC7qhlOospjO3Q8TTGdbyLCjz_woTtE59OlVKRKA7OiPB3PiLgSPChQamTv3vwUdXJJnBmHiPrgF5", folder: "guest-gallery", name: "hero-side-4.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuAaVKiYggYRnbC5RmUXHU57bTL41-MEaOnvs5arOW_8rydz8dlh07fSfpVKm-HJitKTkZzQko-7TdkFveemM1VTRWSoXGkStrIQalhVKMCCHtyDemS8KJWwhOHrzcBnz6cURwU_H79H0mANPVwAc_XEsb3InKFhfLxR8FvuWOCKfK_B8DCQ_am3ui9DTp-oD-MC6PQbLXKVkAy04K4qcF-FiLJhaXhlcYTpwZKYSwOBPbPX49HWx-", folder: "guest-gallery", name: "card-1.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNW-HlrcRlZnZPIrmrJAm4QtFAENhn50qNxcuiDN-INaGig9P8agEah76wgWzUcxRGzHK5ee2XIZWdtT5P5kL4VEmdF_RBl5RpdKr8xRXUC4YAFB2YVwRn3w05xUONrnRfztMu-CZ0v41-I9Fkrkk-CsfpTKguasgU7oZ7cicsGEsX4NEHaWBWCARaoqQjyqVDX78wAWFynkAHiUKy6Qo6DnDk9Us21L0XZza4F_TEiy8JR_HuEI-l", folder: "guest-gallery", name: "card-2.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLNFvAp4w1hTNP5HWELQEPrzHRdzuw4yyPIufzYWPXvEUFmdgzDKmXyNY2mWYTET_74X_czHFHzcZBNP2wSmF5u6xrdVwaAiQzDzdGK7DPvoVkbAX2WI0DOAOz0XICmbEpQrsWGCsa2RN4eiSfNjxLJJE9hwwNjFfSK0J9pVpWBiKexVw_-05cL39_piMGN7sQQ4rGLCckUUmAM2f5tsu1CqOHrfxUKiNwVD09jo_D46O5w2bGgPUC", folder: "guest-gallery", name: "card-3.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDB73W-zl-Vcs8B6G2-g0N1pa1RPlcaO-yYQn70BL01d-nfiAV7OoVB11Qlxb9tWYjo5-793RJmNXQe9jaPKPgbtWZ2XyspHOHH791nrjf-uMoDrKh_l7t83THlolGqk8BGymUQ19as0AjniX-gnBbOYDL31v21iiLM-IZYqjMBnu26mXn_FnicmQlxo9ZDzbOqvULwq3GwxBIAFaVbxE8L5z4DWNROaLol0ttF2V5z6g2yd5k3FDS9", folder: "guest-gallery", name: "card-4.jpg" },

  // --- virtual-wish-wall ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu7z7anWD4f37f23zs_Cv66MTRm0YQ4Vn5aYU37_EO-LvmKN94nsPYcfuyMH_TGdii10bwnbiTOv1nmRiJhDY5xC2Z-K1zp3yhzO1_R-Nshu5yXUqTwTBxUlwfGQsTkDUXZj8HsSR4FGYSL_or5qd1X0NVOVSBNSinV8njme7azDqIDHJO2xNDTmILVCi88xel87N2KK81Ct9eQft7NRbHNcqiKwYg4eqpJjIgqEGlG22OnlxHozKs", folder: "wish-wall", name: "venue-projection.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7sVTo6r5XPhMXo8-hWTG1xZq1h6LcyzrA7olqMu0k_3SkU_27L5r0Lc5hAl_PFa53qoDaeXpnkGgjmiURP10uQ1Nd5TX-clE1GxIoiZftLneB3osK2jF-DcfO9ujtTZ8joOS3_vSbUSjdcSonzfFP2uyZV1yb0204zuo24fijuV05pKM7xni6KtqNEp7UGXKV5Vkj-1161II9jQKAYbzzYphHoeg8q-n6rwpX8Q-aqCJjr0lgs49DOaFHCWv94WD06nils_5vGmuTug", folder: "wish-wall", name: "dashboard-interface.jpg" },

  // --- qr-digital-buku-tamu ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgakV1yAxQG5fnS1PAps-CoYl4IffERoNWP3xRS8N56kKbgPhi_Ce_UdNqL3AxxTcDh9Q6meyCZbnkm4ZKLXDUb-XB8jv_LaW64imOB8jbsMl79xG39J0qrNmojbkGzsM1myxl02sK5Ct8n3_bleqiNDWKSV8QEqhAR8L-WF_QuyKGjbNRiKfybT9l5t-mbO-bnTqLbo7LZQNWN6sCLq5FqCkJ_7xHjwLwY7Fp-46KdtCWB6Gh66Yl", folder: "qr-digital", name: "hero-reception.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0Yb1DPXt2GQsZVVIO1PXJ4RrTLzMyDCIuMFW0T-C3Piv9tSMTwd3qgmsIqibU7WtgAIjkPuQbjQ9FSh646FIi6nUeKPhmiNxrkY78vXVqLtNbceYHTA1NtFIvbEVdy5mB6uCMExWpw6Yy_kiMzYCvWbNeQPjMRn44M8gFScHt8UW2XRuNkBnuomS999AnFBzVeW57XRGsccbpmRwzYrsI8za3h6i6_nB2CpKEjzLEVQLld_obIOuc", folder: "qr-digital", name: "tablet-dashboard.jpg" },

  // --- premium web invitation page ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUH-hH62TqhqOLh-pzF3RF6tZYlCTMaIunZww7uUBhLLaKE_PvLI8mfHxt-Css_NA1fb6Nblbgcx2tv3FbdQjG5NJkFMUzEoO5Tnj15FEe7hEe7LjmHjCcg9vj0K9hG-DVL9bXxc9uRTy7EO_HaSu71QPkj2sHVQ7SlIjs69bbiJQhJJ9_xBD1cYItph99LGkqwzB7Wpp2oy5p4-nQNCg3pFuTKpfHoSk_s8lghl2JyX8iSS3OSwrtych7ScZx5G5qgb7pxpOZsqCcWw", folder: "premium-web", name: "hero-mockup.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWUY81voGkW_8v_0PLz-esqs1NoEQON8tq5A7TXXcooU4ogmYnNBdZtlmEGafwjk-ryiydcPTc6DYjlqgccXEzmA6twAFnV-WmiFhJ7aLV6WPT74Pi7DjCfy5j9gxFt7qLR5YF3PaZZ66idJnLyjilRxwIZjNBzrKsh1YqsmWVX7U94vy2KaSXolf2xijDPVSqz1QH8gNLxeJE_f0DshPtP6i6md-2EbMljbAjQ_mp7-XklfH4FST0ygf-gG_3GmiyC5oiLWRv9vG7iA", folder: "premium-web", name: "tablet-mockup.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJuGSTQjngv0DW0g6rN3tT6xAv21nahsKbEBO4Y_V47ZKw8HUZyw2XjuZq-3aM7XRR2sdGdWe1zktj-MBIhCp2xK2heySP-2o7RlHfai_GMvb5EbuQdmX5fDuXjgzl-qtRF5SkdWTk5UHILrf8nY_ngX2de_40r-Gmwn2Y_6jjUTE6BrdnaXnYUKBFB302nS4WR61fO692TjdpVWZSfoFgbcpJ7_GTTMBGO8SIjZ_NtpDHGHnNMR3K", folder: "premium-web", name: "maps-location.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuApVUVcePKL9UgODLVBaZoie0xFtfDXYsyVQqUGet7PLDCySi9kvIiYUqBXQj0B88gU9MtWdSCP0bZAkvRr7s2TInicT_pGA_XiEajiEKdZyLGmtUeGxvKwXchOOR08v9LAdbdG9G0b06pjxqk44pJi9v1RY44lkhc-trsQIFTmFuDjC3-eK0VC37OXpoQ_rG4s0tfbT4O7ecL5oCqch6Xly9u7fnW5iEUN1DWJr3dGbUtzHmAbTZLZ", folder: "premium-web", name: "story-couple-walking.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNtgdejZyr7BNtw_5ZjaniHuKwy8CoB1gSenk0ksopBtqkkSyT4gKdKnpgHhlMuWcWlWmwCIDcva4oOGfcjGsrWBhYrqv8jhh_4XAXTwvb1bYZjLrnYRb21cpCZI2WQpnZpPPb8-6FDdTKAsClv7o0NOt8yTY7EZSyOJiLJv1WSze2tErpQ8TTUpXYHGJk2FeWe0kNKKP-QdUsLt17H3-BJxOrGWAXsecFQx2frR24A8nPOtUKHUAI", folder: "premium-web", name: "story-hands-ring.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0plCCppHRmWvc-m2G7W-GgC_Pb4KhcJ7DTdyVTgPwa1W5U2_ZE2EcvGPJQPYo1rx85JBAeOqFr6hDy21i2BaLlCxnVhK7a8lPSh3Ms4-3GWpooUCLZu_iV9wdArXDgOGkWocqtyLlmbvZbuLPbNKexjWGKgxWct27o_3Eszxo--wOkSaXNCMPd0kEGwZ0fBgFc503Mt6_U84sjMQUgfWmLghw0BKH6fMRvj0lDhOcZG4BYBbtFrJu", folder: "premium-web", name: "story-coastal-villa.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhGaPRWCnRD2eDRDqmAnfVU1rWnX8SvG0VJAHeTqhFh7s0yHLliIgQ7RB7Lc2kUjAWtQcUaFFgl-nZCYYPgU6jTVxjfNnbMi6pHGBkFGNLLyOossdcwdxEx4G2Jjik1tQEBk9iy5wwwHlpRrW64SlssEONe-EBtmrMAHiHibmfpLhb6c3-1UkJtbQjenXo1Ie121VQA1mCvyiNHbh3GdBPK465DsVxErLmobIpJGhYNnaLkgL3Y_0j", folder: "premium-web", name: "story-couple-gallery.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc7SLYNrj6PCM3vg_cRkfBGt0qFL7NXALN2LX12_FkB8UkADDUX8xnAxJvi8ygiVDlFBaWsWIaPQURT1p_oHlS9V_aEn82IL_iqxjWVufs8X6YYOhVY2gA9vMlq-VsOLtG9vTCQelSm_ipg8Vr3kCQCqZI22P4QcWvC_t06fVH4pXR8RnYfDdD-STpVsY2NV4G3Fe8My3l-hA-4zss4ouVwK4qTEFmnr8dtFsupnKAf3Q-Vni6yCfK", folder: "premium-web", name: "cinematic-video-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBb4QxKBANYbMr-mBZQWzSq3Nl9a5QVXjHfgsXPdn5pBjqwukvBEnZ_GUeb4sT-NPCxw8iDN_CoYUaawJJCmq5Mq-a90CiOYDS-PX9lEK1cQtaI0ODof19mUiQxNWru_a2rdjWZap0Ftk4UzmwFSwD8u_pFwqp5UXbPZ90XQczpFXobyBnB08RaA6hHNrrI12tFV-_pDCPg4Wr7w_8JHUwaIyNN_PCAns16-iSM8I5DvSWerS5cs3ADCAV3ow7jF2iXMfUQ91AwX4GUow", folder: "premium-web", name: "dashboard-screenshot.jpg" },

  // --- reminder-vip ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZ-32WMcFmAuR_2_kSMhjLuXXmZqWSI7dBLCEtmJPYgXVv8D4JI-JLB7YhZ1jFKsstfrXVzsM8C9Y6Y5R4BYSs1_AUNmw3-nGq3PRQ1t4CuA1EYb5IHFxfhAMl-qPsfjP9iuDhthSTu3UJgO-o1vFC_AMF5PSaxXprNU1tzBsGsX_sKhSQBTEQEH2DdrpO158gKSeWVHKJfDg4GQHcnQD-xcYcjQc7NAdG3_ovyTOprEIRbpD8qh3l", folder: "reminder-vip", name: "whatsapp-chat.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzVXVUl5giwNooX4VNbreBVHbGxfWJJFZPIqNWddZLsR87PaJ2qvTFPwTlUMCaIlUJjeAvYq1tKx6gaBPa3e_EY2w3mgtwJn5PBEynukdbTs7mvS503LyvI4oaB3ZHmf8UJVYMfMZ6EzUX_sX1pHmQ0jMBUF75aocKeVYsEbRdyCbNjYbm-rW2kTlNwp4z_ZrHvEW1rHBANCAlGMOzpu7MnX3NMBfvQiWhl5nkjhnJUg-SWYGid0Bv", folder: "reminder-vip", name: "dispatch-dashboard.jpg" },

  // --- web templates (previews) ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZI0UVuf0E3q4oKByJNY9fsVdzmfQhLxE9PMmGhOvu2z0sjo9G7m9nFqz1nBm1lo4UKaC6VMP8CmZZD1P7n_0XZ1yPqO1mE02wzOhhpIg3VA-k_KEzGV9TW5ns9AjreSP0kal7WDLWMz7liPU1HrmNfVgzlmU7hUzRaMjptnN-dCzt5m_oi_DMfBt3JVNqMel8ZWjTNH5Ta15OHWJORPquuMFetQsYkxAKSNZ8hZvalK6ZS7Beh8s8", folder: "templates", name: "parallax-sinematik.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuCS4mFpWKZ0Z4PMV0O91judgZpPD_DCyfnmB7UoNBlkwkoY8OkTBIvyx0OonNVhdaGxfiaWxB5EI3zbMQl__ANqhTf_6HBbf2uhou3abYZi0odXyyZsYCzm_4Sn7EcHrmwlycROSPSHucLVopSVU8c8y-oSLhUqr9SAauFSEAzTxV3Q4vzAT4DyFPeju3jXUfAD9vaVyEXTomSs5eeeceqEJapXlAGAy0UWE-0GrZ1l2iO5mnyUGFLt", folder: "templates", name: "editorial-modern.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm6a6jW4mlyVUHnAfHdfXfivWDAQ1CQqriIHT_UTmfsT41uM8m9bKaF25WqGjNHGfwBTIy76IGGbWbw0uuW-F68NOWUmtD1qJWgzdOpouYNgWiXZv7HqZhqRC50YzEKEJThw_9VA9wWKTkei9O27xezyEMXpbCQdrWpOM6VQNtNzlIZhp2LhjLPPMoBRFqNaho-PRSYxJpzvXnHGHfnxFZcnK8xCg9i0fW9i5tuP1jTAfaK6Iu_y4p", folder: "templates", name: "animasi-watercolor.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZhlkLMb7KgIeX0IJBgXEk9b9Uajk9GlBb3lpaG6Rn3f-zAv09FGBBpnX2iv5uNZHNEeWtOFLEQhUNNy8DhP6q1oauba17E9zmb3lARxWGLhtfhZ7zZI1ZtLtqcR2aT59fD1gebhhUz1EVi2uRCLH2X6etulVRG5RWcvOiFRe2xhWpgBpdEfM1KOtmxRp85jRsgrroVyddyYtGoHsuZ7C-3csGO_h9Qt4AIYWcPZrdAYo2WExYyVgq", folder: "templates", name: "heritage-dinamis.jpg" },

  // --- web tracks (audio) ---
  { source: "https://drive.usercontent.google.com/download?id=1gyl4IppTKVm7jAldtHwvXWbQ8GO7jY20&export=download", folder: "tracks", name: "white-moment.mp3" },
  { source: "https://drive.usercontent.google.com/download?id=1B0PawYUvYMyRpx-lk9J593hzge5tcxCp&export=download", folder: "tracks", name: "perfect.mp3" },
  { source: "https://drive.usercontent.google.com/download?id=1aluJd9AVsl7UL55gsXnRJpnZ6L6HEMH8&export=download", folder: "tracks", name: "women-in-white.mp3" },

  // --- skyline-penthouse (in-house template artwork) ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGJvkfp6oNs-gbQrCl_-zfDwFbc2gX6ic6D_J0C4yPUTomh8yOAqH9HMUqyr47zuXASIs3k3ooLMkCiC0RdJRcmU63YrUi2m6RRruwaJG0pVdXGZHigkPpZAklMuu-QKWplw8sELE_Vkw19L6ordS6AKH6EU7wQe9c0670m16KefCqhSFo23KPMDPm6LPdigiQ8lkFacZmuiEBkCp7drM522l5ZAYa16NiwmZK8nigq80Hmev1CDe-", folder: "skyline-penthouse", name: "cover-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4szL9Rbn3L9KLjmBW9bObHDMOWaVchxhCg1qxNHw_RxUq4z-NxW59M8SoMY8JNqbBPWLUM_9IKJ8QeM_QrTC8Luler-JjM5s1D5hCU1J5Y8W3LJV41imyQZ3IyXA2fGEakw8sHbu2Er8HyyJRs-7bqhOnZlI6eBz0vcEIFbCuoDnRTHwH3cj0zw0BZsPtYjl4SX6O_JQzitKJ-Xf_VoIw082U8diqAFo2y83e3ux6DAoJKroAmNaMwuO0wKgaJXtKaQ", folder: "skyline-penthouse", name: "room-bg.jpg" },

  // --- pixel-paradise (in-house template artwork) ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0tHadFSRZA0FLTKk8csw52ihWidnsqzw0sHgoFrz85sF8oVCgVX0iTc1hH8mbPU2Swe4YHDqZVHgQn5HGZJHbR1REfUbqKcd_bRtQYN5HbFlWggiDgeEwxykGjO-6-N15d8Hd-nyJUwc1xMP6B6A5UUYg6jTxMmt_O2T73K7o-rz71Ag-tvpCEhejCWrbTkxjHSSBaiHmuZaOS0dTnIFhvfizzBoC7gFyKqm4oL2-JFeWcQQ_6Dtubep0W-SGrzyT6_4", folder: "pixel-paradise", name: "cover-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvQYKAukll_YcaotnSmdV4JtgN0JCBRn4SLbWwTnEHtLmRx1Q-E4IRQTjsyU9lexU9yDbeLi2bnUwjCZiibCVR4jk_aJeBzxlY0tzT_A0BEhepKDW5ZzPMxamGGhxPB7Vqa1oPjq8HIZEUFI3BLbDRCeB-ZfKlYh1OZdDqyLC8Vo1ZmYJxa3MxiYPmtKTxFExU4TlwlFegup89BTORvx-TxGubrZRXX9eUKBbKmsu0EB1WgX8TEDrnqziGQUq_cs-OhiU", folder: "pixel-paradise", name: "room-bg.jpg" },

  // --- pixel-quest (in-house template artwork) ---
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5dJnHwGKnfiC0y3hwDr0FYRPHIcI3eaZ-UThFTsEAh5r_7tuOsoOD8m6UusrHrJpyvYFPdZEdrd1anqgTISirpx7cgbTZwP41BoEcr5HClSfYtAc_u2BA1AhvBKjyKpXKOCjTi0ubPThCFSUA91X1Wj7PXpVnucap0b-PYi3yqCrxx_hy_7J1ZBQMeCnT61lC_KDyHYEqd46Z9Ao5Ra17Taz2-O7dC3nQXpr-FQ1hAt1SFnf42JPBRVcK1uemyW2vFT8", folder: "pixel-quest", name: "cover-bg.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjx9tT5DqOhbpCA5PrYtpU9hyTzuVFSnuWh0az2YUNb3ZtTQBIuZz8-MKSHRD6UKqbwSoXd11YLCgwGuDPXiTX_mg3TquC2i7dFKfinZlzr8O81fpEj10TAlP8lCuI--d5YiMAOIU4SY1H0abaqtz6HUMTfuPlUCV-0XAG9vyydZ0OBQ6dUKpzDoegYyRac_Qb2-e7XS982-Uiuz7M6IFBY_jDvAZYMEMVGkix6cOPxe4KG4Zfj2Cxfvy7RL9ziXrUbYY", folder: "pixel-quest", name: "frame1.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl_-v6yvtk3PgcPfsfScvJ1bx-XZTHd_dKHz6vk11-21_WoAiwV7czdLcJBCQd7YsNKMrW0kSUa0hm8sV8YbpzeuYJzhKb54hmc1v6ad1Yd-82ZwrfH6KX2PPdkR4m6Dzmp9ug3bM8qedRITF1S96FQlIrVVHF5AhTQIsWUxGXyuPjE6_tv7re9RSv0dE_Yuc7jaN144TljI_WFbCh7QtGs1cjOsmCLZk2IssM_1u8Slw9M50YWEuDlnNNJGPnEpoY7Fk", folder: "pixel-quest", name: "frame2.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHPqLxgnRKutHnGn0GQSZlDG4zLTj6WcX_vDC-bSdmke6lveoSXwXUyYLkjwrps_3F5a5C-nTt3l4J_YmHV2a_hNx8bHvx8NbBQCyrr8sn8SB_5Gt3CTwDh7D5o9UrLeOlAKHToHvkwc638U7CFt4_ALA5QHXRF7fL140EdK4hy5kVWFg5CvDFC4bn25B6AoaYHPKVAt3fks8dN8QkACbbnQhBpLTX6qZ8CRe204wgm9Dxs6Ls6nFTuMA20sAgRWLW8pc", folder: "pixel-quest", name: "frame3.jpg" },
  { source: "https://lh3.googleusercontent.com/aida-public/AB6AXuBT4hMhO5IkSglXEOv6RngwYNfByPOh5wtUmORo2FaCumfto5xyjRWQI1Ss7X321apx8HrSWYaDINuBCLERUCr3DWJoQ-HrqATJdEcCsR6jhNe45FrpNMgAdRorwUg7s9pSJVHaBiEyOx-OMyfTNSFXjexW2k-1mPqlsInq0PxnQtONNqBHsKQDhfL8J-949Y8A8mljeVniRbkY2dTBpWbWHHn0NB1PTOvojNMfE4RvJZqVX7gEYIr8iPObNBG_WvQwwxU", folder: "pixel-quest", name: "frame4.jpg" },
]

async function uploadOne(entry: AssetEntry, index: number, total: number) {
  const storagePath = `seeded/${entry.folder}/${entry.name}`
  process.stdout.write(`[${index + 1}/${total}] ${storagePath} ... `)

  // Check if already exists
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(entry.folder ? `seeded/${entry.folder}` : "seeded", { search: entry.name })

  if (existing && existing.length > 0 && existing.some(f => f.name === entry.name)) {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(`EXISTS → ${pub.publicUrl}`)
    return pub.publicUrl
  }

  // Download and upload
  try {
    const res = await fetch(entry.source)
    if (!res.ok) {
      console.log(`FAIL (fetch ${res.status})`)
      return null
    }
    const blob = await res.blob()
    const contentType = res.headers.get("content-type") || blob.type || "application/octet-stream"
    const file = new File([blob], entry.name, { type: contentType })

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      upsert: true,
      contentType,
    })
    if (error) {
      console.log(`FAIL (${error.message})`)
      return null
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(`OK → ${pub.publicUrl}`)
    return pub.publicUrl
  } catch (err) {
    console.log(`FAIL (${String(err).slice(0, 80)})`)
    return null
  }
}

async function main() {
  console.log(`\nSeeding ${ASSETS.length} assets to bucket "${BUCKET}" ...\n`)

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    console.log(`Creating bucket "${BUCKET}" ...`)
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "audio/mpeg", "audio/wav", "audio/ogg"],
    })
  }

  let success = 0
  let fail = 0

  for (let i = 0; i < ASSETS.length; i++) {
    const result = await uploadOne(ASSETS[i], i, ASSETS.length)
    if (result) success++
    else fail++
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nDone! ${success} uploaded, ${fail} failed.\n`)
}

main().catch(console.error)
