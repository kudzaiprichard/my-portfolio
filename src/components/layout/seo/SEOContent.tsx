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
                <h1>Kudzai Prichard — AI &amp; Full Stack Software Developer</h1>
                <p>
                    Building intelligent systems and production-grade applications.
                    Specializing in machine learning, backend architecture, and modern
                    full-stack development with Python, Java, and TypeScript.
                </p>
            </header>

            <section>
                <h2>About</h2>
                <p>
                    Software developer focused on building AI-powered systems and scalable
                    full-stack applications. Experienced in designing end-to-end solutions
                    from machine learning model development through production deployment,
                    combining robust backend engineering with modern frontend frameworks.
                </p>
                <h3>Technical Skills</h3>
                <p>
                    AI/ML: PyTorch, TensorFlow, Scikit-learn, Pandas, NumPy, Contextual Bandits,
                    Neural Networks, Thompson Sampling, NLP, OCR, Hugging Face, Google Gemini.
                    Backend: Python, Java, TypeScript, FastAPI, Spring Boot, Flask, Django,
                    Node.js, PostgreSQL, Redis, REST APIs.
                    Frontend: Next.js, React, Angular, Vue.js, TypeScript, Tailwind CSS.
                    Mobile: Flutter, Dart.
                    DevOps: Docker, AWS, Git, CI/CD, Linux, Vercel, Windows Services.
                </p>
                <h3>Specializations</h3>
                <p>
                    Machine Learning Engineering, Reinforcement Learning, Contextual Bandits,
                    Natural Language Processing, Optical Character Recognition,
                    Full Stack Web Development, API Architecture, System Design,
                    Data Engineering, Cloud Deployment, Mobile Application Development.
                </p>
            </section>

            <section>
                <h2>Projects</h2>
                <article>
                    <h3>DiabetesML — Type 2 Diabetes Treatment Optimization</h3>
                    <p>
                        AI-powered clinical decision support system using Neural Contextual Bandits
                        with Thompson Sampling to recommend personalized Type 2 Diabetes treatments.
                        Features a PyTorch neural network backbone for reward prediction, Bayesian
                        posterior updates for uncertainty-aware recommendations, built-in clinical
                        safety checks and contraindication detection, LLM-powered explanations
                        via Google Gemini, and a full-stack deployment with FastAPI backend and
                        Next.js frontend.
                    </p>
                </article>
                <article>
                    <h3>FreightFlow — Intelligent Logistics Optimization Platform</h3>
                    <p>
                        End-to-end freight management system with route optimization using
                        graph algorithms and real-time shipment tracking. Built with a Spring Boot
                        microservices backend, Angular dashboard for dispatchers, and a Flutter
                        driver app with live GPS updates. Integrates PostgreSQL for transactional
                        data, Redis for caching active routes, and WebSocket connections for
                        real-time fleet monitoring across multiple warehouses.
                    </p>
                </article>
                <article>
                    <h3>DocIntel — AI Document Processing Pipeline</h3>
                    <p>
                        Automated document intelligence platform combining OCR, named entity
                        recognition, and classification to extract structured data from
                        unstructured documents. Features a FastAPI orchestration layer,
                        TensorFlow-based document classifier, Tesseract OCR with custom
                        pre-processing, and a Next.js review interface where users verify
                        and correct extractions that feed back into model retraining.
                    </p>
                </article>
                <article>
                    <h3>SentinelAPI — Adaptive Rate Limiting &amp; Threat Detection Gateway</h3>
                    <p>
                        API gateway with machine learning-driven anomaly detection that
                        identifies and mitigates abusive traffic patterns in real time.
                        Built with Python and FastAPI, using Scikit-learn isolation forests
                        for request fingerprinting, Redis sliding window counters for rate
                        limiting, and a React admin dashboard with live threat visualizations
                        powered by WebSocket streams and Recharts.
                    </p>
                </article>
                <article>
                    <h3>CropCast — Precision Agriculture Yield Predictor</h3>
                    <p>
                        Machine learning platform for smallholder farmers that predicts
                        crop yields using satellite imagery, soil data, and weather patterns.
                        Features a PyTorch vision model for NDVI analysis, a Flask REST API
                        serving predictions, PostgreSQL with PostGIS for geospatial queries,
                        and an Angular frontend with interactive map-based field management
                        and season-over-season analytics.
                    </p>
                </article>
                <article>
                    <h3>CodeReview AI — Automated Pull Request Analyzer</h3>
                    <p>
                        Developer productivity tool that analyzes pull requests for code quality,
                        security vulnerabilities, and architectural consistency using LLM-powered
                        static analysis. Built with a FastAPI backend integrating Google Gemini
                        for contextual code review, a Spring Boot webhook service for GitHub
                        and GitLab integration, and a Next.js dashboard tracking code health
                        metrics, review history, and team-level quality trends over time.
                    </p>
                </article>
            </section>

            <section>
                <h2>Experience</h2>
                <article>
                    <h3>AI &amp; ML Engineer Intern — Sybrin | Imaging Solutions</h3>
                    <p>1 Year</p>
                    <p>
                        Engineered and shipped a production OCR system in C# that automated
                        document data extraction across enterprise clients, eliminating hours
                        of manual processing per day. Architected and deployed Windows Services
                        handling background document ingestion, queue management, and automated
                        retry logic for fault-tolerant processing pipelines. Built real-time
                        analytical dashboards exposing throughput metrics, error rates, and
                        processing bottlenecks that directly informed infrastructure scaling
                        decisions. Led technical demos to clients and stakeholders, translating
                        complex AI pipeline internals into clear business value propositions
                        that contributed to contract renewals.
                    </p>
                </article>
                <article>
                    <h3>Full Stack Software Developer Intern — Replica Systems</h3>
                    <p>6 Months</p>
                    <p>
                        Sole developer on a full-stack site management platform serving multiple
                        client properties, built from scratch with Angular on the web, Flutter
                        for cross-platform mobile, Spring Boot powering the REST API layer, and
                        PostgreSQL for persistent storage. Designed and deployed the company&apos;s
                        official website and several client-facing production sites, owning
                        everything from database schema design and API architecture through
                        frontend implementation and deployment. Worked directly with clients
                        to gather requirements, iterate on feedback, and ship features on
                        tight deadlines across the full development lifecycle.
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