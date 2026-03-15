// content/personal.ts

export const owner = {
    name: 'kudzai prichard',
    fullName: 'Kudzai Prichard Matizirofa',
    title: 'AI & Full Stack Developer',
    description: [
        'Building intelligent systems and scalable applications.',
        'Specializing in AI/ML, backend architecture, and modern web technologies.',
        'Transforming complex problems into elegant solutions.',
    ],
    bio: 'Passionate developer with expertise in artificial intelligence and full-stack development. I combine cutting-edge AI technologies with robust backend systems to create innovative solutions. Committed to writing clean, efficient code and staying current with emerging technologies.',
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
} as const
