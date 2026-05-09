// hooks/useTerminalInput.ts
"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useSnakeGame } from './useSnakeGame'
import { useAdventureGame } from './useAdventureGame'
import { owner, contact, skillCategories, specializations, projects, experiences } from '@/src/content'
import type { AgentAction, ChatMessage } from '@/src/lib/aiAgent'
import {
    getCharClassMultiplier,
    getBaseSpeedForSection,
    getPatternForSection,
    globalTypingPattern,
} from '@/src/constants/typingConfig'

type TerminalSectionId = 'hero' | 'about' | 'projects' | 'experience' | 'terminal'
type NavigableSection = 'home' | 'about' | 'projects' | 'experience' | 'contact'

export interface TerminalLine {
    id: number
    type: 'input' | 'output'
    text: string
    prompt?: string
    /** 'agent' marks a spoken reply from the AI, styled distinctly from raw output. */
    variant?: 'agent'
}

interface UseTerminalInputOptions {
    sectionId: TerminalSectionId
    isActive: boolean
    /** Called with each agent reply as it starts (used to speak it aloud). */
    onAgentReply?: (text: string) => void
    /** Called when the visitor interrupts a reply (used to stop speech). */
    onAgentInterrupt?: () => void
}

type TerminalMode = 'normal' | 'vim' | 'matrix' | 'snake' | 'adventure' | 'tour' | 'contact'

/** Visual state of the agent presence orb, derived from terminal activity. */
type AgentState = 'idle' | 'thinking' | 'speaking'

interface UseTerminalInputReturn {
    inputText: string
    history: TerminalLine[]
    isTypingResponse: boolean
    responseText: string
    suggestion: string
    cwd: string
    mode: TerminalMode
    vimContent: string
    vimCommand: string
    snakeDisplay: string
    snakeChangeDirection: (dir: 'up' | 'down' | 'left' | 'right') => void
    adventurePrompt: string
    displayedSection: NavigableSection | null
    /** Variant of the in-progress typing line ('agent' for AI replies). */
    responseVariant: 'agent' | undefined
    /** True once the AI has answered — show the quick-action chips. */
    agentUsed: boolean
    /** Run a command programmatically (used by quick-action chips). */
    submitCommand: (command: string) => void
    /** Contextual follow-up questions suggested by the agent (chip labels). */
    agentSuggestions: readonly string[]
    /** Submit a spoken transcript (reply will be read aloud). */
    submitVoiceCommand: (command: string) => void
}

interface CommandResponse {
    response: string | null
    newCwd?: string
    enterMode?: 'vim' | 'matrix' | 'snake' | 'adventure'
    vimContent?: string
    navigateTo?: string
    loadingMessages?: string[]
    renderSection?: NavigableSection
    /** Trigger a file download from this URL (relative to /public). */
    downloadUrl?: string
    /** Open this URL in a new tab (mailto:, https://, etc). */
    openUrl?: string
    /**
     * Route this plain-English input to the AI agent (/api/chat) instead of
     * returning a static response. Set when an unknown command reads like a
     * natural-language question rather than a typo'd command.
     */
    askAI?: string
    /** Launch the scripted guided tour (from the `tour` command or a tour phrase). */
    startTour?: boolean
    /** Launch the step-by-step contact flow (from `email`/`contact` — no AI needed). */
    startContact?: boolean
    /**
     * Marks a scripted onboarding/greeting reply — typed as the agent's voice
     * and followed by onboarding chips, without an AI round-trip.
     */
    onboarding?: boolean
}

const RESPONSE_CHAR_SPEED = 18

/* ============================================
   LOADING INDICATOR MESSAGES
   ============================================ */

const LOADING_SETS: Record<string, string[]> = {
    neofetch: [
        'Scanning hardware abstraction layer...',
        'Reading /proc/developer/capabilities...',
        'Measuring baseline output metrics...',
        'Compiling system profile...',
    ],
    htop: [
        'Sampling active cognitive processes...',
        'Measuring resource allocation...',
        'Ranking by throughput impact...',
        'Rendering process table...',
    ],
    'git-log': [
        'Resolving commit graph...',
        'Unpacking 4+ years of object history...',
        'Cross-referencing milestone tags...',
        'Formatting log output...',
    ],
    'git-blame': [
        'Analyzing blame annotations...',
        'Tracing authorship graph...',
        'Correlating fuel source metadata...',
        'Compiling attribution report...',
    ],
    ssh: [
        'Resolving host address...',
        'Negotiating key exchange...',
        'Verifying credentials...',
    ],
    sudo: [
        'Verifying identity...',
        'Checking clearance level...',
        'Querying personnel records...',
        'Declassifying assessment...',
    ],
    curl: [
        'Resolving endpoint...',
        'Establishing secure connection...',
        'Fetching remote payload...',
        'Parsing response body...',
    ],
}

/* ============================================
   SECTION CONTENT RENDERING (cd navigation)
   ============================================ */

const NAV_SECTIONS: Record<string, NavigableSection> = {
    home: 'home', about: 'about', projects: 'projects',
    experience: 'experience', contact: 'contact',
}

const CD_STATUS_LINES: Record<NavigableSection, string> = {
    home: 'Reading /home/kudzai/...',
    about: 'Reading /home/kudzai/about/...',
    projects: 'Indexing /home/kudzai/projects/...',
    experience: 'Parsing /home/kudzai/experience/...',
    contact: 'Resolving /home/kudzai/contact/...',
}

/**
 * Standalone human-feel delay calculator for character-by-character typing.
 * Mirrors the logic in useTypingAnimation.calculateDelay but works outside
 * of React hook context. Uses the terminal section's typing pattern.
 */
function calculateHumanCharDelay(
    char: string,
    index: number,
    fullText: string,
    baseSpeed: number,
): number {
    const pattern = getPatternForSection('terminal')
    let delay = baseSpeed

    // Character-class multiplier
    delay *= getCharClassMultiplier(char)

    // Positional multipliers
    if (index < 3) {
        delay *= pattern.startSpeedMultiplier
    }
    const middleStart = Math.floor(fullText.length * 0.3)
    const middleEnd = Math.floor(fullText.length * 0.7)
    if (index >= middleStart && index <= middleEnd) {
        delay *= pattern.middleSpeedMultiplier
    }
    if (index > fullText.length - 4) {
        delay *= pattern.endSpeedMultiplier
    }

    // Slow characters
    if (pattern.slowCharacters.includes(char)) {
        delay *= pattern.slowCharMultiplier
    }

    // Repeated character — muscle memory
    if (index > 0 && char === fullText[index - 1]) {
        delay *= pattern.repeatedCharMultiplier
    }

    // Random micro-pause
    if (Math.random() < pattern.randomPauseProbability) {
        delay *= pattern.randomPauseMultiplier
    }

    // Natural variation ±30%
    const variation = delay * 0.3
    delay += Math.random() * variation * 2 - variation

    return Math.max(10, delay)
}

/**
 * Calculate delay before the next content line appears.
 * Uses typingConfig char class multipliers and random pause probability
 * to create natural variation — not Math.random() alone.
 */
function calculateLineDelay(line: string): number {
    const BASE = 35

    // Empty lines (paragraph breaks) get a longer pause
    if (line.trim() === '') return BASE * 3

    // Header/separator lines get a pause
    if (line.startsWith('──') || line.startsWith('===') || line.startsWith('┌')) {
        return BASE * 2.2
    }

    // Closing lines
    if (line.startsWith('└')) return BASE * 0.8

    // Weight from first meaningful character
    const firstChar = line.trim()[0] || ' '
    const charWeight = getCharClassMultiplier(firstChar)

    // Random pause from typingConfig pattern (8% chance)
    const pauseHit = Math.random() < globalTypingPattern.randomPauseProbability
    const pauseMult = pauseHit ? globalTypingPattern.randomPauseMultiplier : 1.0

    // Longer lines get a slightly longer lead time (capped)
    const lengthFactor = 1 + Math.min(line.length / 150, 0.4)

    // Natural variation ±20%
    const variation = 0.8 + Math.random() * 0.4

    return BASE * charWeight * pauseMult * lengthFactor * variation
}

/**
 * Format section content from src/content/ into terminal-friendly text lines.
 * Each string in the returned array becomes one history entry.
 */
function formatSectionLines(section: NavigableSection): string[] {
    switch (section) {
        case 'home':
            return [
                owner.name,
                owner.title,
                '',
                ...owner.description,
            ]
        case 'about':
            return [
                owner.bio,
                '',
                '── Tech Stack ──────────────────────────────────────',
                ...skillCategories.map(c =>
                    `  ${c.icon} ${c.title}: ${c.technologies.join(' | ')}`
                ),
                '',
                '── Specializations ─────────────────────────────────',
                ...specializations.map(s => `  > ${s}`),
            ]
        case 'projects':
            return projects.flatMap(p => [
                `┌─ ${p.name}${p.status ? ` [${p.status}]` : ''}`,
                `│  ${p.description}`,
                `│  Stack: ${p.technologies.join(', ')}`,
                `│  ${p.githubUrl}${p.liveUrl ? '  |  ' + p.liveUrl : ''}`,
                '└──',
                '',
            ])
        case 'experience':
            return experiences.flatMap(e => [
                `=== ${e.role} ${e.company} ===`,
                `Period: ${e.period}`,
                '',
                e.description,
                '',
                'Key achievements:',
                ...e.achievements.map(a => `  > ${a}`),
                '',
                `Stack: ${e.technologies.join(', ')}`,
                '',
            ])
        case 'contact':
            return [
                'Contact Information',
                '───────────────────',
                `Email:    ${contact.email}`,
                `GitHub:   ${contact.githubHandle}  (${contact.githubUrl})`,
                `LinkedIn: ${contact.linkedinName}  (${contact.linkedinUrl})`,
                `Twitter:  ${contact.twitterHandle}  (${contact.twitterUrl})`,
                '',
                'Preferred contact method: email.',
            ]
    }
}

/* ============================================
   FILESYSTEM DATA STRUCTURE
   ============================================ */

interface FsFile {
    type: 'file'
    content: string
}

interface FsDir {
    type: 'dir'
    children: Record<string, FsNode>
}

type FsNode = FsFile | FsDir

const filesystem: FsDir = {
    type: 'dir',
    children: {
        'projects': {
            type: 'dir',
            children: {
                'ai-chatbot-platform': {
                    type: 'dir',
                    children: {
                        'README.md': {
                            type: 'file',
                            content: [
                                '# AI ChatBot Platform',
                                'Status: LIVE',
                                '',
                                'Enterprise conversational AI platform powered by GPT-4.',
                                'Context-aware responses, multi-language support, custom',
                                'training capabilities for enterprise clients.',
                                '',
                                'Stack: Python, FastAPI, OpenAI, PostgreSQL',
                                '',
                                'Handles complex queries with natural language processing.',
                                'The kind of system that makes you wonder why most chatbots',
                                'still feel like arguing with a phone menu.',
                            ].join('\n'),
                        },
                        'config.json': {
                            type: 'file',
                            content: '{\n  "model": "gpt-4",\n  "max_tokens": 4096,\n  "temperature": 0.7,\n  "languages": ["en", "es", "fr", "de", "pt", "zh"]\n}',
                        },
                    },
                },
                'ml-image-classifier': {
                    type: 'dir',
                    children: {
                        'README.md': {
                            type: 'file',
                            content: [
                                '# ML Image Classifier',
                                'Status: LIVE',
                                '',
                                'Deep learning model for image classification with high accuracy.',
                                'Transfer learning with ResNet50, real-time inference API.',
                                '',
                                'Stack: TensorFlow, Flask, Docker, AWS',
                                '',
                                'Processes thousands of images per minute. The 4% it gets',
                                'wrong are probably modern art.',
                            ].join('\n'),
                        },
                        'model.info': {
                            type: 'file',
                            content: 'Architecture: ResNet50 (transfer learning)\nAccuracy: 96.2%\nInference: ~12ms per image\nDataset: 50K labeled samples',
                        },
                    },
                },
                'e-commerce-dashboard': {
                    type: 'dir',
                    children: {
                        'README.md': {
                            type: 'file',
                            content: [
                                '# E-Commerce Dashboard',
                                'Status: LIVE',
                                '',
                                'Full-stack admin dashboard for e-commerce platforms.',
                                'Real-time analytics, inventory management, automated reporting.',
                                'Supports multiple stores and currencies.',
                                '',
                                'Stack: Next.js, Node.js, MongoDB',
                                '',
                                'The kind of dashboard that makes spreadsheet people nervous.',
                            ].join('\n'),
                        },
                    },
                },
                'real-time-chat': {
                    type: 'dir',
                    children: {
                        'README.md': {
                            type: 'file',
                            content: [
                                '# Real-Time Chat App',
                                'Status: BETA',
                                '',
                                'WebSocket-based messaging with end-to-end encryption.',
                                'Group chats, file sharing, message history.',
                                'Redis caching for optimal performance.',
                                '',
                                'Stack: React, Socket.io, Redis',
                                '',
                                'Messages arrive before you finish regretting sending them.',
                            ].join('\n'),
                        },
                    },
                },
                'task-automation-bot': {
                    type: 'dir',
                    children: {
                        'README.md': {
                            type: 'file',
                            content: [
                                '# Task Automation Bot',
                                'Status: LIVE',
                                '',
                                'Automation bot for repetitive tasks.',
                                'Integrates with Slack, Email, and Calendar APIs.',
                                'Saves average of 10+ hours per week.',
                                '',
                                'Stack: Python, Celery, RabbitMQ',
                                '',
                                'Does the boring parts so humans can focus on',
                                'the interesting boring parts.',
                            ].join('\n'),
                        },
                    },
                },
            },
        },
        'experience': {
            type: 'dir',
            children: {
                '2023-present_senior-ai-engineer.log': {
                    type: 'file',
                    content: [
                        '=== Senior AI Engineer @ TechCorp Solutions ===',
                        'Period: 2023 - Present',
                        '',
                        'Leading AI/ML initiatives and developing intelligent systems',
                        'for enterprise clients. Architected scalable ML pipelines',
                        'processing millions of data points daily.',
                        '',
                        'Key achievements:',
                        '  - Built NLP models with high accuracy for document understanding',
                        '  - Reduced model inference time significantly through optimization',
                        '  - Mentored team of junior engineers',
                        '',
                        'Stack: Python, TensorFlow, AWS, Docker, PyTorch',
                    ].join('\n'),
                },
                '2021-2023_full-stack-developer.log': {
                    type: 'file',
                    content: [
                        '=== Full Stack Developer @ StartupHub Inc ===',
                        'Period: 2021 - 2023',
                        '',
                        'Developed and maintained full-stack applications serving',
                        'a large user base. RESTful APIs, modern frontend with React/Node.js.',
                        '',
                        'Key achievements:',
                        '  - Launched 3 major product features on schedule',
                        '  - Improved application performance by 45%',
                        '  - Collaborated with cross-functional teams',
                        '',
                        'Stack: React, Node.js, PostgreSQL, TypeScript, Git',
                    ].join('\n'),
                },
                '2020-2021_freelance-developer.log': {
                    type: 'file',
                    content: [
                        '=== Freelance Developer @ Self-Employed ===',
                        'Period: 2020 - 2021',
                        '',
                        'Custom web applications and AI solutions for various clients.',
                        'Rapid prototyping, MVP development.',
                        '',
                        'Key achievements:',
                        '  - Completed 15+ client projects successfully',
                        '  - Maintained 100% client satisfaction rate',
                        '  - Built scalable solutions for diverse industries',
                        '',
                        'Stack: Python, Django, React, MongoDB, AWS',
                    ].join('\n'),
                },
            },
        },
        'skills': {
            type: 'dir',
            children: {
                'ai-ml.txt': {
                    type: 'file',
                    content: 'AI/ML Stack\n───────────\nTensorFlow | PyTorch | Scikit-learn | OpenAI | Hugging Face\n\nSpecializations:\n  - Machine Learning Engineering\n  - Natural Language Processing\n  - Data Engineering',
                },
                'backend.txt': {
                    type: 'file',
                    content: 'Backend Stack\n─────────────\nPython | Node.js | Django | FastAPI | PostgreSQL\n\nSpecializations:\n  - API Development\n  - System Architecture',
                },
                'frontend.txt': {
                    type: 'file',
                    content: 'Frontend Stack\n──────────────\nReact | Next.js | TypeScript | Tailwind | Vue.js\n\nThis portfolio was built with Next.js 16 and React 19.\nNo UI framework. Every pixel is accounted for.',
                },
                'devops.txt': {
                    type: 'file',
                    content: 'DevOps Stack\n────────────\nDocker | AWS | Git | CI/CD | Linux\n\nSpecializations:\n  - Cloud Computing\n  - Container Orchestration',
                },
            },
        },
        'personal': {
            type: 'dir',
            children: {
                'contact.txt': {
                    type: 'file',
                    content: [
                        'Contact Information',
                        '───────────────────',
                        'Email:    kudzai@example.com',
                        'GitHub:   @kudzaiprichard',
                        'LinkedIn: Kudzai Prichard',
                        'Twitter:  @kudzaiprichard',
                        '',
                        'Preferred contact method: email.',
                        'Response time: faster than most ML model inference.',
                    ].join('\n'),
                },
                'about.txt': {
                    type: 'file',
                    content: [
                        'Kudzai Prichard',
                        'AI & Full Stack Developer',
                        '',
                        'Building intelligent systems, one commit at a time.',
                        '',
                        'Core focus areas:',
                        '  - Machine Learning Engineering',
                        '  - Natural Language Processing',
                        '  - API Development',
                        '  - System Architecture',
                        '  - Data Engineering',
                        '  - Cloud Computing',
                    ].join('\n'),
                },
                '.private': {
                    type: 'dir',
                    children: {
                        'secrets': {
                            type: 'dir',
                            children: {
                                'buried': {
                                    type: 'dir',
                                    children: {
                                        'deep': {
                                            type: 'dir',
                                            children: {
                                                'particle_system.fact': {
                                                    type: 'file',
                                                    content: [
                                                        '[ CLASSIFIED — clearance level: curious ]',
                                                        '',
                                                        'The background you\'re staring at is a 676-line canvas',
                                                        'particle system with simulated depth layers. Particles',
                                                        'in the "back" move slower, particles in the "front"',
                                                        'respond to your mouse cursor. There are hub particles',
                                                        'that attract nearby nodes into micro-constellations.',
                                                        '',
                                                        'You scrolled past it without noticing. That was the point.',
                                                    ].join('\n'),
                                                },
                                                'typing_engine.fact': {
                                                    type: 'file',
                                                    content: [
                                                        '[ CLASSIFIED — clearance level: persistent ]',
                                                        '',
                                                        'Every typed character in this portfolio runs through',
                                                        'a 7-layer delay calculation: base speed, positional',
                                                        'multiplier (start/middle/end), character class detection',
                                                        '(digits are slower — reaching for the number row),',
                                                        'repeated-char speedup (muscle memory), random micro-pauses',
                                                        '(8% chance per keystroke), slow-char penalties for dots',
                                                        'and slashes, and file-extension slowdowns.',
                                                        '',
                                                        'The goal: make you believe a human typed it.',
                                                        'The fact you\'re reading this means you\'re suspicious.',
                                                    ].join('\n'),
                                                },
                                                'glitch_system.fact': {
                                                    type: 'file',
                                                    content: [
                                                        '[ CLASSIFIED — clearance level: determined ]',
                                                        '',
                                                        'The name "kudzai prichard" on the hero section glitches.',
                                                        'It\'s a 474-line two-phase character glitch system that',
                                                        'wraps individual characters in spans, randomizes them',
                                                        'through unicode substitution sets, then resolves back',
                                                        'to the original text. The effect is frame-synced to',
                                                        'requestAnimationFrame for buttery 60fps.',
                                                        '',
                                                        'Total engineering time for a 2-second visual effect:',
                                                        'more than you\'d want to know.',
                                                    ].join('\n'),
                                                },
                                                'sound_design.fact': {
                                                    type: 'file',
                                                    content: [
                                                        '[ CLASSIFIED — clearance level: obsessive ]',
                                                        '',
                                                        'The keystroke sounds are not random. The audio engine',
                                                        '(504 lines) detects which hand region a key belongs to',
                                                        '— left hand, right hand, or wide keys (space, enter).',
                                                        'Each region has its own sound pool. Volume ramps up over',
                                                        'the first 10 keystrokes and decays after 2 seconds of',
                                                        'inactivity. There are multiple sound files per key type',
                                                        'to avoid the machine-gun effect of repeated identical',
                                                        'audio samples.',
                                                        '',
                                                        'Muting is available. Using it is a valid life choice.',
                                                    ].join('\n'),
                                                },
                                                'meta.fact': {
                                                    type: 'file',
                                                    content: [
                                                        '[ CLASSIFIED — clearance level: thorough ]',
                                                        '',
                                                        'This portfolio is ~4,200 lines of TypeScript across',
                                                        '35 files, backed by a custom imperative animation',
                                                        'state machine (idle → running → completed/cancelled)',
                                                        'that coordinates all section animations. No animation',
                                                        'library was used. No component library. No Tailwind.',
                                                        'Every CSS variable, every transition, every scroll-snap',
                                                        'was hand-placed.',
                                                        '',
                                                        'The developer did not use a template.',
                                                        'The developer may need more hobbies.',
                                                    ].join('\n'),
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}

/* ============================================
   FILESYSTEM UTILITIES
   ============================================ */

function normalizePath(path: string): string {
    // Remove trailing slash (except for root)
    const cleaned = path.replace(/\/+/g, '/')
    return cleaned === '/' ? '/' : cleaned.replace(/\/$/, '')
}

function resolvePath(cwd: string, target: string): string {
    // Handle home
    if (target === '~' || target === '') return '/'

    // Handle absolute paths
    let parts: string[]
    if (target.startsWith('/') || target.startsWith('~/')) {
        parts = target.replace(/^~/, '').split('/').filter(Boolean)
    } else {
        // Relative path
        parts = [...cwd.split('/').filter(Boolean), ...target.split('/').filter(Boolean)]
    }

    // Resolve . and ..
    const resolved: string[] = []
    for (const part of parts) {
        if (part === '.') continue
        if (part === '..') {
            resolved.pop()
        } else {
            resolved.push(part)
        }
    }

    return '/' + resolved.join('/')
}

function lookupNode(path: string): FsNode | null {
    if (path === '/') return filesystem
    const parts = path.split('/').filter(Boolean)
    let current: FsNode = filesystem as FsNode
    for (const part of parts) {
        if (current.type !== 'dir') return null
        const child: FsNode | undefined = current.children[part]
        if (!child) return null
        current = child
    }
    return current
}

function getParentPath(path: string): string {
    if (path === '/') return '/'
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
}

/** List entries in a directory. hideDotFiles controls whether .entries are included. */
function listDir(dir: FsDir, hideDotFiles: boolean): string[] {
    return Object.keys(dir.children)
        .filter(name => !hideDotFiles || !name.startsWith('.'))
        .sort((a, b) => {
            // Directories first, then files
            const aIsDir = dir.children[a].type === 'dir'
            const bIsDir = dir.children[b].type === 'dir'
            if (aIsDir && !bIsDir) return -1
            if (!aIsDir && bIsDir) return 1
            return a.localeCompare(b)
        })
}

/** Format ls output */
function formatLs(dir: FsDir, hideDotFiles: boolean): string {
    const entries = listDir(dir, hideDotFiles)
    if (entries.length === 0) return ''
    return entries
        .map(name => {
            const node = dir.children[name]
            const isDir = node.type === 'dir'
            const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--'
            const suffix = isDir ? '/' : ''
            return `${perms}  1 kudzai staff  ${name}${suffix}`
        })
        .join('\n')
}

/** Format short ls (no -l flag) */
function formatLsShort(dir: FsDir, hideDotFiles: boolean): string {
    const entries = listDir(dir, hideDotFiles)
    if (entries.length === 0) return ''
    return entries
        .map(name => {
            const node = dir.children[name]
            return node.type === 'dir' ? `${name}/` : name
        })
        .join('  ')
}

/** Get tab completions for a partial path from a given cwd */
function getCompletions(cwd: string, partial: string): string[] {
    // Separate the directory part and the name prefix
    const lastSlash = partial.lastIndexOf('/')
    let dirPart: string
    let namePrefix: string

    if (lastSlash === -1) {
        dirPart = cwd
        namePrefix = partial
    } else {
        const dirTarget = partial.slice(0, lastSlash) || '/'
        dirPart = resolvePath(cwd, dirTarget)
        namePrefix = partial.slice(lastSlash + 1)
    }

    const dirNode = lookupNode(dirPart)
    if (!dirNode || dirNode.type !== 'dir') return []

    const matches = Object.keys(dirNode.children)
        .filter(name => name.startsWith(namePrefix))
        .sort()

    // Return full partial path with completion
    const prefix = lastSlash === -1 ? '' : partial.slice(0, lastSlash + 1)
    return matches.map(name => {
        const node = dirNode.children[name]
        return prefix + name + (node.type === 'dir' ? '/' : '')
    })
}

/* ============================================
   COMMAND LISTS, FUZZY MATCH, GHOST SUGGESTION
   ============================================ */

/** Canonical command names available in the dedicated terminal section. */
const TERMINAL_COMMAND_LIST: readonly string[] = [
    'adventure', 'ai', 'ascii', 'ask', 'cat', 'cd', 'chat', 'clear', 'curl', 'cv', 'date',
    'echo', 'email', 'exit', 'git', 'hack', 'help', 'history',
    'htop', 'kill', 'ls', 'man', 'matrix', 'neofetch', 'ping',
    'pwd', 'sl', 'snake', 'ssh', 'sudo', 'tour', 'vim', 'whoami',
]

/** Limited command set available in the inline terminals on other sections. */
const NON_TERMINAL_COMMAND_LIST: readonly string[] = [
    'cd', 'clear', 'exit', 'help', 'ls', 'sudo', 'whoami',
]

/** Standard Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
    const m = a.length
    const n = b.length
    if (m === 0) return n
    if (n === 0) return m

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
        }
    }
    return dp[m][n]
}

/**
 * Find the closest matching command for a typo'd input.
 * Threshold scales with input length to avoid false positives on short inputs.
 * Returns null if nothing is close enough or the input already matches exactly.
 */
function findClosestCommand(input: string, sectionId: TerminalSectionId): string | null {
    const cmd = input.trim().split(/\s+/)[0]?.toLowerCase()
    if (!cmd || cmd.length < 2) return null

    const threshold = cmd.length < 4 ? 1 : 2
    const list = sectionId === 'terminal' ? TERMINAL_COMMAND_LIST : NON_TERMINAL_COMMAND_LIST

    let closest: string | null = null
    let minDist = Infinity

    for (const c of list) {
        const dist = levenshtein(cmd, c)
        if (dist < minDist) {
            minDist = dist
            closest = c
        }
    }

    if (minDist > threshold) return null
    if (closest === cmd) return null
    return closest
}

/**
 * Compute the ghost-text suffix that would complete the current input.
 * Returns the portion to render in dim text after what the user typed.
 *
 * - For single-token input: matches command names, prefers alphabetical first.
 * - For path arguments to fs commands (cd/ls/cat in terminal section): matches filesystem entries.
 * - Returns '' when the input is empty, already a complete match, or unmatched.
 *
 * Ghost shows the FIRST alphabetical match (single suggestion, fish-style),
 * which intentionally differs from Tab's common-prefix behavior.
 */
function computeSuggestion(
    input: string,
    cwd: string,
    sectionId: TerminalSectionId,
): string {
    if (!input) return ''

    const parts = input.split(/\s+/)
    const cmd = parts[0]?.toLowerCase()

    // Filesystem path completion (terminal section only — fs commands need at least one char of path)
    if (sectionId === 'terminal' && parts.length >= 2 && (cmd === 'cd' || cmd === 'ls' || cmd === 'cat')) {
        const lastPart = parts[parts.length - 1]
        if (!lastPart) return ''
        const completions = getCompletions(cwd, lastPart)
        if (completions.length === 0) return ''
        return completions[0].slice(lastPart.length)
    }

    // Command name completion — single token, must be a strict superset
    if (parts.length === 1) {
        const cmds = sectionId === 'terminal' ? TERMINAL_COMMAND_LIST : NON_TERMINAL_COMMAND_LIST
        const lower = input.toLowerCase()
        const match = cmds.find(c => c.startsWith(lower) && c !== lower)
        if (!match) return ''
        return match.slice(input.length)
    }

    return ''
}

/* ============================================
   SECTION LS OUTPUT (non-terminal sections)
   ============================================ */

function getLsOutput(sectionId: TerminalSectionId): string {
    switch (sectionId) {
        case 'hero':
            return [
                'total 7',
                'drwxr-xr-x  2 kudzai staff  about/',
                'drwxr-xr-x  5 kudzai staff  projects/',
                'drwxr-xr-x  3 kudzai staff  experience/',
                'drwxr-xr-x  2 kudzai staff  contact/',
                '-rw-r--r--  1 kudzai staff  role.txt',
                '-rw-r--r--  1 kudzai staff  description.txt',
                '-rw-r--r--  1 kudzai staff  README.md',
            ].join('\n')
        case 'about':
            return [
                'total 6',
                'drwxr-xr-x  5 kudzai staff  ai-ml/',
                'drwxr-xr-x  5 kudzai staff  backend/',
                'drwxr-xr-x  5 kudzai staff  frontend/',
                'drwxr-xr-x  5 kudzai staff  devops/',
                '-rw-r--r--  1 kudzai staff  about.txt',
                '-rwxr-xr-x  1 kudzai staff  list_specializations.sh',
            ].join('\n')
        case 'projects':
            return [
                'total 6',
                'drwxr-xr-x  1 kudzai staff  ai-chatbot-platform/',
                'drwxr-xr-x  1 kudzai staff  ml-image-classifier/',
                'drwxr-xr-x  1 kudzai staff  e-commerce-dashboard/',
                'drwxr-xr-x  1 kudzai staff  real-time-chat/',
                'drwxr-xr-x  1 kudzai staff  task-automation-bot/',
                '-rw-r--r--  1 kudzai staff  more_projects.txt',
            ].join('\n')
        case 'experience':
            return [
                'total 5',
                '-rw-r--r--  1 kudzai staff  2023-present_senior-ai-engineer.log',
                '-rw-r--r--  1 kudzai staff  2021-2023_full-stack-developer.log',
                '-rw-r--r--  1 kudzai staff  2020-2021_freelance-developer.log',
                '-rw-r--r--  1 kudzai staff  skills.json',
                '-rw-r--r--  1 kudzai staff  references.gpg',
            ].join('\n')
        default:
            return ''
    }
}

/* ============================================
   TERMINAL FILESYSTEM COMMANDS
   ============================================ */

interface FsCommandResult {
    output: string | null
    newCwd?: string
}

function handleTerminalCommand(command: string, cwd: string): FsCommandResult {
    const trimmed = command.trim()
    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]?.toLowerCase()

    // pwd
    if (cmd === 'pwd') {
        const display = cwd === '/' ? '/home/kudzai' : `/home/kudzai${cwd}`
        return { output: display }
    }

    // cd
    if (cmd === 'cd') {
        const target = parts[1] || '~'

        if (target === '~' || target === '/') {
            return { output: null, newCwd: '/' }
        }

        const resolved = resolvePath(cwd, target)
        const node = lookupNode(resolved)

        if (!node) {
            return { output: `bash: cd: ${parts[1]}: No such file or directory` }
        }
        if (node.type !== 'dir') {
            return { output: `bash: cd: ${parts[1]}: Not a directory` }
        }
        return { output: null, newCwd: resolved }
    }

    // ls
    if (cmd === 'ls') {
        const flags = parts.filter(p => p.startsWith('-')).join('')
        const hasLong = flags.includes('l')
        const hasAll = flags.includes('a')
        const target = parts.find(p => !p.startsWith('-') && p !== 'ls')

        let targetPath = cwd
        if (target) {
            targetPath = resolvePath(cwd, target)
        }

        const node = lookupNode(targetPath)
        if (!node) {
            return { output: `ls: cannot access '${target}': No such file or directory` }
        }
        if (node.type !== 'dir') {
            // ls on a file just shows the filename
            const name = targetPath.split('/').pop() || targetPath
            return { output: name }
        }

        if (hasLong) {
            const result = formatLs(node, !hasAll)
            return { output: result || null }
        } else {
            const result = formatLsShort(node, !hasAll)
            return { output: result || null }
        }
    }

    // cat
    if (cmd === 'cat') {
        const target = parts[1]
        if (!target) {
            return { output: 'cat: missing operand' }
        }

        const resolved = resolvePath(cwd, target)
        const node = lookupNode(resolved)

        if (!node) {
            return { output: `cat: ${target}: No such file or directory` }
        }
        if (node.type === 'dir') {
            return { output: `cat: ${target}: Is a directory` }
        }
        return { output: node.content }
    }

    return { output: null }
}

/* ============================================
   EASTER EGG COMMAND GENERATORS
   ============================================ */

const VIM_FILE_CONTENT = [
    '# TODO.md — last updated: today, probably',
    '',
    '[ ] Sleep more than 5 hours',
    '[x] Build custom animation state machine from scratch',
    '[x] Write 7-layer typing delay system for "vibes"',
    '[ ] Touch grass',
    '[x] Deploy ML pipeline processing millions daily',
    '[x] Make portfolio that impresses other developers',
    '[ ] Accept that this is enough',
    '[x] Add vim to portfolio terminal for this joke',
    '[ ] Stop adding features to portfolio',
    '[ ] Seriously, stop',
    '[x] Add one more feature',
].join('\n')

function generateNeofetch(): string {
    return [
        '    ┌───────────┐    visitor@kudzai',
        '    │  >_ █     │    ─────────────────',
        '    │           │    OS: Human 1.0 (Developer Edition)',
        '    │           │    Shell: Brain/zsh 5.9',
        '    └─────┬─────┘    Uptime: 4+ years (since freelance.init)',
        '          │          Memory: Selective (caffeine-backed)',
        '     ═════╧═════     Resolution: Varies by coffee intake',
        '                     DE: Terminal Minimalist',
        '                     CPU: ML-Core @ high-accuracy inference',
        '                     GPU: Full-Stack Rendering 4090',
        '                     Disk: 15+ projects / unlimited ambition',
        '                     Network: @kudzaiprichard (all nodes)',
    ].join('\n')
}

function generateWhoami(): string {
    return [
        'Kudzai Prichard — Backend Software Engineer | Distributed Systems | AI',
        '',
        'Engineer who builds distributed backend systems and ships them to production.',
        'Spent a year at Sybrin Imaging Solutions shipping OCR pipelines, ML models,',
        'and distributed APIs for tier-1 African banks across 6+ markets. Now',
        'co-founding Teleagents (AI voice infrastructure) and OurAfrica (offline-first',
        'e-learning). Builds open-source AI systems on the side — phishing detection,',
        'clinical decision support, crypto prediction microservices.',
        'Fluent in Python, C#, Java, TypeScript, and making machines do useful things.',
        '',
        'Currently: building the next thing. Always: building the next thing.',
    ].join('\n')
}

function generateHistory(): string {
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

function generateGitLog(): string {
    return [
        'commit a7f3b2e (HEAD -> main, tag: v2.0)',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Mon Mar 10 02:14:33 2025 +0200',
        '',
        '    feat: add terminal easter egg that you are reading right now',
        '',
        'commit 8d1c4f9',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Sat Mar 8 23:47:12 2025 +0200',
        '',
        '    perf: reduce model inference time significantly through optimization',
        '',
        'commit e2b8a71',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Thu Mar 6 18:22:05 2025 +0200',
        '',
        '    feat: implement 7-layer human typing simulation engine',
        '',
        'commit 3f9d0c2',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Mon Mar 3 14:33:41 2025 +0200',
        '',
        '    refactor: rewrite entire animation engine without libraries',
        '',
        'commit c4e7b38',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Fri Feb 28 09:15:27 2025 +0200',
        '',
        '    feat: deploy ML pipeline processing 1M+ data points daily',
        '',
        'commit 91a2d5e',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Wed Feb 26 03:42:18 2025 +0200',
        '',
        '    fix: sleep schedule (reverted after 2 hours)',
        '',
        'commit b5f8e03',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Mon Feb 24 16:08:52 2025 +0200',
        '',
        '    feat: build NLP sentiment analysis model with high accuracy',
        '',
        'commit 2e4a9d1',
        'Author: Kudzai Prichard <kudzai@example.com>',
        'Date:   Sat Feb 22 21:33:06 2025 +0200',
        '',
        "    init: portfolio v2.0 — because v1 wasn't enough",
    ].join('\n')
}

function generateGitBlame(): string {
    return [
        'a7f3b2e (caffeine          2025-03-10 02:14)  const motivation = "still going"',
        '8d1c4f9 (stack-overflow     2019-07-14 23:47)  // TODO: understand this later',
        'e2b8a71 (kudzai             2025-03-06 18:22)  function solveComplexProblem() {',
        '3f9d0c2 (caffeine           2025-03-03 03:33)    while (awake) { code() }',
        'c4e7b38 (stack-overflow     2019-11-02 09:15)    return magicNumber * 42',
        '91a2d5e (sheer-willpower    2025-02-26 03:42)  }',
        "b5f8e03 (kudzai             2025-02-24 16:08)  // this works. don't touch it.",
        '2e4a9d1 (caffeine           2025-02-22 21:33)  export default handleEverything',
        "f1c3d7a (future-kudzai      2026-12-31 00:00)  // I'll refactor this eventually",
    ].join('\n')
}

function generateHtop(): string {
    return [
        '  PID USER      PR   VIRT    RES  S  %CPU  %MEM  COMMAND',
        '    1 kudzai    20   99.9g  brain R  94.0  87.2  neural-net-training',
        '   42 kudzai    20   4.2g   stack S  78.3  45.1  full-stack-dev.service',
        '  100 kudzai    20   2.1g   eyes  R  65.0  32.8  code-review.loop',
        '  404 kudzai    20   1.8g   will  R  55.2  28.4  learning-new-things.loop',
        '  200 kudzai    20   512m   gut   S  43.1  12.0  ambition.exe',
        '  666 kudzai    20   256m   beans R  99.9  99.9  coffee-dependency.service',
        '    7 kudzai    20    64m   ego   S   0.0   0.1  imposter-syndrome (stopped)',
        '  500 kudzai    20   128m   rest  S   2.3   5.0  sleep.timer (overdue)',
        '',
        '  Uptime: 4+ years | Tasks: 7 running, 1 stopped',
        '  Mem: 16.0G/16.0G [||||||||||||||||||||||||||||||||] 99.9%',
        '  CPU:              [||||||||||||||||||||||||||||||  ] 94.0%',
    ].join('\n')
}

function generateHack(): string {
    return [
        '[*] Initializing breach protocol...',
        '[*] Scanning network interfaces...',
        '[*] Port scan: 22/tcp open  80/tcp open  443/tcp open  8080/tcp filtered',
        '[*] Bypassing firewall      [████████████████████] 100%',
        '[*] Decrypting credentials  [████████████████████] 100%',
        '[*] Injecting payload       [████████████████████] 100%',
        '[*] Escalating privileges   [████████████████████] 100%',
        '[*] Exfiltrating data...',
        '[*] Root access obtained.',
        '',
        '> Access granted. You were already in.',
    ].join('\n')
}

function generateCv(url: string): string {
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


function generateSl(): string {
    return [
        '                  ___',
        '            _-=-=|___|=-=-_',
        '           |  ___       ___ |              ____',
        '           | |   |     |   ||             /    \\',
        '   ________| |___|_____|___||___________ /      \\',
        '  |   ___                                |        |',
        '  |  |AI |   KUDZAI ENGINEERING CO.      |   ML   |',
        '  |  |___|________________________________|        |',
        '  |________________________________________________|',
        '       O-O           O-O           O-O      O-O',
        '   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '',
        '> sl — the steam locomotive that visits when you typo \'ls\'.',
        '> A classic Unix package. We honor the bit.',
        '> (You probably wanted: ls)',
    ].join('\n')
}

function generateMakeSandwich(): string {
    return [
        'What? Make it yourself.',
        '',
        '(If you really mean it, try with elevated privileges.)',
    ].join('\n')
}

function generateSudoSandwich(): string {
    return [
        '[sudo] password for visitor: ********',
        '',
        'Okay.',
        '',
        '         _____________________',
        '        |  bread              |',
        '        |---------------------|',
        '        |  lettuce   cheese   |',
        '        |---------------------|',
        '        |  tomato    bacon    |',
        '        |---------------------|',
        '        |  bread              |',
        '        |_____________________|',
        '',
        '> Sandwich delivered. xkcd #149 honored.',
    ].join('\n')
}

function generateKill(args: string): string {
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

function generateAscii(): string {
    return [
        '    ╭──────────────────────────────────╮',
        '    │                                  │',
        '    │    > const developer = {         │',
        '    │        name: "kudzai prichard",  │',
        '    │        role: "AI & Full Stack",  │',
        '    │        passion: "building",      │',
        '    │        status: "shipping"        │',
        '    │      };                          │',
        '    │                                  │',
        '    │    > developer.build()           │',
        '    │    // Output: this portfolio     │',
        '    │                                  │',
        '    ╰──────────────────────────────────╯',
    ].join('\n')
}

function generatePing(target: string): string {
    const t = target.toLowerCase()

    if (t === 'kudzai.dev' || t === 'kudzai') {
        return [
            'PING kudzai.dev (127.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=0.042ms',
            '64 bytes: icmp_seq=1 ttl=64 time=0.039ms',
            '64 bytes: icmp_seq=2 ttl=64 time=0.041ms',
            '--- kudzai.dev ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'round-trip min/avg/max = 0.039/0.041/0.042 ms',
            'Connection: flawless. As expected.',
        ].join('\n')
    }

    if (t === 'happiness') {
        return [
            'PING happiness (192.168.1.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=128 time=23ms   (debugging)',
            '64 bytes: icmp_seq=1 ttl=128 time=2ms    (deploying)',
            '64 bytes: icmp_seq=2 ttl=128 time=0.5ms  (it works first try)',
            '--- happiness ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'Latency correlates with distance from keyboard.',
        ].join('\n')
    }

    if (t === 'localhost' || t === '127.0.0.1') {
        return [
            'PING localhost (127.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=0.001ms',
            '',
            "You're already here. Focus.",
        ].join('\n')
    }

    if (t === 'google.com') {
        return [
            'PING google.com (142.250.80.46): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=117 time=4ms',
            '64 bytes: icmp_seq=1 ttl=117 time=3ms',
            '64 bytes: icmp_seq=2 ttl=117 time=4ms',
            '--- google.com ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'Google is up. So is this portfolio. Coincidence.',
        ].join('\n')
    }

    if (t === 'production' || t === 'prod') {
        return [
            'PING production (10.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=1ms',
            '64 bytes: icmp_seq=1 ttl=64 time=1ms',
            '--- production ping statistics ---',
            '2 packets transmitted, 2 received, 0% packet loss',
            'Production is stable. Kudzai deployed it.',
        ].join('\n')
    }

    // Generic ping
    const octet = () => Math.floor(Math.random() * 255)
    const ms = () => (Math.random() * 50 + 5).toFixed(1)
    return [
        `PING ${target} (${octet()}.${octet()}.${octet()}.${octet()}): 56 data bytes`,
        `64 bytes: icmp_seq=0 ttl=64 time=${ms()}ms`,
        `64 bytes: icmp_seq=1 ttl=64 time=${ms()}ms`,
        `64 bytes: icmp_seq=2 ttl=64 time=${ms()}ms`,
        `--- ${target} ping statistics ---`,
        '3 packets transmitted, 3 received, 0% packet loss',
    ].join('\n')
}

function generateSsh(target: string): string {
    return [
        `ssh: connect to host ${target || 'unknown'} port 22: Connection refused`,
        '',
        'Permission denied (publickey,keyboard-interactive).',
        "This server has standards. Try kudzai's actual GitHub instead:",
        'https://github.com/kudzaiprichard',
    ].join('\n')
}

function generateSudo(command: string): string {
    return [
        '[sudo] password for visitor: ********',
        'Privilege escalation successful.',
        '',
        'root@kudzai:~# cat /etc/personnel/kudzai-prichard.enc',
        '',
        'CLEARANCE: GRANTED',
        'PERSONNEL FILE: kudzai-prichard (decrypted)',
        '',
        'Subject profile:',
        '  - Deployed ML systems processing millions of data points daily',
        '  - Deployed ML systems processing high volumes of documents in production',
        '  - Built full-stack applications serving enterprise clients across markets',
        '  - Engineered 676-line particle system for ambient visual layer',
        '  - ML models deployed with high accuracy for tier-1 banking clients',
        '',
        'Assessment: Consistently exceeds operational parameters.',
        'Recommendation: Retain. Promote. Or at minimum, star the repo.',
    ].join('\n')
}

function generateMan(topic: string): string {
    const t = topic.toLowerCase()

    if (t === 'kudzai' || t === 'kudzai-prichard') {
        return [
            'KUDZAI(1)                   Developer Manual                  KUDZAI(1)',
            '',
            'NAME',
            '    kudzai — AI & Full Stack Developer',
            '',
            'SYNOPSIS',
            '    kudzai [--ai-ml] [--fullstack] [--ship-it] <problem>',
            '',
            'DESCRIPTION',
            '    Solves problems across the entire stack with emphasis on',
            '    machine learning and intelligent systems. Known to reduce',
            '    model inference times by 60% and maintain 100% client',
            '    satisfaction rates. Processes caffeine into production code.',
            '',
            'OPTIONS',
            '    --ai-ml       Enable ML pipeline mode (high-accuracy inference)',
            '    --fullstack   Cover frontend, backend, and everything between',
            '    --ship-it     Skip overthinking, deploy with confidence',
            '',
            'SEE ALSO',
            '    tensorflow(1), react(1), building-things-that-work(7)',
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
            '    In these hands, used for ML pipelines, API development,',
            '    automation bots, and the occasional script that saves',
            '    10+ hours per week. Others merely write Python.',
            '    Kudzai speaks it.',
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
            'TENSORFLOW(1)               Developer Manual              TENSORFLOW(1)',
            '',
            'NAME',
            '    tensorflow — ML framework for building intelligent systems',
            '',
            'DESCRIPTION',
            "    Open-source machine learning framework. Kudzai's models built",
            '    with this achieve high accuracy in sentiment analysis.',
            '    Inference time optimized significantly. The framework takes',
            '    partial credit.',
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
        `    ${topic} — as understood by kudzai prichard`,
        '',
        'DESCRIPTION',
        `    ${topic} is best approached with Python, a whiteboard, and`,
        "    unreasonable optimism. For implementation examples, see the",
        "    15+ shipped projects in ~/projects or the portfolio you're",
        '    currently exploring.',
        '',
        'SEE ALSO',
        '    kudzai(1), building-things-that-work(7), engineering-standards(7)',
    ].join('\n')
}

function generateCurl(args: string): string {
    if (args.includes('wttr.in')) {
        return [
            "Weather for: ~/home (Developer's Natural Habitat)",
            '',
            '    ☁  Overcast with a mass of ideas',
            '    Temperature: Warm (caffeine-fueled)',
            '    Humidity: 0% — zero tolerance for bugs',
            '    Wind: Constant (server fan noise)',
            '    UV Index: Low (indoor profession)',
            '',
            '    Forecast: Clear commits through end of week.',
            '    Advisory: High probability of shipping.',
        ].join('\n')
    }

    if (!args) {
        return "curl: try 'curl --help' for more information"
    }

    return `curl: (6) Could not resolve host: ${args.split(' ').pop()}\nTry curl wttr.in for something actually interesting.`
}

function generateDate(): string {
    const now = new Date()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${days[now.getDay()]} ${months[now.getMonth()]} ${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} CAT ${now.getFullYear()}\nSystem clock synchronized. Uptime: continuous since 2020.`
}

function generateEcho(text: string): string {
    if (!text) return ''
    return `${text}\n— transmitted via kudzai.dev infrastructure`
}

function generateHelp(): string {
    return [
        '── Just ask ───────────────────────────────────────────',
        '  Type a question in plain English and my AI will answer —',
        '  e.g. "what do you specialize in?" or "can I see your resume?"',
        '  Or use:  ask <question>',
        '',
        '── Navigation ─────────────────────────────────────────',
        '  cd <section>   view section content (home, about, projects, experience, contact)',
        '',
        '── Filesystem ─────────────────────────────────────────',
        '  ls [dir]       list contents (try ls -la for secrets)',
        '  cd <dir>       navigate the directory tree',
        '  pwd            print working directory',
        '  cat <file>     read file contents',
        '',
        '── System ─────────────────────────────────────────────',
        '  whoami         who built this',
        '  neofetch       system specs (human edition)',
        '  htop           what\'s running in this brain',
        '  kill <proc>    terminate a process (try: imposter-syndrome)',
        '  date           current time in the right timezone',
        '  history        a revealing session log',
        '  man <topic>    manual pages, lightly biased',
        '  echo <text>    echo, with infrastructure',
        '',
        '── Network ────────────────────────────────────────────',
        '  ping <host>    test latency (try: happiness)',
        '  ssh <host>     permission denied, politely',
        '  curl wttr.in   local weather conditions',
        '  sudo <cmd>     escalate privileges (results vary)',
        '',
        '── Git ────────────────────────────────────────────────',
        '  git log        commit history for portfolio v2.0',
        '  git blame      who wrote this (and what fueled them)',
        '',
        '── Reach out ──────────────────────────────────────────',
        '  cv             download my resume',
        '  email          open mail client with my address',
        '',
        '── Games ──────────────────────────────────────────────',
        '  snake          classic snake game (arrow keys)',
        '  adventure      a career-themed text adventure',
        '',
        '── Fun ────────────────────────────────────────────────',
        '  vim            open a file worth reading (:q exits)',
        '  ascii          display ASCII art',
        '  matrix         enter the matrix (5 sec)',
        '  hack           breach the mainframe',
        '  sl             see what happens when you typo \'ls\'',
        '  exit           close session (we\'ll miss you)',
        '  clear          clear terminal',
        '',
        'Tab to autocomplete. → to accept ghost suggestion. Up/Down for command history.',
    ].join('\n')
}

/* ============================================
   COMMAND ALIAS RESOLUTION
   ============================================ */

/** Simple alias map: alias → canonical command name */
const COMMAND_ALIASES: Record<string, string> = {
    // Filesystem
    'dir':        'ls',
    'type':       'cat',
    'less':       'cat',
    'more':       'cat',
    'head':       'cat',
    'tail':       'cat',
    'bat':        'cat',

    // System
    '?':          'help',
    'commands':   'help',
    'id':         'whoami',
    'finger':     'whoami',
    'screenfetch':'neofetch',
    'fastfetch':  'neofetch',
    'sysinfo':    'neofetch',
    'systeminfo': 'neofetch',
    'top':        'htop',
    'ps':         'htop',
    'free':       'htop',
    'time':       'date',
    'print':      'echo',
    'printf':     'echo',

    // Network
    'wget':       'curl',
    'fetch':      'curl',
    'http':       'curl',
    'su':         'sudo',
    'doas':       'sudo',
    'runas':      'sudo',
    'telnet':     'ssh',

    // Editors
    'nvim':       'vim',
    'emacs':      'vim',
    'code':       'vim',
    'edit':       'vim',
    'pico':       'vim',
    'micro':      'vim',
    'notepad':    'vim',
    'ed':         'vim',

    // Reach-out
    'resume':     'cv',
    'download':   'cv',
    'mail':       'email',
    'mailto':     'email',

    // Process
    'pkill':      'kill',
    'killall':    'kill',

    // Fun / misc
    'cls':        'clear',
    'reset':      'clear',
    'cmatrix':    'matrix',
    'quit':       'exit',
    'q':          'exit',
    'logout':     'exit',
    'bye':        'exit',
    'close':      'exit',
    'disconnect': 'exit',
    'nmap':       'hack',
    'exploit':    'hack',
    'metasploit': 'hack',
    'pentest':    'hack',
    'figlet':     'ascii',
    'cowsay':     'ascii',
    'banner':     'ascii',
    'zork':       'adventure',
    'quest':      'adventure',
}

/**
 * Resolve common shell aliases to canonical commands.
 * Preserves the original argument casing and spacing.
 */
function resolveAlias(command: string): string {
    const trimmed = command.trim()
    if (!trimmed) return command

    const parts = trimmed.split(/\s+/)
    const cmd = parts[0].toLowerCase()

    // Preserve everything after the command name (with original casing)
    const rest = trimmed.slice(parts[0].length)

    // Aliases that expand with implicit flags
    if (cmd === 'll') return 'ls -l' + rest
    if (cmd === 'la') return 'ls -la' + rest

    const canonical = COMMAND_ALIASES[cmd]
    if (canonical) return canonical + rest

    return command
}

/* ============================================
   GUIDED TOUR + SCRIPTED ONBOARDING
   ============================================ */

/** Natural phrasings that launch the guided tour without an AI round-trip. */
const TOUR_TRIGGERS: ReadonlySet<string> = new Set([
    'tour', 'take a tour', 'take the tour', 'start tour', 'start the tour',
    'show me around', 'give me a tour', 'guided tour', 'walk me through',
    'show me round', 'show me around the site',
])

function isTourTrigger(trimmed: string): boolean {
    return TOUR_TRIGGERS.has(trimmed)
}

/** Phrasings that launch the step-by-step contact flow. */
const CONTACT_TRIGGERS: ReadonlySet<string> = new Set([
    'email', 'contact', 'contact you', 'get in touch', 'send a message',
    'send message', 'message you', 'reach you', 'reach out', 'hire you',
    'i want to hire you', 'work with you', 'email you', 'leave a message',
])

function isContactTrigger(trimmed: string): boolean {
    return CONTACT_TRIGGERS.has(trimmed)
}

/** Basic email-shape validation for the contact flow. */
const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Scripted, instant replies for greetings and "what is this?" — the most common
 * first interaction from non-technical visitors. Handled without calling Gemini
 * so it's immediate, free, and reliable.
 */
function matchOnboarding(trimmed: string): string | null {
    const greetings = [
        'hi', 'hello', 'hey', 'yo', 'hi there', 'hello there', 'hey there',
        'howdy', 'sup', 'greetings', 'hallo', 'hie', 'hiya', 'good morning',
        'good afternoon', 'good evening', 'hey kudzai', 'hi kudzai',
    ]
    const explainers = [
        'what is this', 'whats this', "what's this", 'what is this site',
        'what is this place', 'what can you do', 'what can i do here',
        'what do i do', 'what do i do here', 'how does this work',
        'how do i use this', 'i am lost', "i'm lost", 'im lost', 'what now',
        'where do i start', 'how do i start', 'what is this thing',
    ]
    if (greetings.includes(trimmed)) {
        return [
            "Hey — I'm Kudzai's assistant, right here in the terminal.",
            "You don't need to know any commands. Just ask me anything in plain English,",
            'like "what do you do?" or "can I see your projects?".',
            "Or type 'tour' and I'll walk you through everything.",
        ].join('\n')
    }
    if (explainers.includes(trimmed)) {
        return [
            "This is Kudzai Prichard's interactive portfolio — a terminal you can actually talk to.",
            "I'm his AI assistant. Ask me anything about his work, skills, projects, or how to",
            'get in touch — no commands needed.',
            "New here? Type 'tour' and I'll show you around, or tap a suggestion below.",
        ].join('\n')
    }
    return null
}

/** A stop on the guided tour: a line of narration, then that section rendered. */
interface TourStep {
    section: NavigableSection
    narration: string
}

const TOUR_STEPS: readonly TourStep[] = [
    { section: 'about', narration: "First, a bit about who I am and what I work on." },
    { section: 'projects', narration: "Next — some of the things I've actually built. This is where I spend most of my time." },
    { section: 'experience', narration: "Here's where I've done the work: the companies, the roles, the real production systems." },
    { section: 'contact', narration: "And that's the tour. If you'd like to talk, here's how to reach me — or just ask me to send a message." },
]

/** Prompt shown while the guided tour waits for the visitor to continue. */
const TOUR_PROMPT = "[tour] press enter for next ▸ or ask me anything · "

/** Default chips shown after a scripted onboarding reply. */
const ONBOARDING_SUGGESTIONS: readonly string[] = [
    'Take a tour', 'What do you do?', 'See your projects', 'How can I reach you?',
]

/** Chips shown after the guided tour finishes. */
const POST_TOUR_SUGGESTIONS: readonly string[] = [
    'Download your CV', 'Tell me about your experience', 'How can I reach you?',
]

/**
 * Decide whether plain-English input should be handled by the agent layer
 * (tour, scripted onboarding, explicit ask, or auto-detected question).
 * Shared by every section so the AI is reachable everywhere, not just the
 * dedicated terminal. Returns null when the input is better treated as a
 * typo'd command (the caller then offers "did you mean").
 */
function routeNaturalLanguage(command: string, sectionId: TerminalSectionId): CommandResponse | null {
    const trimmed = command.trim().toLowerCase()

    // Guided tour — explicit command or natural phrasing. Instant, no AI call.
    if (isTourTrigger(trimmed)) return { response: null, startTour: true }

    // Contact flow — explicit command or natural phrasing. Instant, no AI call,
    // so it works even when the AI is rate-limited.
    if (isContactTrigger(trimmed)) return { response: null, startContact: true }

    // Scripted onboarding for greetings / "what is this" — instant, no AI call.
    const onboardingReply = matchOnboarding(trimmed)
    if (onboardingReply) return { response: onboardingReply, onboarding: true }

    // Explicit AI invocation: `ask <question>` / `ai <question>` / `chat ...`.
    const cmd = trimmed.split(/\s+/)[0]
    if (cmd === 'ask' || cmd === 'ai' || cmd === 'chat') {
        const query = command.trim().slice(cmd.length).trim()
        if (!query) {
            return { response: "Ask me anything — e.g. `ask what do you specialize in?` or just type your question." }
        }
        return { response: null, askAI: query }
    }

    // Auto-detect natural language: route questions / multi-word phrases to the
    // agent; leave close single-token typos for the caller's "did you mean".
    const wordCount = trimmed.split(/\s+/).length
    const closest = findClosestCommand(command, sectionId)
    const looksLikeQuestion = /[?]/.test(command) || wordCount >= 2
    if (looksLikeQuestion || !closest) {
        return { response: null, askAI: command.trim() }
    }
    return null
}

/* ============================================
   NON-TERMINAL COMMAND RESPONSES
   ============================================ */

function getCommandResponse(sectionId: TerminalSectionId, command: string, cwd: string): CommandResponse {
    const trimmed = command.trim().toLowerCase()

    // Terminal section — full command set
    if (sectionId === 'terminal') {
        if (trimmed === '' || trimmed === 'clear') return { response: null }

        const parts = trimmed.split(/\s+/)
        const cmd = parts[0]
        const rawParts = command.trim().split(/\s+/)

        // Section navigation via cd — renders content inline
        if (cmd === 'cd') {
            const target = (parts[1] || '').replace(/^[/#]+/, '')
            if (NAV_SECTIONS[target]) {
                return {
                    response: null,
                    renderSection: NAV_SECTIONS[target],
                }
            }
        }

        // Filesystem commands
        if (cmd === 'cd' || cmd === 'ls' || cmd === 'pwd' || cmd === 'cat') {
            const result = handleTerminalCommand(command.trim(), cwd)
            return { response: result.output, newCwd: result.newCwd }
        }

        // System commands
        if (cmd === 'help') return { response: generateHelp() }
        if (cmd === 'whoami') return { response: generateWhoami() }
        if (cmd === 'neofetch') return { response: generateNeofetch(), loadingMessages: LOADING_SETS.neofetch }
        if (cmd === 'htop') return { response: generateHtop(), loadingMessages: LOADING_SETS.htop }
        if (cmd === 'date') return { response: generateDate() }
        if (cmd === 'history') return { response: generateHistory() }
        if (cmd === 'man') {
            const topic = rawParts.slice(1).join(' ') || 'kudzai'
            return { response: generateMan(topic) }
        }
        if (cmd === 'echo') {
            const text = command.trim().slice(5) // preserve original casing
            return { response: generateEcho(text) }
        }
        if (cmd === 'kill') {
            const args = command.trim().slice(4)
            return { response: generateKill(args) }
        }

        // Reach-out commands — turn the easter egg into a conversion path
        if (cmd === 'cv') {
            const url = contact.resumeUrl
            const isExternal = /^https?:\/\//.test(url)
            // Same-origin → use download attribute (forces save dialog).
            // Cross-origin → open in new tab; the `download` attr is ignored on
            // cross-origin URLs without proper Content-Disposition headers, and
            // would otherwise navigate the visitor away from the portfolio.
            return {
                response: generateCv(url),
                ...(isExternal ? { openUrl: url } : { downloadUrl: url }),
            }
        }
        if (cmd === 'email') {
            // Launch the in-terminal step-by-step contact flow (no mail client,
            // no AI needed). Falls through to startContact handling.
            return { response: null, startContact: true }
        }

        // Network commands
        if (cmd === 'ping') {
            const target = rawParts[1]
            if (!target) return { response: 'Usage: ping <host>' }
            return { response: generatePing(target) }
        }
        if (cmd === 'ssh') {
            const target = rawParts[1] || 'unknown'
            return { response: generateSsh(target), loadingMessages: LOADING_SETS.ssh }
        }
        if (cmd === 'curl') {
            const args = command.trim().slice(5)
            return { response: generateCurl(args), loadingMessages: LOADING_SETS.curl }
        }
        // xkcd #149 — must come BEFORE the generic sudo handler
        if (trimmed === 'sudo make me a sandwich') {
            return { response: generateSudoSandwich(), loadingMessages: LOADING_SETS.sudo }
        }
        if (trimmed === 'make me a sandwich') {
            return { response: generateMakeSandwich() }
        }
        if (cmd === 'sudo') {
            const subCmd = command.trim().slice(5)
            return { response: generateSudo(subCmd), loadingMessages: LOADING_SETS.sudo }
        }

        // Git commands
        if (cmd === 'git') {
            const sub = parts[1]
            if (sub === 'log' || sub === 'hist' || sub === 'history') return { response: generateGitLog(), loadingMessages: LOADING_SETS['git-log'] }
            if (sub === 'blame' || sub === 'annotate') return { response: generateGitBlame(), loadingMessages: LOADING_SETS['git-blame'] }
            return { response: `git: '${parts.slice(1).join(' ')}' is not a git command.\nTry 'git log' or 'git blame'.` }
        }

        // Fun commands
        if (cmd === 'vim' || cmd === 'vi' || cmd === 'nano') {
            return { response: null, enterMode: 'vim', vimContent: VIM_FILE_CONTENT }
        }
        if (cmd === 'ascii') return { response: generateAscii() }
        if (cmd === 'sl') return { response: generateSl() }
        if (cmd === 'matrix') {
            return { response: null, enterMode: 'matrix' }
        }
        if (cmd === 'hack') return { response: generateHack() }
        if (cmd === 'snake') {
            return { response: null, enterMode: 'snake' }
        }
        if (cmd === 'adventure') {
            return { response: null, enterMode: 'adventure' }
        }

        if (cmd === 'exit') {
            return { response: 'logout\nConnection to kudzai.dev closed. Come back anytime.' }
        }

        // Agent layer: tour / onboarding / explicit ask / auto-detected question.
        const aiRoute = routeNaturalLanguage(command, 'terminal')
        if (aiRoute) return aiRoute

        // Single-token typo with a close command match — keep the classic hint.
        const closest = findClosestCommand(command, 'terminal')
        const didYouMean = closest ? `\nDid you mean: ${closest}?` : ''
        return { response: `bash: ${command.trim()}: command not found${didYouMean}\nType 'help' for available commands, or just ask me a question.` }
    }

    // Non-terminal sections — original behavior
    if (trimmed === 'help') {
        return {
            response: [
                'Available commands:',
                '  help               show this message',
                '  ls                 list directory contents',
                '  clear              clear command history',
                '  whoami             about the developer',
                '  cd <section>       navigate to section (home, about, projects, experience, contact)',
                '  sudo               elevate privileges',
                '  exit               close session',
            ].join('\n'),
        }
    }

    if (trimmed === 'clear') return { response: null }

    if (trimmed.startsWith('sudo')) {
        return { response: '[sudo] password for visitor: ********\nNice try. This portfolio runs on vibes, not root access.' }
    }

    if (trimmed === 'exit') {
        return { response: 'logout\nConnection to kudzai.dev closed. Come back anytime.' }
    }

    if (trimmed === 'whoami') {
        return { response: 'kudzai prichard — AI & Full Stack Developer\nBuilding intelligent systems, one commit at a time.' }
    }

    // Section navigation via cd — scrolls to target section
    if (trimmed.startsWith('cd ')) {
        const target = trimmed.slice(3).trim().replace(/^[/#]+/, '')
        if (NAV_SECTIONS[target]) {
            return { response: null, navigateTo: NAV_SECTIONS[target] }
        }
    }

    if (trimmed === 'cd ..' || trimmed === 'cd ~' || trimmed === 'cd') {
        return { response: "Nice try, but you're already home.\nUse arrow keys or cd <section> to navigate." }
    }

    if (trimmed === 'ls' || trimmed === 'ls -la' || trimmed === 'ls -l' || trimmed === 'ls -al') {
        return { response: getLsOutput(sectionId) }
    }

    if (trimmed === '') return { response: null }

    // Agent layer is available on every section — route natural language to it.
    const aiRoute = routeNaturalLanguage(command, sectionId)
    if (aiRoute) return aiRoute

    const closest = findClosestCommand(command, sectionId)
    const didYouMean = closest ? `\nDid you mean: ${closest}?` : ''
    return { response: `bash: ${command.trim()}: command not found${didYouMean}\nType 'help' for available commands, or just ask me a question.` }
}

/* ============================================
   PROMPT HELPER
   ============================================ */

function cwdToPrompt(cwd: string): string {
    if (cwd === '/') return 'visitor@kudzai:~$ '
    return `visitor@kudzai:~${cwd}$ `
}

/* ============================================
   HOOK
   ============================================ */

export function useTerminalInput(options: UseTerminalInputOptions): UseTerminalInputReturn {
    const { sectionId, isActive, onAgentReply, onAgentInterrupt } = options

    // Latest voice callbacks in refs, so timers/handlers read them without
    // re-binding. Updated every render below.
    const onAgentReplyRef = useRef(onAgentReply)
    const onAgentInterruptRef = useRef(onAgentInterrupt)
    onAgentReplyRef.current = onAgentReply
    onAgentInterruptRef.current = onAgentInterrupt

    const [inputText, setInputText] = useState('')
    const [history, setHistory] = useState<TerminalLine[]>([])
    const [isTypingResponse, setIsTypingResponse] = useState(false)
    const [responseText, setResponseText] = useState('')
    const [responseVariant, setResponseVariant] = useState<'agent' | undefined>(undefined)
    const pendingVariantRef = useRef<'agent' | undefined>(undefined)
    const [cwd, setCwd] = useState('/')
    const [mode, setMode] = useState<TerminalMode>('normal')
    const [vimContent, setVimContent] = useState('')
    const [vimCommand, setVimCommand] = useState('')
    const [displayedSection, setDisplayedSection] = useState<NavigableSection | null>(null)
    // True once the AI agent has answered at least once — gates the quick-action chips.
    const [agentUsed, setAgentUsed] = useState(false)
    // Contextual follow-up chips suggested by the agent (or onboarding defaults).
    const [agentSuggestions, setAgentSuggestions] = useState<readonly string[]>([])
    // Mirror of isThinkingRef as state, so the orb re-renders on change.
    const [thinking, setThinking] = useState(false)
    // When set, the NEXT agent reply is spoken aloud (voice-initiated only).
    const shouldSpeakRef = useRef(false)
    // Current step index of the guided tour.
    const tourStepRef = useRef(0)

    // ── Contact flow state ──
    const contactStepRef = useRef<'name' | 'email' | 'message' | 'retry'>('name')
    const contactDataRef = useRef<{ name: string; email: string; message: string }>({
        name: '', email: '', message: '',
    })
    // Indirection so the keydown handler can call the latest step handler.
    const submitContactStepRef = useRef<((raw: string) => void) | null>(null)
    const displayedSectionRef = useRef<NavigableSection | null>(null)
    const pendingSectionLinesRef = useRef<string[] | null>(null)
    const sectionLineIndexRef = useRef(0)
    const lineIdRef = useRef(0)
    const inputTextRef = useRef('')
    const cwdRef = useRef('/')
    const responseTimersRef = useRef<NodeJS.Timeout[]>([])
    const pendingResponseRef = useRef<string | null>(null)
    const isTypingRef = useRef(false)
    const modeRef = useRef<TerminalMode>('normal')
    const vimCommandRef = useRef('')
    const matrixTimerRef = useRef<NodeJS.Timeout | null>(null)

    // ── AI agent state ──
    // Multi-turn conversation history sent to /api/chat. Capped server-side too.
    const chatHistoryRef = useRef<ChatMessage[]>([])
    // Interval driving the "thinking" spinner while we await the API.
    const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
    // True while awaiting the API. Swallows keystrokes so a network wait
    // can't be "skipped" like the typing animation can.
    const isThinkingRef = useRef(false)
    // Stable indirection so agent-run commands can re-enter the dispatcher,
    // which is defined further down. Assigned via effect below.
    const processCommandRef = useRef<((command: string) => void) | null>(null)
    // Stable indirection to launch the tour from runAgentQuery (defined later).
    const startTourRef = useRef<(() => void) | null>(null)

    // Game hooks
    const snakeGame = useSnakeGame()
    const adventureGame = useAdventureGame()
    const [adventurePrompt, setAdventurePrompt] = useState('')

    // Command history for session (ref, not state — spec requirement)
    const commandHistoryRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const savedInputRef = useRef('')

    const clearResponseTimers = useCallback(() => {
        responseTimersRef.current.forEach(t => clearTimeout(t))
        responseTimersRef.current = []
    }, [])

    const completeResponseImmediately = useCallback(() => {
        clearResponseTimers()
        // Interrupting a reply also stops it being spoken aloud.
        onAgentInterruptRef.current?.()

        // Flush remaining section content lines
        if (pendingSectionLinesRef.current) {
            const remaining = pendingSectionLinesRef.current.slice(sectionLineIndexRef.current)
            pendingSectionLinesRef.current = null
            sectionLineIndexRef.current = 0
            if (remaining.length > 0) {
                setHistory(prev => [...prev, ...remaining.map(text => ({
                    id: ++lineIdRef.current,
                    type: 'output' as const,
                    text,
                }))])
            }
        }

        if (pendingResponseRef.current) {
            const text = pendingResponseRef.current
            const variant = pendingVariantRef.current
            pendingResponseRef.current = null
            pendingVariantRef.current = undefined
            setHistory(prev => [...prev, {
                id: ++lineIdRef.current,
                type: 'output' as const,
                text,
                variant,
            }])
        }
        setResponseText('')
        setResponseVariant(undefined)
        setIsTypingResponse(false)
        isTypingRef.current = false
    }, [clearResponseTimers])

    const typeResponse = useCallback((text: string, onComplete?: () => void, variant?: 'agent') => {
        setIsTypingResponse(true)
        isTypingRef.current = true
        setResponseText('')
        setResponseVariant(variant)
        pendingResponseRef.current = text
        pendingVariantRef.current = variant
        clearResponseTimers()

        // Speak agent replies aloud ONLY when the question was asked by voice.
        if (variant === 'agent' && shouldSpeakRef.current) {
            onAgentReplyRef.current?.(text)
            shouldSpeakRef.current = false
        }

        for (let i = 0; i <= text.length; i++) {
            const timer = setTimeout(() => {
                if (i < text.length) {
                    setResponseText(text.slice(0, i + 1))
                } else {
                    setHistory(prev => [...prev, {
                        id: ++lineIdRef.current,
                        type: 'output' as const,
                        text,
                        variant,
                    }])
                    setResponseText('')
                    setResponseVariant(undefined)
                    setIsTypingResponse(false)
                    isTypingRef.current = false
                    pendingResponseRef.current = null
                    pendingVariantRef.current = undefined
                    onComplete?.()
                }
            }, i * RESPONSE_CHAR_SPEED)
            responseTimersRef.current.push(timer)
        }
    }, [clearResponseTimers])

    const showLoadingThenResponse = useCallback((text: string, messages: string[]) => {
        setIsTypingResponse(true)
        isTypingRef.current = true
        pendingResponseRef.current = text
        clearResponseTimers()

        const spinnerFrames = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F']
        const FRAME_MS = 80
        const framesPerMsg = 5
        const totalFrames = framesPerMsg * messages.length

        for (let i = 0; i < totalFrames; i++) {
            const timer = setTimeout(() => {
                const spinner = spinnerFrames[i % spinnerFrames.length]
                const msgIdx = Math.min(Math.floor(i / framesPerMsg), messages.length - 1)
                setResponseText(`${spinner} ${messages[msgIdx]}`)
            }, i * FRAME_MS)
            responseTimersRef.current.push(timer)
        }

        const loadingDuration = totalFrames * FRAME_MS
        for (let i = 0; i <= text.length; i++) {
            const timer = setTimeout(() => {
                if (i < text.length) {
                    setResponseText(text.slice(0, i + 1))
                } else {
                    setHistory(prev => [...prev, {
                        id: ++lineIdRef.current,
                        type: 'output' as const,
                        text,
                    }])
                    setResponseText('')
                    setIsTypingResponse(false)
                    isTypingRef.current = false
                    pendingResponseRef.current = null
                }
            }, loadingDuration + i * RESPONSE_CHAR_SPEED)
            responseTimersRef.current.push(timer)
        }
    }, [clearResponseTimers])

    const renderSectionContent = useCallback((section: NavigableSection) => {
        clearResponseTimers()

        displayedSectionRef.current = section
        setDisplayedSection(section)

        setIsTypingResponse(true)
        isTypingRef.current = true
        setResponseText('')

        const statusLine = CD_STATUS_LINES[section]
        const baseSpeed = getBaseSpeedForSection('terminal')
        const contentLines = formatSectionLines(section)

        // Store all lines for skip-ahead
        const allLines = [statusLine, ...contentLines]
        pendingSectionLinesRef.current = allLines
        sectionLineIndexRef.current = 0

        // Phase 1: Type status line char by char with human-feel timing
        let elapsed = 0
        for (let i = 0; i < statusLine.length; i++) {
            const charDelay = calculateHumanCharDelay(statusLine[i], i, statusLine, baseSpeed)
            const timer = setTimeout(() => {
                setResponseText(statusLine.slice(0, i + 1))
            }, elapsed)
            responseTimersRef.current.push(timer)
            elapsed += charDelay
        }

        // Status line complete — move to history
        elapsed += 180
        const statusDoneTimer = setTimeout(() => {
            sectionLineIndexRef.current = 1 // status line consumed
            setHistory(prev => [...prev, {
                id: ++lineIdRef.current,
                type: 'output' as const,
                text: statusLine,
            }])
            setResponseText('')
        }, elapsed)
        responseTimersRef.current.push(statusDoneTimer)

        // Phase 2: Add content lines progressively with varied timing
        elapsed += 120
        for (let i = 0; i < contentLines.length; i++) {
            const lineDelay = calculateLineDelay(contentLines[i])
            const timer = setTimeout(() => {
                sectionLineIndexRef.current = i + 2 // +1 for status line, +1 for this line
                setHistory(prev => [...prev, {
                    id: ++lineIdRef.current,
                    type: 'output' as const,
                    text: contentLines[i],
                }])
            }, elapsed)
            responseTimersRef.current.push(timer)
            elapsed += lineDelay
        }

        // Phase 3: Unlock input
        const unlockTimer = setTimeout(() => {
            pendingSectionLinesRef.current = null
            sectionLineIndexRef.current = 0
            setIsTypingResponse(false)
            isTypingRef.current = false
            pendingResponseRef.current = null
        }, elapsed + 80)
        responseTimersRef.current.push(unlockTimer)
    }, [clearResponseTimers])

    /* ── AI agent ────────────────────────────────────────────────────────── */

    // Animated "thinking" spinner shown while we await /api/chat. Distinct from
    // the typing animation: isThinkingRef (not isTypingRef) gates it, so a
    // keypress can't "skip" a network round-trip — keys are swallowed instead.
    const startThinking = useCallback((messages?: string[]) => {
        clearResponseTimers()
        setIsTypingResponse(true)
        isThinkingRef.current = true
        setThinking(true)

        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        const msgs = messages ?? ['Thinking', 'Pulling that together', 'Almost there']
        let i = 0
        const tick = () => {
            const spinner = frames[i % frames.length]
            const msg = msgs[Math.min(Math.floor(i / 28), msgs.length - 1)]
            const dots = '.'.repeat((Math.floor(i / 5) % 3) + 1)
            setResponseText(`${spinner} ${msg}${dots}`)
            i++
        }
        tick()
        thinkingTimerRef.current = setInterval(tick, 90)
    }, [clearResponseTimers])

    const stopThinking = useCallback(() => {
        if (thinkingTimerRef.current) {
            clearInterval(thinkingTimerRef.current)
            thinkingTimerRef.current = null
        }
        isThinkingRef.current = false
        setThinking(false)
        setResponseText('')
    }, [])

    // Map an agent action onto an existing terminal side-effect. Only the
    // "instant" effects live here (navigate / open link / download). Inline
    // renders (showSection / runCommand) are deferred by the caller so they
    // appear AFTER the agent's spoken reply, not on top of it.
    const executeAgentAction = useCallback((action: AgentAction) => {
        switch (action.type) {
            case 'navigate': {
                const el = document.getElementById(action.section)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                    el.focus({ preventScroll: true })
                }
                break
            }
            case 'openLink': {
                const url =
                    action.target === 'github' ? contact.githubUrl
                    : action.target === 'linkedin' ? contact.linkedinUrl
                    : action.target === 'twitter' ? contact.twitterUrl
                    : `mailto:${contact.email}`
                window.open(url, '_blank', 'noopener,noreferrer')
                break
            }
            case 'downloadResume': {
                const url = contact.resumeUrl
                if (/^https?:\/\//.test(url)) {
                    window.open(url, '_blank', 'noopener,noreferrer')
                } else {
                    const link = document.createElement('a')
                    link.href = url
                    link.rel = 'noopener'
                    link.setAttribute('download', '')
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
                break
            }
            // 'showSection' and 'runCommand' are handled by runAgentQuery's
            // deferred step — they produce terminal output, not a side-effect.
        }
    }, [])

    const runAgentQuery = useCallback(async (query: string) => {
        // Record the user's turn; keep the client-side window bounded too.
        chatHistoryRef.current.push({ role: 'user', content: query })
        if (chatHistoryRef.current.length > 12) {
            chatHistoryRef.current = chatHistoryRef.current.slice(-12)
        }

        startThinking()

        let data: { text?: string; actions?: AgentAction[]; suggestions?: string[] }
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistoryRef.current }),
            })
            data = await res.json()
        } catch {
            stopThinking()
            typeResponse("Couldn't reach my AI side just now. Try again in a moment, or type `email` to contact me directly.", undefined, 'agent')
            return
        }

        stopThinking()

        const text = (typeof data.text === 'string' && data.text.trim())
            ? data.text.trim()
            : 'Ask me about my experience, projects, skills, or how to get in touch.'
        const actions: AgentAction[] = Array.isArray(data.actions) ? data.actions : []

        chatHistoryRef.current.push({ role: 'model', content: text })
        setAgentUsed(true)
        setAgentSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])

        // Fire instant side-effects now; hold inline-render / tour actions until
        // the reply finishes typing. Only the first deferred action is honored to
        // avoid two animations fighting over the output area.
        const isDeferred = (a: AgentAction) =>
            a.type === 'showSection' || a.type === 'runCommand' || a.type === 'startTour'
        const deferred = actions.find(isDeferred)
        for (const a of actions) {
            if (!isDeferred(a)) executeAgentAction(a)
        }

        typeResponse(text, deferred
            ? () => {
                if (deferred.type === 'showSection') renderSectionContent(deferred.section)
                else if (deferred.type === 'runCommand') processCommandRef.current?.(deferred.command)
                else if (deferred.type === 'startTour') startTourRef.current?.()
            }
            : undefined, 'agent')
    }, [startThinking, stopThinking, typeResponse, executeAgentAction, renderSectionContent])

    /* ── Guided tour ─────────────────────────────────────────────────────── */

    const finishTour = useCallback((silent?: boolean) => {
        modeRef.current = 'normal'
        setMode('normal')
        tourStepRef.current = 0
        if (!silent) {
            setAgentUsed(true)
            setAgentSuggestions(POST_TOUR_SUGGESTIONS)
        }
    }, [])

    // Run one tour stop: type the narration, then render that section inline.
    const runTourStep = useCallback((step: number) => {
        if (step >= TOUR_STEPS.length) {
            finishTour()
            typeResponse("That's the whirlwind tour. Ask me anything, or pick a suggestion below.", undefined, 'agent')
            return
        }
        tourStepRef.current = step
        const { section, narration } = TOUR_STEPS[step]
        typeResponse(narration, () => renderSectionContent(section), 'agent')
    }, [finishTour, typeResponse, renderSectionContent])

    const startTour = useCallback(() => {
        clearResponseTimers()
        modeRef.current = 'tour'
        setMode('tour')
        tourStepRef.current = 0
        setAgentUsed(true)
        setAgentSuggestions([])
        typeResponse(
            "Happy to show you around. I'll walk you through the highlights — press Enter to move to the next stop, or ask me anything at any time to jump out.",
            () => runTourStep(0),
            'agent',
        )
    }, [clearResponseTimers, typeResponse, runTourStep])

    // Keep the ref current so runAgentQuery (defined above) can launch the tour.
    useEffect(() => {
        startTourRef.current = startTour
    }, [startTour])

    /* ── Contact flow (no AI — works even when the agent is rate-limited) ──── */

    const sendContact = useCallback(() => {
        startThinking(['Sending your message', 'Almost there'])
        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactDataRef.current),
        })
            .then(async res => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
            .then(({ ok, body }) => {
                stopThinking()
                if (ok && body?.success) {
                    modeRef.current = 'normal'
                    setMode('normal')
                    const email = contactDataRef.current.email
                    typeResponse(
                        `Sent ✓ — your message is in Kudzai's inbox, and a copy went to ${email}. He'll be in touch. Anything else I can help with?`,
                        undefined, 'agent',
                    )
                    setAgentUsed(true)
                    setAgentSuggestions(['See his projects', 'Download his CV', 'What does he do?'])
                } else {
                    contactStepRef.current = 'retry'
                    const reason = typeof body?.error === 'string' ? body.error : 'something went wrong on our end'
                    typeResponse(`Hmm — it didn't send: ${reason}. Want me to try again? (yes / no)`, undefined, 'agent')
                }
            })
            .catch(() => {
                stopThinking()
                contactStepRef.current = 'retry'
                typeResponse("Hmm — I couldn't reach the server (looks like a network hiccup). Want me to try again? (yes / no)", undefined, 'agent')
            })
    }, [startThinking, stopThinking, typeResponse])

    const submitContactStep = useCallback((raw: string) => {
        const value = raw.trim()
        const low = value.toLowerCase()
        const step = contactStepRef.current

        // Let the visitor bail out (except mid-message, where the text is theirs).
        if (step !== 'message' && ['exit', 'cancel', 'quit', 'stop'].includes(low)) {
            modeRef.current = 'normal'
            setMode('normal')
            typeResponse('No problem — cancelled. Ask me anything else.', undefined, 'agent')
            return
        }

        if (step === 'name') {
            if (!value) { typeResponse("I'll need a name to go on — what should I call you?", undefined, 'agent'); return }
            contactDataRef.current = { name: value, email: '', message: '' }
            contactStepRef.current = 'email'
            typeResponse(`Thanks, ${value}. What's the best email to reach you on?`, undefined, 'agent')
            return
        }
        if (step === 'email') {
            if (!CONTACT_EMAIL_RE.test(value)) {
                typeResponse("That doesn't look like a valid email — mind typing it again?", undefined, 'agent')
                return
            }
            contactDataRef.current.email = value
            contactStepRef.current = 'message'
            typeResponse('Got it. And what would you like to say?', undefined, 'agent')
            return
        }
        if (step === 'message') {
            if (!value) { typeResponse("Add a short message and I'll send it along.", undefined, 'agent'); return }
            contactDataRef.current.message = value
            sendContact()
            return
        }
        if (step === 'retry') {
            if (['yes', 'y', 'retry', 'ok', 'sure', 'yeah', 'yep'].includes(low)) {
                // Resend the details already given — no need to re-type them.
                sendContact()
            } else {
                modeRef.current = 'normal'
                setMode('normal')
                typeResponse(`No worries. You can also reach me directly at ${contact.email}.`, undefined, 'agent')
            }
        }
    }, [typeResponse, sendContact])

    useEffect(() => {
        submitContactStepRef.current = submitContactStep
    }, [submitContactStep])

    const startContact = useCallback(() => {
        clearResponseTimers()
        modeRef.current = 'contact'
        setMode('contact')
        contactStepRef.current = 'name'
        contactDataRef.current = { name: '', email: '', message: '' }
        setAgentUsed(true)
        setAgentSuggestions([])
        typeResponse(
            "Happy to pass a message to Kudzai. First — what's your name? (type 'cancel' anytime to stop)",
            undefined, 'agent',
        )
    }, [clearResponseTimers, typeResponse])

    const exitMatrix = useCallback(() => {
        if (matrixTimerRef.current) {
            clearTimeout(matrixTimerRef.current)
            matrixTimerRef.current = null
        }
        modeRef.current = 'normal'
        setMode('normal')
        setHistory(prev => [...prev, {
            id: ++lineIdRef.current,
            type: 'output' as const,
            text: 'Wake up, Neo... The Matrix has you.\nFollow the white rabbit. Or just type another command.',
        }])
    }, [])

    const exitVim = useCallback(() => {
        modeRef.current = 'normal'
        setMode('normal')
        setVimContent('')
        setVimCommand('')
        vimCommandRef.current = ''
    }, [])

    const exitSnake = useCallback(() => {
        snakeGame.stop()
        modeRef.current = 'normal'
        setMode('normal')
        setHistory(prev => [...prev, {
            id: ++lineIdRef.current,
            type: 'output' as const,
            text: 'Game exited. Back to the grind.',
        }])
    }, [snakeGame])

    const exitAdventure = useCallback(() => {
        adventureGame.stop()
        modeRef.current = 'normal'
        setMode('normal')
        setAdventurePrompt('')
    }, [adventureGame])

    /** Build prompt string reflecting displayed section or filesystem cwd */
    const currentPrompt = useCallback((): string => {
        if (displayedSectionRef.current) {
            const s = displayedSectionRef.current
            return s === 'home' ? 'visitor@kudzai:~$ ' : `visitor@kudzai:~/${s}$ `
        }
        return cwdToPrompt(cwdRef.current)
    }, [])

    const processCommand = useCallback((command: string) => {
        // Track non-empty commands in session history (original input)
        if (command.trim()) {
            const hist = commandHistoryRef.current
            if (hist.length === 0 || hist[hist.length - 1] !== command.trim()) {
                hist.push(command.trim())
            }
        }
        historyIndexRef.current = -1
        savedInputRef.current = ''

        // Display original command in history
        setHistory(prev => [...prev, {
            id: ++lineIdRef.current,
            type: 'input' as const,
            text: command,
            prompt: currentPrompt(),
        }])

        // Each new command supersedes the previous contextual chips.
        setAgentSuggestions([])

        // Resolve aliases for processing (original stays in display/history)
        const resolved = resolveAlias(command)
        const trimmed = resolved.trim().toLowerCase()

        if (trimmed === 'clear') {
            setHistory([])
            displayedSectionRef.current = null
            setDisplayedSection(null)
            setAgentUsed(false)
            return
        }

        if (trimmed === '') return

        const result = getCommandResponse(sectionId, resolved, cwdRef.current)

        if (result.newCwd !== undefined) {
            cwdRef.current = result.newCwd
            setCwd(result.newCwd)
        }

        // Handle section content rendering (terminal section only)
        if (result.renderSection) {
            renderSectionContent(result.renderSection)
            return
        }

        // Launch the guided tour (from the `tour` command or a tour phrase).
        if (result.startTour) {
            startTour()
            return
        }

        // Launch the step-by-step contact flow (from `email`/`contact`).
        if (result.startContact) {
            startContact()
            return
        }

        // Handle mode transitions
        if (result.enterMode === 'vim') {
            modeRef.current = 'vim'
            setMode('vim')
            setVimContent(result.vimContent || '')
            return
        }
        if (result.enterMode === 'matrix') {
            modeRef.current = 'matrix'
            setMode('matrix')
            matrixTimerRef.current = setTimeout(exitMatrix, 5000)
            return
        }
        if (result.enterMode === 'snake') {
            modeRef.current = 'snake'
            setMode('snake')
            snakeGame.start()
            return
        }
        if (result.enterMode === 'adventure') {
            modeRef.current = 'adventure'
            setMode('adventure')
            const intro = adventureGame.start()
            const prompt = adventureGame.getCurrentPrompt()
            setAdventurePrompt(prompt)
            typeResponse(intro)
            return
        }

        if (result.navigateTo) {
            const section = document.getElementById(result.navigateTo)
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' })
                section.focus({ preventScroll: true })
            }
        }

        // Side-effect: trigger a download (cv/resume).
        // The browser handles 404s if the file isn't present yet — the response
        // text still types out as confirmation, so the visitor sees the intent.
        if (result.downloadUrl) {
            const link = document.createElement('a')
            link.href = result.downloadUrl
            link.rel = 'noopener'
            // Empty `download` lets the browser use Content-Disposition or the URL filename
            link.setAttribute('download', '')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }

        // Side-effect: open a URL in a new tab (mailto, external profiles).
        if (result.openUrl) {
            window.open(result.openUrl, '_blank', 'noopener,noreferrer')
        }

        // Route plain-English input to the AI agent.
        if (result.askAI) {
            runAgentQuery(result.askAI)
            return
        }

        // Scripted onboarding reply — typed in the agent's voice, with onboarding chips.
        if (result.onboarding && result.response) {
            setAgentUsed(true)
            setAgentSuggestions(ONBOARDING_SUGGESTIONS)
            typeResponse(result.response, undefined, 'agent')
            return
        }

        if (result.response) {
            if (result.loadingMessages) {
                showLoadingThenResponse(result.response, result.loadingMessages)
            } else {
                typeResponse(result.response)
            }
        }
    }, [sectionId, typeResponse, showLoadingThenResponse, exitMatrix, renderSectionContent, currentPrompt, runAgentQuery, startTour, startContact])

    // Keep the ref pointing at the latest processCommand so agent-run commands
    // (run_command tool) can re-enter the dispatcher without a forward-ref.
    useEffect(() => {
        processCommandRef.current = processCommand
    }, [processCommand])

    // Attach/detach the keydown listener based on isActive.
    useEffect(() => {
        if (!isActive) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture if an input/textarea/button is focused
            const active = document.activeElement
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'BUTTON')) return

            // Modifier combos are never captured
            if (e.ctrlKey || e.metaKey || e.altKey) return

            // While the agent is thinking (awaiting the network), swallow all
            // keys — a round-trip can't be skipped the way typing can.
            if (isThinkingRef.current) {
                e.preventDefault()
                return
            }

            // Ghost-completion accept: ArrowRight or End fills in the suggestion
            // when one exists. Only fires in normal mode (not vim/snake/adventure)
            // and not while a response is typing. If no suggestion is present,
            // the key falls through to existing handling (page-level section nav, etc.).
            if ((e.key === 'ArrowRight' || e.key === 'End') &&
                modeRef.current === 'normal' &&
                !isTypingRef.current) {
                const sugg = computeSuggestion(inputTextRef.current, cwdRef.current, sectionId)
                if (sugg) {
                    e.preventDefault()
                    inputTextRef.current = inputTextRef.current + sugg
                    setInputText(inputTextRef.current)
                    return
                }
            }

            // ── TOUR MODE ── (available on every section, not just the terminal)
            if (modeRef.current === 'tour') {
                if (isTypingRef.current) {
                    e.preventDefault()
                    completeResponseImmediately()
                    return
                }

                if (e.key === 'Enter') {
                    e.preventDefault()
                    const raw = inputTextRef.current
                    const low = raw.trim().toLowerCase()
                    inputTextRef.current = ''
                    setInputText('')

                    const advance = ['', 'next', 'n', 'continue', 'yes', 'y', 'ok', 'go'].includes(low)
                    const quit = ['exit', 'quit', 'stop', 'q', 'done', 'skip'].includes(low)

                    if (advance) {
                        setHistory(prev => [...prev, {
                            id: ++lineIdRef.current, type: 'input' as const, text: raw, prompt: TOUR_PROMPT,
                        }])
                        runTourStep(tourStepRef.current + 1)
                    } else if (quit) {
                        setHistory(prev => [...prev, {
                            id: ++lineIdRef.current, type: 'input' as const, text: raw, prompt: TOUR_PROMPT,
                        }])
                        finishTour()
                        typeResponse('Tour ended. Ask me anything, or explore on your own.', undefined, 'agent')
                    } else {
                        // A real question — leave the tour and answer it.
                        // processCommand echoes the input itself, so don't echo here.
                        finishTour(true)
                        processCommandRef.current?.(raw)
                    }
                    return
                }

                if (e.key === 'Backspace') {
                    e.preventDefault()
                    inputTextRef.current = inputTextRef.current.slice(0, -1)
                    setInputText(inputTextRef.current)
                    return
                }

                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    return
                }

                if (e.key.length === 1) {
                    e.preventDefault()
                    inputTextRef.current += e.key
                    setInputText(inputTextRef.current)
                }
                return
            }

            // ── CONTACT MODE ── (available on every section)
            if (modeRef.current === 'contact') {
                // While the agent's question is typing, a key skips ahead.
                if (isTypingRef.current) {
                    e.preventDefault()
                    completeResponseImmediately()
                    return
                }

                if (e.key === 'Enter') {
                    e.preventDefault()
                    const raw = inputTextRef.current
                    inputTextRef.current = ''
                    setInputText('')
                    setHistory(prev => [...prev, {
                        id: ++lineIdRef.current, type: 'input' as const, text: raw, prompt: currentPrompt(),
                    }])
                    submitContactStepRef.current?.(raw)
                    return
                }

                if (e.key === 'Backspace') {
                    e.preventDefault()
                    inputTextRef.current = inputTextRef.current.slice(0, -1)
                    setInputText(inputTextRef.current)
                    return
                }

                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    return
                }

                if (e.key.length === 1) {
                    e.preventDefault()
                    inputTextRef.current += e.key
                    setInputText(inputTextRef.current)
                }
                return
            }

            // Terminal section: handle special modes and normal input
            if (sectionId === 'terminal') {

                // ── VIM MODE ──
                if (modeRef.current === 'vim') {
                    e.preventDefault()
                    if (vimCommandRef.current.startsWith(':')) {
                        // Colon command mode
                        if (e.key === 'Enter') {
                            const cmd = vimCommandRef.current.slice(1).trim()
                            if (['q', 'wq', 'q!', 'x', 'wq!', 'qa', 'qa!', 'exit', 'quit', 'close'].includes(cmd)) {
                                exitVim()
                            } else if (cmd === '') {
                                vimCommandRef.current = ''
                                setVimCommand('')
                            } else {
                                setVimCommand(`Not an editor command: ${cmd}`)
                                setTimeout(() => {
                                    vimCommandRef.current = ''
                                    setVimCommand('')
                                }, 2000)
                            }
                        } else if (e.key === 'Backspace') {
                            if (vimCommandRef.current.length > 1) {
                                vimCommandRef.current = vimCommandRef.current.slice(0, -1)
                                setVimCommand(vimCommandRef.current)
                            } else {
                                vimCommandRef.current = ''
                                setVimCommand('')
                            }
                        } else if (e.key === 'Escape') {
                            vimCommandRef.current = ''
                            setVimCommand('')
                        } else if (e.key.length === 1) {
                            vimCommandRef.current += e.key
                            setVimCommand(vimCommandRef.current)
                        }
                    } else if (e.key === ':') {
                        vimCommandRef.current = ':'
                        setVimCommand(':')
                    } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
                        // Direct quit: bare q/Q/Escape exits without needing :q
                        exitVim()
                    }
                    // All other keys in vim mode: no-op
                    return
                }

                // ── MATRIX MODE ──
                if (modeRef.current === 'matrix') {
                    e.preventDefault()
                    exitMatrix()
                    return
                }

                // ── SNAKE MODE ──
                if (modeRef.current === 'snake') {
                    e.preventDefault()
                    const consumed = snakeGame.handleKeyDown(e)
                    if (!consumed) {
                        // Q pressed — exit snake
                        exitSnake()
                    }
                    return
                }

                // ── ADVENTURE MODE ──
                if (modeRef.current === 'adventure') {
                    // Skip if currently typing response
                    if (isTypingRef.current) {
                        e.preventDefault()
                        completeResponseImmediately()
                        return
                    }

                    if (e.key === 'Enter') {
                        e.preventDefault()
                        const cmd = inputTextRef.current
                        const prompt = adventureGame.getCurrentPrompt()

                        // Add input to history
                        setHistory(prev => [...prev, {
                            id: ++lineIdRef.current,
                            type: 'input' as const,
                            text: cmd,
                            prompt,
                        }])
                        inputTextRef.current = ''
                        setInputText('')

                        if (!cmd.trim()) return

                        const result = adventureGame.handleInput(cmd)
                        setAdventurePrompt(result.prompt)

                        if (result.quit) {
                            exitAdventure()
                            if (result.output) {
                                typeResponse(result.output)
                            }
                            return
                        }

                        if (result.output) {
                            typeResponse(result.output)
                        }
                        return
                    }

                    if (e.key === 'Backspace') {
                        e.preventDefault()
                        inputTextRef.current = inputTextRef.current.slice(0, -1)
                        setInputText(inputTextRef.current)
                        return
                    }

                    // Arrow keys for history in adventure mode — ignore
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        return
                    }

                    if (e.key.length === 1) {
                        e.preventDefault()
                        inputTextRef.current += e.key
                        setInputText(inputTextRef.current)
                    }
                    return
                }

                // ── NORMAL MODE: history navigation ──
                if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const hist = commandHistoryRef.current
                    if (hist.length === 0) return
                    if (historyIndexRef.current === -1) {
                        savedInputRef.current = inputTextRef.current
                        historyIndexRef.current = hist.length - 1
                    } else if (historyIndexRef.current > 0) {
                        historyIndexRef.current--
                    }
                    inputTextRef.current = hist[historyIndexRef.current]
                    setInputText(inputTextRef.current)
                    return
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (historyIndexRef.current === -1) return
                    const hist = commandHistoryRef.current
                    if (historyIndexRef.current < hist.length - 1) {
                        historyIndexRef.current++
                        inputTextRef.current = hist[historyIndexRef.current]
                    } else {
                        historyIndexRef.current = -1
                        inputTextRef.current = savedInputRef.current
                    }
                    setInputText(inputTextRef.current)
                    return
                }
                if (e.key === 'Tab') {
                    e.preventDefault()
                    const input = inputTextRef.current
                    const parts = input.split(/\s+/)
                    const cmd = parts[0]?.toLowerCase()

                    // Autocomplete filesystem paths for fs commands
                    if (parts.length >= 2 && (cmd === 'cd' || cmd === 'ls' || cmd === 'cat')) {
                        const partial = parts[parts.length - 1]
                        const completions = getCompletions(cwdRef.current, partial)

                        if (completions.length === 1) {
                            parts[parts.length - 1] = completions[0]
                            inputTextRef.current = parts.join(' ')
                            setInputText(inputTextRef.current)
                        } else if (completions.length > 1) {
                            let common = completions[0]
                            for (let i = 1; i < completions.length; i++) {
                                let j = 0
                                while (j < common.length && j < completions[i].length && common[j] === completions[i][j]) {
                                    j++
                                }
                                common = common.slice(0, j)
                            }
                            if (common.length > partial.length) {
                                parts[parts.length - 1] = common
                                inputTextRef.current = parts.join(' ')
                                setInputText(inputTextRef.current)
                            }
                        }
                    } else if (parts.length <= 1 && input.length > 0) {
                        // Autocomplete command names
                        const matches = TERMINAL_COMMAND_LIST.filter(c => c.startsWith(input.toLowerCase()))
                        if (matches.length === 1) {
                            inputTextRef.current = matches[0] + ' '
                            setInputText(inputTextRef.current)
                        } else if (matches.length > 1) {
                            let common = matches[0]
                            for (let i = 1; i < matches.length; i++) {
                                let j = 0
                                while (j < common.length && j < matches[i].length && common[j] === matches[i][j]) {
                                    j++
                                }
                                common = common.slice(0, j)
                            }
                            if (common.length > input.length) {
                                inputTextRef.current = common
                                setInputText(inputTextRef.current)
                            }
                        }
                    }
                    return
                }
            }

            // Don't capture navigation keys for non-terminal sections
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape',
                'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            ].includes(e.key)) return

            // Any key during response typing completes it instantly
            if (isTypingRef.current) {
                e.preventDefault()
                completeResponseImmediately()
                return
            }

            if (e.key === 'Enter') {
                e.preventDefault()
                processCommand(inputTextRef.current)
                inputTextRef.current = ''
                setInputText('')
                return
            }

            if (e.key === 'Backspace') {
                e.preventDefault()
                inputTextRef.current = inputTextRef.current.slice(0, -1)
                setInputText(inputTextRef.current)
                return
            }

            // Only accept printable characters
            if (e.key.length === 1) {
                e.preventDefault()
                inputTextRef.current += e.key
                setInputText(inputTextRef.current)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isActive, sectionId, processCommand, completeResponseImmediately, exitVim, exitMatrix, exitSnake, exitAdventure, snakeGame, adventureGame, typeResponse, runTourStep, finishTour, currentPrompt])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            responseTimersRef.current.forEach(t => clearTimeout(t))
            if (matrixTimerRef.current) clearTimeout(matrixTimerRef.current)
            if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current)
            snakeGame.stop()
            adventureGame.stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Run a command as if typed — used by the quick-action chips. Ignored
    // while the terminal is busy typing or awaiting the agent.
    const submitCommand = useCallback((command: string) => {
        if (isThinkingRef.current || isTypingRef.current) return
        if (modeRef.current !== 'normal') return
        processCommandRef.current?.(command)
    }, [])

    // Submit a spoken transcript: marks the reply to be read aloud and enters
    // voice mode (the input line shows the orb until the reply finishes).
    const submitVoiceCommand = useCallback((command: string) => {
        if (isThinkingRef.current || isTypingRef.current) return
        if (modeRef.current !== 'normal') return
        shouldSpeakRef.current = true
        processCommandRef.current?.(command)
    }, [])

    // Presence-orb state, derived from current activity. 'thinking' while
    // awaiting the API, 'speaking' while an agent reply types out, else 'idle'.
    const agentState: AgentState = useMemo(() => {
        if (thinking) return 'thinking'
        if (isTypingResponse && responseVariant === 'agent') return 'speaking'
        return 'idle'
    }, [thinking, isTypingResponse, responseVariant])

    // Once activity settles back to idle, clear the speak flag so a later TYPED
    // reply is never accidentally read aloud.
    const prevAgentStateRef = useRef<AgentState>('idle')
    useEffect(() => {
        const prev = prevAgentStateRef.current
        prevAgentStateRef.current = agentState
        if (prev !== 'idle' && agentState === 'idle') {
            shouldSpeakRef.current = false
        }
    }, [agentState])

    // Ghost-completion suggestion. Suppressed in non-normal modes
    // (vim/snake/adventure/matrix) and during response typing — those states
    // either don't render the active input line or have their own input handling.
    const suggestion = useMemo(() => {
        if (mode !== 'normal') return ''
        if (isTypingResponse) return ''
        if (!inputText) return ''
        return computeSuggestion(inputText, cwd, sectionId)
    }, [inputText, cwd, sectionId, isTypingResponse, mode])

    return {
        inputText,
        history,
        isTypingResponse,
        responseText,
        suggestion,
        cwd,
        mode,
        vimContent,
        vimCommand,
        snakeDisplay: snakeGame.display,
        snakeChangeDirection: snakeGame.changeDirection,
        adventurePrompt,
        displayedSection,
        responseVariant,
        agentUsed,
        submitCommand,
        agentSuggestions,
        submitVoiceCommand,
    }
}

export { cwdToPrompt }
export type { TerminalMode, NavigableSection, AgentState }
