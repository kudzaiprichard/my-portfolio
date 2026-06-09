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
        technologies: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI', 'Hugging Face'],
    },
    {
        title: 'Backend',
        icon: '\u2699\uFE0F',
        technologies: ['Python', 'Node.js', 'Django', 'FastAPI', 'PostgreSQL'],
    },
    {
        title: 'Frontend',
        icon: '\u{1F4BB}',
        technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Vue.js'],
    },
    {
        title: 'DevOps',
        icon: '\u2601\uFE0F',
        technologies: ['Docker', 'AWS', 'Git', 'CI/CD', 'Linux'],
    },
]

export const specializations: string[] = [
    'Machine Learning Engineering',
    'Natural Language Processing',
    'API Development',
    'System Architecture',
    'Data Engineering',
    'Cloud Computing',
]
