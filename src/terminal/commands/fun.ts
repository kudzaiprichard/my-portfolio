// terminal/commands/fun.ts
// Easter eggs: sl, make me a sandwich, ascii.

export function generateSl(): string {
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

export function generateMakeSandwich(): string {
    return [
        'What? Make it yourself.',
        '',
        '(If you really mean it, try with elevated privileges.)',
    ].join('\n')
}

export function generateSudoSandwich(): string {
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

export function generateAscii(): string {
    return [
        '    ╭──────────────────────────────────╮',
        '    │                                  │',
        '    │    > const developer = {         │',
        '    │        name: "kudzai matizirofa", │',
        '    │        role: "AI / ML engineer", │',
        '    │        founder: true,            │',
        '    │        status: "shipping"        │',
        '    │      };                          │',
        '    │                                  │',
        '    │    > developer.build()           │',
        '    │    // Output: this portfolio     │',
        '    │                                  │',
        '    ╰──────────────────────────────────╯',
    ].join('\n')
}
