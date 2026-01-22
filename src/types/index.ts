// types/index.ts

/* ============================================
   PARTICLE SYSTEM TYPES
   ============================================ */

export interface Particle {
    x: number
    y: number
    baseSize: number
    currentSize: number
    speedX: number
    speedY: number
    opacity: number
    isHub: boolean
    pulsePhase: number
    zone?: {           // NEW: Optional zone constraint for area-restricted particles
        minX: number
        maxX: number
        minY: number
        maxY: number
    }
}

export interface MouseTrailPoint {
    x: number
    y: number
}

export interface ParticleSystemConfig {
    numberOfParticles: number
    maxTrailLength: number
    connectionDistance: number
    hubConnectionDistance: number
    mouseConnectionDistance: number
}

/* ============================================
   SKILLS & TECH STACK TYPES
   ============================================ */

export interface TechBadge {
    name: string
    category?: string
}

export interface SkillCategory {
    title: string
    icon: string
    technologies: TechBadge[]
}

export interface Specialization {
    name: string
    description?: string
}

/* ============================================
   PROJECT TYPES
   ============================================ */

export interface Project {
    id: string
    title: string
    description: string
    longDescription?: string
    technologies: string[]
    demoUrl?: string
    githubUrl?: string
    imageUrl?: string
    featured?: boolean
    startDate?: string
    endDate?: string
    status?: 'completed' | 'in-progress' | 'archived'
}

/* ============================================
   EXPERIENCE/WORK TYPES
   ============================================ */

export interface Experience {
    id: string
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string // undefined means "Present"
    current?: boolean
    description: string
    responsibilities?: string[]
    achievements?: string[]
    technologies?: string[]
    type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
}

/* ============================================
   EDUCATION TYPES
   ============================================ */

export interface Education {
    id: string
    institution: string
    degree: string
    field: string
    startDate: string
    endDate?: string
    current?: boolean
    gpa?: string
    achievements?: string[]
    description?: string
}

/* ============================================
   CONTACT TYPES
   ============================================ */

export interface ContactInfo {
    email: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
}

export interface ContactFormData {
    name: string
    email: string
    subject?: string
    message: string
}

export interface ContactFormErrors {
    name?: string
    email?: string
    message?: string
}

/* ============================================
   NAVIGATION TYPES
   ============================================ */

export interface NavSection {
    id: string
    label: string
    path: string
}

export interface PageIndicator {
    id: string
    label: string
    active: boolean
}

/* ============================================
   ANIMATION TYPES
   ============================================ */

export interface TypingEffectConfig {
    text: string
    speed?: number
    delay?: number
    onComplete?: () => void
}

export interface CommandOutput {
    command: string
    output: string | React.ReactNode
    delay?: number
}

/* ============================================
   TERMINAL TYPES
   ============================================ */

export interface TerminalCommand {
    id: string
    prompt: string
    command: string
    output?: string | React.ReactNode
    isTyping?: boolean
    showCursor?: boolean
}

/* ============================================
   FLOATING CODE SNIPPET TYPES
   ============================================ */

export interface CodeSnippet {
    id: string
    text: string
    top?: string
    left?: string
    right?: string
    bottom?: string
    delay?: number
}

/* ============================================
   UTILITY TYPES
   ============================================ */

export type SectionId = 'home' | 'about' | 'projects' | 'experience' | 'contact'

export interface ScrollSectionProps {
    id: SectionId
    children: React.ReactNode
    className?: string
}

/* ============================================
   COMPONENT PROP TYPES
   ============================================ */

export interface TerminalContainerProps {
    title?: string
    children: React.ReactNode
    className?: string
}

export interface ButtonProps {
    variant?: 'primary' | 'secondary'
    children: React.ReactNode
    onClick?: () => void
    href?: string
    className?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
}