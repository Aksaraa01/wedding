import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo"

// Organization + WebSite + Service graph for the marketing homepage.
// Helps Google connect the brand, site name, and product entity; no visible UI.
export default function SeoOrganization() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon.svg`,
        image: DEFAULT_OG_IMAGE.url,
        description:
          "Aksaraa Wedding menyediakan undangan pernikahan digital, buku tamu QR, galeri foto tamu, wish wall, dan reminder WhatsApp.",
        areaServed: { "@type": "Country", name: "Indonesia" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/hero`,
        name: SITE_NAME,
        inLanguage: "id-ID",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#service`,
        name: "Undangan Pernikahan Digital",
        serviceType: "Undangan pernikahan digital dan website pernikahan",
        description:
          "Undangan website dengan 100+ desain, RSVP online, buku tamu digital QR, galeri foto tamu, wish wall, dan reminder WhatsApp.",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: { "@type": "Country", name: "Indonesia" },
        url: `${SITE_URL}/hero`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
