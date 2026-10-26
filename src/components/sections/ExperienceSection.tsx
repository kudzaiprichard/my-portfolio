// components/sections/ExperienceSection.tsx
// Server component: the full work history ships in the HTML; SectionReveal
// types the command and reveals the timeline one entry at a time.

import SectionReveal from '@/src/components/shared/reveal/SectionReveal'
import SectionShell from '@/src/components/shared/reveal/SectionShell'
import TypedLine from '@/src/components/shared/reveal/TypedLine'
import { experiences } from '@/src/content'
import GlitchText from '@/src/components/shared/GlitchText'

export default async function ExperienceSection() {
    'use cache'
    return (
        <>
            <SectionReveal
                sectionId="experience"
                title="developer@portfolio:~/experience$"
                ariaLabel="Experience section terminal — work history"
                afterComplete={<SectionShell sectionId="experience" />}
            >
                <div className="experience-section-content">
                    <TypedLine
                        text={'git log --all --author="kudzai"'}
                        className="experience-section-command-line"
                        prompt="$ "
                        promptClassName="experience-section-prompt"
                    />

                    {/* The timeline (and its line) appears with the first entry */}
                    <div className="experience-section-timeline-container" data-reveal="show">
                        <div className="experience-section-timeline-line" />

                        {experiences.map((exp, index) => (
                            <div key={exp.id} className="experience-section-item" data-reveal="show" data-delay={index === 0 ? "0" : undefined}>
                                <div className="experience-section-timeline-dot" />

                                <div className="experience-section-period-badge">
                                    <GlitchText text={exp.period} />
                                </div>

                                <div className="experience-section-role-header">
                                    <h3 className="experience-section-role-title">
                                        <GlitchText text={exp.role} />
                                    </h3>
                                    <div className="experience-section-company-name">
                                        <GlitchText text={exp.company} />
                                    </div>
                                </div>

                                <p className="experience-section-description">
                                    {exp.description}
                                </p>

                                <div className="experience-section-achievements">
                                    {exp.achievements.map((achievement, idx) => (
                                        <div key={idx} className="experience-section-achievement-item">
                                            <span className="experience-section-achievement-bullet">&gt;</span>
                                            {achievement}
                                        </div>
                                    ))}
                                </div>

                                <div className="experience-section-tech-list">
                                    {exp.technologies.map((tech) => (
                                        <span key={tech} className="experience-section-tech-tag">
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                {exp.url && (
                                    <div className="experience-section-links">
                                        <a
                                            href={exp.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="experience-section-link"
                                        >
                                            → Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </SectionReveal>

            <style>{`

                .experience-section-timeline-container {
                    position: relative;
                    padding-left: 20px;
                }

                .experience-section-timeline-line {
                    position: absolute;
                    left: 0;
                    top: 10px;
                    bottom: 10px;
                    width: 2px;
                    background: rgb(var(--glow) / 0.4);
                }

                .experience-section-item {
                    position: relative;
                    margin-bottom: var(--spacing-2xl);
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .experience-section-item:last-child {
                    margin-bottom: 0;
                }


                .experience-section-timeline-dot {
                    position: absolute;
                    left: -25px;
                    top: 8px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 2px solid var(--bright);
                    background: var(--bg);
                    box-shadow: 0 0 10px rgb(var(--glow) / 0.2);
                    transition: all var(--dur-quick) var(--ease-out);
                }

                .experience-section-item:hover .experience-section-timeline-dot {
                    background: var(--bright);
                    box-shadow: 0 0 20px rgb(var(--glow) / 0.7), 0 0 30px rgb(var(--glow) / 0.4);
                }

                .experience-section-period-badge {
                    display: inline-block;
                    padding: 4px var(--spacing-sm);
                    border: 1px solid rgb(var(--glow) / 0.4);
                    font-size: 10px;
                    margin-bottom: var(--spacing-xs);
                    color: var(--dim);
                    line-height: var(--line-height-tight);
                }

                .experience-section-role-header {
                    margin-bottom: var(--spacing-sm);
                }

                .experience-section-role-title {
                    font-size: var(--font-size-lg);
                    font-weight: bold;
                    margin: 0 0 4px 0;
                    color: var(--text);
                    line-height: var(--line-height-tight);
                }

                .experience-section-company-name {
                    font-size: var(--font-size-sm);
                    color: var(--dim);
                    line-height: var(--line-height-normal);
                }

                .experience-section-description {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    color: var(--text);
                    margin: 0 0 var(--spacing-sm) 0;
                }

                .experience-section-achievements {
                    margin-bottom: var(--spacing-sm);
                }

                .experience-section-achievement-item {
                    font-size: var(--font-size-xs);
                    color: var(--text);
                    margin-bottom: 4px;
                    padding-left: var(--spacing-sm);
                    position: relative;
                    line-height: var(--line-height-normal);
                }

                .experience-section-achievement-bullet {
                    position: absolute;
                    left: 0;
                    color: var(--dim);
                }

                .experience-section-tech-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .experience-section-tech-tag {
                    font-size: 10px;
                    padding: 3px 8px;
                    border: 1px solid rgb(var(--glow) / 0.4);
                    color: var(--dim);
                    line-height: var(--line-height-tight);
                    transition: all var(--dur-quick) var(--ease-out);
                }

                .experience-section-tech-tag:hover {
                    border-color: var(--bright);
                    background: rgb(var(--glow) / 0.05);
                }

                .experience-section-links {
                    display: flex;
                    gap: var(--spacing-md);
                    margin-top: var(--spacing-sm);
                }

                .experience-section-link {
                    font-size: var(--font-size-sm);
                    color: var(--bright);
                    text-decoration: none;
                    transition: text-shadow var(--dur-quick) var(--ease-out);
                    line-height: var(--line-height-tight);
                    text-shadow: 0 0 8px rgb(var(--glow) / 0.4);
                }

                .experience-section-link:hover {
                    text-shadow: 0 0 12px rgb(var(--glow) / 0.7);
                }

                @media (min-width: 768px) {
                    .experience-section-timeline-container {
                        padding-left: 30px;
                    }

                    .experience-section-timeline-dot {
                        left: -35px;
                        width: 12px;
                        height: 12px;
                    }

                    .experience-section-period-badge {
                        font-size: 11px;
                        padding: 3px 10px;
                    }

                    .experience-section-role-title {
                        font-size: var(--font-size-xl);
                    }

                    .experience-section-company-name {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-description {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-achievement-item {
                        font-size: var(--font-size-sm);
                    }

                    .experience-section-tech-tag {
                        font-size: 11px;
                    }
                }

                @media (max-width: 480px) {
                    .experience-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .experience-section-timeline-container {
                        padding-left: 18px;
                    }

                    .experience-section-timeline-dot {
                        left: -23px;
                        width: 8px;
                        height: 8px;
                    }

                    .experience-section-period-badge {
                        font-size: 9px;
                        padding: 3px 8px;
                    }

                    .experience-section-role-title {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-company-name {
                        font-size: var(--font-size-xs);
                    }

                    .experience-section-description {
                        font-size: var(--font-size-xs);
                    }

                    .experience-section-achievement-item {
                        font-size: 10px;
                        padding-left: 10px;
                    }

                    .experience-section-tech-tag {
                        font-size: 9px;
                        padding: 2px 6px;
                    }

                    .experience-section-item {
                        margin-bottom: var(--spacing-xl);
                    }
                }
            `}</style>
        </>
    )
}