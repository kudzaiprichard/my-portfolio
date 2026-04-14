// src/components/layout/SEOContent.tsx

import { owner, contact, skillCategories, specializations, projects, experiences } from '@/src/content'

export default function SEOContent() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0,
            }}
        >
            <header>
                <h1>{owner.fullName} — {owner.title}</h1>
                <p>
                    Also known as {owner.aliases.join(', ')}.
                </p>
                <p>
                    {owner.description.join(' ')}
                </p>
            </header>

            <section>
                <h2>About</h2>
                <p>
                    {owner.fullName} is a software developer focused on building
                    AI-powered systems and scalable full-stack applications. Experienced in
                    designing end-to-end solutions from machine learning model development
                    through production deployment, combining robust backend engineering with
                    modern frontend frameworks.
                </p>
                <h3>Technical Skills</h3>
                <p>
                    {skillCategories.map(c => `${c.title}: ${c.technologies.join(', ')}`).join('. ')}.
                </p>
                <h3>Specializations</h3>
                <p>
                    {specializations.join(', ')}.
                </p>
            </section>

            <section>
                <h2>Projects</h2>
                {projects.map((project) => (
                    <article key={project.id}>
                        <h3>{project.name}</h3>
                        <p>
                            {project.description}
                            {' '}Technologies: {project.technologies.join(', ')}.
                        </p>
                    </article>
                ))}
            </section>

            <section>
                <h2>Experience</h2>
                {experiences.map((exp) => (
                    <article key={exp.id}>
                        <h3>{exp.role} — {exp.company.replace('@ ', '')}</h3>
                        <p>{exp.period}</p>
                        <p>
                            {exp.description}
                            {' '}{exp.achievements.join('. ')}.
                        </p>
                    </article>
                ))}
            </section>

            <section>
                <h2>Contact</h2>
                <p>
                    Contact {owner.fullName} for software development,
                    AI/ML engineering, or full-stack project inquiries.
                </p>
                <p>Email: {contact.email}</p>
                <nav>
                    <a href={contact.githubUrl}>GitHub</a>
                    <a href={contact.linkedinUrl}>LinkedIn</a>
                    <a href={contact.twitterUrl}>Twitter</a>
                </nav>
            </section>
        </div>
    )
}
