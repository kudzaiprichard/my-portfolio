// types/index.ts
// Shared component prop types. Content shapes (Project, Experience, …) live in src/content/.

type SectionId = 'home' | 'about' | 'projects' | 'experience' | 'contact' | 'terminal'

export interface ScrollSectionProps {
    id: SectionId
    children: React.ReactNode
    className?: string
}

export interface TerminalContainerProps {
    title?: string
    /** Rich title-bar content; falls back to `title`. */
    titleContent?: React.ReactNode
    children: React.ReactNode
    className?: string
}
