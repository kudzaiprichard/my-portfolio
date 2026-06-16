// hooks/useAdventureGame.ts
"use client"

import { useCallback, useRef } from 'react'

/* ============================================
   WORLD DATA
   ============================================ */

interface Item {
    name: string
    description: string
}

interface Exit {
    direction: string
    roomId: string
    locked?: boolean
    lockMessage?: string
    requiresItem?: string
}

interface Room {
    id: string
    name: string
    description: string
    lookAround: string
    items: Item[]
    exits: Exit[]
    examineTargets?: Record<string, string>
    puzzle?: {
        useItem: string
        giveItem?: string
        unlockExit?: string
        message: string
    }
}

const ROOMS: Record<string, Room> = {
    'the-garage': {
        id: 'the-garage',
        name: 'The Garage',
        description: [
            'A dimly lit garage. The hum of a refurbished laptop fills the silence.',
            'Sticky notes cover every surface — client deadlines, API endpoints,',
            'half-formed ideas. A whiteboard reads: "15 projects. 100% satisfaction."',
            'This is where it all started. Circa 2020.',
        ].join('\n'),
        lookAround: [
            'You see a WORN-LAPTOP on the desk, still warm.',
            'Sticky notes everywhere: "ship by Friday", "learn Docker",',
            '"figure out why CORS exists." A door leads SOUTH to a crossroads.',
        ].join('\n'),
        items: [
            { name: 'worn-laptop', description: 'A battle-scarred ThinkPad. 15+ projects shipped from this thing. It radiates freelancer energy.' },
        ],
        exits: [
            { direction: 'south', roomId: 'the-crossroads' },
        ],
        examineTargets: {
            'whiteboard': 'It reads: "Every senior dev was once a junior dev who didn\'t quit."\nUnderneath, in smaller writing: "Also, learn TypeScript."',
            'sticky notes': '• Fix CORS issue (URGENT)\n• Deploy to Heroku\n• Invoice client #12\n• Sleep (optional)',
            'notes': '• Fix CORS issue (URGENT)\n• Deploy to Heroku\n• Invoice client #12\n• Sleep (optional)',
        },
    },
    'the-crossroads': {
        id: 'the-crossroads',
        name: 'The Crossroads',
        description: [
            'A junction where four paths converge. A weathered signpost stands',
            'at the center, its arms pointing in every direction. The air smells',
            'faintly of fresh deploys and ambition.',
        ].join('\n'),
        lookAround: [
            'The signpost reads:',
            '  NORTH → The Startup (sounds promising)',
            '  EAST  → The Legacy Codebase (sounds ominous)',
            '  WEST  → The Open Source Garden (sounds peaceful)',
            '  SOUTH → (a wall — you can\'t go back to before you started)',
            '',
            'A plaque at the base reads: "Every career is just a series of',
            'well-timed direction changes."',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'north', roomId: 'the-startup' },
            { direction: 'east', roomId: 'the-legacy-codebase' },
            { direction: 'west', roomId: 'the-garden' },
        ],
        examineTargets: {
            'signpost': 'Carved from reclaimed server rack wood. Each arm shows faint scratches where previous paths were crossed out and rewritten. Relatable.',
            'plaque': '"Every career is just a series of well-timed direction changes." — Anonymous (but probably Kudzai)',
        },
    },
    'the-legacy-codebase': {
        id: 'the-legacy-codebase',
        name: 'The Legacy Codebase',
        description: [
            'A dark cavern of spaghetti code. jQuery selectors echo off the',
            'walls. A tangle of callback hell blocks the path forward. Somewhere',
            'deep inside, a function is 400 lines long and nobody knows what',
            'it does. The commit history says only: "fixed stuff."',
        ].join('\n'),
        lookAround: [
            'The walls are inscribed with ancient var declarations.',
            'A mass of tangled LEGACY-CODE blocks the main passage.',
            'You could probably refactor it... if you had the right tools.',
            'The exit leads WEST back to the crossroads.',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'west', roomId: 'the-crossroads' },
        ],
        examineTargets: {
            'walls': 'var x = null; var y = undefined; var z = NaN;\nif (x == y == z) { // this somehow works in production }',
            'legacy-code': 'A writhing mass of nested callbacks, global variables, and inline styles. It whispers: "I was written in a weekend and never refactored." You shudder.',
            'code': 'A writhing mass of nested callbacks, global variables, and inline styles. It whispers: "I was written in a weekend and never refactored." You shudder.',
        },
        puzzle: {
            useItem: 'worn-laptop',
            giveItem: 'clean-module',
            message: [
                'You open the worn laptop and begin refactoring.',
                'Hours pass. The spaghetti code untangles itself into clean,',
                'well-documented modules. The cavern brightens.',
                '',
                'From the refactored code, a CLEAN-MODULE crystallizes in your hands.',
                'It hums with the satisfaction of tests passing on the first try.',
            ].join('\n'),
        },
    },
    'the-startup': {
        id: 'the-startup',
        name: 'The Startup',
        description: [
            'A bustling open-plan office. Whiteboards everywhere. A "Days',
            'Since Last Deploy" counter reads "0" (it always reads 0).',
            'Three product launches happened here. 100K+ users served.',
            'The energy of StartupHub, 2021-2023.',
        ].join('\n'),
        lookAround: [
            'A DEPLOYMENT-KEY hangs on the wall next to a "Ship It" poster.',
            'Exits lead EAST to the server room, NORTH to the AI lab,',
            'and SOUTH back to the crossroads.',
            '',
            'A performance dashboard shows: "45% improvement. You\'re welcome."',
        ].join('\n'),
        items: [
            { name: 'deployment-key', description: 'A golden key inscribed with "CI/CD." It unlocks the ability to ship code at 2 AM without fear.' },
        ],
        exits: [
            { direction: 'south', roomId: 'the-crossroads' },
            { direction: 'east', roomId: 'the-server-room' },
            { direction: 'north', roomId: 'the-lab' },
        ],
        examineTargets: {
            'whiteboard': 'Sprint #47: "Improve load time by 45%"\nStatus: Done ✓\nBelow it: "Sprint #48: Improve it again"',
            'dashboard': '"Requests/sec: 12,400 | Uptime: 99.97% | Vibes: Immaculate"',
            'poster': '"Move fast and don\'t break things." The "don\'t" was added in permanent marker by someone who learned the hard way.',
        },
    },
    'the-server-room': {
        id: 'the-server-room',
        name: 'The Server Room',
        description: [
            'Rows of humming servers. Blue LED lights pulse in rhythm.',
            'Docker containers spin up and down like digital heartbeats.',
            'This is where infrastructure becomes art. Or at least,',
            'where it becomes someone else\'s problem (AWS).',
        ].join('\n'),
        lookAround: [
            'A CONTAINER-KEY sits on the rack, glowing faintly blue.',
            'A monitoring screen shows all systems green.',
            'The exit leads WEST back to the startup.',
        ].join('\n'),
        items: [
            { name: 'container-key', description: 'A key shaped like a Docker whale. It can containerize anything. Dreams, code, leftover pizza.' },
        ],
        exits: [
            { direction: 'west', roomId: 'the-startup' },
        ],
        examineTargets: {
            'servers': 'Each server is labeled: "prod-1", "prod-2", "prod-never-touch-this-one." The third one has the most uptime.',
            'screen': 'All green. 99.97% uptime. The 0.03% was "a learning experience."',
            'monitor': 'All green. 99.97% uptime. The 0.03% was "a learning experience."',
        },
    },
    'the-garden': {
        id: 'the-garden',
        name: 'The Open Source Garden',
        description: [
            'A sunlit garden where code grows in the open. Pull requests',
            'bloom like flowers. Contributors from around the world tend',
            'to the shared codebase. A fountain burbles with fresh commits.',
        ].join('\n'),
        lookAround: [
            'The garden is peaceful. A CONTRIBUTION-WALL lists merged PRs.',
            'There\'s a strange pedestal in the center — it looks like',
            'something could be placed on it.',
            'The exit leads EAST back to the crossroads.',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'east', roomId: 'the-crossroads' },
        ],
        examineTargets: {
            'fountain': 'The fountain is fed by a stream of git commits. Each droplet is a merged PR. It\'s strangely beautiful.',
            'wall': 'A list of contributions. Bug fixes, feature additions, documentation improvements. The quiet work that makes the ecosystem better.',
            'contribution-wall': 'A list of contributions. Bug fixes, feature additions, documentation improvements. The quiet work that makes the ecosystem better.',
            'pedestal': 'A stone pedestal with an inscription: "Place the refined artifact here to unlock the path forward." There\'s a slot shaped like a module.',
        },
        puzzle: {
            useItem: 'clean-module',
            giveItem: 'golden-api-key',
            message: [
                'You place the clean module on the pedestal.',
                'The garden hums with approval. The open-source community',
                'recognizes quality code when it sees it.',
                '',
                'The pedestal transforms the module into a GOLDEN-API-KEY.',
                'It shimmers with the power of well-designed interfaces.',
            ].join('\n'),
        },
    },
    'the-lab': {
        id: 'the-lab',
        name: 'The AI Lab',
        description: [
            'A high-tech laboratory filled with GPUs and whiteboards covered',
            'in neural network diagrams. NLP models achieve 94% accuracy here.',
            'Inference pipelines have been optimized by 60%. Five mentees',
            'learned their craft in this room. TechCorp, 2023-present.',
        ].join('\n'),
        lookAround: [
            'A TRAINED-MODEL sits in a glass case, glowing with potential.',
            'A locked door to the EAST bears the inscription:',
            '"Only those with the key to all APIs may enter."',
            'The exit leads SOUTH back to the startup.',
        ].join('\n'),
        items: [
            { name: 'trained-model', description: 'A neural network trained to 94% accuracy. It\'s compact, efficient, and surprisingly opinionated about architecture decisions.' },
        ],
        exits: [
            { direction: 'south', roomId: 'the-startup' },
            {
                direction: 'east',
                roomId: 'the-side-project',
                locked: true,
                lockMessage: 'The door is locked. The inscription reads: "Only those with the key to all APIs may enter."\nYou need a GOLDEN-API-KEY.',
                requiresItem: 'golden-api-key',
            },
        ],
        examineTargets: {
            'whiteboards': 'Diagrams of transformer architectures, attention mechanisms, and a surprisingly detailed drawing of a cat labeled "training data."',
            'case': 'The glass case hums. Inside, tensors flow through layers of abstraction. The model wants to be used.',
            'door': 'A reinforced door. The lock is shaped like an API endpoint. Fancy.',
        },
    },
    'the-side-project': {
        id: 'the-side-project',
        name: 'The Side Project Lab',
        description: [
            'A private workshop. This is where passion projects come to life.',
            'The walls are lined with half-finished prototypes, each one',
            'more ambitious than the last. A deployment terminal glows',
            'in the corner, waiting for the final piece.',
        ].join('\n'),
        lookAround: [
            'The terminal reads: "DEPLOYMENT READY. Insert trained model',
            'to launch the ultimate project."',
            'This is it. The culmination of everything.',
            'The exit leads WEST back to the lab.',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'west', roomId: 'the-lab' },
        ],
        examineTargets: {
            'terminal': '"System Status: READY\nAll dependencies resolved. All tests passing.\nAwaiting final artifact for deployment."',
            'prototypes': 'Each prototype represents a lesson learned. A chat app. A classifier. A dashboard. None wasted — each one built toward this moment.',
            'walls': 'Blueprints for projects that pushed boundaries. Some shipped. Some taught. All mattered.',
        },
        puzzle: {
            useItem: 'trained-model',
            message: 'WIN',
        },
    },
}

const WIN_MESSAGE = [
    '╔══════════════════════════════════════════════════════╗',
    '║              🎉 DEPLOYMENT SUCCESSFUL 🎉             ║',
    '╠══════════════════════════════════════════════════════╣',
    '║                                                      ║',
    '║  You insert the trained model into the terminal.     ║',
    '║  The screen erupts with green. Every test passes.    ║',
    '║  Every metric spikes. The project goes live.         ║',
    '║                                                      ║',
    '║  From a garage with a worn laptop to an AI lab       ║',
    '║  shipping production models — you just played        ║',
    '║  through the career of someone who turned every      ║',
    '║  challenge into a shipped feature.                   ║',
    '║                                                      ║',
    '║  Kudzai Prichard Matizirofa:                         ║',
    '║  AI & Full Stack Engineer. 15+ projects shipped.     ║',
    '║  100K+ users served. 94% model accuracy.             ║',
    '║  Currently building the future at TechCorp.          ║',
    '║                                                      ║',
    '║  The developer you just played as? They\'re also      ║',
    '║  the one who built the terminal you\'re standing in.  ║',
    '║                                                      ║',
    '║  Hiring? Let\'s talk. → Contact section above.       ║',
    '║                                                      ║',
    '╚══════════════════════════════════════════════════════╝',
    '',
    'Type "quit" to return to the terminal.',
].join('\n')

/* ============================================
   GAME STATE
   ============================================ */

interface GameState {
    currentRoom: string
    inventory: Item[]
    visitedRooms: Set<string>
    roomItemsTaken: Record<string, Set<string>>
    puzzlesSolved: Set<string>
    isComplete: boolean
    moveCount: number
}

function createInitialState(): GameState {
    return {
        currentRoom: 'the-garage',
        inventory: [],
        visitedRooms: new Set(['the-garage']),
        roomItemsTaken: {},
        puzzlesSolved: new Set(),
        isComplete: false,
        moveCount: 0,
    }
}

/* ============================================
   PARSER
   ============================================ */

function getAvailableItems(room: Room, state: GameState): Item[] {
    const taken = state.roomItemsTaken[room.id] || new Set()
    return room.items.filter(item => !taken.has(item.name))
}

function processInput(input: string, state: GameState): { output: string; newState: GameState } {
    const trimmed = input.trim().toLowerCase()
    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]
    const rest = parts.slice(1).join(' ')

    if (!cmd) {
        return { output: '', newState: state }
    }

    const room = ROOMS[state.currentRoom]

    // ── QUIT ──
    if (cmd === 'quit' || cmd === 'exit' || cmd === 'q') {
        return { output: 'QUIT', newState: state }
    }

    // ── HELP ──
    if (cmd === 'help' || cmd === '?') {
        return {
            output: [
                '── Adventure Commands ──',
                '  go <direction>     move (north, south, east, west)',
                '  look               look around the room',
                '  look at <thing>    examine something closely',
                '  take <item>        pick up an item',
                '  use <item>         use an item in this room',
                '  inventory / i      check your inventory',
                '  help               show this message',
                '  quit               exit the adventure',
            ].join('\n'),
            newState: state,
        }
    }

    // ── LOOK ──
    if (cmd === 'look' || cmd === 'l') {
        if (rest && (rest.startsWith('at ') || rest.startsWith('around'))) {
            const target = rest.replace(/^at\s+/, '').replace(/^around$/, '')
            if (!target || rest === 'around') {
                return { output: room.lookAround, newState: state }
            }
            const examineKey = target.toLowerCase()
            if (room.examineTargets?.[examineKey]) {
                return { output: room.examineTargets[examineKey], newState: state }
            }
            // Check inventory items
            const invItem = state.inventory.find(i => i.name === examineKey)
            if (invItem) {
                return { output: invItem.description, newState: state }
            }
            return { output: `You don't see anything special about "${target}".`, newState: state }
        }
        return { output: room.lookAround, newState: state }
    }

    // ── GO / MOVE ──
    if (cmd === 'go' || cmd === 'move' || cmd === 'walk' || cmd === 'north' || cmd === 'south' || cmd === 'east' || cmd === 'west' || cmd === 'n' || cmd === 's' || cmd === 'e' || cmd === 'w') {
        let direction = rest
        // Allow shorthand: just typing "north" or "n"
        const dirMap: Record<string, string> = { n: 'north', s: 'south', e: 'east', w: 'west', north: 'north', south: 'south', east: 'east', west: 'west' }
        if (dirMap[cmd]) direction = dirMap[cmd]

        if (!direction) {
            return { output: 'Go where? (north, south, east, west)', newState: state }
        }

        const exit = room.exits.find(e => e.direction === direction)
        if (!exit) {
            return { output: `You can't go ${direction} from here.`, newState: state }
        }

        if (exit.locked) {
            // Check if player has the required item
            if (exit.requiresItem && state.inventory.some(i => i.name === exit.requiresItem)) {
                // Unlock and proceed
                const newState = { ...state }
                const newRoom = ROOMS[exit.roomId]
                newState.currentRoom = exit.roomId
                newState.visitedRooms = new Set(state.visitedRooms)
                newState.visitedRooms.add(exit.roomId)
                newState.moveCount = state.moveCount + 1
                const visited = state.visitedRooms.has(exit.roomId)
                return {
                    output: [
                        `The golden API key fits. The door swings open.`,
                        '',
                        `── ${newRoom.name} ──`,
                        visited ? 'You\'ve been here before.' : newRoom.description,
                    ].join('\n'),
                    newState,
                }
            }
            return { output: exit.lockMessage || 'The way is blocked.', newState: state }
        }

        const newRoom = ROOMS[exit.roomId]
        const visited = state.visitedRooms.has(exit.roomId)
        const newState = {
            ...state,
            currentRoom: exit.roomId,
            visitedRooms: new Set(state.visitedRooms),
            moveCount: state.moveCount + 1,
        }
        newState.visitedRooms.add(exit.roomId)

        return {
            output: [
                `── ${newRoom.name} ──`,
                visited ? 'You\'ve been here before. Type "look" to look around.' : newRoom.description,
            ].join('\n'),
            newState,
        }
    }

    // ── TAKE / GET / PICK UP ──
    if (cmd === 'take' || cmd === 'get' || cmd === 'grab' || cmd === 'pick') {
        const itemName = (cmd === 'pick' ? rest.replace(/^up\s+/, '') : rest).toLowerCase()
        if (!itemName) {
            return { output: 'Take what?', newState: state }
        }

        const available = getAvailableItems(room, state)
        const item = available.find(i => i.name === itemName)
        if (!item) {
            if (state.inventory.some(i => i.name === itemName)) {
                return { output: 'You already have that.', newState: state }
            }
            return { output: `There's no "${itemName}" here to take.`, newState: state }
        }

        const newState = { ...state }
        newState.inventory = [...state.inventory, item]
        newState.roomItemsTaken = { ...state.roomItemsTaken }
        if (!newState.roomItemsTaken[room.id]) {
            newState.roomItemsTaken[room.id] = new Set()
        } else {
            newState.roomItemsTaken[room.id] = new Set(newState.roomItemsTaken[room.id])
        }
        newState.roomItemsTaken[room.id].add(item.name)

        return {
            output: `Taken: ${item.name}\n${item.description}`,
            newState,
        }
    }

    // ── USE ──
    if (cmd === 'use' || cmd === 'apply' || cmd === 'place') {
        const itemName = rest.toLowerCase()
        if (!itemName) {
            return { output: 'Use what?', newState: state }
        }

        if (!state.inventory.some(i => i.name === itemName)) {
            return { output: `You don't have "${itemName}".`, newState: state }
        }

        if (!room.puzzle || room.puzzle.useItem !== itemName) {
            return { output: `You can't use "${itemName}" here. Maybe somewhere else.`, newState: state }
        }

        if (state.puzzlesSolved.has(room.id)) {
            return { output: 'You\'ve already done that here.', newState: state }
        }

        // Check for win condition
        if (room.puzzle.message === 'WIN') {
            const newState = { ...state, isComplete: true }
            return { output: WIN_MESSAGE, newState }
        }

        const newState = { ...state }
        newState.puzzlesSolved = new Set(state.puzzlesSolved)
        newState.puzzlesSolved.add(room.id)

        // Remove used item from inventory
        newState.inventory = state.inventory.filter(i => i.name !== itemName)

        // Give new item if applicable
        if (room.puzzle.giveItem) {
            const newItem: Item = {
                name: room.puzzle.giveItem,
                description: room.puzzle.giveItem === 'clean-module'
                    ? 'A pristine, well-tested module extracted from the chaos. It represents what good engineering can salvage.'
                    : 'A shimmering key that grants access to any API. It represents mastery of interfaces and integration.',
            }
            newState.inventory = [...newState.inventory, newItem]
        }

        return { output: room.puzzle.message, newState }
    }

    // ── INVENTORY ──
    if (cmd === 'inventory' || cmd === 'i' || cmd === 'inv') {
        if (state.inventory.length === 0) {
            return { output: 'Your inventory is empty.', newState: state }
        }
        const lines = ['── Inventory ──']
        for (const item of state.inventory) {
            lines.push(`  ${item.name} — ${item.description.split('.')[0]}.`)
        }
        return { output: lines.join('\n'), newState: state }
    }

    // ── UNKNOWN ──
    return { output: `I don't understand "${trimmed}". Type "help" for commands.`, newState: state }
}

/* ============================================
   HOOK
   ============================================ */

export function useAdventureGame() {
    const stateRef = useRef<GameState>(createInitialState())

    const handleInput = useCallback((input: string): { output: string; quit: boolean; prompt: string } => {
        const { output, newState } = processInput(input, stateRef.current)
        stateRef.current = newState

        if (output === 'QUIT') {
            return {
                output: 'You step away from the terminal. The adventure fades.\nReturning to normal shell...',
                quit: true,
                prompt: getPrompt(newState),
            }
        }

        return {
            output,
            quit: false,
            prompt: getPrompt(newState),
        }
    }, [])

    const start = useCallback((): string => {
        stateRef.current = createInitialState()
        const room = ROOMS['the-garage']
        return [
            '╔══════════════════════════════════════════════════════╗',
            '║           CAREER QUEST: A Terminal Adventure         ║',
            '╠══════════════════════════════════════════════════════╣',
            '║  Navigate a world that may or may not be a thinly   ║',
            '║  veiled metaphor for someone\'s career journey.      ║',
            '║  Type "help" for commands. Type "quit" to exit.     ║',
            '╚══════════════════════════════════════════════════════╝',
            '',
            `── ${room.name} ──`,
            room.description,
        ].join('\n')
    }, [])

    const stop = useCallback(() => {
        stateRef.current = createInitialState()
    }, [])

    const getPrompt = (state: GameState): string => {
        const room = ROOMS[state.currentRoom]
        return `[${room.name}] > `
    }

    const getCurrentPrompt = useCallback((): string => {
        return getPrompt(stateRef.current)
    }, [])

    return { handleInput, start, stop, getCurrentPrompt }
}
