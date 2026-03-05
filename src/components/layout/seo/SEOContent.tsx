// src/components/layout/SEOContent.tsx

export default function SEOContent() {
    const email = process.env.NEXT_PUBLIC_EMAIL || 'kudzai@example.com'
    const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/kudzaiprichard'
    const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/kudzaiprichard'
    const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/kudzaiprichard'

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
                <h1>Kudzai Prichard — AI &amp; Full Stack Developer</h1>
                <p>
                    Building intelligent systems and scalable applications.
                    Specializing in AI/ML, backend architecture, and modern web
                    technologies. Transforming complex problems into elegant solutions.
                </p>
            </header>

            <section>
                <h2>About</h2>
                <p>
                    Passionate developer with expertise in artificial intelligence and
                    full-stack development. Combines cutting-edge AI technologies with
                    robust backend systems to create innovative solutions. Committed to
                    writing clean, efficient code and staying current with emerging
                    technologies.
                </p>
                <h3>Technical Skills</h3>
                <p>
                    AI/ML: TensorFlow, PyTorch, Scikit-learn, OpenAI, Hugging Face.
                    Backend: Python, Node.js, Django, FastAPI, PostgreSQL, Spring Boot, C#. Frontend:
                    React, Next.js, TypeScript, Tailwind, Vue.js, Angular. Mobile: Flutter.
                    DevOps: Docker, AWS, Git, CI/CD, Linux, Windows Services.
                </p>
                <h3>Specializations</h3>
                <p>
                    Machine Learning Engineering, Natural Language Processing, Optical Character Recognition,
                    API Development, System Architecture, Data Engineering, Cloud Computing,
                    Full Stack Web Development, Mobile Application Development.
                </p>
            </section>

            <section>
                <h2>Projects</h2>
                <article>
                    <h3>AI ChatBot Platform</h3>
                    <p>
                        Enterprise conversational AI platform powered by GPT-4 with
                        context-aware responses, multi-language support, and custom
                        training capabilities.
                    </p>
                </article>
                <article>
                    <h3>ML Image Classifier</h3>
                    <p>
                        Deep learning model for image classification with 96% accuracy
                        using transfer learning and real-time inference API.
                    </p>
                </article>
                <article>
                    <h3>E-Commerce Dashboard</h3>
                    <p>
                        Full-stack admin dashboard with real-time analytics, inventory
                        management, and automated reporting.
                    </p>
                </article>
                <article>
                    <h3>Real-Time Chat App</h3>
                    <p>
                        WebSocket-based messaging application with end-to-end encryption
                        and Redis caching.
                    </p>
                </article>
                <article>
                    <h3>Task Automation Bot</h3>
                    <p>
                        Python automation bot integrating with Slack, Email, and Calendar
                        APIs saving 10+ hours per week.
                    </p>
                </article>
                <article>
                    <h3>Site Management System — Replica Systems</h3>
                    <p>
                        Full-stack site management system built with Angular frontend,
                        Flutter mobile app, Spring Boot backend, and PostgreSQL database.
                        Delivered end-to-end from development through deployment.
                    </p>
                </article>
                <article>
                    <h3>OCR Engine — Sybrin</h3>
                    <p>
                        Optical Character Recognition system developed and deployed using C#,
                        enabling automated document processing as part of Sybrin&apos;s imaging solutions platform.
                    </p>
                </article>
            </section>

            <section>
                <h2>Experience</h2>
                <article>
                    <h3>AI &amp; ML Intern — Sybrin | Imaging Solutions</h3>
                    <p>1 Year</p>
                    <p>
                        Worked on AI and machine learning initiatives within an enterprise imaging solutions environment.
                        Developed and deployed an Optical Character Recognition (OCR) system using C#.
                        Built and maintained Windows Services for background processing and automation.
                        Created analytical dashboards to surface key business and system metrics.
                        Participated in client meetings, presented demos, and communicated technical solutions to stakeholders.
                    </p>
                </article>
                <article>
                    <h3>Software Developer Intern — Replica Systems</h3>
                    <p>6 Months</p>
                    <p>
                        Developed and deployed multiple production websites including the official company website
                        and client-facing sites. Built a full-stack site management system using Angular for the
                        web frontend, Flutter for the mobile application, Spring Boot for the backend API, and
                        PostgreSQL as the database. Gained hands-on experience across the full software development lifecycle.
                    </p>
                </article>
            </section>

            <section>
                <h2>Contact</h2>
                <p>Email: {email}</p>
                <nav>
                    <a href={githubUrl}>GitHub</a>
                    <a href={linkedinUrl}>LinkedIn</a>
                    <a href={twitterUrl}>Twitter</a>
                </nav>
            </section>
        </div>
    )
}