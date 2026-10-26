// terminal/sections.ts
// Section text shown by `cd <section>` in the terminal, and its typing timings.

import { outputTimings } from '@/src/constants/typingConfig'
import { aboutBlocks, contactBlock, experienceBlocks, homeBlock, projectsBlocks } from './format'
import type { NavigableSection } from './types'

/* ============================================
   LOADING INDICATOR MESSAGES
   ============================================ */

export const LOADING_SETS: Record<string, string[]> = {
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
        'Unpacking object history since 2019...',
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

export const NAV_SECTIONS: Record<string, NavigableSection> = {
    home: 'home', about: 'about', projects: 'projects',
    experience: 'experience', contact: 'contact',
}

export const CD_STATUS_LINES: Record<NavigableSection, string> = {
    home: 'Reading /home/kudzai/...',
    about: 'Reading /home/kudzai/about/...',
    projects: 'Indexing /home/kudzai/projects/...',
    experience: 'Parsing /home/kudzai/experience/...',
    contact: 'Resolving /home/kudzai/contact/...',
}

/**
 * Delay before the next output line prints: machine speed, with a slightly
 * longer hold on blank lines and section rules so the stream has a rhythm.
 */
export function lineDelay(line: string): number {
    const t = line.trim()
    if (t === '' || t === '│' || t.startsWith('──') || t.startsWith('===') || t.startsWith('┌')) return outputTimings.pauseLineMs
    return outputTimings.lineMs
}

/**
 * Format section content from src/content/ into terminal-friendly text lines
 * (boxed blocks, see terminal/format). Each string becomes one history entry.
 */
export function formatSectionLines(section: NavigableSection): string[] {
    switch (section) {
        case 'home': return homeBlock()
        case 'about': return aboutBlocks()
        case 'projects': return projectsBlocks()
        case 'experience': return experienceBlocks()
        case 'contact': return contactBlock()
    }
}
