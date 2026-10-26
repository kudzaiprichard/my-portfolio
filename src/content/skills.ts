// content/skills.ts

export interface SkillCategory {
    title: string
    icon: string
    technologies: string[]
}

export const skillCategories: SkillCategory[] = [
    {
        title: 'AI / ML',
        icon: '\u{1F916}',
        technologies: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'OpenCV', 'LightGBM', 'CatBoost', 'Optuna', 'NLP', 'Computer vision', 'OCR'],
    },
    {
        title: 'Generative & Speech AI',
        icon: '\u{1F399}️',
        technologies: ['LLMs', 'AI agents', 'RAG / vector search', 'ASR', 'TTS', 'Streaming STT → LLM → TTS', 'Google Gemini', 'OpenAI API', 'Hugging Face'],
    },
    {
        title: 'Cloud AI',
        icon: '\u{1F9E0}',
        technologies: ['AWS SageMaker', 'Azure OpenAI', 'Azure Document Intelligence', 'OpenAI API', 'Hugging Face'],
    },
    {
        title: 'Languages',
        icon: '\u{1F4DD}',
        technologies: ['Python', 'C#', 'Java', 'TypeScript', 'SQL'],
    },
    {
        title: 'APIs & Backend',
        icon: '⚙️',
        technologies: ['FastAPI', 'Flask', '.NET', 'Spring Boot', 'REST microservices', 'OAuth / JWT / MFA'],
    },
    {
        title: 'Data',
        icon: '\u{1F5C4}️',
        technologies: ['PostgreSQL', 'MySQL', 'MongoDB', 'Neo4j', 'Redis', 'Spark'],
    },
    {
        title: 'Cloud & DevOps',
        icon: '☁️',
        technologies: ['AWS (EC2, ECS, ECR, S3, EMR, Glue, Lambda, RDS, CloudWatch)', 'Azure', 'Docker', 'CI/CD', 'Linux', 'Vercel'],
    },
    {
        title: 'Frontend',
        icon: '\u{1F4BB}',
        technologies: ['React', 'Next.js', 'TypeScript', 'Angular', 'Tailwind CSS'],
    },
]

export const specializations: string[] = [
    'Machine learning & model deployment',
    'Computer vision & document AI',
    'NLP, LLM agents & RAG',
    'Speech & voice AI for African languages',
    'Cloud AI on AWS & Azure',
    'Full-stack & offline-first products',
    'Fintech & banking systems',
    'Product, strategy & go-to-market',
]
