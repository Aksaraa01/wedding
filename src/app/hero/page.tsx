import PageTheme from "@/components/PageTheme"
import CustomCursor from "@/components/CustomCursor"
import BackgroundElements from "@/components/BackgroundElements"
import Navigation from "@/components/Navigation"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeaturesSection"
import Footer from "@/components/Footer"
import SeoFaq from "@/components/SeoFaq"

export default function HeroPage() {
  return (
    <>
      <PageTheme mode="light" />
      <CustomCursor />
      <BackgroundElements />
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <SeoFaq
          heading="Pertanyaan tentang Undangan Pernikahan Digital"
          items={[
            {
              q: "Apa saja fitur undangan pernikahan digital Aksaraa?",
              a: "Undangan website dengan RSVP online, buku tamu digital QR, galeri foto tamu ala disposable camera, wish wall digital, amplop digital, dan reminder WhatsApp otomatis.",
            },
            {
              q: "Berapa harga membuat undangan digital?",
              a: "Harga mengikuti paket dan fitur yang dipilih. Buka halaman customize untuk melihat paket undangan website, buku tamu, galeri, dan add-on yang tersedia.",
            },
            {
              q: "Apakah tamu harus install aplikasi?",
              a: "Tidak. Semua fitur — undangan, RSVP, buku tamu, galeri, dan ucapan — berjalan langsung di browser HP tamu.",
            },
            {
              q: "Apakah cocok untuk resepsi besar?",
              a: "Ya. QR check-in, e-pass bernomor meja, layar sapa, dan rekap kehadiran real-time dirancang untuk resepsi ratusan hingga ribuan tamu.",
            },
          ]}
        />
      </main>
      <Footer />
    </>
  )
}