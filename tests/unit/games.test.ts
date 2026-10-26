import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WpmRace, WPM_SECONDS, wordsPerMinute } from '@/src/terminal/games/wpm'
import { TrainRun, TRAIN_EPOCHS, seeded, twoMoons } from '@/src/terminal/games/train'
import { Quiz, QUIZ_LENGTH } from '@/src/terminal/games/quiz'
import { AdventureGame } from '@/src/terminal/games/adventure'
import { tickFor } from '@/src/terminal/games/snake'
import { generateGames, GAMES } from '@/src/terminal/commands/help'
import { getCommandResponse } from '@/src/terminal/commands'

function stubStorage() {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v) },
        removeItem: (k: string) => { store.delete(k) },
    })
}

describe('wpm: the typing race', () => {
    beforeEach(stubStorage)
    afterEach(() => vi.unstubAllGlobals())

    it('counts words as five characters per minute', () => {
        expect(wordsPerMinute(50, 60_000)).toBe(10)
        expect(wordsPerMinute(25, 15_000)).toBe(20)
        expect(wordsPerMinute(10, 0)).toBe(0)
    })

    it('starts the clock on the first key and ends when the passage is typed', () => {
        const race = new WpmRace()
        race.start(() => 0)
        const target = race.view(0).target
        expect(race.view(0).started).toBe(false)
        expect(race.view(0).remaining).toBe(WPM_SECONDS)
        // A typo, fixed
        race.input('x', 1000)
        race.input('', 1100)
        expect(race.view(1100).started).toBe(true)
        let done = false
        for (let i = 1; i <= target.length; i++) done = race.input(target.slice(0, i), 1100 + i * 100)
        expect(done).toBe(true)
        const v = race.view(99_999)
        expect(v.done).toBe(true)
        expect(v.accuracy).toBeLessThan(100)
        expect(v.accuracy).toBeGreaterThan(90)
        expect(v.wpm).toBeGreaterThan(0)
        expect(v.newBest).toBe(true)
        expect(localStorage.getItem('portfolio-wpm-best')).toBe(String(v.wpm))
    })

    it('stops at the time limit', () => {
        const race = new WpmRace()
        race.start(() => 0.5)
        race.input('g', 0)
        expect(race.tick(WPM_SECONDS * 1000 - 1)).toBe(false)
        expect(race.tick(WPM_SECONDS * 1000)).toBe(true)
        expect(race.view(WPM_SECONDS * 1000 + 5000).remaining).toBe(0)
    })
})

describe('train: a neural network learning live', () => {
    it('is reproducible from a seed', () => {
        expect(twoMoons(seeded(7))).toEqual(twoMoons(seeded(7)))
    })

    it('learns the two moons well past a straight line', () => {
        for (const seed of [1, 7, 123, 2026, 99]) {
            const run = new TrainRun(seed)
            while (!run.done) run.advance()
            expect(run.epoch).toBe(TRAIN_EPOCHS)
            expect(run.accuracy).toBeGreaterThanOrEqual(0.95)
            expect(run.loss).toBeLessThan(0.3)
        }
    })

    it('draws the plot, the numbers and the loss curve', () => {
        const run = new TrainRun(3)
        run.advance(200)
        const frame = run.frame()
        expect(frame).toMatch(/epoch\s+200 \/ 1500/)
        expect(frame).toContain('●')
        expect(frame).toContain('○')
        expect(frame).toMatch(/loss [▁▂▃▄▅▆▇█]+/)
    })
})

describe('quiz: which pattern solves it?', () => {
    it('asks three questions, takes letters, and ends with the score and Anvil', () => {
        const quiz = new Quiz()
        const first = quiz.start(() => 0)
        expect(first.options).toHaveLength(4)
        expect(first.options[0]).toMatch(/^a\) /)
        expect(quiz.answer('z').output).toContain('Pick a, b, c or d')
        let step = quiz.answer('b')
        expect(step.output).toMatch(/[✓✗]/)
        for (let i = 2; i < QUIZ_LENGTH; i++) step = quiz.answer('a) whatever')
        step = quiz.answer('C')
        expect(step.done).toBe(true)
        expect(step.options).toEqual([])
        expect(step.output).toMatch(/You scored \d of 3/)
        expect(step.output).toContain('/projects/anvil')
    })
})

describe("adventure: Founder's Journey", () => {
    it('can be finished, and says so', () => {
        const game = new AdventureGame()
        expect(game.start()).toContain("FOUNDER'S JOURNEY")
        const walk = ['take notebook', 'n', 'e', 'use notebook', 'e', 'n', 'take raw-audio', 'use raw-audio', 's', 'use speech-dataset', 'e', 'use voice-agent']
        const out = walk.map(step => game.handleInput(step).output)
        // The locked door before the OCR platform, then open after it
        expect(out[2]).toMatch(/Locked/)
        expect(out[4]).toContain('Teleagents')
        expect(out.at(-1)).toContain('CHAMPION, POTRAZ 2026')
        expect(game.complete).toBe(true)
        expect(game.handleInput('quit').quit).toBe(true)
    })
})

describe('snake', () => {
    it('speeds up as it grows, down to a floor', () => {
        expect(tickFor(0)).toBe(140)
        expect(tickFor(5)).toBeLessThan(tickFor(0))
        expect(tickFor(1000)).toBe(70)
    })
})

describe('the games menu and commands', () => {
    it('lists every game, the extras and the achievements count', () => {
        const text = generateGames(3, 11)
        for (const g of GAMES) expect(text).toContain(g.command)
        expect(text).toContain('★ 3 of 11 achievements found')
    })

    it('starts each game in the terminal, and sends other sections there', () => {
        for (const mode of ['snake', 'wpm', 'train', 'quiz', 'adventure'] as const) {
            expect(getCommandResponse('terminal', mode, '/').enterMode).toBe(mode)
            expect(getCommandResponse('hero', mode, '/').runInTerminal).toBe(mode)
        }
        expect(getCommandResponse('terminal', 'games', '/').response).toBeNull()
        expect(getCommandResponse('terminal', 'hack', '/').response ?? '').not.toContain('breach')
    })
})
