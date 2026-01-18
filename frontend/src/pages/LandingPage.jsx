import LandingNavbar from '@/components/Landing/LandingNavbar'
import HeroSection from '@/components/Landing/HeroSection'
import GetStartedSteps from '@/components/Landing/GetStartedSteps'
import FeaturesSection from '@/components/Landing/FeaturesSection'
import PricingSection from '@/components/Landing/PricingSection'
import AboutSection from '@/components/Landing/AboutSection'

export default function LandingPage() {
    return (
        <div className="min-h-screen font-inter">
            <LandingNavbar />
            <main>
                <HeroSection />
                <GetStartedSteps />
                <FeaturesSection />
                <PricingSection />
                <AboutSection />
            </main>
        </div>
    )
}
