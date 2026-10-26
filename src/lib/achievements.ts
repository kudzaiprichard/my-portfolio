// lib/achievements.ts
/**
 * Achievements for the games and easter eggs, so the hidden effort gets
 * found: `achievements` lists them ("found 3 of 11"); each unlock plays the
 * achievement chime (audioEngine) and is remembered in localStorage. The
 * tmux bar shows the count live (subscribeAchievements).
 */

const ACHIEVEMENTS_STORAGE_KEY = 'portfolio-achievements'
const CHANGE_EVENT = 'portfolio-achievements-change'

export const ACHIEVEMENTS = [
    { id: 'snake', name: 'Snake charmer', hint: 'type snake' },
    { id: 'wpm', name: 'Out-typed the terminal', hint: 'finish a typing race (wpm)' },
    { id: 'train', name: 'Model trainer', hint: 'teach a neural network something (train)' },
    { id: 'quiz', name: 'Pattern spotter', hint: 'test your interview instincts (quiz)' },
    { id: 'adventure', name: "Founder's journey", hint: 'there is a story to play (adventure)' },
    { id: 'secret', name: 'Read the secret', hint: 'some files start with a dot' },
    { id: 'sl', name: 'Choo choo', hint: 'mistype a very common command' },
    { id: 'matrix', name: 'Red pill', hint: 'follow the white rabbit' },
    { id: 'vim', name: 'Escaped vim', hint: 'open the editor, then get out' },
    { id: 'theme', name: 'Phosphor swap', hint: 'change the tube' },
    { id: 'tour', name: 'Tourist', hint: 'ask to be shown around' },
] as const

export type AchievementId = typeof ACHIEVEMENTS[number]['id']

export function unlockedAchievements(): Set<AchievementId> {
    try {
        const raw = JSON.parse(localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY) ?? '[]')
        return new Set((Array.isArray(raw) ? raw : []).filter((id: unknown): id is AchievementId => ACHIEVEMENTS.some(a => a.id === id)))
    } catch {
        return new Set()
    }
}

/** Unlock one. Returns the achievement if it is new, otherwise null. */
export function unlockAchievement(id: AchievementId): (typeof ACHIEVEMENTS)[number] | null {
    const got = unlockedAchievements()
    if (got.has(id)) return null
    got.add(id)
    try { localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify([...got])) } catch { /* storage blocked */ }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event(CHANGE_EVENT))
    return ACHIEVEMENTS.find(a => a.id === id) ?? null
}

/** How many are found (for useSyncExternalStore). */
export function achievementCount(): number {
    return unlockedAchievements().size
}

/** Told when one unlocks here or in another tab. */
export function subscribeAchievements(fn: () => void): () => void {
    const onStorage = (e: StorageEvent) => { if (e.key === ACHIEVEMENTS_STORAGE_KEY) fn() }
    window.addEventListener(CHANGE_EVENT, fn)
    window.addEventListener('storage', onStorage)
    return () => {
        window.removeEventListener(CHANGE_EVENT, fn)
        window.removeEventListener('storage', onStorage)
    }
}

/** The `achievements` command's text, as a box (terminal/format). */
export function achievementsText(got: ReadonlySet<AchievementId>): string {
    const rows = ACHIEVEMENTS.map(a => got.has(a.id)
        ? `▸ [x] ${a.name}`
        : `▸ [ ] ${'?'.repeat(a.name.length)}   hint: ${a.hint}`)
    return [
        `┌─ Achievements — found ${got.size} of ${ACHIEVEMENTS.length}`,
        ...rows.map(r => `│  ${r}`),
        '│',
        '│  # type games to see everything you can play',
        '└──',
    ].join('\n')
}

/** The line printed when one unlocks. */
export function unlockLine(a: (typeof ACHIEVEMENTS)[number], found: number): string {
    return `★ achievement unlocked: ${a.name} (${found} of ${ACHIEVEMENTS.length}) — type 'achievements' to see them all`
}
