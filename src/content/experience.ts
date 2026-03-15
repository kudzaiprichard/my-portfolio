// content/experience.ts

export interface Experience {
    id: string
    period: string
    role: string
    company: string
    description: string
    achievements: string[]
    technologies: string[]
}

export const experiences: Experience[] = [
    {
        id: '1',
        period: '2023 - Present',
        role: 'Senior AI Engineer',
        company: '@ TechCorp Solutions',
        description: 'Leading AI/ML initiatives and developing intelligent systems for enterprise clients. Architected and deployed scalable machine learning pipelines processing millions of data points daily.',
        achievements: [
            'Built NLP models achieving 94% accuracy in sentiment analysis',
            'Reduced model inference time by 60% through optimization',
            'Mentored team of 5 junior engineers',
        ],
        technologies: ['Python', 'TensorFlow', 'AWS', 'Docker', 'PyTorch'],
    },
    {
        id: '2',
        period: '2021 - 2023',
        role: 'Full Stack Developer',
        company: '@ StartupHub Inc',
        description: 'Developed and maintained full-stack applications serving 100K+ users. Implemented RESTful APIs and modern frontend interfaces with React and Node.js.',
        achievements: [
            'Launched 3 major product features on schedule',
            'Improved application performance by 45%',
            'Collaborated with cross-functional teams',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git'],
    },
    {
        id: '3',
        period: '2020 - 2021',
        role: 'Freelance Developer',
        company: '@ Self-Employed',
        description: 'Delivered custom web applications and AI solutions for various clients. Specialized in rapid prototyping and MVP development.',
        achievements: [
            'Completed 15+ client projects successfully',
            'Maintained 100% client satisfaction rate',
            'Built scalable solutions for diverse industries',
        ],
        technologies: ['Python', 'Django', 'React', 'MongoDB', 'AWS'],
    },
]
