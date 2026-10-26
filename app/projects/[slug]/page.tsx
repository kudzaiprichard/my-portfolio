// app/projects/[slug]/page.tsx
// One page per project: the problem, what was built, a result where there is
// one, media, and links. Static (generateStaticParams); content comes from
// src/content/projects.ts via lib/projectDocs — the terminal's
// `cat projects/<slug>/README.md` prints the same fields.

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import GlitchText from '@/src/components/shared/GlitchText'
import { projects, owner } from '@/src/content'
import { projectBySlug, projectPath } from '@/src/lib/projectDocs'
import { SITE_URL } from '@/src/lib/site'
import { PERSON_ID } from '@/src/components/layout/seo/StructuredData'

export function generateStaticParams() {
    return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const p = projectBySlug(slug)
    if (!p) return {}
    // The root layout's title template appends the owner's name
    const title = p.name
    const description = snippet(`${p.description} ${p.problem}`)
    const images = p.media ? [{ url: p.media.src, alt: p.media.alt }] : [{ url: '/og-image.png', alt: owner.fullName }]
    return {
        title,
        description,
        keywords: [p.name, ...p.technologies, owner.fullName],
        alternates: { canonical: projectPath(p) },
        openGraph: { title: `${p.name} | ${owner.fullName}`, description, url: projectPath(p), type: 'article', images },
        twitter: { card: 'summary_large_image', title: `${p.name} | ${owner.fullName}`, description, images: images.map(i => i.url) },
    }
}

/** Trim to what a search result shows (~155 characters), on a word boundary. */
function snippet(text: string, max = 155): string {
    if (text.length <= max) return text
    return `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`
}

function projectJsonLd(p: NonNullable<ReturnType<typeof projectBySlug>>) {
    const url = `${SITE_URL}${projectPath(p)}`
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                // Apps people can install are applications; the rest are source code
                '@type': p.downloads ? ['SoftwareApplication', 'SoftwareSourceCode'] : 'SoftwareSourceCode',
                '@id': `${url}#project`,
                name: p.name,
                description: p.description,
                url,
                ...(p.githubUrl ? { codeRepository: p.githubUrl } : {}),
                programmingLanguage: p.technologies,
                ...(p.downloads ? {
                    applicationCategory: p.appCategory ?? 'DeveloperApplication',
                    operatingSystem: p.downloads.map(d => d.label).join(', '),
                    downloadUrl: p.downloads.map(d => d.url),
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                } : {}),
                ...(p.liveUrl ? { sameAs: p.liveUrl } : {}),
                ...(p.year ? { dateCreated: String(p.year) } : {}),
                ...(p.media ? { image: new URL(p.media.src, SITE_URL).toString() } : {}),
                ...(p.event ? { keywords: `${p.event.toLowerCase()}, ${p.technologies.join(', ')}` } : {}),
                author: { '@id': PERSON_ID },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: owner.fullName, item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/#projects` },
                    { '@type': 'ListItem', position: 3, name: p.name, item: url },
                ],
            },
        ],
    }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const p = projectBySlug(slug)
    if (!p) notFound()
    const others = projects.filter(o => o.slug !== p.slug)

    return (
        <main id="main-content" tabIndex={-1} className="project-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(p)) }}
            />
            <article className="terminal-container project-page-card">
                <div className="terminal-header">
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <span className="terminal-title"><GlitchText text={`visitor@kudzai:~/projects/${p.slug}$ cat README.md`} /></span>
                </div>

                <p className="project-page-back"><Link href="/#projects">← all projects</Link></p>

                <header className="project-page-head">
                    <h1 className="project-page-title"><GlitchText text={p.name} /></h1>
                    <p className="project-page-meta">
                        <span className={`project-page-status project-page-status-${(p.status ?? 'DONE').toLowerCase()}`}>[{p.status ?? 'DONE'}]</span>
                        {p.event && <span className="project-page-status project-page-status-event"> [{p.event}]</span>}
                        {p.year && <span> · {p.year}</span>}
                        <span> · {p.technologies.join(', ')}</span>
                    </p>
                    <p className="project-page-lede">{p.description}</p>
                </header>

                {p.media && (
                    <figure className="project-page-media">
                        <Image
                            src={p.media.src}
                            alt={p.media.alt}
                            width={p.media.width}
                            height={p.media.height}
                            sizes="(max-width: 900px) 100vw, 860px"
                            // Served straight from the repository: already web-sized, and the
                            // GIF must stay animated
                            unoptimized
                        />
                        <figcaption>{p.media.alt}</figcaption>
                    </figure>
                )}

                <section className="project-page-block" aria-labelledby="problem">
                    <h2 id="problem">## The problem</h2>
                    <p>{p.problem}</p>
                </section>

                <section className="project-page-block" aria-labelledby="built">
                    <h2 id="built">## What was built</h2>
                    <ul>{p.built.map(b => <li key={b}>{b}</li>)}</ul>
                </section>

                {p.result && (
                    <section className="project-page-block" aria-labelledby="result">
                        <h2 id="result">## Result</h2>
                        <p className="project-page-result">{p.result.text}</p>
                        {p.result.source && <p className="project-page-source">Source: {p.result.source}</p>}
                    </section>
                )}

                <nav className="project-page-links" aria-label="Project links">
                    {p.downloads?.map(d => (
                        <a key={d.url} className="keycap" href={d.url} target="_blank" rel="noopener noreferrer">[ download: {d.label} ]</a>
                    ))}
                    {p.liveUrl && <a className="keycap" href={p.liveUrl} target="_blank" rel="noopener noreferrer">[ website ]</a>}
                    {p.githubUrl && <a className="keycap" href={`${p.githubUrl}#readme`} target="_blank" rel="noopener noreferrer">[ README ]</a>}
                    {p.githubUrl && <a className="keycap" href={p.githubUrl} target="_blank" rel="noopener noreferrer">[ code ]</a>}
                </nav>

                <nav className="project-page-others" aria-label="Other projects">
                    <h2>## More projects</h2>
                    <ul>
                        {others.map(o => (
                            <li key={o.slug}><Link href={projectPath(o)}>{o.name}</Link> <span>— {o.technologies.slice(0, 3).join(', ')}</span></li>
                        ))}
                    </ul>
                </nav>
            </article>

            <style>{`
                .project-page {
                    position: relative;
                    z-index: var(--z-content);
                    min-height: 100dvh;
                    display: flex;
                    justify-content: center;
                    padding: calc(var(--spacing-2xl) + 24px) var(--container-padding) calc(var(--spacing-2xl) + 32px);
                }

                .project-page-card {
                    max-height: none;
                    overflow: visible;
                    max-width: 900px;
                    color: var(--text);
                    line-height: var(--line-height-relaxed);
                    font-size: var(--font-size-md);
                }

                .project-page-back a,
                .project-page-others a {
                    color: var(--bright);
                }

                .project-page-title {
                    font-family: var(--font-display);
                    font-weight: normal;
                    font-size: calc(var(--font-size-2xl) * 1.3);
                    color: var(--bright);
                    line-height: var(--line-height-tight);
                    margin: var(--spacing-md) 0 var(--spacing-xs);
                }

                .project-page-meta {
                    color: var(--dim);
                    font-size: var(--font-size-sm);
                }

                .project-page-status-live { color: var(--bright); }
                .project-page-status-wip { color: var(--warn); }
                .project-page-status-beta { color: var(--agent); }
                .project-page-status-event { color: var(--warn); }

                .project-page-lede {
                    margin-top: var(--spacing-md);
                }

                .project-page-media {
                    margin: var(--spacing-lg) 0;
                }

                .project-page-media img {
                    width: 100%;
                    height: auto;
                    border: 1px solid rgb(var(--glow) / 0.3);
                }

                .project-page-media figcaption {
                    color: var(--dim);
                    font-size: var(--font-size-sm);
                    margin-top: var(--spacing-xs);
                }

                .project-page-block,
                .project-page-others {
                    margin-top: var(--spacing-lg);
                }

                .project-page-block h2,
                .project-page-others h2 {
                    color: var(--bright);
                    font-size: var(--font-size-md);
                    font-weight: 600;
                    margin-bottom: var(--spacing-xs);
                }

                .project-page-block ul,
                .project-page-others ul {
                    padding-left: 1.4em;
                }

                .project-page-block li + li {
                    margin-top: var(--spacing-xs);
                }

                .project-page-result {
                    color: var(--bright);
                }

                .project-page-source,
                .project-page-others span {
                    color: var(--dim);
                    font-size: var(--font-size-sm);
                }

                .project-page-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-sm);
                    margin-top: var(--spacing-lg);
                }

                .project-page-links a {
                    border: 1px solid var(--bright);
                    color: var(--bright);
                    padding: 6px 14px;
                    text-decoration: none;
                    font-size: var(--font-size-sm);
                }

                .project-page-links a:hover,
                .project-page-links a:focus-visible {
                    background: rgb(var(--glow) / 0.12);
                }
            `}</style>
        </main>
    )
}
