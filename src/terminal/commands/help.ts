// terminal/commands/help.ts
// The `help` listing and the `games` menu.

import { box, bullets } from '../format'

/** What there is to play, one line each (the `games` menu and the play chips). */
export const GAMES: ReadonlyArray<{ command: string; label: string; about: string }> = [
    { command: 'snake', label: 'snake', about: 'the classic, faster as it grows (arrows or swipe, P pauses)' },
    { command: 'wpm', label: 'wpm', about: 'typing race: out-type the terminal in 30 seconds' },
    { command: 'train', label: 'train a model', about: 'watch a neural network learn, live, in your browser' },
    { command: 'quiz', label: 'quiz', about: 'which pattern solves it? three interview questions' },
    { command: 'adventure', label: 'adventure', about: "Founder's Journey: from a lecture hall to a national award" },
]

/** The `games` menu, with how many achievements are found. */
export function generateGames(found: number, total: number): string {
    const width = Math.max(...GAMES.map(g => g.command.length))
    return [
        ...box('Games', [
            ...GAMES.map(g => `${g.command.padEnd(width)}  ${g.about}`),
            '',
            '# and a few more for the curious',
            ...bullets(['matrix  ·  vim (then get out)  ·  sl  ·  theme  ·  crt on']),
        ]),
        '',
        `★ ${found} of ${total} achievements found. Type achievements for hints.`,
    ].join('\n')
}

export function generateHelp(): string {
    return [
        '── Just ask ───────────────────────────────────────────',
        '  Type a question in plain English and my AI will answer —',
        '  e.g. "what do you specialize in?" or "can I see your resume?"',
        '  Or use:  ask <question>',
        '',
        '── Games ──────────────────────────────────────────────',
        '  games          everything you can play, and your achievements',
        '  snake          classic snake, faster as it grows',
        '  wpm            typing race: out-type the terminal',
        '  train          watch a neural network learn, live',
        '  quiz           which pattern solves it? (interview practice)',
        '  adventure      Founder\'s Journey, a short text adventure',
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
        '── Fun ────────────────────────────────────────────────',
        '  vim            open a file worth reading (:q exits)',
        '  ascii          display ASCII art',
        '  matrix         enter the matrix (5 sec)',
        '  theme [name]   list or switch the phosphor theme',
        '  crt [on|off]   scanlines, flicker and a CRT tube glow',
        '  --no-tty       plain mode: same content, no boot/typing/sound (tty to return)',
        '  achievements   games and easter eggs found so far',
        '  screenreader   read every output line aloud (on | off, alias sr)',
        '  sl             see what happens when you typo \'ls\'',
        '  exit           close session (we\'ll miss you)',
        '  clear          clear terminal',
        '',
        'Tab to autocomplete. → to accept ghost suggestion. Up/Down for command history.',
    ].join('\n')
}
