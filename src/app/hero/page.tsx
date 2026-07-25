import PageTheme from "@/components/PageTheme"
import CustomCursor from "@/components/CustomCursor"
import BackgroundElements from "@/components/BackgroundElements"
import Navigation from "@/components/Navigation"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeaturesSection"
import Footer from "@/components/Footer"

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
      </main>
      <Footer />
    </>
  )
}