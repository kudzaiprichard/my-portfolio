// content/projects.ts

export interface Project {
    id: string
    name: string
    status?: 'LIVE' | 'BETA' | 'WIP'
    description: string
    technologies: string[]
    githubUrl: string
    liveUrl?: string
}

export const projects: Project[] = [
    {
        id: '1',
        name: 'AURA',
        status: 'WIP',
        description: 'Distributed phishing-detection platform with a closed model feedback loop. A FastAPI backend handles inference, model versioning, and online retraining; a Chrome extension delivers real-time verdicts inside Gmail; a Next.js analyst dashboard manages the review and redeployment cycle — all connected through a PostgreSQL-backed audit trail.',
        technologies: ['Python', 'FastAPI', 'scikit-learn', 'PostgreSQL', 'Next.js', 'TypeScript', 'Docker'],
        githubUrl: 'https://github.com/kudzaiprichard/aura',
    },
    {
        id: '2',
        name: 'SENTRY',
        status: 'WIP',
        description: 'Two-stage distributed email analysis pipeline. A FastAPI service integrates Groq for low-latency inference and Google Gemini for deep page analysis — decoupled via async background tasks so the fast path is never blocked. Deployed with async SQLAlchemy and rate-limited token auth for extension clients.',
        technologies: ['Python', 'FastAPI', 'Groq', 'Google Gemini', 'Playwright', 'Next.js', 'TypeScript'],
        githubUrl: 'https://github.com/kudzaiprichard/sentry',
    },
    {
        id: '3',
        name: 'METIS',
        status: 'WIP',
        description: 'Clinical AI backend deploying a Neural Thompson Sampling model (PyTorch) as a REST API for real-time treatment recommendations. Model inference, clinician feedback ingestion, and posterior updates are handled by a FastAPI service backed by PostgreSQL and Neo4j — with deterministic safety gates enforced at the API layer before any model output is returned.',
        technologies: ['Python', 'PyTorch', 'FastAPI', 'PostgreSQL', 'Neo4j', 'Next.js', 'React'],
        githubUrl: 'https://github.com/kudzaiprichard/metis',
    },
    {
        id: '4',
        name: 'Coin Compass',
        status: 'LIVE',
        description: 'Eight-service microservices architecture for cryptocurrency price prediction. Spring Boot handles API gateway, JWT/RBAC auth, centralised config, live Binance data ingestion, and user services; a Python ML service exposes a trained model via REST. Fully containerised with Docker and designed for independent service deployment.',
        technologies: ['Java', 'Spring Boot', 'Python', 'Flask', 'scikit-learn', 'MySQL', 'MongoDB', 'Docker'],
        githubUrl: 'https://github.com/kudzaiprichard/coin-compass',
    },
    {
        id: '5',
        name: 'UBot MT4',
        status: 'LIVE',
        description: 'Automated trading system (Expert Advisor) built in MQL4 for MetaTrader 4. Analyses historical market data to identify patterns and executes long and short trades autonomously — with configurable stop loss, take profit, position scaling, and trailing profit management. Includes a real-time dashboard and compiles to a deployable .ex4 binary.',
        technologies: ['MQL4', 'MetaTrader 4', 'Algorithmic Trading', 'Expert Advisor'],
        githubUrl: 'https://github.com/kudzaiprichard/ubot-mt4',
    },
    {
        id: '6',
        name: 'Spring Real Estate API',
        status: 'LIVE',
        description: 'Production REST API deployed on AWS and Vercel connecting property agents with buyers. Spring Boot backend with JWT-secured endpoints, role-based access control, relational schema design, and a CI/CD pipeline — built from scratch and taken to live production.',
        technologies: ['Java', 'Spring Boot', 'MySQL', 'JWT', 'AWS', 'Vercel', 'CI/CD'],
        githubUrl: 'https://github.com/kudzaiprichard/spring-realestate-api',
    },
]
