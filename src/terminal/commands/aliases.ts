// terminal/commands/aliases.ts
// Windows/Mac command names mapped onto the canonical commands.

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

    // Reach-out
    'resume':     'cv',
    'download':   'cv',
    'mail':       'email',
    'mailto':     'email',

    // Process
    'pkill':      'kill',
    'killall':    'kill',

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
    'figlet':     'ascii',
    'cowsay':     'ascii',
    'banner':     'ascii',
    'zork':       'adventure',
    'quest':      'adventure',
    'journey':    'adventure',
    'play':       'games',
    'arcade':     'games',
    'typing':     'wpm',
    'typerace':   'wpm',
    'race':       'wpm',
    'ml':         'train',
    'neural':     'train',
    'interview':  'quiz',
}

/**
 * Resolve common shell aliases to canonical commands.
 * Preserves the original argument casing and spacing.
 */
export function resolveAlias(command: string): string {
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
