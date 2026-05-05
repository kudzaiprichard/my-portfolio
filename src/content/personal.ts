// content/personal.ts

export const owner = {
    name: 'kudzai prichard',
    fullName: 'Kudzai Prichard Matizirofa',
    title: 'Backend Software Engineer · Distributed Systems · AI Integration',
    description: [
        'Building distributed backend systems and cloud-native APIs at scale.',
        'Specializing in AI/ML integration, model deployment, and AWS infrastructure.',
        'Shipping production systems that process high volumes of data reliably.',
    ],
    bio: 'Backend software engineer with production experience shipping distributed APIs, ML pipelines, and AI-integrated systems on AWS and Azure. I focus on cloud-native architecture, scalable backend design, and deploying machine learning models into production — building systems that hold up under real load and real clients.',
    aliases: [
        'Kudzai Prichard',
        'Kudzai Matizirofa',
        'Prichard Matizirofa',
    ],
} as const

export const contact = {
    email: process.env.NEXT_PUBLIC_EMAIL || 'kudzai@example.com',
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/kudzaiprichard',
    linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/kudzaiprichard',
    twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/kudzaiprichard',
    githubHandle: process.env.NEXT_PUBLIC_GITHUB_HANDLE || '@kudzaiprichard',
    twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@kudzaiprichard',
    linkedinName: process.env.NEXT_PUBLIC_LINKEDIN_NAME || 'Kudzai Prichard',
    // Primary: Google Drive / GitHub release / external host (set via env).
    // Fallback: /resume.pdf served from the public/ directory.
    resumeUrl: process.env.NEXT_PUBLIC_RESUME_URL || '/resume.pdf',
} as const
