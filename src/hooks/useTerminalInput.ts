// hooks/useTerminalInput.ts
"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSnakeGame } from './useSnakeGame'
import { useAdventureGame } from './useAdventureGame'
import { owner, contact, skillCategories, specializations, projects, experiences } from '@/src/content'
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
}

interface UseTerminalInputOptions {
    sectionId: TerminalSectionId
    isActive: boolean
}

type TerminalMode = 'normal' | 'vim' | 'matrix' | 'snake' | 'adventure'

interface UseTerminalInputReturn {
    inputText: string
    history: TerminalLine[]
    isTypingResponse: boolean
    responseText: string
    cwd: string
    mode: TerminalMode
    vimContent: string
    vimCommand: string
    snakeDisplay: string
    snakeChangeDirection: (dir: 'up' | 'down' | 'left' | 'right') => void
    adventurePrompt: string
    displayedSection: NavigableSection | null
}

interface CommandResponse {
    response: string | null
    newCwd?: string
    enterMode?: 'vim' | 'matrix' | 'snake' | 'adventure'
    vimContent?: string
    navigateTo?: string
    loadingMessages?: string[]
    renderSection?: NavigableSection
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
                                'Deep learning model for image classification. 96% accuracy.',
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
                        '  - Built NLP models achieving 94% accuracy in sentiment analysis',
                        '  - Reduced model inference time by 60% through optimization',
                        '  - Mentored team of 5 junior engineers',
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
                        '100K+ users. RESTful APIs, modern frontend with React/Node.js.',
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
        '                     CPU: ML-Core @ 94% NLP accuracy',
        '                     GPU: Full-Stack Rendering 4090',
        '                     Disk: 15+ projects / unlimited ambition',
        '                     Network: @kudzaiprichard (all nodes)',
    ].join('\n')
}

function generateWhoami(): string {
    return [
        'Kudzai Prichard — AI & Full Stack Developer',
        '',
        'Engineer who builds intelligent systems and ships them. Led AI/ML',
        'initiatives at TechCorp Solutions, built NLP models hitting 94%',
        'accuracy, reduced inference times by 60%, and architected pipelines',
        'processing millions of data points daily. Before that, shipped',
        'full-stack applications serving 100K+ users at StartupHub. Started',
        'freelancing in 2020, delivered 15+ projects with a 100% satisfaction',
        'rate, and never looked back. Fluent in Python, TypeScript, TensorFlow,',
        'React, and the art of making machines do useful things.',
        '',
        'Currently: building the next thing. Always: building the next thing.',
    ].join('\n')
}

function generateHistory(): string {
    return [
        '    1  ssh deploy@production-cluster',
        '    2  kubectl get pods --all-namespaces',
        '    3  python train_model.py --epochs 100 --lr 0.001',
        '    4  git commit -m "feat: improve NLP accuracy to 94%"',
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
        '    perf: reduce model inference time by 60% through optimization',
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
        '    feat: build NLP sentiment analysis model, 94% accuracy',
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
        '  - Built full-stack applications serving 100K+ concurrent users',
        '  - Engineered 676-line particle system for ambient visual layer',
        '  - NLP model accuracy: 94% (above department threshold)',
        '  - Client retention rate: 100% across 15+ engagements',
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
            '    --ai-ml       Enable ML pipeline mode (94% accuracy)',
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
            '    with this achieve 94% accuracy in sentiment analysis.',
            '    Inference time optimized by 60%. The framework takes',
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
        '── Games ──────────────────────────────────────────────',
        '  snake          classic snake game (arrow keys)',
        '  adventure      a career-themed text adventure',
        '',
        '── Fun ────────────────────────────────────────────────',
        '  vim            open a file worth reading (:q exits)',
        '  ascii          display ASCII art',
        '  matrix         enter the matrix (5 sec)',
        '  hack           breach the mainframe',
        '  exit           close session (we\'ll miss you)',
        '  clear          clear terminal',
        '',
        'Tab to autocomplete. Up/Down for command history.',
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

        return { response: `bash: ${command.trim()}: command not found\nType 'help' for available commands.` }
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

    return { response: `bash: ${command.trim()}: command not found\nType 'help' for available commands.` }
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
    const { sectionId, isActive } = options

    const [inputText, setInputText] = useState('')
    const [history, setHistory] = useState<TerminalLine[]>([])
    const [isTypingResponse, setIsTypingResponse] = useState(false)
    const [responseText, setResponseText] = useState('')
    const [cwd, setCwd] = useState('/')
    const [mode, setMode] = useState<TerminalMode>('normal')
    const [vimContent, setVimContent] = useState('')
    const [vimCommand, setVimCommand] = useState('')
    const [displayedSection, setDisplayedSection] = useState<NavigableSection | null>(null)
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
            pendingResponseRef.current = null
            setHistory(prev => [...prev, {
                id: ++lineIdRef.current,
                type: 'output' as const,
                text,
            }])
        }
        setResponseText('')
        setIsTypingResponse(false)
        isTypingRef.current = false
    }, [clearResponseTimers])

    const typeResponse = useCallback((text: string) => {
        setIsTypingResponse(true)
        isTypingRef.current = true
        setResponseText('')
        pendingResponseRef.current = text
        clearResponseTimers()

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

        // Resolve aliases for processing (original stays in display/history)
        const resolved = resolveAlias(command)
        const trimmed = resolved.trim().toLowerCase()

        if (trimmed === 'clear') {
            setHistory([])
            displayedSectionRef.current = null
            setDisplayedSection(null)
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

        if (result.response) {
            if (result.loadingMessages) {
                showLoadingThenResponse(result.response, result.loadingMessages)
            } else {
                typeResponse(result.response)
            }
        }
    }, [sectionId, typeResponse, showLoadingThenResponse, exitMatrix, renderSectionContent, currentPrompt])

    // Attach/detach the keydown listener based on isActive.
    useEffect(() => {
        if (!isActive) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture if an input/textarea/button is focused
            const active = document.activeElement
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'BUTTON')) return

            // Modifier combos are never captured
            if (e.ctrlKey || e.metaKey || e.altKey) return

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
                        const cmds = [
                            'adventure', 'ascii', 'cat', 'cd', 'clear', 'curl', 'date',
                            'echo', 'exit', 'git', 'hack', 'help', 'history',
                            'htop', 'ls', 'man', 'matrix', 'neofetch', 'ping',
                            'pwd', 'snake', 'ssh', 'sudo', 'vim', 'whoami',
                        ]
                        const matches = cmds.filter(c => c.startsWith(input.toLowerCase()))
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
    }, [isActive, sectionId, processCommand, completeResponseImmediately, exitVim, exitMatrix, exitSnake, exitAdventure, snakeGame, adventureGame, typeResponse])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            responseTimersRef.current.forEach(t => clearTimeout(t))
            if (matrixTimerRef.current) clearTimeout(matrixTimerRef.current)
            snakeGame.stop()
            adventureGame.stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        inputText,
        history,
        isTypingResponse,
        responseText,
        cwd,
        mode,
        vimContent,
        vimCommand,
        snakeDisplay: snakeGame.display,
        snakeChangeDirection: snakeGame.changeDirection,
        adventurePrompt,
        displayedSection,
    }
}

export { cwdToPrompt }
export type { TerminalMode, NavigableSection }
