// scripts/generate-og.mjs
// Run: node scripts/generate-og.mjs  (requires `sharp` installed locally)

import path from 'node:path'
import sharp from 'sharp'

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
      <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#4DFF8F" stroke-width="0.5" stroke-opacity="0.07"/>
    </pattern>
    <radialGradient id="bg1" cx="240" cy="189" r="600" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0E3A22" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#07110B" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bg2" cx="960" cy="441" r="500" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#11492A" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#07110B" stop-opacity="0"/>
    </radialGradient>
    <filter id="nameGlow" x="-15%" y="-40%" width="130%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0
                0 1 0 0 0.9
                0 0 0 0 0.15
                0 0 0 0.7 0" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Base background -->
  <rect width="1200" height="630" fill="#07110B"/>
  <!-- Ambient radial gradients -->
  <rect width="1200" height="630" fill="url(#bg1)"/>
  <rect width="1200" height="630" fill="url(#bg2)"/>
  <!-- Grid overlay -->
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Terminal outer box -->
  <rect x="55" y="52" width="1090" height="526" rx="2"
        fill="#0C1A12" fill-opacity="0.72"
        stroke="#4DFF8F" stroke-opacity="0.28" stroke-width="1"/>

  <!-- Terminal header bg tint -->
  <rect x="55" y="52" width="1090" height="46" rx="2"
        fill="#4DFF8F" fill-opacity="0.04"/>
  <!-- Header bottom separator -->
  <line x1="55" y1="98" x2="1145" y2="98"
        stroke="#4DFF8F" stroke-opacity="0.16" stroke-width="1"/>

  <!-- Traffic-light dots -->
  <circle cx="83"  cy="75" r="6" fill="#4DFF8F" fill-opacity="0.65"/>
  <circle cx="106" cy="75" r="6" fill="#4DFF8F" fill-opacity="0.65"/>
  <circle cx="129" cy="75" r="6" fill="#4DFF8F" fill-opacity="0.65"/>

  <!-- Header title -->
  <text x="155" y="80"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="13"
        fill="#4DFF8F" fill-opacity="0.52">developer@portfolio:~$</text>

  <!-- Header right: site URL -->
  <text x="1130" y="80"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="13"
        fill="#4DFF8F" fill-opacity="0.38" text-anchor="end">prichard.co.zw</text>

  <!-- ── CONTENT ─────────────────────────────────────────── -->

  <!-- $ whoami -->
  <text x="86" y="146"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="15"
        fill="#4DFF8F" fill-opacity="0.52">$ whoami</text>

  <!-- Name — large glowing text -->
  <text x="86" y="218"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="52"
        font-weight="normal" fill="#4DFF8F"
        filter="url(#nameGlow)">kudzai prichard matizirofa</text>

  <!-- $ cat role.txt -->
  <text x="86" y="263"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="15"
        fill="#4DFF8F" fill-opacity="0.52">$ cat role.txt</text>

  <!-- Role -->
  <text x="86" y="298"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="21"
        fill="#4DFF8F" fill-opacity="0.88">AI / ML Engineer · Co-Founder of Teleagents &amp; OurAfrica</text>

  <!-- Thin divider -->
  <line x1="86" y1="324" x2="1114" y2="324"
        stroke="#4DFF8F" stroke-opacity="0.11" stroke-width="1"/>

  <!-- $ cat description.txt -->
  <text x="86" y="358"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="15"
        fill="#4DFF8F" fill-opacity="0.52">$ cat description.txt</text>

  <!-- Description lines -->
  <text x="86" y="393"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="16"
        fill="#4DFF8F" fill-opacity="0.72">Machine learning, computer vision, NLP, speech and LLMs in production.</text>
  <text x="86" y="417"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="16"
        fill="#4DFF8F" fill-opacity="0.72">Co-founder: Teleagents (voice AI for Africa), OurAfrica (offline learning).</text>
  <text x="86" y="441"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="16"
        fill="#4DFF8F" fill-opacity="0.72">From strategy to code · Champion, POTRAZ Innovation Expo 2026.</text>

  <!-- Thin divider -->
  <line x1="86" y1="464" x2="1114" y2="464"
        stroke="#4DFF8F" stroke-opacity="0.11" stroke-width="1"/>

  <!-- Tech badges row (the hero's stack) -->
  <rect x="86" y="477" width="69" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="120" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">Python</text>
  <rect x="163" y="477" width="77" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="201" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">PyTorch</text>
  <rect x="248" y="477" width="113" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="304" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">scikit-learn</text>
  <rect x="369" y="477" width="135" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="436" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">Computer Vision</text>
  <rect x="512" y="477" width="47" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="535" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">NLP</text>
  <rect x="567" y="477" width="55" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="594" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">LLMs</text>
  <rect x="630" y="477" width="77" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="668" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">FastAPI</text>
  <rect x="715" y="477" width="47" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="738" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">AWS</text>
  <rect x="770" y="477" width="62" height="26" rx="1" fill="#4DFF8F" fill-opacity="0.03" stroke="#4DFF8F" stroke-opacity="0.32" stroke-width="1"/>
  <text x="801" y="494" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="#4DFF8F" fill-opacity="0.72" text-anchor="middle">Azure</text>

  <!-- ── BOTTOM BAR ──────────────────────────────────────── -->
  <line x1="86" y1="520" x2="1114" y2="520"
        stroke="#4DFF8F" stroke-opacity="0.11" stroke-width="1"/>

  <!-- Prompt with cursor -->
  <text x="86" y="549"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="15"
        fill="#4DFF8F" fill-opacity="0.48">$</text>
  <!-- Cursor block -->
  <rect x="105" y="533" width="10" height="18" rx="1"
        fill="#4DFF8F" fill-opacity="0.75"/>

  <!-- GitHub handle (bottom right) -->
  <text x="1114" y="549"
        font-family="'JetBrains Mono', 'Courier New', monospace" font-size="13"
        fill="#4DFF8F" fill-opacity="0.42" text-anchor="end">github.com/kudzaiprichard</text>
</svg>`

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(path.join(process.cwd(), 'public', 'og-image.png'))
  .then(info => {
    console.log('OG image written to public/og-image.png')
    console.log(info)
  })
  .catch(err => {
    console.error('Failed to generate OG image:', err.message)
    process.exit(1)
  })
