// terminal/games/adventure.ts
// "Founder's Journey": a short text adventure through the real path — the
// University of Zimbabwe, Sybrin's bank floor, the Teleagents night office,
// the data room, and the POTRAZ Innovation Expo. Loaded on demand the first
// time `adventure` runs.

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
    /** Printed when the item opens the way */
    unlockMessage?: string
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
        giveItem?: Item
        message: string
        /** Using the item here ends the game */
        win?: boolean
    }
}

const START = 'lecture-hall'

const ROOMS: Record<string, Room> = {
    'lecture-hall': {
        id: 'lecture-hall',
        name: 'University of Zimbabwe',
        description: [
            'A lecture hall after hours. A whiteboard still holds tonight\'s derivation:',
            'a contextual bandit choosing between five diabetes treatments.',
            'Your B.Sc. in Artificial Intelligence & Machine Learning is under way.',
        ].join('\n'),
        lookAround: [
            'A NOTEBOOK lies open on the front desk, full of models and maths.',
            'The WHITEBOARD is covered in Thompson sampling. A door leads NORTH',
            'to the city, where the banks are hiring.',
        ].join('\n'),
        items: [
            { name: 'notebook', description: 'Your notes: CNNs, transformers, OCR, contextual bandits. Everything you need, nothing you have shipped yet.' },
        ],
        exits: [{ direction: 'north', roomId: 'bank-floor' }],
        examineTargets: {
            whiteboard: 'Neural Thompson Sampling, a safety gate, "never Metformin below eGFR 30".\nThis becomes METIS, your thesis.',
        },
    },
    'bank-floor': {
        id: 'bank-floor',
        name: 'Sybrin, the bank operations floor',
        description: [
            'Rows of scanners hum. Towers of paper forms from EcoCash, CABS and Stanbic',
            'wait to be keyed in by hand. Somebody sighs at a payment instruction.',
        ].join('\n'),
        lookAround: [
            'The FORMS are endless: payments, account openings, signatures.',
            'SOUTH is the university. EAST, a door marked "Teleagents" is locked:',
            'founders need proof that you can ship to production.',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'south', roomId: 'lecture-hall' },
            {
                direction: 'east', roomId: 'night-office', locked: true, requiresItem: 'ocr-platform',
                lockMessage: 'Locked. A note on the door: "Show us something running in production."\nTry USE NOTEBOOK here first.',
                unlockMessage: 'You show the OCR platform running for three banks. The door opens.',
            },
        ],
        examineTargets: {
            forms: 'Tens of thousands a month. Faces, signatures, account numbers. Perfect for a model.',
            scanners: 'They never stop. The bottleneck is the people behind them.',
        },
        puzzle: {
            useItem: 'notebook',
            giveItem: { name: 'ocr-platform', description: 'A production document-AI platform for EcoCash, CABS and Stanbic: tens of thousands of documents a month, no manual keying.' },
            message: [
                'You turn the notebook into a pipeline: computer vision for faces and',
                'signatures, OCR for the text, an API the banks can call.',
                'Manual keying stops. You now carry the OCR-PLATFORM.',
            ].join('\n'),
        },
    },
    'night-office': {
        id: 'night-office',
        name: 'Teleagents, the night office',
        description: [
            'Two desks, one whiteboard: "Voice AI agents for Africa." Phones ring in',
            'Shona, Ndebele and Ndau. Commercial voice models do not understand them.',
        ].join('\n'),
        lookAround: [
            'The PHONES keep ringing. A sticky note says: "we need our own speech data."',
            'NORTH is the data room. WEST, back to the bank floor. EAST, a hall in',
            'Bulawayo, where the doors only open for a working product.',
        ].join('\n'),
        items: [],
        exits: [
            { direction: 'west', roomId: 'bank-floor' },
            { direction: 'north', roomId: 'data-room' },
            {
                direction: 'east', roomId: 'expo-hall', locked: true, requiresItem: 'voice-agent',
                lockMessage: 'Locked. The sign reads: "POTRAZ Innovation Expo — exhibitors only."\nYou need a VOICE-AGENT that actually works.',
                unlockMessage: 'Your voice agent answers the door attendant in Ndebele. You are in.',
            },
        ],
        examineTargets: {
            phones: 'Inbound support, outbound sales, call-centre queues. All of it in languages the big models skip.',
            whiteboard: 'STT → LLM → TTS, streaming, self-hosted. And a question mark under "data".',
        },
        puzzle: {
            useItem: 'speech-dataset',
            giveItem: { name: 'voice-agent', description: 'A self-hosted, real-time voice agent: your own speech models, a streaming STT → LLM → TTS loop, RAG over each client\'s knowledge.' },
            message: [
                'You train speech-to-text and text-to-speech on SageMaker, wire a streaming',
                'loop with an LLM in the middle, and answer the first call in Shona.',
                'You now carry the VOICE-AGENT.',
            ].join('\n'),
        },
    },
    'data-room': {
        id: 'data-room',
        name: 'The data room',
        description: [
            'Racks of drives and a terminal pointed at S3. Seven speech sources sit',
            'in seven formats, and only 15,000 clips carry human labels.',
        ].join('\n'),
        lookAround: [
            'RAW-AUDIO is stacked in crates. The TERMINAL is ready for a Spark job.',
            'SOUTH, back to the night office.',
        ].join('\n'),
        items: [
            { name: 'raw-audio', description: 'Seven separate speech sources in Shona, Ndebele and Ndau. Messy, unlabelled, valuable.' },
        ],
        exits: [{ direction: 'south', roomId: 'night-office' }],
        examineTargets: {
            terminal: 'A Spark (EMR) pipeline waiting for input: segment, score, tier, label.',
        },
        puzzle: {
            useItem: 'raw-audio',
            giveItem: { name: 'speech-dataset', description: 'Zimbabwe All Speech: 1,678+ hours and 358K clips, every one with a quality score. Open-sourced on Hugging Face.' },
            message: [
                'You merge the seven sources into one schema, score every clip, and use',
                'pseudo-labelling to grow 15K labelled clips six-fold. Then you publish it.',
                'You now carry the SPEECH-DATASET.',
            ].join('\n'),
        },
    },
    'expo-hall': {
        id: 'expo-hall',
        name: 'POTRAZ Innovation Expo, Bulawayo',
        description: [
            'A hall of stands and lanyards. On stage, a panel of judges and the',
            'Director-General. Your stand has a phone and a microphone.',
        ].join('\n'),
        lookAround: [
            'The STAGE is waiting for a demo. WEST is the way you came.',
            'Use what you built.',
        ].join('\n'),
        items: [],
        exits: [{ direction: 'west', roomId: 'night-office' }],
        examineTargets: {
            stage: 'A microphone, a speaker, and a room that has never heard a machine answer in Ndau.',
        },
        puzzle: { useItem: 'voice-agent', message: 'WIN', win: true },
    },
}

const WIN_MESSAGE = [
    '╔══════════════════════════════════════════════════════╗',
    '║               ★  CHAMPION, POTRAZ 2026  ★            ║',
    '╠══════════════════════════════════════════════════════╣',
    '║                                                      ║',
    '║  The judges call a number. Your agent answers in     ║',
    '║  Shona, books the appointment and switches to        ║',
    '║  Ndebele when the caller does. The hall goes quiet,  ║',
    '║  then loud.                                          ║',
    '║                                                      ║',
    '║  "TeleAgents: AI Voice Agents for Zimbabwe" is named ║',
    '║  Champion of the POTRAZ Innovation Expo & Conference ║',
    '║  2026, and recognised by the Director-General.       ║',
    '║                                                      ║',
    '║  That was the real path of Kudzai Prichard           ║',
    '║  Matizirofa: AI / ML engineer, co-founder of         ║',
    '║  Teleagents and OurAfrica.                           ║',
    '║                                                      ║',
    '║  Building something like it? Type email to reach me. ║',
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
        currentRoom: START,
        inventory: [],
        visitedRooms: new Set([START]),
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

function enter(state: GameState, roomId: string, lead?: string): { output: string; newState: GameState } {
    const visited = state.visitedRooms.has(roomId)
    const room = ROOMS[roomId]
    const newState = { ...state, currentRoom: roomId, visitedRooms: new Set(state.visitedRooms).add(roomId), moveCount: state.moveCount + 1 }
    return {
        output: [
            ...(lead ? [lead, ''] : []),
            `── ${room.name} ──`,
            visited ? 'You\'ve been here before. Type "look" to look around.' : room.description,
        ].join('\n'),
        newState,
    }
}

function processInput(input: string, state: GameState): { output: string; newState: GameState } {
    const trimmed = input.trim().toLowerCase()
    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]
    const rest = parts.slice(1).join(' ')

    if (!cmd) return { output: '', newState: state }

    const room = ROOMS[state.currentRoom]

    if (cmd === 'quit' || cmd === 'exit' || cmd === 'q') return { output: 'QUIT', newState: state }

    if (cmd === 'help' || cmd === '?') {
        return {
            output: [
                '── Journey commands ──',
                '  go <direction>     move (north, south, east, west; or n s e w)',
                '  look               look around',
                '  look at <thing>    examine something closely',
                '  take <item>        pick up an item',
                '  use <item>         use an item here',
                '  inventory / i      what you carry',
                '  quit               back to the terminal',
            ].join('\n'),
            newState: state,
        }
    }

    if (cmd === 'look' || cmd === 'l' || cmd === 'examine' || cmd === 'x') {
        const target = (cmd === 'look' || cmd === 'l' ? rest.replace(/^at\s+/, '').replace(/^around$/, '') : rest).trim()
        if (!target) return { output: room.lookAround, newState: state }
        const examined = room.examineTargets?.[target]
        if (examined) return { output: examined, newState: state }
        const item = state.inventory.find(i => i.name === target) ?? getAvailableItems(room, state).find(i => i.name === target)
        if (item) return { output: item.description, newState: state }
        return { output: `You don't see anything special about "${target}".`, newState: state }
    }

    const dirMap: Record<string, string> = { n: 'north', s: 'south', e: 'east', w: 'west', north: 'north', south: 'south', east: 'east', west: 'west' }
    if (cmd === 'go' || cmd === 'move' || cmd === 'walk' || dirMap[cmd]) {
        const direction = dirMap[cmd] ?? dirMap[rest] ?? rest
        if (!direction) return { output: 'Go where? (north, south, east, west)', newState: state }
        const exit = room.exits.find(e => e.direction === direction)
        if (!exit) return { output: `You can't go ${direction} from here.`, newState: state }
        if (exit.locked) {
            if (exit.requiresItem && state.inventory.some(i => i.name === exit.requiresItem)) {
                return enter(state, exit.roomId, exit.unlockMessage)
            }
            return { output: exit.lockMessage || 'The way is blocked.', newState: state }
        }
        return enter(state, exit.roomId)
    }

    if (cmd === 'take' || cmd === 'get' || cmd === 'grab' || cmd === 'pick') {
        const itemName = (cmd === 'pick' ? rest.replace(/^up\s+/, '') : rest).trim()
        if (!itemName) return { output: 'Take what?', newState: state }
        const item = getAvailableItems(room, state).find(i => i.name === itemName)
        if (!item) {
            if (state.inventory.some(i => i.name === itemName)) return { output: 'You already have that.', newState: state }
            return { output: `There's no "${itemName}" here to take.`, newState: state }
        }
        const taken = new Set(state.roomItemsTaken[room.id] ?? []).add(item.name)
        return {
            output: `Taken: ${item.name}\n${item.description}`,
            newState: { ...state, inventory: [...state.inventory, item], roomItemsTaken: { ...state.roomItemsTaken, [room.id]: taken } },
        }
    }

    if (cmd === 'use' || cmd === 'apply' || cmd === 'show') {
        const itemName = rest.trim()
        if (!itemName) return { output: 'Use what?', newState: state }
        if (!state.inventory.some(i => i.name === itemName)) return { output: `You don't have "${itemName}".`, newState: state }
        if (!room.puzzle || room.puzzle.useItem !== itemName) return { output: `"${itemName}" doesn't help here. Maybe somewhere else.`, newState: state }
        if (state.puzzlesSolved.has(room.id)) return { output: 'You\'ve already done that here.', newState: state }
        if (room.puzzle.win) return { output: WIN_MESSAGE, newState: { ...state, isComplete: true } }

        const inventory = state.inventory.filter(i => i.name !== itemName)
        if (room.puzzle.giveItem) inventory.push(room.puzzle.giveItem)
        return {
            output: room.puzzle.message,
            newState: { ...state, inventory, puzzlesSolved: new Set(state.puzzlesSolved).add(room.id) },
        }
    }

    if (cmd === 'inventory' || cmd === 'i' || cmd === 'inv') {
        if (state.inventory.length === 0) return { output: 'You carry nothing yet.', newState: state }
        return {
            output: ['── Inventory ──', ...state.inventory.map(i => `  ${i.name} — ${i.description.split('.')[0]}.`)].join('\n'),
            newState: state,
        }
    }

    return { output: `I don't understand "${trimmed}". Type "help" for commands.`, newState: state }
}

function getPrompt(state: GameState): string {
    return `[${ROOMS[state.currentRoom].name}] > `
}

/* ============================================
   GAME
   ============================================ */

export class AdventureGame {
    private state: GameState = createInitialState()

    /** True once the journey has been finished (the session unlocks the achievement). */
    get complete(): boolean {
        return this.state.isComplete
    }

    handleInput(input: string): { output: string; quit: boolean; prompt: string } {
        const { output, newState } = processInput(input, this.state)
        this.state = newState
        if (output === 'QUIT') {
            return { output: 'You step back from the journey.\nReturning to the shell...', quit: true, prompt: getPrompt(newState) }
        }
        return { output, quit: false, prompt: getPrompt(newState) }
    }

    start(): string {
        this.state = createInitialState()
        const room = ROOMS[START]
        return [
            '╔══════════════════════════════════════════════════════╗',
            "║          FOUNDER'S JOURNEY: a terminal story         ║",
            '╠══════════════════════════════════════════════════════╣',
            '║  Five rooms, one real path: from a lecture hall to   ║',
            '║  a national award. Take things, use them, go on.     ║',
            '║  Type "help" for commands, "quit" to leave.          ║',
            '╚══════════════════════════════════════════════════════╝',
            '',
            `── ${room.name} ──`,
            room.description,
        ].join('\n')
    }

    stop(): void {
        this.state = createInitialState()
    }

    getCurrentPrompt(): string {
        return getPrompt(this.state)
    }
}
