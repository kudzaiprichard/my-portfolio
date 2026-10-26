// content/personal.ts

export const owner = {
    name: 'kudzai prichard matizirofa',
    fullName: 'Kudzai Prichard Matizirofa',
    title: 'AI / ML Engineer · Co-Founder of Teleagents & OurAfrica',
    description: [
        'Co-founder of Teleagents (voice AI agents for Africa) and OurAfrica (offline-first learning for Africa).',
        'AI / ML engineer across machine learning, computer vision, NLP, speech and LLMs, shipped to production on AWS and Azure.',
        'From strategy and go-to-market to architecture and code; built AI systems for EcoCash, CABS, Stanbic, BancABC and Old Mutual.',
    ],
    bio: 'AI / ML Engineer and two-time co-founder. I co-founded Teleagents, which builds voice AI agents for Africa on its own speech models for Shona, Ndebele and Ndau (Champion, POTRAZ Innovation Expo & Conference 2026), and OurAfrica, an offline-first learning platform on web, desktop and Android. My engineering spans machine learning, computer vision, NLP, speech and LLMs: I train models, deploy them behind APIs on AWS and Azure, and run them in production. At Sybrin I built document-AI and banking systems for EcoCash, CABS, Stanbic, BancABC and Old Mutual. As a founder I own the product end to end, from strategy, go-to-market and client work to architecture and code. I hold a B.Sc. Honours in Artificial Intelligence & Machine Learning from the University of Zimbabwe.',
    /** The About section's paragraph; `highlight` phrases are emphasised (and glitch). */
    about: [
        { text: 'AI / ML engineer and ' },
        { text: 'two-time co-founder', highlight: true },
        { text: '. At Teleagents we build ' },
        { text: 'voice AI agents for Africa', highlight: true },
        { text: '; at OurAfrica, offline-first learning for low-bandwidth learners. My engineering spans ' },
        { text: 'machine learning, computer vision, NLP and speech', highlight: true },
        { text: ': models trained, deployed on AWS and Azure and run in production, from document AI processing ' },
        { text: 'tens of thousands of documents a month', highlight: true },
        { text: ' for banks to credit-risk and fraud models and full products on web, desktop and Android. As a founder I take ideas ' },
        { text: 'from strategy to paying clients', highlight: true },
        { text: ': product, go-to-market, architecture and code. Always: ' },
        { text: 'building the next thing', highlight: true },
        { text: '.' },
    ] as ReadonlyArray<{ text: string; highlight?: boolean }>,
    /** The tech pills under the hero description */
    stack: ['Python', 'PyTorch', 'scikit-learn', 'Computer Vision', 'NLP', 'LLMs', 'FastAPI', 'AWS', 'Azure'],
    education: [
        { degree: 'B.Sc. Honours, Artificial Intelligence & Machine Learning', school: 'University of Zimbabwe', period: '2022 – 2026', detail: 'Upper Second Class (2:1)' },
        { degree: 'Diploma & Certificate in Software Engineering', school: 'University of Zimbabwe', period: '2019 – 2022' },
        { degree: 'Level 4 & 5 Diplomas in Computer Engineering', school: 'ABMA Education, UK', period: '2018 – 2019' },
    ] as ReadonlyArray<{ degree: string; school: string; period: string; detail?: string }>,
    honors: [
        'Champion, POTRAZ Innovation Expo & Conference 2026 (Bulawayo, Oct 2026) for “TeleAgents: AI Voice Agents for Zimbabwe”',
        'Recognised as Innovator by the POTRAZ Director-General (an ITU Acceleration Centres Network member)',
    ],
    aliases: [
        'Kudzai Prichard',
        'Kudzai Matizirofa',
        'Prichard Matizirofa',
    ],
} as const

export const contact = {
    email: process.env.NEXT_PUBLIC_EMAIL || 'kudzaiprichard@gmail.com',
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/kudzaiprichard',
    linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/kudzai-prichard',
    twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/kudzaiprichard',
    huggingfaceUrl: 'https://huggingface.co/Teleagents',
    githubHandle: process.env.NEXT_PUBLIC_GITHUB_HANDLE || '@kudzaiprichard',
    twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@kudzaiprichard',
    linkedinName: process.env.NEXT_PUBLIC_LINKEDIN_NAME || 'Kudzai Prichard Matizirofa',
    // Primary: Google Drive / GitHub release / external host (set via env).
    // Fallback: /resume.pdf served from the public/ directory.
    resumeUrl: process.env.NEXT_PUBLIC_RESUME_URL || '/resume.pdf',
} as const
