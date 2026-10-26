// components/sections/AboutSection.tsx
// Server component: bio, skills and specializations ship in the HTML;
// SectionReveal types the commands and reveals each output.

import SectionReveal from '@/src/components/shared/reveal/SectionReveal'
import SectionShell from '@/src/components/shared/reveal/SectionShell'
import TypedLine from '@/src/components/shared/reveal/TypedLine'
import { owner, skillCategories, specializations } from '@/src/content'
import GlitchText from '@/src/components/shared/GlitchText'

const commandLine = {
    className: 'about-section-command-line about-section-fade-in',
    prompt: '$ ',
    promptClassName: 'about-section-prompt',
}

export default async function AboutSection() {
    'use cache'
    return (
        <>
            <SectionReveal
                sectionId="about"
                title="developer@portfolio:~/skills$"
                ariaLabel="About section terminal — skills and technologies"
                afterComplete={<SectionShell sectionId="about" />}
            >
                <div className="about-section-content">
                    <TypedLine text="cat about.txt" {...commandLine} />

                    <div className="about-section-output-block about-section-fade-in-smooth" data-reveal="show">
                        <p className="about-section-bio-text">
                            {owner.about.map((part, i) => part.highlight
                                ? <span key={i} className="about-section-highlight"><GlitchText text={part.text} /></span>
                                : part.text)}
                        </p>
                    </div>

                    <TypedLine text="ls -la ./tech_stack/" {...commandLine} />

                    <div className="about-section-output-block about-section-fade-in-smooth" data-reveal="show">
                        <div className="about-section-skills-grid">
                            {skillCategories.map((category) => (
                                <div key={category.title} className="about-section-skill-category">
                                    <div className="about-section-category-title">
                                        <span className="about-section-category-icon">{category.icon}</span>
                                        <GlitchText text={category.title} />
                                    </div>
                                    <div className="about-section-tech-stack">
                                        {category.technologies.map((tech) => (
                                            <span key={tech} className="about-section-tech-badge">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <TypedLine text="./list_specializations.sh" {...commandLine} />

                    <div className="about-section-output-block about-section-output-block-compact about-section-fade-in-smooth" data-reveal="show">
                        <div className="about-section-spec-grid">
                            {specializations.map((spec) => (
                                <span key={spec} className="about-section-spec-item">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionReveal>

            <style>{`
                .about-section-content {
                    color: var(--text);
                }

                .about-section-command-line {
                    color: var(--text);
                    font-size: var(--font-size-md);
                    font-family: var(--font-mono);
                    margin-bottom: var(--spacing-xs);
                    line-height: var(--line-height-normal);
                }

                .about-section-output-block-compact {
                    margin-bottom: var(--spacing-md);
                }

                .about-section-highlight {
                    color: var(--text);
                    font-weight: 600;
                }

                .about-section-bio-text {
                    font-size: var(--font-size-md);
                    color: var(--text);
                    line-height: var(--line-height-relaxed);
                    margin: 0;
                }

                .about-section-fade-in {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .about-section-fade-in-smooth {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .about-section-skills-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .about-section-skill-category {
                    background: rgb(var(--glow) / 0.05);
                    border: 1px solid rgb(var(--glow) / 0.2);
                    padding: var(--spacing-md);
                    border-radius: 4px;
                    transition: all var(--dur-quick) var(--ease-out);
                }

                .about-section-skill-category:hover {
                    background: rgb(var(--glow) / 0.08);
                    border-color: rgb(var(--glow) / 0.4);
                    transform: translateY(-2px);
                }

                .about-section-category-title {
                    font-size: var(--font-size-md);
                    font-weight: bold;
                    margin-bottom: var(--spacing-sm);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    line-height: var(--line-height-tight);
                }

                .about-section-category-icon {
                    font-size: var(--font-size-lg);
                }

                .about-section-tech-stack {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs);
                }

                .about-section-tech-badge {
                    background: rgb(var(--glow) / 0.1);
                    border: 1px solid rgb(var(--glow) / 0.3);
                    padding: 4px 10px;
                    border-radius: 3px;
                    font-size: var(--font-size-xs);
                    line-height: var(--line-height-tight);
                    transition: all var(--dur-quick) var(--ease-out);
                }

                .about-section-tech-badge:hover {
                    background: rgb(var(--glow) / 0.15);
                    transform: translateY(-1px);
                }

                .about-section-spec-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 6px;
                }

                .about-section-spec-item {
                    padding: 6px 10px;
                    background: rgb(var(--glow) / 0.05);
                    border-left: 2px solid rgb(var(--glow) / 0.4);
                    font-size: var(--font-size-xs);
                    line-height: var(--line-height-tight);
                    transition: all var(--dur-quick) var(--ease-out);
                }

                .about-section-spec-item:hover {
                    background: rgb(var(--glow) / 0.08);
                    border-left-color: var(--bright);
                }

                @media (min-width: 480px) {
                    .about-section-spec-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-spec-item {
                        font-size: 11px;
                        padding: 7px 10px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }

                @media (min-width: 600px) {
                    .about-section-spec-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (min-width: 768px) {
                    .about-section-skills-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-skill-category {
                        padding: 16px;
                    }

                    .about-section-tech-badge {
                        padding: 5px 10px;
                    }

                    .about-section-spec-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }

                    .about-section-spec-item {
                        font-size: var(--font-size-sm);
                        padding: 8px 12px;
                    }
                }

                @media (min-width: 1024px) {
                    .about-section-skills-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-skill-category {
                        padding: 18px;
                    }
                }

                @media (max-width: 480px) {
                    .about-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-bio-text {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-category-title {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-category-icon {
                        font-size: var(--font-size-md);
                    }

                    .about-section-skill-category {
                        padding: 12px;
                    }

                    .about-section-tech-badge {
                        padding: 3px 8px;
                        font-size: 10px;
                    }

                    .about-section-spec-item {
                        padding: 5px 8px;
                        font-size: 10px;
                    }
                }
            `}</style>
        </>
    )
}