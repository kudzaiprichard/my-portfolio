// content/skills.ts

export interface SkillCategory {
    title: string
    icon: string
    technologies: string[]
}

export const skillCategories: SkillCategory[] = [
    {
        title: 'AI/ML',
        icon: '\u{1F916}',
        technologies: ['TensorFlow', 'Keras', 'PyTorch', 'scikit-learn', 'OpenCV', 'NLP', 'OCR', 'Google Gemini'],
    },
    {
        title: 'Backend',
        icon: '\u2699\uFE0F',
        technologies: ['Python', 'C#', '.NET', 'Java', 'Spring Boot', 'FastAPI', 'Flask'],
    },
    {
        title: 'Frontend',
        icon: '\u{1F4BB}',
        technologies: ['Next.js', 'React', 'TypeScript', 'Angular', 'TanStack Query', 'Tailwind CSS'],
    },
    {
        title: 'Cloud & DevOps',
        icon: '\u2601\uFE0F',
        technologies: ['AWS', 'Azure', 'Docker', 'Vercel', 'CI/CD', 'Git'],
    },
]

export const specializations: string[] = [
    'Distributed Systems & Backend Architecture',
    'AI/ML Integration & Model Deployment',
    'Cloud-Native APIs (AWS / Azure)',
    'Microservices & Event-Driven Systems',
    'Voice AI & Automation',
    'Full Stack Web Development',
]
