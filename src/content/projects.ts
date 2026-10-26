// content/projects.ts

interface ProjectMedia {
    /** Image or GIF from the project's own repository (or public/projects/) */
    src: string
    alt: string
    width: number
    height: number
}

export interface Project {
    id: string
    /** URL segment: /projects/<slug>, and the terminal's projects/<slug>/ */
    slug: string
    name: string
    status?: 'LIVE' | 'BETA' | 'WIP'
    /** A second badge for where the project came from, e.g. a hackathon */
    event?: string
    description: string
    technologies: string[]
    /** Public source repository; omitted when the source is private */
    githubUrl?: string
    liveUrl?: string
    /** Installers: each link points at the latest release, so it never goes stale */
    downloads?: { label: string; url: string }[]
    /** schema.org applicationCategory, for projects with installers */
    appCategory?: 'EducationalApplication' | 'MultimediaApplication' | 'DeveloperApplication'
    /** Year the project started */
    year?: number
    /** The problem it solves (from the project's README) */
    problem: string
    /** What was built */
    built: string[]
    /** One measured result, where the project has one, and where it comes from */
    result?: { text: string; source?: string }
    media?: ProjectMedia
}

const raw = (repo: string, path: string) => `https://raw.githubusercontent.com/kudzaiprichard/${repo}/main/${path}`
const latest = (repo: string) => `https://github.com/kudzaiprichard/${repo}/releases/latest`

export const projects: Project[] = [
    {
        id: 'whiteboard-studio',
        slug: 'whiteboard-studio',
        name: 'Whiteboard Studio',
        status: 'BETA',
        description: 'Desktop studio for whiteboard animation videos, where a hand draws onto the board in time with a voiceover, with a full MCP server so an AI agent can produce a finished, narrated film without touching the interface. Natural offline narration with word timings, code-generated drawings, a reusable cast, camera moves and MP4 export up to 4K.',
        technologies: ['TypeScript', 'Electron', 'React', 'MCP', 'Kokoro TTS', 'SQLite', 'Vitest'],
        downloads: [{ label: 'Windows installer', url: latest('whiteboard-studio-releases') }],
        appCategory: 'MultimediaApplication',
        problem: 'Whiteboard explainer videos teach well, but making one means drawing, animating and timing every element to a voiceover by hand, and most tools end up looking like clipart.',
        built: [
            'A drawing engine where every element enters by being drawn: a pen that lifts, arcs and slows into corners, variable-width strokes, translucent ink and a lit, grained board, so the result looks hand-made.',
            'An MCP server that exposes every feature as a tool: an agent creates the project, composes new drawings, defines a cast, records narration, moves the camera, looks at rendered frames and exports the film.',
            'Free, offline narration in a natural voice (Kokoro, twelve voices) with exact word timings; one click retimes every drawing to finish on its sentence. ElevenLabs is optional.',
            'Forty code-generated drawings, a cast defined once and drawn the same way in every scene, and a library of 9,000+ licensed drawings, with a licence required at import and a credits file in every export.',
            'MP4 export at 1080p30, 1080p60, 4K, square and vertical, encoded in the browser engine with no ffmpeg; a pure, deterministic renderer checked by golden-frame regression tests.',
            'It powers OurAfrica Course Studio, which turns course outlines into narrated lesson videos automatically.',
        ],
        media: { src: '/projects/whiteboard-studio.gif', alt: 'A scene from “The Snowball”, a compound-interest explainer made in Whiteboard Studio, being drawn onto the board', width: 800, height: 450 },
        year: 2026,
    },
    {
        id: 'anvil',
        slug: 'anvil',
        name: 'Anvil',
        status: 'BETA',
        description: 'Offline-first desktop app for coding-interview and DSA practice. A guided course of 8 stages, 19 units and 62 lessons with animated diagrams and pattern drills, then real problems run in a sandboxed local runtime and judged against 3,000+ oracle-verified test packs. No account, no network, no AI crutch.',
        technologies: ['Rust', 'Tauri 2', 'Next.js', 'React', 'TypeScript', 'SQLite', 'CodeMirror'],
        githubUrl: 'https://github.com/kudzaiprichard/anvil',
        downloads: [{ label: 'Windows, macOS & Linux', url: latest('anvil-releases') }],
        appCategory: 'EducationalApplication',
        problem: 'Interview-prep sites hand you a wall of random problems and an AI helper that does the thinking, so the pattern recognition an in-person interview tests never gets built.',
        built: [
            'A mastery-gated course: each lesson teaches one sub-pattern with trigger signals, an interactive prediction diagram, a worked example and faded practice.',
            'Unlabeled pattern-picker drills, and mastery gates of unseen problems solved hint-free under a soft timer before the next unit unlocks.',
            'A Rust sandbox that runs Python and JavaScript in an isolated subprocess with a timeout, a memory cap and temp-dir isolation (Job Objects on Windows); user code never runs in the WebView.',
            'Judging with no hand-typed answer keys: expected outputs come from reference solutions cross-checked in Python, JavaScript and a brute-force oracle, so a wrong solution cannot pass.',
            'FSRS spaced review on the device, a graduated hint ladder and deterministic complexity feedback from operation counts.',
            'Installers for Windows, macOS (Apple Silicon and Intel) and Linux, released from signed tags; MIT-licensed.',
        ],
        media: { src: raw('anvil', '.github/assets/demo.gif'), alt: 'Anvil in action: a guided lesson, the code editor and local test results', width: 800, height: 450 },
        year: 2026,
    },
    {
        id: 'metis',
        slug: 'metis',
        name: 'METIS',
        status: 'WIP',
        description: 'B.Sc. thesis. Clinical AI backend deploying a Neural Thompson Sampling model (PyTorch) as a REST API for real-time treatment recommendations. Model inference, clinician feedback ingestion, and posterior updates are handled by a FastAPI service backed by PostgreSQL and Neo4j — with deterministic safety gates enforced at the API layer before any model output is returned.',
        technologies: ['Python', 'PyTorch', 'FastAPI', 'PostgreSQL', 'Neo4j', 'Next.js', 'React'],
        githubUrl: 'https://github.com/kudzaiprichard/metis',
        problem: 'Type-2 diabetes guidelines give general rules, but the best medication for a specific patient is often unclear: dozens of clinical features interact.',
        built: [
            'A Neural Thompson Sampling contextual bandit (PyTorch) that recommends one of five therapies — Metformin, GLP-1 RA, SGLT-2i, DPP-4i, Insulin — with a calibrated confidence and a runner-up.',
            'A deterministic safety gate after the model that overrides contraindicated choices (for example Metformin below eGFR 30), with the pre-override choice kept for audit.',
            'A FastAPI service backed by PostgreSQL and a Neo4j cohort that finds the most similar historical patients.',
            'Clinician decisions (accepted or overridden) stored as feedback and replayed to update the model online.',
        ],
        media: { src: raw('metis', 'docs/demo.gif'), alt: 'The Metis similar-patients graph: matched historical cases laid out by treatment and outcome, with a per-treatment outcome rollup', width: 800, height: 450 },
        year: 2026,
    },
    {
        id: 'aura',
        slug: 'aura',
        name: 'AURA',
        status: 'WIP',
        description: 'Phishing and fraud detector that keeps learning from analyst feedback. A FastAPI backend handles inference, drift monitoring, a hot-swap model registry and online retraining; a Chrome extension delivers real-time verdicts inside Gmail; a Next.js analyst dashboard manages the review and redeployment cycle — all connected through a PostgreSQL-backed audit trail.',
        technologies: ['Python', 'FastAPI', 'scikit-learn', 'PostgreSQL', 'Next.js', 'TypeScript', 'Docker'],
        githubUrl: 'https://github.com/kudzaiprichard/aura',
        problem: 'Phishing emails reach the inbox, and a detection model that never hears whether it was right slowly goes stale.',
        built: [
            'A FastAPI backend that handles inference, model versioning and online retraining from analyst feedback.',
            'Drift monitoring, and a hot-swap model registry so a retrained model replaces the live one without downtime.',
            'A Chrome extension that shows real-time verdicts inside Gmail.',
            'A Next.js analyst dashboard for the review and redeployment cycle.',
            'A PostgreSQL-backed audit trail connecting all three.',
        ],
    },
    {
        id: 'indabax-2026',
        slug: 'loan-default-prediction',
        name: 'IndabaX 2026: Loan Default',
        event: 'HACKATHON',
        description: 'Deep Learning IndabaX Zimbabwe 2026 hackathon (AI for financial inclusion): predicting loan default in Zimbabwe\'s banking sector. Adversarial validation showed train and test were 91.5% separable, so the work focused on a shift-robust LightGBM / CatBoost / XGBoost ensemble tuned over 50+ cloud experiments on Modal.',
        technologies: ['Python', 'LightGBM', 'CatBoost', 'XGBoost', 'Optuna', 'PyTorch', 'Modal'],
        githubUrl: 'https://github.com/kudzaiprichard/loan-default-prediction',
        problem: 'The Deep Learning IndabaX Zimbabwe 2026 hackathon challenge: predict which loans in Zimbabwe\'s banking sector will default, when the test data comes from a different time period than the training data, so ordinary validation scores are optimistic.',
        built: [
            'Adversarial validation first: a classifier trained only to tell training rows from test rows reached AUC 0.915, revealing a strong temporal distribution shift before any model was trained.',
            'A shift-robust ensemble of LightGBM, CatBoost and XGBoost, with frozen 10-fold stratified splits shared across every experiment.',
            '50+ experiments and 1,398 Optuna trials run as a cloud pipeline on Modal (A10G GPU and a 16-core CPU), for about $30 of compute in total.',
            'Reproducible locally in about 15 minutes, with no GPU required.',
        ],
        result: { text: 'Public leaderboard AUC 0.6840; private leaderboard AUC 0.6878.', source: 'Competition leaderboard, as reported in the project README' },
        year: 2026,
    },
    {
        id: 'sentinel',
        slug: 'sentinel',
        name: 'Sentinel',
        description: 'Police intelligence platform built on computer vision and machine learning: InsightFace face recognition across photos and video, DBSCAN crime-hotspot detection on real map coordinates, Gemini-written crime analysis, a missing-persons register, and SMS and email alerts.',
        technologies: ['Python', 'InsightFace', 'OpenCV', 'scikit-learn', 'PostgreSQL', 'pgvector', 'Gemini', 'Flask'],
        githubUrl: 'https://github.com/kudzaiprichard/sentinel',
        problem: 'Investigators work across separate records, photos and maps, so matching a face to a known suspect or seeing where crimes cluster is slow, manual work.',
        built: [
            'Face recognition with InsightFace (buffalo_l): CLAHE, normalisation and gamma preprocessing, a quality score from size, blur, orientation and lighting, and original plus aligned embeddings stored in pgvector.',
            'Matching by a blend of cosine and Euclidean similarity on L2-normalised embeddings, with a strict default threshold.',
            'Video search: sampled frames, optional DeepSORT tracking and DBSCAN clustering to find each unique person and keep their best frame.',
            'Hotspot detection with DBSCAN over haversine distance (2 km radius, at least 3 incidents), clustered per crime type and ranked from low to critical.',
            'Gemini-generated analysis summaries and recommendations, Twilio SMS and email alerts, role-based access and recoverable (soft) deletes.',
        ],
        media: { src: raw('sentinel', 'docs/imgs/Architecture-Overview.png'), alt: 'Sentinel architecture overview from the project README', width: 5397, height: 2697 },
        year: 2025,
    },
    {
        id: 'ourafrica',
        slug: 'ourafrica',
        name: 'OurAfrica',
        status: 'LIVE',
        description: 'Offline-first learning platform for Africa, shipped as three apps on one API: a web app, a desktop app for Windows, macOS and Linux, and a native Android app. Learners download a course, study for days with no connection, and sync progress, quizzes and certificates when they are back online.',
        technologies: ['Spring Boot', 'Next.js', 'Tauri', 'Rust', 'Kotlin', 'Jetpack Compose', 'PostgreSQL', 'AWS'],
        liveUrl: 'https://ourafrica.co.zw',
        downloads: [
            { label: 'Android APK', url: 'https://github.com/kudzaiprichard/ourafrica-android-releases/releases/latest/download/ourafrica-android.apk' },
            { label: 'Desktop apps', url: latest('ourafrica-releases') },
        ],
        appCategory: 'EducationalApplication',
        problem: 'Learners across Africa often pay a lot for slow, unreliable data, and most learning platforms assume a fast connection that is always there.',
        built: [
            'Download-and-study offline on every client: encrypted course storage (AES-GCM on desktop, SQLCipher on Android) and a sync queue that uploads progress and quiz attempts when the device is back online.',
            'Downloads sized for mobile data: 480p, 720p and 1080p video renditions, delivery from the CloudFront edge, parallel chunked downloads with resume, and Wi-Fi-only controls.',
            'Course packages and app updates signed with Ed25519, so the apps verify what they install without reaching the server; desktop and Android update themselves.',
            'Certificates, multi-course programs, gamification, and organisation workspaces with a relevance engine that suggests the courses each team needs.',
            'AI course production: a course-builder MCP server and Course Studio, which uses Whiteboard Studio for narrated lesson videos and Amazon Transcribe for captions.',
        ],
        media: { src: '/projects/ourafrica.png', alt: 'OurAfrica: education without borders, barriers, or limits. Offline-first, with certificates that travel', width: 1200, height: 630 },
        year: 2025,
    },
    {
        id: 'ubot-mt4',
        slug: 'ubot-mt4',
        name: 'UBot MT4',
        status: 'LIVE',
        description: 'Automated trading system (Expert Advisor) built in MQL4 for MetaTrader 4. Analyses historical market data to identify patterns and executes long and short trades autonomously — with configurable stop loss, take profit, position scaling, and trailing profit management. Includes a real-time dashboard and compiles to a deployable .ex4 binary.',
        technologies: ['MQL4', 'MetaTrader 4', 'Algorithmic Trading', 'Expert Advisor'],
        githubUrl: 'https://github.com/kudzaiprichard/ubot-mt4',
        problem: 'Following a trading strategy by hand is slow and inconsistent; an automated system can apply the same rules to every tick.',
        built: [
            'An Expert Advisor in MQL4 for MetaTrader 4 that analyses market history for patterns and opens, scales and closes long and short trades on its own.',
            'Configurable stop loss, take profit, position scaling and trailing profit.',
            'A live on-chart dashboard (symbol, bid, ask, spread), compiled to a deployable .ex4.',
        ],
        result: { text: 'In the MetaTrader strategy tester (every-tick model), the backtest balance roughly doubles, from about 500 to about 990, over about 44 trades.', source: 'Backtest report chart in the UBot repository' },
        media: { src: raw('ubot-mt4', 'images/Screenshot.png'), alt: 'UBot running in the MetaTrader 4 strategy tester on the US Tech 100 index, with its on-chart dashboard', width: 1366, height: 768 },
        year: 2023,
    },
]
