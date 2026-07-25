import ChaosHero from "@/components/ChaosHero"
import TransitionSection from "@/components/TransitionSection"
import SolutionSection from "@/components/SolutionSection"
import TimelineSection from "@/components/TimelineSection"
import ConversionClimax from "@/components/ConversionClimax"

export default function ProblemPage() {
  return (
    <>
      <div className="dark">
        <ChaosHero />
      </div>
      <TransitionSection />
      <SolutionSection />
      <TimelineSection />
      <ConversionClimax />
    </>
  )
}