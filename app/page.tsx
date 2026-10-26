// app/page.tsx
// Server component: every section prints its final content into the HTML.
// Client behaviour lives in small islands (SectionReveal, terminals, forms).

import ScrollSection from '@/src/components/shared/ScrollSection'
import HeroSection from '@/src/components/sections/HeroSection'
import AboutSection from '@/src/components/sections/AboutSection'
import ProjectsSection from '@/src/components/sections/ProjectsSection'
import ExperienceSection from '@/src/components/sections/ExperienceSection'
import ContactSection from '@/src/components/sections/ContactSection'
import TerminalSection from '@/src/components/sections/TerminalSection'
import SectionKeyNav from '@/src/components/layout/SectionKeyNav'
import { VoiceProvider } from '@/src/components/shared/VoiceProvider'
import StructuredData from '@/src/components/layout/seo/StructuredData'

export default function Home() {
    return (
        <VoiceProvider>
            <StructuredData />
            <SectionKeyNav />
            <main id="main-content" tabIndex={-1}>
                <ScrollSection id="home">
                    <HeroSection />
                </ScrollSection>

                <ScrollSection id="about">
                    <AboutSection />
                </ScrollSection>

                <ScrollSection id="projects">
                    <ProjectsSection />
                </ScrollSection>

                <ScrollSection id="experience">
                    <ExperienceSection />
                </ScrollSection>

                <ScrollSection id="contact">
                    <ContactSection />
                </ScrollSection>

                <ScrollSection id="terminal">
                    <TerminalSection />
                </ScrollSection>
            </main>
        </VoiceProvider>
    )
}