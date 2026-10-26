// src/components/layout/seo/StructuredData.tsx
// JSON-LD for the home page, built from src/content: a ProfilePage whose main
// entity is the Person (with the companies he co-founded, education and awards),
// plus the WebSite. Shared title/description strings live here too.

import { owner, contact, skillCategories, specializations, projects } from '@/src/content'
import { SITE_URL } from '@/src/lib/site'

// Search results show ~60 characters of a title and ~155 of a description
export const SITE_TITLE = `${owner.fullName} | AI / ML Engineer & Co-Founder`
export const SITE_DESCRIPTION = `${owner.fullName}: AI / ML engineer and co-founder of Teleagents (voice AI for Africa) and OurAfrica. ML, computer vision, NLP and LLMs in production.`

export const PERSON_ID = `${SITE_URL}/#person`

const companies = [
    { name: 'Teleagents', url: 'https://teleagents.co.zw', description: 'Voice AI agents for Africa, built on in-house speech models for Shona, Ndebele and Ndau.' },
    { name: 'OurAfrica', url: 'https://ourafrica.co.zw', description: 'An offline-first learning platform for low-bandwidth learners and organisations across Africa.' },
]

export default function StructuredData() {
    const person = {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: owner.fullName,
        givenName: 'Kudzai',
        additionalName: 'Prichard',
        familyName: 'Matizirofa',
        alternateName: owner.aliases,
        url: SITE_URL,
        image: `${SITE_URL}/og-image.png`,
        email: `mailto:${contact.email}`,
        jobTitle: ['AI / ML Engineer', 'Co-Founder'],
        description: owner.bio,
        nationality: { '@type': 'Country', name: 'Zimbabwe' },
        worksFor: companies.map(c => ({ '@type': 'Organization', name: c.name, url: c.url })),
        hasOccupation: {
            '@type': 'Occupation',
            name: 'AI / ML Engineer',
            occupationLocation: { '@type': 'Country', name: 'Zimbabwe' },
            skills: specializations.join(', '),
        },
        knowsAbout: [
            'Artificial Intelligence',
            'Machine Learning',
            'Computer Vision',
            'Natural Language Processing',
            'Large Language Models',
            'Retrieval-Augmented Generation',
            'Speech Recognition',
            'Voice AI',
            'Document AI',
            'MLOps',
            'Cloud Computing',
            'Entrepreneurship',
            'Product Strategy',
            'Model Context Protocol (MCP)',
            'Desktop Applications',
            ...skillCategories.flatMap(c => c.technologies).filter(t => t.length < 30),
        ],
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Zimbabwe' },
        hasCredential: owner.education.map(e => ({
            '@type': 'EducationalOccupationalCredential',
            name: e.degree,
            credentialCategory: e.degree.startsWith('B.Sc.') ? 'degree' : 'diploma',
            recognizedBy: { '@type': 'Organization', name: e.school },
        })),
        award: owner.honors,
        sameAs: [contact.githubUrl, contact.linkedinUrl, contact.twitterUrl, contact.huggingfaceUrl],
    }

    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ProfilePage',
                '@id': `${SITE_URL}/#profile`,
                url: SITE_URL,
                name: SITE_TITLE,
                description: SITE_DESCRIPTION,
                inLanguage: 'en',
                isPartOf: { '@id': `${SITE_URL}/#website` },
                mainEntity: { '@id': PERSON_ID },
                hasPart: { '@id': `${SITE_URL}/#projects` },
            },
            {
                '@type': 'ItemList',
                '@id': `${SITE_URL}/#projects`,
                name: `Projects by ${owner.fullName}`,
                itemListElement: projects.map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: p.name,
                    url: `${SITE_URL}/projects/${p.slug}`,
                })),
            },
            person,
            ...companies.map(c => ({
                '@type': 'Organization',
                name: c.name,
                url: c.url,
                description: c.description,
                founder: { '@id': PERSON_ID },
            })),
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: owner.fullName,
                description: SITE_DESCRIPTION,
                inLanguage: 'en',
                publisher: { '@id': PERSON_ID },
            },
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
    )
}
