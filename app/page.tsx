// app/page.tsx
import ScrollSection from '@/components/shared/ScrollSection'
import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import ExperienceSection from '@/components/sections/ExperienceSection'
import ContactSection from '@/components/sections/ContactSection'

export default function Home() {
  return (
      <main>
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
      </main>
  )
}