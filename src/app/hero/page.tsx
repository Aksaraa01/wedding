import PageTheme from "@/components/PageTheme"
import LandingHeader from "@/components/LandingHeader"
import HeroSection from "@/components/HeroSection"
import InvitationCarousel from "@/components/InvitationCarousel"
import FeatureBento from "@/components/FeatureBento"
import ClosingCta from "@/components/ClosingCta"
import LandingFooter from "@/components/LandingFooter"
import SeoOrganization from "@/components/SeoOrganization"

export default function HeroPage() {
  return (
    <>
      <SeoOrganization />
      <PageTheme mode="dark" />
      <LandingHeader />
      <main className="relative z-10 w-full pt-[88px] bg-[#051711] min-h-screen overflow-hidden">
        <HeroSection />
        <InvitationCarousel />
        <FeatureBento />
        <ClosingCta />
        <LandingFooter />
      </main>
    </>
  )
}
