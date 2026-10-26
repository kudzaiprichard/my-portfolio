// terminal/games/quiz.ts
// `quiz`: "which pattern solves this?" — three quick interview-instinct
// questions in the style of Anvil (the DSA practice app in ~/projects),
// ending with a link to it. Pure; the session prints the text and offers the
// options as chips.

import { projects } from '@/src/content'

interface Question {
    problem: string
    options: readonly [string, string, string, string]
    /** Index of the right option */
    answer: 0 | 1 | 2 | 3
    why: string
}

const QUESTIONS: readonly Question[] = [
    {
        problem: 'A sorted array and a target: find two numbers that add up to it, in O(n) time and O(1) space.',
        options: ['Hash map', 'Two pointers', 'Binary search per element', 'Sort, then brute force'],
        answer: 1,
        why: 'Sorted input: start one pointer at each end and move the side that brings the sum closer.',
    },
    {
        problem: 'The longest substring without repeating characters.',
        options: ['Sliding window', 'Dynamic programming table', 'Recursion with memo', 'Two heaps'],
        answer: 0,
        why: 'Grow the window to the right, shrink it from the left whenever a character repeats.',
    },
    {
        problem: 'The fewest moves for a knight to reach a square on an empty board.',
        options: ['DFS', "Dijkstra's algorithm", 'Breadth-first search', 'Greedy'],
        answer: 2,
        why: 'Every move costs the same, so BFS reaches each square first by the shortest path.',
    },
    {
        problem: 'Keep the median of a stream of numbers as they arrive.',
        options: ['Sort after every insert', 'Two heaps', 'A balanced BST only', 'Prefix sums'],
        answer: 1,
        why: 'A max-heap for the lower half and a min-heap for the upper half; the median sits on top.',
    },
    {
        problem: 'Can you finish all courses, given pairs of "A requires B"?',
        options: ['Union-find', 'Topological sort (cycle detection)', 'Binary search', 'Sliding window'],
        answer: 1,
        why: 'It is a directed graph: if a topological order exists there is no cycle, so every course can be taken.',
    },
    {
        problem: 'The k most frequent words in a list.',
        options: ['Sort the whole list', 'Hash map + heap of size k', 'Two pointers', 'Trie only'],
        answer: 1,
        why: 'Count with a hash map, then keep the top k in a size-k heap: O(n log k).',
    },
    {
        problem: 'The number of ways to climb n stairs taking 1 or 2 steps at a time.',
        options: ['Backtracking', 'Dynamic programming', 'Greedy', 'Bit manipulation'],
        answer: 1,
        why: 'ways(n) = ways(n−1) + ways(n−2): overlapping subproblems, solved bottom-up in O(n).',
    },
    {
        problem: 'The smallest element in a sorted array that has been rotated.',
        options: ['Linear scan', 'Binary search', 'Two heaps', 'Stack'],
        answer: 1,
        why: 'Compare the middle with the right end to tell which half holds the rotation point: O(log n).',
    },
]

const LETTERS = ['a', 'b', 'c', 'd'] as const
export const QUIZ_LENGTH = 3

export interface QuizStep {
    output: string
    /** Chip labels for the current question's options (empty once done) */
    options: string[]
    done: boolean
}

const optionLabels = (q: Question) => q.options.map((o, i) => `${LETTERS[i]}) ${o}`)

function questionText(q: Question, n: number): string {
    return [
        `┌─ Question ${n} of ${QUIZ_LENGTH}: which pattern solves this?`,
        `│  ${q.problem}`,
        '│',
        ...optionLabels(q).map(o => `│  ▸ ${o}`),
        '└──',
        'Answer with a, b, c or d (or q to quit).',
    ].join('\n')
}

export class Quiz {
    private picked: Question[] = []
    private index = 0
    private score = 0

    start(random = Math.random): QuizStep {
        const pool = [...QUESTIONS]
        this.picked = Array.from({ length: QUIZ_LENGTH }, () => pool.splice(Math.floor(random() * pool.length), 1)[0])
        this.index = 0
        this.score = 0
        const q = this.picked[0]
        return { output: questionText(q, 1), options: optionLabels(q), done: false }
    }

    /** "a", "b) Two pointers", "B" … or q to quit. */
    answer(input: string): QuizStep {
        const q = this.picked[this.index]
        const choice = LETTERS.indexOf(input.trim().toLowerCase()[0] as (typeof LETTERS)[number])
        if (!q || choice < 0) {
            return { output: 'Pick a, b, c or d — or q to quit.', options: q ? optionLabels(q) : [], done: false }
        }
        const right = choice === q.answer
        if (right) this.score++
        const verdict = right
            ? `✓ Right — ${q.options[q.answer]}. ${q.why}`
            : `✗ Not quite: it is ${LETTERS[q.answer]}) ${q.options[q.answer]}. ${q.why}`
        this.index++
        if (this.index < QUIZ_LENGTH) {
            const next = this.picked[this.index]
            return { output: `${verdict}\n\n${questionText(next, this.index + 1)}`, options: optionLabels(next), done: false }
        }
        return { output: `${verdict}\n\n${this.summary()}`, options: [], done: true }
    }

    private summary(): string {
        const anvil = projects.find(p => p.slug === 'anvil')
        const download = anvil?.downloads?.[0]
        return [
            `┌─ You scored ${this.score} of ${QUIZ_LENGTH}`,
            `│  ${this.score === QUIZ_LENGTH ? 'Sharp instincts.' : 'Spotting the pattern is the skill interviews test, and it can be trained.'}`,
            '│',
            '│  Anvil, my offline practice app, teaches exactly this: 62 guided',
            '│  lessons, pattern drills and 3,000+ verified test packs, no account.',
            '│',
            ...(download ? [`│  Download  ${download.url.replace(/^https?:\/\//, '')}`] : []),
            '│  Details   /projects/anvil',
            '└──',
            'Type quiz to go again, or games for more.',
        ].join('\n')
    }
}
