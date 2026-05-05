// content/experience.ts

export interface Experience {
    id: string
    period: string
    role: string
    company: string
    description: string
    achievements: string[]
    technologies: string[]
    url?: string
}

export const experiences: Experience[] = [
    {
        id: '1',
        period: 'Aug 2024 - Jul 2025',
        role: 'Software Engineer',
        company: '@ Sybrin Imaging Solutions',
        description: 'Industrial attachment at an enterprise fintech company serving tier-1 African banks and insurers — Ecocash, CABS, Stanbic Bank, BancABC, and Old Mutual — across 6+ markets. Owned the full delivery loop: distributed system design, cloud deployment on AWS and Azure, ML model integration, and live client delivery.',
        achievements: [
            'Architected and deployed a high-volume document processing platform (C#, .NET, Azure, OpenAI) to production — handling large-scale OCR workloads for Ecocash, CABS, and Stanbic Bank across a distributed cloud pipeline',
            'Designed and built the CABS Internet Banking API from scratch on AWS — RESTful endpoints, background Watcher/Indexer service, Audit Logs, and MFA for full regulatory compliance across UAT, QA, and Production environments',
            'Integrated and deployed custom ML models (Python, TensorFlow, OpenCV) into a production document pipeline for BancABC — extracting structured data from high-volume scanned banking documents with high accuracy',
            'Shipped 2 production AI integration pipelines for BancABC: an RTGS instruction processor combining OCR and ML inference, and an HR automation pipeline with NLP-based resume parsing, candidate scoring, and automated scheduling',
            'Delivered across Old Mutual\'s large-scale distributed microservices platform (AWS, Docker) spanning 6 African countries — contributed to system design reviews, BRD sessions, and client training',
            'Architected a reusable UI configuration layer for Sybrin\'s cloud platform — adopted as the standard integration pattern across multiple tier-1 banking clients',
        ],
        technologies: ['C#', '.NET', 'Python', 'TensorFlow', 'OpenCV', 'AWS', 'Azure', 'Docker', 'Next.js', 'MySQL'],
    },
    {
        id: '2',
        period: '2025 - Present',
        role: 'Co-Founder & Engineer',
        company: '@ Teleagents',
        description: 'Building an AI voice-infrastructure platform that deploys human-sounding voice agents for inbound support, outbound sales, and 24/7 call-centre automation. Currently in closed beta with enterprise clients across Zimbabwe.',
        achievements: [
            'Architected the full voice agent pipeline (Next.js, Python, FastAPI) handling both inbound and outbound call flows autonomously',
            'Closed beta with enterprise clients across Zimbabwe',
            'Designed the product, infrastructure, and go-to-market strategy from the ground up as co-founder',
        ],
        technologies: ['Python', 'FastAPI', 'Next.js', 'TypeScript'],
        url: 'https://teleagents.co.zw',
    },
    {
        id: '3',
        period: '2025 - Present',
        role: 'Co-Founder & Engineer',
        company: '@ OurAfrica',
        description: 'Building an offline-first cross-platform e-learning solution for low-bandwidth users across Africa — available on web, desktop, and Android with download-and-study, progress sync, and verifiable certificates.',
        achievements: [
            'Shipped web, desktop (Tauri), and Android (Expo) clients targeting low-bandwidth African markets',
            'Designed offline-first sync architecture so learners can study without an active internet connection',
            'Built Spring Boot backend hosted on AWS EC2 with full CI/CD pipeline',
        ],
        technologies: ['Spring Boot', 'Next.js', 'Tauri', 'Expo', 'AWS EC2'],
        url: 'https://ourafrica.co.zw',
    },
    {
        id: '4',
        period: 'Jan 2022 - Jun 2022',
        role: 'Software Engineer',
        company: '@ Replica Systems',
        description: 'Industrial attachment delivering a full-stack site-management platform for a construction client and taking ownership of production websites including the Replica Systems corporate site.',
        achievements: [
            'Built a full-stack site-management platform (Spring Boot, PostgreSQL, JWT, Angular) from blank repo to live production on AWS and Vercel via CI/CD',
            'Took ownership of the Replica Systems corporate site (React, Next.js) — covering UI development, domain registration, cloud hosting, and SEO optimisation',
        ],
        technologies: ['Spring Boot', 'PostgreSQL', 'JWT', 'Angular', 'React', 'Next.js', 'AWS', 'CI/CD'],
    },
]
