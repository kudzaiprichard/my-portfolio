// components/layout/CrtShader.tsx
"use client"

/**
 * Optional WebGL CRT tube over the boot screen and the hero, behind
 * `crt on`. Off under reduced motion, and only where WebGL exists.
 *
 * A web page can't feed its own DOM into WebGL, so this is the tube, not a
 * re-render of the page: a transparent overlay drawn by a small fragment
 * shader (written for this site, MIT like the rest of it — nothing from
 * GPL projects such as cool-retro-term) with
 *   - curvature: a barrel-distorted bezel that darkens and rounds the corners
 *   - bloom: a soft phosphor halo in the theme's --glow colour
 *   - a slow rolling refresh band and faint grain
 * Rendered at half resolution, ~30 fps, and only while it is visible.
 */

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { getCrt, subscribeCrt } from '@/src/lib/crtStore'
import { onFrame } from '@/src/lib/fxScheduler'

const VERTEX = `
attribute vec2 p;
varying vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
varying vec2 uv;
uniform float t;
uniform vec2 res;
uniform vec3 glow;

float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  // Barrel distortion: where this pixel would sit on a curved tube
  vec2 c = uv - 0.5;
  float aspect = res.x / res.y;
  vec2 cc = c * vec2(aspect, 1.0);
  float r2 = dot(cc, cc);
  vec2 d = c * (1.0 + 0.12 * r2);

  // Bezel: outside the curved screen is black, with a soft rounded edge
  vec2 edge = smoothstep(vec2(0.5), vec2(0.47), abs(d));
  float screen = edge.x * edge.y;

  // Vignette inside the tube
  float vig = smoothstep(0.95, 0.2, length(cc) * 1.1);

  // Phosphor bloom: a faint halo strongest in the middle of the tube
  float bloom = exp(-r2 * 3.0) * 0.07;

  // Rolling refresh band and grain
  float band = smoothstep(0.0, 0.08, 0.08 - abs(fract(uv.y - t * 0.06) - 0.5)) * 0.035;
  float grain = (hash(uv * res + t) - 0.5) * 0.035;

  float dark = (1.0 - screen) + screen * (1.0 - vig) * 0.55;
  vec3 light = glow * (bloom + band) + vec3(grain);
  // Premultiplied: darken by alpha, add the light on top
  float a = clamp(dark + length(light), 0.0, 1.0);
  gl_FragColor = vec4(light * screen, a);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
}

function readGlow(): [number, number, number] {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim().split(/\s+/).map(Number)
    return v.length === 3 && v.every(n => Number.isFinite(n)) ? [v[0] / 255, v[1] / 255, v[2] / 255] : [0.3, 1, 0.56]
}

export default function CrtShader() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const crt = useSyncExternalStore(subscribeCrt, getCrt, () => false)
    const reducedMotion = useReducedMotion()
    const { isBooted } = useBootContext()
    const enabled = crt && !reducedMotion

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !enabled) return
        const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
        if (!gl) return

        const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
        const prog = gl.createProgram()
        if (!vs || !fs || !prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, 'p')
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        const uT = gl.getUniformLocation(prog, 't')
        const uRes = gl.getUniformLocation(prog, 'res')
        const uGlow = gl.getUniformLocation(prog, 'glow')
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        const resize = () => {
            // Half resolution: it is all soft gradients
            canvas.width = Math.max(1, Math.floor(window.innerWidth / 2))
            canvas.height = Math.max(1, Math.floor(window.innerHeight / 2))
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
        resize()
        window.addEventListener('resize', resize)

        let glow = readGlow()
        const themeObserver = new MutationObserver(() => { glow = readGlow() })
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

        // Only while the boot screen or the hero is on screen
        let visible = true
        const hero = document.getElementById('home')
        const io = hero ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.4 }) : null
        if (hero && io) io.observe(hero)

        let elapsed = 0
        let sinceDraw = 1000
        const stop = onFrame((_, delta) => {
            elapsed += delta
            sinceDraw += delta
            canvas.style.opacity = visible ? '1' : '0'
            if (!visible || sinceDraw < 33) return
            sinceDraw = 0
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.uniform1f(uT, elapsed / 1000)
            gl.uniform2f(uRes, canvas.width, canvas.height)
            gl.uniform3f(uGlow, glow[0], glow[1], glow[2])
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        })

        return () => {
            stop()
            window.removeEventListener('resize', resize)
            themeObserver.disconnect()
            io?.disconnect()
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    }, [enabled, isBooted])

    if (!enabled) return null

    return (
        <>
            <canvas ref={canvasRef} className="crt-shader" aria-hidden="true" />
            <style>{`
                .crt-shader {
                    position: fixed;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 99999;
                    pointer-events: none;
                    transition: opacity var(--dur-base) var(--ease-out);
                }
                @media print { .crt-shader { display: none; } }
            `}</style>
        </>
    )
}
