// terminal/games/train.ts
// `train`: a tiny neural network (2 inputs → 16 tanh units → 1 sigmoid) trained
// from scratch, in the browser, on the "two moons" dataset. Each frame runs a
// batch of gradient-descent steps and redraws the decision boundary in ASCII,
// with the loss, accuracy and a loss sparkline. Pure; loaded on demand.

export const TRAIN_EPOCHS = 1500
export const STEPS_PER_FRAME = 25

const POINTS = 64
const NOISE = 0.17

/** Network size and how it learns */
export interface NetOptions { hidden: number; lr: number; init: number; momentum: number }
// Chosen across 40 seeds: every run ends at 97%+, and the boundary visibly bends mid-run
export const NET: NetOptions = { hidden: 16, lr: 0.08, init: 0.5, momentum: 0.9 }

const GRID_W = 46
const GRID_H = 15
const X_MIN = -1.4, X_MAX = 2.4
const Y_MIN = -0.9, Y_MAX = 1.4

/** A small seeded PRNG (mulberry32), so a run is reproducible. */
export function seeded(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

interface Sample { x: number; y: number; label: 0 | 1 }

/** Two interleaved half-circles: not separable by a straight line. */
export function twoMoons(rand: () => number, n = POINTS): Sample[] {
    const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand())
    return Array.from({ length: n }, (_, i) => {
        const label = (i % 2) as 0 | 1
        const t = Math.PI * rand()
        const [x, y] = label === 0 ? [Math.cos(t), Math.sin(t)] : [1 - Math.cos(t), 0.5 - Math.sin(t)]
        return { x: x + gauss() * NOISE, y: y + gauss() * NOISE, label }
    })
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
// Inputs are centred on the moons before the first layer
const norm = (x: number, y: number) => [(x - 0.5) / 1.2, (y - 0.25) / 0.7] as const

class TinyNet {
    w1: number[][]
    b1: number[]
    w2: number[]
    b2 = 0
    private v = { w1: [] as number[][], b1: [] as number[], w2: [] as number[], b2: 0 }

    constructor(rand: () => number, private opts: NetOptions) {
        const init = () => (rand() * 2 - 1) * opts.init
        this.w1 = Array.from({ length: opts.hidden }, () => [init(), init()])
        this.b1 = Array.from({ length: opts.hidden }, init)
        this.w2 = Array.from({ length: opts.hidden }, init)
        this.v.w1 = this.w1.map(() => [0, 0])
        this.v.b1 = this.b1.map(() => 0)
        this.v.w2 = this.w2.map(() => 0)
    }

    predict(x: number, y: number): number {
        const [a, b] = norm(x, y)
        let z = this.b2
        for (let j = 0; j < this.w2.length; j++) z += this.w2[j] * Math.tanh(this.w1[j][0] * a + this.w1[j][1] * b + this.b1[j])
        return sigmoid(z)
    }

    /** One full-batch gradient step (binary cross-entropy, momentum). Returns the loss before it. */
    step(data: readonly Sample[]): number {
        const g = { w1: this.w1.map(() => [0, 0]), b1: this.b1.map(() => 0), w2: this.w2.map(() => 0), b2: 0 }
        let loss = 0
        for (const s of data) {
            const [a, b] = norm(s.x, s.y)
            const h = this.w1.map((w, j) => Math.tanh(w[0] * a + w[1] * b + this.b1[j]))
            const p = sigmoid(h.reduce((z, hj, j) => z + this.w2[j] * hj, this.b2))
            loss -= s.label ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9)
            const dz = p - s.label
            g.b2 += dz
            for (let j = 0; j < this.w2.length; j++) {
                g.w2[j] += dz * h[j]
                const dh = dz * this.w2[j] * (1 - h[j] * h[j])
                g.w1[j][0] += dh * a
                g.w1[j][1] += dh * b
                g.b1[j] += dh
            }
        }
        const n = data.length
        const move = (vel: number, grad: number) => this.opts.momentum * vel - (this.opts.lr * grad) / n
        for (let j = 0; j < this.w2.length; j++) {
            this.v.w2[j] = move(this.v.w2[j], g.w2[j]); this.w2[j] += this.v.w2[j]
            this.v.b1[j] = move(this.v.b1[j], g.b1[j]); this.b1[j] += this.v.b1[j]
            for (let k = 0; k < 2; k++) {
                this.v.w1[j][k] = move(this.v.w1[j][k], g.w1[j][k])
                this.w1[j][k] += this.v.w1[j][k]
            }
        }
        this.v.b2 = move(this.v.b2, g.b2); this.b2 += this.v.b2
        return loss / n
    }

    accuracy(data: readonly Sample[]): number {
        return data.filter(s => (this.predict(s.x, s.y) > 0.5 ? 1 : 0) === s.label).length / data.length
    }
}

const SPARK = '▁▂▃▄▅▆▇█'

function sparkline(values: readonly number[], width = 32): string {
    if (!values.length) return ''
    const step = Math.max(1, values.length / width)
    const picked: number[] = []
    for (let i = 0; i < values.length; i += step) picked.push(values[Math.floor(i)])
    const max = Math.max(...picked), min = Math.min(...picked)
    return picked.map(v => SPARK[Math.round(((v - min) / (max - min || 1)) * (SPARK.length - 1))]).join('')
}

export class TrainRun {
    private net: TinyNet
    private data: Sample[]
    epoch = 0
    private losses: number[] = []

    constructor(seed = Date.now(), opts: NetOptions = NET) {
        const rand = seeded(seed)
        this.data = twoMoons(rand)
        this.net = new TinyNet(rand, opts)
    }

    get done(): boolean { return this.epoch >= TRAIN_EPOCHS }
    get loss(): number { return this.losses.at(-1) ?? NaN }
    get accuracy(): number { return this.net.accuracy(this.data) }

    /** Run up to `n` gradient steps. */
    advance(n = STEPS_PER_FRAME): void {
        for (let i = 0; i < n && !this.done; i++) {
            const loss = this.net.step(this.data)
            this.epoch++
            if (this.epoch % 5 === 0 || this.epoch === 1) this.losses.push(loss)
        }
    }

    /** The plot, the numbers and the sparkline, as text. */
    frame(): string {
        const grid: string[][] = Array.from({ length: GRID_H }, (_, r) => Array.from({ length: GRID_W }, (_, c) => {
            const x = X_MIN + ((c + 0.5) / GRID_W) * (X_MAX - X_MIN)
            const y = Y_MAX - ((r + 0.5) / GRID_H) * (Y_MAX - Y_MIN)
            return this.net.predict(x, y) > 0.5 ? '·' : ' '
        }))
        for (const s of this.data) {
            const c = Math.floor(((s.x - X_MIN) / (X_MAX - X_MIN)) * GRID_W)
            const r = Math.floor(((Y_MAX - s.y) / (Y_MAX - Y_MIN)) * GRID_H)
            if (r >= 0 && r < GRID_H && c >= 0 && c < GRID_W) grid[r][c] = s.label ? '●' : '○'
        }
        const acc = Math.round(this.accuracy * 100)
        const loss = Number.isNaN(this.loss) ? '  —  ' : this.loss.toFixed(3)
        return [
            ` epoch ${String(this.epoch).padStart(4)} / ${TRAIN_EPOCHS}   loss ${loss}   accuracy ${String(acc).padStart(3)}%`,
            ' ┌' + '─'.repeat(GRID_W) + '┐',
            ...grid.map(row => ' │' + row.join('') + '│'),
            ' └' + '─'.repeat(GRID_W) + '┘',
            ` loss ${sparkline(this.losses)}`,
            ' ○ ● two classes   · where the network says ●',
        ].join('\n')
    }
}
