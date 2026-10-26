// components/sections/ProjectsSection.tsx
// Server component: every project card ships in the HTML; SectionReveal
// types the commands and reveals the cards and footer.

import SectionReveal from '@/src/components/shared/reveal/SectionReveal'
import SectionShell from '@/src/components/shared/reveal/SectionShell'
import TypedLine from '@/src/components/shared/reveal/TypedLine'
import { projects, contact } from '@/src/content'
import type { Project } from '@/src/content/projects'
import GlitchText from '@/src/components/shared/GlitchText'

const githubUrl = contact.githubUrl

function getStatusColor(status?: string) {
    switch (status) {
        case 'LIVE': return 'var(--bright)'
        case 'BETA': return 'var(--agent)'
        case 'WIP': return 'var(--warn)'
        default: return 'var(--bright)'
    }
}

// On hover the card turns into a long-format listing line: ls -l
function LongListing({ project }: { project: Project }) {
    return (
        <div className="projects-section-ls">
            <span className="projects-section-ls-perm" aria-hidden="true">drwxr-xr-x</span>
            <span className="projects-section-ls-owner" aria-hidden="true">kudzai</span>
            <span className="projects-section-ls-year">{project.year ?? '----'}</span>
            <span className="projects-section-ls-status">{project.status ?? 'DONE'}</span>
            <span className="projects-section-ls-stack">{project.technologies.slice(0, 4).join(',').toLowerCase()}</span>
        </div>
    )
}

// Details, then code, website and installers: whichever the project has
function ProjectLinks({ project, small }: { project: Project; small?: boolean }) {
    const cls = `projects-section-link${small ? ' projects-section-link-small' : ''}`
    return (
        <div className="projects-section-links">
            <a href={`/projects/${project.slug}`} className={cls}>→ Details</a>
            {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={cls}>→ GitHub</a>
            )}
            {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={cls}>→ Website</a>
            )}
            {project.downloads?.map(d => (
                <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`Download ${project.name}: ${d.label}`}>↓ {d.label}</a>
            ))}
        </div>
    )
}

function Badges({ project }: { project: Project }) {
    return (
        <span className="projects-section-badges">
            {project.event && (
                <span className="projects-section-status-badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>{project.event}</span>
            )}
            {project.status && (
                <span className="projects-section-status-badge" style={{ borderColor: getStatusColor(project.status), color: getStatusColor(project.status) }}>{project.status}</span>
            )}
        </span>
    )
}

const commandLine = {
    className: 'projects-section-command-line',
    prompt: '$ ',
    promptClassName: 'projects-section-prompt',
}

export default async function ProjectsSection() {
    'use cache'
    return (
        <>
            <SectionReveal
                sectionId="projects"
                title="developer@portfolio:~/projects$"
                ariaLabel="Projects section terminal — portfolio projects"
                afterComplete={<SectionShell sectionId="projects" />}
            >
                <div className="projects-section-content">
                    <TypedLine text="ls -la ./repositories/" {...commandLine} />

                    <div className="projects-section-container" data-reveal="show">
                        <div className="projects-section-featured-row">
                            {projects.slice(0, 2).map((project) => (
                                <div key={project.id} className="projects-section-card projects-section-card-featured">
                                    <div className="projects-section-header">
                                        <span className="projects-section-name">
                                            <GlitchText text={project.name} />
                                        </span>
                                        <Badges project={project} />
                                    </div>
                                    <LongListing project={project} />
                                    <p className="projects-section-description">{project.description}</p>
                                    <div className="projects-section-tech-tags">
                                        {project.technologies.map((tech) => (
                                            <span key={tech} className="projects-section-tech-tag">{tech}</span>
                                        ))}
                                    </div>
                                    <ProjectLinks project={project} />
                                </div>
                            ))}
                        </div>

                        <div className="projects-section-other-row">
                            {projects.slice(2).map((project) => (
                                <div key={project.id} className="projects-section-card">
                                    <div className="projects-section-header">
                                        <span className="projects-section-name projects-section-name-small">
                                            <GlitchText text={project.name} />
                                        </span>
                                        <Badges project={project} />
                                    </div>
                                    <LongListing project={project} />
                                    <p className="projects-section-description projects-section-description-small">{project.description}</p>
                                    <div className="projects-section-tech-tags">
                                        {project.technologies.map((tech) => (
                                            <span key={tech} className="projects-section-tech-tag projects-section-tech-tag-small">{tech}</span>
                                        ))}
                                    </div>
                                    <ProjectLinks project={project} small />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="projects-section-footer" data-reveal="show" data-delay="dramaticPause">
                        <TypedLine text="cat more_projects.txt" {...commandLine} delay="0" />

                        <div className="projects-section-footer-content" data-reveal="show" data-delay="postCommandDelay">
                            → View all projects on{' '}
                            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="projects-section-footer-link">
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </SectionReveal>

            <style>{`

                .projects-section-container {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .projects-section-featured-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .projects-section-other-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .projects-section-card {
                    border: 1px solid rgb(var(--glow) / 0.4);
                    padding: var(--spacing-md);
                    background: rgb(var(--surface-rgb) / 0.35);
                    transition: all var(--dur-quick) var(--ease-out);
                    display: flex;
                    flex-direction: column;
                    min-height: 180px;
                }

                .projects-section-card-featured {
                    min-height: 200px;
                }

                .projects-section-card:hover {
                    border-color: var(--bright);
                    background: rgb(var(--surface-rgb) / 0.6);
                }

                .projects-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: var(--spacing-sm);
                    gap: var(--spacing-xs);
                }

                .projects-section-name {
                    font-size: var(--font-size-md);
                    font-weight: bold;
                    color: var(--text);
                    line-height: var(--line-height-tight);
                }

                .projects-section-name-small {
                    font-size: var(--font-size-sm);
                }

                .projects-section-badges {
                    display: inline-flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    justify-content: flex-end;
                }

                .projects-section-status-badge {
                    font-size: 9px;
                    padding: 3px 7px;
                    border: 1px solid;
                    flex-shrink: 0;
                    line-height: 1;
                }

                /* ls -l: hovering (or focusing into) a card prints its long-format columns */
                .projects-section-ls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0 1.2ch;
                    font-size: var(--font-size-sm);
                    color: var(--dim);
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transition: max-height var(--dur-base) var(--ease-out), opacity var(--dur-quick) var(--ease-out), margin var(--dur-base) var(--ease-out);
                }

                .projects-section-card:hover .projects-section-ls,
                .projects-section-card:focus-within .projects-section-ls {
                    max-height: 4em;
                    opacity: 1;
                    margin: 2px 0 var(--spacing-xs);
                }

                .projects-section-card:hover .projects-section-ls > *,
                .projects-section-card:focus-within .projects-section-ls > * {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .projects-section-ls-year,
                .projects-section-ls-status { color: var(--text); }
                .projects-section-ls-stack { color: var(--dim); }

                /* Touch screens have no hover: always long format */
                @media (hover: none) {
                    .projects-section-ls {
                        max-height: none;
                        opacity: 1;
                        margin: 2px 0 var(--spacing-xs);
                    }
                }

                .projects-section-description {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    color: var(--text);
                    margin: 0 0 var(--spacing-sm) 0;
                    flex-grow: 1;
                }

                .projects-section-description-small {
                    font-size: var(--font-size-xs);
                }

                .projects-section-tech-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: var(--spacing-sm);
                }

                .projects-section-tech-tag {
                    font-size: 10px;
                    padding: 3px 8px;
                    border: 1px solid rgb(var(--glow) / 0.4);
                    color: var(--dim);
                    line-height: 1;
                }

                .projects-section-tech-tag-small {
                    font-size: 9px;
                    padding: 2px 6px;
                }

                .projects-section-links {
                    display: flex;
                    flex-wrap: wrap;
                    column-gap: var(--spacing-sm);
                    row-gap: var(--spacing-xs);
                    padding-top: var(--spacing-xs);
                    border-top: 1px solid rgb(var(--glow) / 0.2);
                }

                .projects-section-link {
                    font-size: var(--font-size-xs);
                    color: var(--bright);
                    text-decoration: none;
                    white-space: nowrap;
                    transition: color var(--dur-quick) var(--ease-out);
                }

                .projects-section-link:hover {
                    color: var(--dim);
                }

                .projects-section-link-small {
                    font-size: 10px;
                }

                .projects-section-footer {
                    margin-top: var(--spacing-lg);
                }

                .projects-section-footer-content {
                    font-size: var(--font-size-sm);
                    color: var(--dim);
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                    padding-left: 4px;
                }

                .projects-section-footer-link {
                    color: var(--bright);
                    text-decoration: none;
                    border-bottom: 1px solid rgb(var(--glow) / 0.4);
                }

                .projects-section-footer-link:hover {
                    border-bottom-color: var(--bright);
                }

                @media (min-width: 768px) {
                    .projects-section-featured-row {
                        grid-template-columns: 1.5fr 1fr;
                    }

                    .projects-section-other-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .projects-section-card {
                        min-height: 200px;
                    }

                    .projects-section-card-featured {
                        min-height: 220px;
                    }

                    .projects-section-name {
                        font-size: var(--font-size-lg);
                    }

                    .projects-section-name-small {
                        font-size: var(--font-size-md);
                    }

                    .projects-section-description {
                        font-size: var(--font-size-md);
                    }

                    .projects-section-description-small {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-tech-tag {
                        font-size: 11px;
                    }

                    .projects-section-tech-tag-small {
                        font-size: 10px;
                    }

                    .projects-section-link {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-link-small {
                        font-size: var(--font-size-xs);
                    }
                }

                @media (min-width: 1024px) {
                    .projects-section-other-row {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 480px) {
                    .projects-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-card {
                        padding: var(--spacing-sm);
                        min-height: 160px;
                    }

                    .projects-section-card-featured {
                        min-height: 180px;
                    }

                    .projects-section-name {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-name-small {
                        font-size: var(--font-size-xs);
                    }

                    .projects-section-status-badge {
                        font-size: 8px;
                        padding: 2px 5px;
                    }

                    .projects-section-description {
                        font-size: var(--font-size-xs);
                    }

                    .projects-section-description-small {
                        font-size: 10px;
                    }

                    .projects-section-tech-tag {
                        font-size: 9px;
                        padding: 2px 6px;
                    }

                    .projects-section-tech-tag-small {
                        font-size: 8px;
                        padding: 2px 5px;
                    }

                    .projects-section-footer-content {
                        font-size: var(--font-size-xs);
                    }
                }
            `}</style>
        </>
    )
}