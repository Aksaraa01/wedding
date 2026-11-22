"use client"

import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY } from "../fonts"
import Section from "../Section"
import Slideshow from "../Slideshow"

type Props = {
  photos: string[]
  coupleLabel: string
}

export default function Closing({ photos, coupleLabel }: Props) {
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  return (
    <Section id="closing" className="bg-black/[0.06]" reveal={false}>
      {photos.length > 0 && (
        <Slideshow images={photos} className="h-[46vh] w-full" overlayClassName="bg-black/45">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[20px] uppercase text-white" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
              Terima Kasih
            </span>
          </div>
        </Slideshow>
      )}

      <div className="pt-10 text-center text-white">
        <p className="mx-auto max-w-[340px] text-[13px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
          Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.
        </p>
        <p className="mt-6 text-[20px]" style={{ ...FONT_DISPLAY, letterSpacing: "1.5px" }}>
          {coupleLabel}
        </p>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hubungi Aksaraa Wedding via WhatsApp"
          className="group mt-10 inline-flex flex-col items-center gap-3"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 p-2 shadow-lg transition-transform duration-300 group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.galeriEnvelope.aksaraaLogo}
              alt="Aksaraa Wedding"
              draggable={false}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-[10px] uppercase text-white/60 transition-colors duration-300 group-hover:text-white/90" style={{ letterSpacing: "0.3em" }}>
            Wedding by Aksaraa
          </span>
        </a>

        <p className="mt-8 text-[11px] text-white/45" style={FONT_BODY}>
          © {new Date().getFullYear()} {coupleLabel}. All rights reserved.
        </p>
      </div>
    </Section>
  )
}
