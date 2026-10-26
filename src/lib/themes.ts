// lib/themes.ts
// Theme ids and palettes. Mirrors the THEMES block in app/globals.css (pinned by tests).

export const THEME_IDS = ['p1', 'p3', 'p4', 'night', 'paper'] as const
export type ThemeId = typeof THEME_IDS[number]

export const DEFAULT_THEME: ThemeId = 'night'
export const THEME_STORAGE_KEY = 'portfolio-theme'

export interface ThemeInfo {
    id: ThemeId
    name: string
    /** Words the `theme` command accepts besides the id */
    aliases: readonly string[]
    colors: { bg: string; surface: string; text: string; bright: string; dim: string; warn: string; error: string; agent: string }
    /** The word shown and typed in the terminal: `theme <command>` */
    command: string
}

export const THEMES: readonly ThemeInfo[] = [
    { id: 'p1', name: 'Phosphor', command: 'phosphor', aliases: ['phosphor', 'green'], colors: { bg: '#07110B', surface: '#0C1A12', text: '#A8F5C0', bright: '#4DFF8F', dim: '#5E9C76', warn: '#FFB454', error: '#FF6E61', agent: '#6FD3FF' } },
    { id: 'p3', name: 'Amber', command: 'amber', aliases: ['amber'], colors: { bg: '#120C05', surface: '#1C140A', text: '#FFD08A', bright: '#FFB000', dim: '#A8834C', warn: '#FF7A45', error: '#FF5D5D', agent: '#8FD8FF' } },
    { id: 'p4', name: 'Ice White', command: 'ice', aliases: ['ice', 'white', 'icewhite'], colors: { bg: '#0A0E14', surface: '#111823', text: '#D9E6F2', bright: '#FFFFFF', dim: '#7D8FA3', warn: '#FFC46B', error: '#FF7A85', agent: '#7CC8FF' } },
    { id: 'night', name: 'Night Shift', command: 'night', aliases: ['nightshift', 'synth', 'default'], colors: { bg: '#0F0B1A', surface: '#181229', text: '#E6DCFF', bright: '#5CF2FF', dim: '#8D80B3', warn: '#FFC15E', error: '#FF6B8B', agent: '#FF7FDF' } },
    { id: 'paper', name: 'Daylight Paper', command: 'paper', aliases: ['daylight', 'light'], colors: { bg: '#F3F1E7', surface: '#E8E5D6', text: '#1D3325', bright: '#0A6B39', dim: '#5F6E62', warn: '#9A5200', error: '#B3261E', agent: '#0F5E8C' } },
]
