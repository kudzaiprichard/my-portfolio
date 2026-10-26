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
        id: '2',
        period: '2025 - Present',
        role: 'Co-Founder & AI Engineer',
        company: '@ Teleagents',
        description: 'Co-founded Teleagents to build human-sounding voice AI agents for African languages — inbound support, outbound sales and 24/7 call-centre automation — on our own speech models and self-hosted infrastructure. In closed beta with enterprise clients across Zimbabwe, and named Champion at the POTRAZ Innovation Expo & Conference 2026.',
        achievements: [
            'Built and open-sourced Zimbabwe All Speech on Hugging Face: 1,678+ hours and 358K clips of Shona, Ndebele and Ndau speech',
            'Merged 7 separate speech sources into one schema with per-clip quality scores, so every clip can be filtered by how trustworthy it is',
            'Used pseudo-labelling to grow 15K human-labelled clips 6x, turning a small labelled set into training-scale data',
            'Trained in-house ASR (speech-to-text) and TTS (text-to-speech) models for Zimbabwean languages on AWS SageMaker and EC2 GPUs — giving native Shona voice that commercial providers lack',
            'Built the data pipeline on S3 and Spark (EMR) for audio segmentation and quality tiering ahead of training',
            'Architected a self-hosted real-time voice agent platform (Python, FastAPI, Next.js, telephony) with a streaming STT → LLM → TTS loop that handles inbound and outbound calls autonomously',
            'Added retrieval-augmented generation (RAG) over a Redis vector database, so each agent answers from its client\'s own knowledge instead of guessing',
            'Deployed and auto-scaled the platform on AWS ECS',
            'Champion, POTRAZ Innovation Expo & Conference 2026 (Bulawayo) for “TeleAgents: AI Voice Agents for Zimbabwe”, and recognised as Innovator by the POTRAZ Director-General',
            'Designed the product, infrastructure and go-to-market strategy from the ground up as co-founder',
        ],
        technologies: ['Python', 'FastAPI', 'Next.js', 'TypeScript', 'LLMs', 'RAG', 'Redis', 'AWS SageMaker', 'EC2', 'ECS', 'S3', 'Spark (EMR)', 'Hugging Face'],
        url: 'https://teleagents.co.zw',
    },
    {
        id: '1',
        period: 'Aug 2024 - Jul 2026',
        role: 'AI Systems Engineer',
        company: '@ Sybrin Imaging Solutions',
        description: 'Enterprise fintech company serving tier-1 African banks and insurers — EcoCash, CABS, Stanbic Bank, BancABC and Old Mutual — across 6+ markets. Owned the full delivery loop: AI system design, cloud deployment on AWS and Azure, ML model integration and live client delivery.',
        achievements: [
            'Shipped a production document-AI (OCR) platform for EcoCash, CABS and Stanbic Bank (C#, .NET, Azure, OpenAI, Redis), processing tens of thousands of documents a month',
            'Migrated that platform from Azure Document Intelligence to a more accurate AI engine',
            'Built 2 production AI agents for BancABC — the first an RTGS payment-instruction processor combining OCR and ML inference, which ended manual transaction keying',
            'The second BancABC agent: an HR pipeline for CV intake, NLP resume parsing, candidate scoring and automated scheduling',
            'Trained custom computer-vision models (TensorFlow, OpenCV) that extract faces and signatures from scanned bank forms',
            'Designed the CABS Internet Banking API from scratch (C#, .NET, MySQL): transaction endpoints, a background watcher/indexer service, audit logs, and OAuth/JWT + MFA for regulatory compliance across UAT, QA and Production',
            'Built a Telegraphic Transfer service with mobile APIs',
            'Closed 100+ tickets on Old Mutual\'s distributed microservices platform (AWS, Docker) spanning 6 African countries, and took part in system design reviews, BRD sessions, client demos and training',
            'Built a reusable low-code UI configuration layer for Sybrin\'s cloud platform, adopted as the standard integration pattern by 4 tier-1 banking clients',
        ],
        technologies: ['C#', '.NET', 'Python', 'Azure', 'Azure Document Intelligence', 'OpenAI', 'TensorFlow', 'OpenCV', 'Redis', 'MySQL', 'AWS', 'Docker'],
    },
    {
        id: '3',
        period: '2025 - Present',
        role: 'Co-Founder & Engineer',
        company: '@ OurAfrica',
        description: 'Co-founded OurAfrica, an offline-first learning platform (LMS) for low-bandwidth learners and organisations across Africa. I built and run all of it: the Spring Boot API, a Next.js web app that also ships as a Windows desktop app, a native Android app, and the AI tooling that produces the courses. Learners download a course, study for days without a connection and sync their progress, quizzes and certificates when they are back online.',
        achievements: [
            'Built the backend as a Spring Boot 4 / Java 21 modular monolith (Spring Modulith): courses, curriculum, assessments, enrolments, programs, certificates, gamification, notifications, organisations and billing, on PostgreSQL with Flyway, AWS Cognito, S3 and CloudFront',
            'Shipped one Next.js 16 / React 19 codebase as two products: a web app on Vercel and a Tauri 2 Windows desktop app with a Rust backend for encrypted (AES-GCM) offline downloads, decrypt-on-read media streaming and OS-keystore sign-in',
            'Built the native Android app in Kotlin and Jetpack Compose: a multi-module clean architecture with boundaries enforced in CI by Konsist, an encrypted Room/SQLCipher database, WorkManager batch sync and screenshot regression tests',
            'Signed offline course packages and app updates with Ed25519, so the desktop and Android apps can verify content and updates without reaching the server',
            'Built an automatic video pipeline on AWS: every uploaded lesson video is transcoded by AWS Lambda and Elemental MediaConvert into 480p, 720p and 1080p renditions (never upscaled), and learners pick the quality they stream or download, with the size of each option shown first',
            'Added automatic closed captions with Amazon Transcribe: it reads each video straight from S3 (the bytes never pass through the API), detects South African, British or US English, and attaches the subtitles to the lesson',
            'Made course downloads faster on African mobile networks, measured from Harare: delivery moved to the CloudFront edge, smaller renditions (720p about 6.5× smaller than the source), parallel chunked downloads, resume and Wi-Fi-only controls',
            'Sped up instructor video uploads with browser-to-S3 multipart uploads and S3 Transfer Acceleration',
            'Designed the AWS infrastructure: PostgreSQL on Amazon RDS, the API on EC2 in a VPC with NAT for private outbound traffic, Route 53 DNS for ourafrica.co.zw, Cognito for sign-in, S3 + CloudFront for media, and SES for email',
            'Built the AI layer: a learner tutor, RAG search over lessons (Gemini embeddings + pgvector), translation, spaced-repetition flashcards, per-user token metering, and a local ONNX embedder so private student submissions never leave the server',
            'Built and published a course-builder MCP server (npm + hosted) so authors build, lint and publish full courses with their own Claude subscription; a publish gate refuses courses that fail quality checks',
            'Built Course Studio, an AI production pipeline that takes a course from outline to published, with quizzes, narrated whiteboard videos, captions, learner notes, covers and resources',
            'Designed and shipped a relevance engine that matches organisations and learners to courses by sector, team and skill, with onboarding that feeds it',
            'Run releases across three environments (dev, UAT, prod) with GitHub Actions: API deploys to AWS EC2, desktop auto-updates from GitHub Releases, and a self-hosted Android update channel',
        ],
        technologies: ['Spring Boot', 'Java', 'PostgreSQL', 'Next.js', 'React', 'Tauri', 'Rust', 'Kotlin', 'Jetpack Compose', 'AWS (EC2, RDS, S3, CloudFront, Lambda, MediaConvert, Transcribe, Cognito, Route 53)', 'Gemini', 'pgvector', 'MCP', 'GitHub Actions'],
        url: 'https://ourafrica.co.zw',
    },
    {
        id: '4',
        period: 'Jan 2022 - Jun 2022',
        role: 'Software Engineer Intern',
        company: '@ Replica Systems',
        description: 'Industrial attachment delivering a full-stack site-management platform for a construction client, and taking ownership of production websites including the Replica Systems corporate site.',
        achievements: [
            'Took a construction site-management platform from an empty repo to production (Spring Boot, PostgreSQL, Angular)',
            'Secured it with JWT authentication, role-based access control (RBAC) and rate limiting',
            'Set up CI/CD deploying to AWS and Vercel',
            'Took ownership of the Replica Systems corporate site (React, Next.js) — UI development, domain registration, cloud hosting and SEO',
        ],
        technologies: ['Spring Boot', 'PostgreSQL', 'Angular', 'JWT', 'RBAC', 'React', 'Next.js', 'AWS', 'Vercel', 'CI/CD'],
    },
]
