// terminal/fs.ts
// The fake in-memory filesystem (~) and the ls/cd/cat/pwd commands that walk it.

import type { TerminalSectionId } from './types'
import { contact, projects, experiences, skillCategories, specializations } from '@/src/content'
import { projectReadme } from '@/src/lib/projectDocs'
import { aboutBlocks, box, bullets, contactBlock, experienceBlock } from './format'

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

/* ============================================
   FACTUAL FOLDERS — generated from src/content
   (projects, experience, skills, contact, about), so the terminal can never
   disagree with the rest of the site. The fun files stay hand-written.
   ============================================ */

const file = (content: string): FsFile => ({ type: 'file', content })

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function projectsDir(): FsDir {
    const children: Record<string, FsNode> = {}
    for (const p of projects) {
        children[p.slug] = { type: 'dir', children: { 'README.md': file(projectReadme(p)) } }
    }
    children['more_projects.txt'] = file(`More on GitHub: ${contact.githubUrl}`)
    return { type: 'dir', children }
}

function experienceDir(): FsDir {
    const children: Record<string, FsNode> = {}
    for (const e of experiences) {
        const company = e.company.replace(/^@\s*/, '')
        const name = `${slugify(e.period)}_${slugify(e.role)}@${slugify(company)}.log`
        children[name] = file(experienceBlock(e).join('\n'))
    }
    return { type: 'dir', children }
}

function skillsDir(): FsDir {
    const children: Record<string, FsNode> = {}
    for (const c of skillCategories) {
        children[`${slugify(c.title)}.txt`] = file(box(`${c.title} stack`, bullets(c.technologies)).join('\n'))
    }
    children['specializations.txt'] = file(box('Specializations', bullets(specializations)).join('\n'))
    return { type: 'dir', children }
}

function contactText(): string {
    return contactBlock().join('\n')
}

function aboutText(): string {
    return aboutBlocks().join('\n')
}

const filesystem: FsDir = {
    type: 'dir',
    children: {
        '.secret': file([
            'You found the first one. There are deeper secrets:',
            '  cd personal/.private  — and keep going.',
            '',
            "Type 'achievements' to see what else is hidden.",
        ].join('\n')),
        projects: projectsDir(),
        experience: experienceDir(),
        skills: skillsDir(),
        'personal': {
            type: 'dir',
            children: {
                'contact.txt': file(contactText()),
                'about.txt': file(aboutText()),
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
                                                        'The background you\'re staring at is a hand-written canvas',
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
                                                        'Every command in this portfolio is typed like a person',
                                                        'would: a pause at the start of each word, common letter',
                                                        'pairs ("th", "er", "ca") rolled off fast, a thumb beat on',
                                                        'space, deliberate dots and slashes, and now and then a',
                                                        'wrong neighbouring key, a beat, and a backspace.',
                                                        'The output? The machine prints that. 30 ms a line.',
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
                                                        'Titles, names and phrases on every screen glitch. One',
                                                        'director picks a visible one every second or two and',
                                                        'flickers a few characters, scrambles the whole line and',
                                                        'decodes it, or splits it red/cyan like a tube losing',
                                                        'convergence. It only writes into an overlay per character,',
                                                        'so the real text underneath never changes.',
                                                        '',
                                                        'If you caught it, you were staring. Fair.',
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
export function getCompletions(cwd: string, partial: string): string[] {
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

export function getLsOutput(sectionId: TerminalSectionId): string {
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
                `total ${projects.length + 1}`,
                ...projects.map(p => `drwxr-xr-x  1 kudzai staff  ${p.slug}/`),
                '-rw-r--r--  1 kudzai staff  more_projects.txt',
            ].join('\n')
        case 'experience':
            return [
                `total ${experiences.length}`,
                ...Object.keys(experienceDir().children).map(n => `-rw-r--r--  1 kudzai staff  ${n}`),
            ].join('\n')
        default:
            return ''
    }
}

/* ============================================
   TERMINAL FILESYSTEM COMMANDS
   ============================================ */

export interface FsCommandResult {
    output: string | null
    newCwd?: string
}

export function handleTerminalCommand(command: string, cwd: string): FsCommandResult {
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
