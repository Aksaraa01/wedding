"use client"

import { useEffect } from "react"

// Cloudflare Web Analytics (cookieless, no banner needed).
//
// Loaded client-side and gated by hostname on purpose:
//  - Couple invitations live on DNS-only subdomains (`{slug}.wedding.aksaraa.com`)
//    where Cloudflare never touches the HTML, so auto-install cannot reach them.
//  - Cloudflare RUM only accepts beacons from a registered hostname and rejects
//    everything else with a CORS error. Injecting the beacon on those pages made
//    every guest invitation log a failed request, so those hosts are skipped
//    until they get their own measurement path.
const TOKEN = "60ffb5fbf13543519fb77d6e861b195e"
const ALLOWED = /^(www\.)?wedding\.aksaraa\.com$/

export default function CloudflareBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!ALLOWED.test(window.location.hostname)) return
    if (document.querySelector("script[data-cf-beacon]")) return
    const script = document.createElement("script")
    script.src = "https://static.cloudflareinsights.com/beacon.min.js"
    script.defer = true
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: TOKEN }))
    document.body.appendChild(script)
  }, [])

  return null
}
