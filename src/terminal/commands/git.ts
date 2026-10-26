// terminal/commands/git.ts
// git log / git blame.

import { contact } from '@/src/content'

const AUTHOR = `Author: Kudzai Prichard Matizirofa <${contact.email}>`

export function generateGitLog(): string {
    const commits: [string, string, string][] = [
        ['a7f3b2e (HEAD -> main, tag: v3.0)', 'Sun Oct 25 02:14:33 2026 +0200', 'feat(terminal): wpm, train and quiz — the terminal plays now'],
        ['8d1c4f9', 'Fri Oct 16 23:47:12 2026 +0200', 'feat(teleagents): champion at POTRAZ Innovation Expo 2026'],
        ['e2b8a71', 'Mon Oct 12 18:22:05 2026 +0200', 'perf(ourafrica): 720p renditions, 6.5x smaller downloads'],
        ['3f9d0c2', 'Sat Oct 10 14:33:41 2026 +0200', 'feat(whiteboard-studio): an MCP server, so agents can draw'],
        ['c4e7b38', 'Wed Sep 02 09:15:27 2026 +0200', 'data: release Zimbabwe All Speech (1,678+ hours, 358K clips)'],
        ['91a2d5e', 'Tue Jul 14 03:42:18 2026 +0200', 'fix: sleep schedule (reverted after 2 hours)'],
        ['b5f8e03', 'Sat May 16 16:08:52 2026 +0200', 'feat(indabax): shift-robust ensemble, public LB 0.6840'],
        ['2e4a9d1', 'Mon Aug 05 21:33:06 2024 +0200', 'init: first commit at Sybrin — banks, OCR, production'],
    ]
    return commits.flatMap(([hash, date, msg], i) => [
        ...(i ? [''] : []),
        `commit ${hash}`,
        AUTHOR,
        `Date:   ${date}`,
        '',
        `    ${msg}`,
    ]).join('\n')
}

export function generateGitBlame(): string {
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
