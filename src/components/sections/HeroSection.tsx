// components/sections/HeroSection.tsx
// Server component: the hero's final text ships in the HTML; SectionReveal
// types the commands and reveals each output.

import SectionReveal from '@/src/components/shared/reveal/SectionReveal'
import SectionShell from '@/src/components/shared/reveal/SectionShell'
import TypedLine from '@/src/components/shared/reveal/TypedLine'
import GlitchText from '@/src/components/shared/GlitchText'
import CvLink from '@/src/components/shared/CvLink'
import { owner } from '@/src/content'

const commandLine = {
    className: 'hero-section-command-line hero-section-fade-in',
    prompt: '$ ',
    promptClassName: 'hero-section-prompt',
}

export default async function HeroSection() {
    'use cache'
    return (
        <>
            <SectionReveal
                sectionId="hero"
                title="developer@portfolio:~$"
                ariaLabel="Hero section terminal — introduction"
                afterComplete={<SectionShell sectionId="hero" />}
            >
                <div className="hero-section-content">
                    <TypedLine text="whoami" {...commandLine} />

                    <div className="hero-section-output-block hero-section-fade-in-smooth" data-reveal="show">
                        <h1 className="hero-section-name">
                            <GlitchText text={owner.name} />
                        </h1>
                    </div>

                    <TypedLine text="cat role.txt" {...commandLine} />

                    <div className="hero-section-output-block hero-section-fade-in-smooth" data-reveal="show">
                        <h2 className="hero-section-role">
                            <GlitchText text={owner.title} />
                        </h2>
                    </div>

                    <TypedLine text="cat description.txt" {...commandLine} />

                    <div className="hero-section-description-section hero-section-fade-in-smooth-delayed" data-reveal="show">
                        <p className="hero-section-description-text">
                            <GlitchText text={owner.description.join(' ')} />
                        </p>
                        <div className="hero-section-tech-pills">
                            {owner.stack.map(tech => (
                                <span key={tech} className="hero-section-tech-pill">{tech}</span>
                            ))}
                        </div>
                        <div className="hero-section-cta">
                            <CvLink className="hero-section-cv" />
                        </div>
                    </div>
                </div>
            </SectionReveal>

            <style>{`

                .hero-section-command-line {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-xs);
                    line-height: var(--line-height-normal);
                }

                .hero-section-cta {
                    margin-top: var(--spacing-md);
                }

                .hero-section-cv {
                    display: inline-block;
                    padding: 6px 14px;
                    border: 1px solid var(--bright);
                    color: var(--bright);
                    text-decoration: none;
                    font-size: var(--font-size-sm);
                }

                .hero-section-cv:hover,
                .hero-section-cv:focus-visible {
                    background: rgb(var(--glow) / 0.12);
                }

                .hero-section-name {
                    font-family: var(--font-display);
                    letter-spacing: 0.02em;
                    font-size: calc(var(--font-size-2xl) * 1.4);
                    font-weight: normal;
                    color: var(--bright);
                    display: inline;
                    margin: 0;
                    line-height: var(--line-height-tight);
                }

                .hero-section-role {
                    font-size: var(--font-size-lg);
                    font-weight: normal;
                    color: var(--text);
                    margin: 0;
                    display: inline;
                    line-height: var(--line-height-tight);
                }

                .hero-section-description-section {
                    margin-top: var(--spacing-md);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid rgb(var(--glow) / 0.2);
                }

                .hero-section-description-text {
                    font-size: var(--font-size-md);
                    color: var(--text);
                    line-height: var(--line-height-relaxed);
                    margin: 0 0 var(--spacing-md) 0;
                    text-align: justify;
                }

                .hero-section-tech-pills {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs);
                }

                .hero-section-tech-pill {
                    font-size: var(--font-size-sm);
                    font-family: var(--font-mono);
                    color: var(--dim);
                    border: 1px solid rgb(var(--glow) / 0.2);
                    padding: 2px var(--spacing-xs);
                    border-radius: 2px;
                }

                .hero-section-fade-in {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .hero-section-fade-in-smooth {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .hero-section-fade-in-smooth-delayed {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                @media (min-width: 768px) {
                    .hero-section-name {
                        font-size: calc(var(--font-size-3xl) * 1.4);
                    }

                    .hero-section-role {
                        font-size: var(--font-size-xl);
                    }

                    .hero-section-description-text {
                        font-size: var(--font-size-lg);
                    }
                }

                @media (max-width: 480px) {
                    .hero-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .hero-section-name {
                        font-size: var(--font-size-xl);
                    }

                    .hero-section-role {
                        font-size: var(--font-size-md);
                    }

                    .hero-section-description-text {
                        font-size: var(--font-size-sm);
                        line-height: var(--line-height-normal);
                    }

                    .hero-section-tech-pill {
                        font-size: var(--font-size-xs);
                    }
                }
            `}</style>
        </>
    )
}