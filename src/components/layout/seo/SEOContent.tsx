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
                    Backend: Python, Node.js, Django, FastAPI, PostgreSQL. Frontend:
                    React, Next.js, TypeScript, Tailwind, Vue.js. DevOps: Docker, AWS,
                    Git, CI/CD, Linux.
                </p>
                <h3>Specializations</h3>
                <p>
                    Machine Learning Engineering, Natural Language Processing, API
                    Development, System Architecture, Data Engineering, Cloud Computing.
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
            </section>

            <section>
                <h2>Experience</h2>
                <article>
                    <h3>Senior AI Engineer — TechCorp Solutions</h3>
                    <p>2023 – Present</p>
                    <p>
                        Leading AI/ML initiatives and developing intelligent systems for
                        enterprise clients. Built NLP models achieving 94% accuracy.
                        Reduced model inference time by 60%.
                    </p>
                </article>
                <article>
                    <h3>Full Stack Developer — StartupHub Inc</h3>
                    <p>2021 – 2023</p>
                    <p>
                        Developed full-stack applications serving 100K+ users. Launched 3
                        major product features. Improved application performance by 45%.
                    </p>
                </article>
                <article>
                    <h3>Freelance Developer</h3>
                    <p>2020 – 2021</p>
                    <p>
                        Delivered custom web applications and AI solutions. Completed 15+
                        client projects with 100% satisfaction rate.
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