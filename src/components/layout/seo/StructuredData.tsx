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
        jobTitle: 'AI & Full Stack Developer',
        description:
            'Building intelligent systems and scalable applications. Specializing in AI/ML, backend architecture, and modern web technologies.',
        knowsAbout: [
            'Artificial Intelligence',
            'Machine Learning',
            'Full Stack Development',
            'Python',
            'React',
            'Next.js',
            'TensorFlow',
            'Node.js',
            'Cloud Computing',
        ],
        sameAs: [githubUrl, linkedinUrl, twitterUrl],
    }

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Kudzai Prichard | AI & Full Stack Developer',
        url: baseUrl,
        description:
            'Portfolio of Kudzai Prichard — AI & Full Stack Developer building intelligent systems and scalable applications.',
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