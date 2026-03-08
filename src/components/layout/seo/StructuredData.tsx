// src/components/layout/StructuredData.tsx

export default function StructuredData() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const email = process.env.NEXT_PUBLIC_EMAIL || 'kudzai@example.com'
    const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/kudzaiprichard'
    const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/kudzaiprichard'
    const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/kudzaiprichard'

    const personSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Kudzai Prichard',
        url: baseUrl,
        email: email,
        jobTitle: 'AI & Full Stack Software Developer',
        description:
            'Building intelligent systems and production-grade applications. Specializing in machine learning, backend architecture, and modern full-stack development with Python, Java, and TypeScript.',
        knowsAbout: [
            'Artificial Intelligence',
            'Machine Learning',
            'Reinforcement Learning',
            'Contextual Bandits',
            'Full Stack Development',
            'Python',
            'Java',
            'TypeScript',
            'PyTorch',
            'TensorFlow',
            'FastAPI',
            'Spring Boot',
            'Next.js',
            'React',
            'Angular',
            'Cloud Computing',
        ],
        sameAs: [githubUrl, linkedinUrl, twitterUrl],
    }

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Kudzai Prichard | AI & Full Stack Software Developer',
        url: baseUrl,
        description:
            'Portfolio of Kudzai Prichard — AI & Full Stack Software Developer building intelligent systems and scalable applications with Python, Java, and TypeScript.',
        author: {
            '@type': 'Person',
            name: 'Kudzai Prichard',
        },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
        </>
    )
}