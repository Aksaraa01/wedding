import PageTheme from "@/components/PageTheme"
import LandingHeader from "@/components/LandingHeader"
import LandingHero from "@/components/LandingHero"
import InvitationCarousel from "@/components/InvitationCarousel"
import FeatureBento from "@/components/FeatureBento"
import LandingSteps from "@/components/LandingSteps"
import ClosingCta from "@/components/ClosingCta"
import LandingFooter from "@/components/LandingFooter"
import SeoOrganization from "@/components/SeoOrganization"

export default function LandingPage() {
  return (
    <>
      <SeoOrganization />
      <PageTheme mode="light" />
      <div className="landing-root bg-white">
        <LandingHeader />
        <main className="relative z-10 min-h-screen w-full overflow-hidden bg-white pt-[88px]">
          <LandingHero />
          <InvitationCarousel />
          <FeatureBento />
          <LandingSteps />
          <ClosingCta />
          <LandingFooter />
        </main>
      </div>
    </>
  )
}
