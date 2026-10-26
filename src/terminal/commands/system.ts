// terminal/commands/system.ts
// System-flavoured commands: neofetch, whoami, history, htop, cv, kill, man, date, echo.
// The facts come from src/content, so the jokes never contradict the site.

import { owner, projects, contact } from '@/src/content'
import { box } from '../format'

export function generateNeofetch(): string {
    return [
        '    ┌───────────┐    visitor@kudzai',
        '    │  >_ █     │    ─────────────────',
        '    │           │    OS: Human 1.0 (Founder Edition)',
        '    │           │    Shell: Brain/zsh 5.9',
        '    └─────┬─────┘    Uptime: since 2019 (first line of Java)',
        '          │          Memory: Selective (caffeine-backed)',
        '     ═════╧═════     Kernel: AI / ML Engineer',
        '                     DE: Terminal Minimalist',
        '                     CPU: PyTorch @ speech, vision and LLMs',
        '                     GPU: SageMaker, when the dataset needs it',
        `                     Disk: ${projects.length} featured projects · 2 companies`,
        `                     Network: ${contact.githubHandle} · Teleagents · OurAfrica`,
    ].join('\n')
}

export function generateWhoami(): string {
    return [
        ...box(`${owner.fullName}`, [owner.title, '', ...owner.description]),
        '',
        'Type cd about for the full story, or games for something to play.',
    ].join('\n')
}

export function generateHistory(): string {
    return [
        '    1  ssh deploy@production-cluster',
        '    2  kubectl get pods --all-namespaces',
        '    3  python train_model.py --epochs 100 --lr 0.001',
        '    4  git commit -m "feat: improve NLP model accuracy"',
        '    5  docker build -t ml-pipeline:latest .',
        '    6  curl -s api.openai.com/v1/models | jq .',
        '    7  vim architecture-decisions.md',
        '    8  pytest tests/ -v --cov=src --cov-report=term',
        '    9  terraform apply -auto-approve',
        '   10  npm run build && npm run deploy',
        '   11  psql -U kudzai -d analytics -c "SELECT count(*) FROM predictions"',
        '   12  jupyter notebook --port 8888',
        '   13  git push origin main --force-with-lease',
        '   14  tail -f /var/log/ml-pipeline/inference.log',
        '   15  neofetch',
    ].join('\n')
}

export function generateHtop(): string {
    return [
        '  PID USER      PR   VIRT    RES  S  %CPU  %MEM  COMMAND',
        '    1 kudzai    20   99.9g  brain R  94.0  87.2  neural-net-training',
        '   42 kudzai    20   4.2g   voice S  78.3  45.1  teleagents-voice-agent.service',
        '   88 kudzai    20   1.1g   sync  S  51.0  21.7  ourafrica-offline-sync.worker',
        '  100 kudzai    20   2.1g   eyes  R  65.0  32.8  code-review.loop',
        '  404 kudzai    20   1.8g   will  R  55.2  28.4  learning-new-things.loop',
        '  200 kudzai    20   512m   gut   S  43.1  12.0  ambition.exe',
        '  666 kudzai    20   256m   beans R  99.9  99.9  coffee-dependency.service',
        '    7 kudzai    20    64m   ego   S   0.0   0.1  imposter-syndrome (stopped)',
        '  500 kudzai    20   128m   rest  S   2.3   5.0  sleep.timer (overdue)',
        '',
        '  Uptime: since 2019 | Tasks: 8 running, 1 stopped',
        '  Mem: 16.0G/16.0G [||||||||||||||||||||||||||||||||] 99.9%',
        '  CPU:              [||||||||||||||||||||||||||||||  ] 94.0%',
    ].join('\n')
}

export function generateCv(url: string): string {
    const isExternal = /^https?:\/\//.test(url)

    if (isExternal) {
        return [
            '> Resolving resume...',
            '> Opening in new tab → ' + url,
            '',
            'If the tab didn\'t open, the file lives at:',
            '  ' + url,
            '',
            'Pro tip: forward to a hiring manager. Or skip the middle step.',
        ].join('\n')
    }

    return [
        '> Resolving ' + url + '...',
        '> Preparing transfer...',
        '',
        'resume.pdf — saved to ~/Downloads.',
        '',
        'If your browser blocked the download, the file lives at:',
        '  ' + url,
        '',
        'Pro tip: forward to a hiring manager. Or skip the middle step.',
    ].join('\n')
}

export function generateKill(args: string): string {
    const tokens = args.trim().split(/\s+/).filter(Boolean)
    const target = tokens[tokens.length - 1]?.toLowerCase()

    if (!target) {
        return 'Usage: kill [-9] <process|pid>'
    }

    if (target === 'imposter-syndrome' || target === '7') {
        return [
            'imposter-syndrome (PID 7): killed.',
            '',
            'Note: process tends to respawn unattended.',
            'Recommended cron: 0 9 * * * kill -9 imposter-syndrome',
        ].join('\n')
    }

    if (target === 'self' || target === '$$' || target === '1') {
        return 'kill: refusing to terminate the calling process. (good call)'
    }

    return [
        `kill: (${target}) - No such process.`,
        '',
        'Tip: try \'htop\' to see what\'s running.',
    ].join('\n')
}

export function generateMan(topic: string): string {
    const t = topic.toLowerCase()

    if (t === 'kudzai' || t === 'kudzai-prichard') {
        return [
            'KUDZAI(1)                   Developer Manual                  KUDZAI(1)',
            '',
            'NAME',
            '    kudzai — AI / ML engineer, co-founder of Teleagents and OurAfrica',
            '',
            'SYNOPSIS',
            '    kudzai [--ml] [--speech] [--vision] [--found] [--ship-it] <problem>',
            '',
            'DESCRIPTION',
            '    Trains models, deploys them behind APIs on AWS and Azure, and',
            '    runs them in production: speech models for Shona, Ndebele and',
            '    Ndau, document AI for banks, LLM agents. As a founder, takes a',
            '    product from strategy to paying clients. Processes caffeine',
            '    into production code.',
            '',
            'OPTIONS',
            '    --ml          Machine learning, from the notebook to the endpoint',
            '    --speech      ASR and TTS for African languages',
            '    --vision      OCR, faces and signatures on scanned documents',
            '    --found       Strategy, go-to-market and the code',
            '    --ship-it     Skip overthinking, deploy with confidence',
            '',
            'SEE ALSO',
            '    pytorch(1), fastapi(1), teleagents(7), ourafrica(7)',
        ].join('\n')
    }

    if (t === 'python') {
        return [
            'PYTHON(1)                   Developer Manual                  PYTHON(1)',
            '',
            'NAME',
            '    python — the language kudzai thinks in',
            '',
            'DESCRIPTION',
            '    Interpreted, high-level, general-purpose programming language.',
            '    In these hands: speech models, document AI, LLM agents,',
            '    FastAPI services and the odd hackathon ensemble.',
            '    Others merely write Python. Kudzai speaks it.',
            '',
            'SEE ALSO',
            '    tensorflow(1), fastapi(1), django(1)',
        ].join('\n')
    }

    if (t === 'react' || t === 'next.js' || t === 'nextjs') {
        return [
            'REACT(1)                    Developer Manual                  REACT(1)',
            '',
            'NAME',
            '    react — frontend framework, well-utilized',
            '',
            'DESCRIPTION',
            "    Component-based UI library. In kudzai's hands, it renders",
            '    more than components — it renders experiences. This portfolio',
            '    was built with Next.js 16 and React 19, no UI library,',
            '    no templates. Every pixel is intentional.',
            '',
            'SEE ALSO',
            '    next.js(1), typescript(1), shipping-fast(7)',
        ].join('\n')
    }

    if (t === 'tensorflow' || t === 'pytorch' || t === 'ml') {
        return [
            'PYTORCH(1)                  Developer Manual                 PYTORCH(1)',
            '',
            'NAME',
            '    pytorch — the framework behind the speech models and METIS',
            '',
            'DESCRIPTION',
            '    Open-source deep learning framework. Trains the in-house ASR',
            '    and TTS models at Teleagents and the Neural Thompson Sampling',
            '    bandit in METIS; TensorFlow and OpenCV handled the vision',
            '    models at Sybrin. The frameworks take partial credit.',
            '',
            'SEE ALSO',
            '    pytorch(1), scikit-learn(1), kudzai(1)',
        ].join('\n')
    }

    // Generic man page
    return [
        `${topic.toUpperCase()}(1)                   Developer Manual                  ${topic.toUpperCase()}(1)`,
        '',
        'NAME',
        `    ${topic} — as understood by kudzai prichard matizirofa`,
        '',
        'DESCRIPTION',
        `    ${topic} is best approached with Python, a whiteboard, and`,
        "    unreasonable optimism. For implementation examples, see",
        "    ~/projects or the portfolio you're currently exploring.",
        '',
        'SEE ALSO',
        '    kudzai(1), building-things-that-work(7), engineering-standards(7)',
    ].join('\n')
}

export function generateDate(): string {
    const now = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${days[now.getDay()]} ${months[now.getMonth()]} ${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} CAT ${now.getFullYear()}\nSystem clock synchronized (Harare, UTC+2). Uptime: continuous since 2019.`
}

export function generateEcho(text: string): string {
    if (!text) return ''
    return `${text}\n— transmitted via prichard.co.zw infrastructure`
}
