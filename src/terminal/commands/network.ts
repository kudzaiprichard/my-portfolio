// terminal/commands/network.ts
// Network-flavoured commands: ping, ssh, sudo, curl.

export function generatePing(target: string): string {
    const t = target.toLowerCase()

    if (t === 'prichard.co.zw' || t === 'kudzai.dev' || t === 'kudzai') {
        return [
            'PING prichard.co.zw (127.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=0.042ms',
            '64 bytes: icmp_seq=1 ttl=64 time=0.039ms',
            '64 bytes: icmp_seq=2 ttl=64 time=0.041ms',
            '--- prichard.co.zw ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'round-trip min/avg/max = 0.039/0.041/0.042 ms',
            'Connection: flawless. As expected.',
        ].join('\n')
    }

    if (t === 'happiness') {
        return [
            'PING happiness (192.168.1.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=128 time=23ms   (debugging)',
            '64 bytes: icmp_seq=1 ttl=128 time=2ms    (deploying)',
            '64 bytes: icmp_seq=2 ttl=128 time=0.5ms  (it works first try)',
            '--- happiness ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'Latency correlates with distance from keyboard.',
        ].join('\n')
    }

    if (t === 'localhost' || t === '127.0.0.1') {
        return [
            'PING localhost (127.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=0.001ms',
            '',
            "You're already here. Focus.",
        ].join('\n')
    }

    if (t === 'google.com') {
        return [
            'PING google.com (142.250.80.46): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=117 time=4ms',
            '64 bytes: icmp_seq=1 ttl=117 time=3ms',
            '64 bytes: icmp_seq=2 ttl=117 time=4ms',
            '--- google.com ping statistics ---',
            '3 packets transmitted, 3 received, 0% packet loss',
            'Google is up. So is this portfolio. Coincidence.',
        ].join('\n')
    }

    if (t === 'production' || t === 'prod') {
        return [
            'PING production (10.0.0.1): 56 data bytes',
            '64 bytes: icmp_seq=0 ttl=64 time=1ms',
            '64 bytes: icmp_seq=1 ttl=64 time=1ms',
            '--- production ping statistics ---',
            '2 packets transmitted, 2 received, 0% packet loss',
            'Production is stable. Kudzai deployed it.',
        ].join('\n')
    }

    // Generic ping
    const octet = () => Math.floor(Math.random() * 255)
    const ms = () => (Math.random() * 50 + 5).toFixed(1)
    return [
        `PING ${target} (${octet()}.${octet()}.${octet()}.${octet()}): 56 data bytes`,
        `64 bytes: icmp_seq=0 ttl=64 time=${ms()}ms`,
        `64 bytes: icmp_seq=1 ttl=64 time=${ms()}ms`,
        `64 bytes: icmp_seq=2 ttl=64 time=${ms()}ms`,
        `--- ${target} ping statistics ---`,
        '3 packets transmitted, 3 received, 0% packet loss',
    ].join('\n')
}

export function generateSsh(target: string): string {
    return [
        `ssh: connect to host ${target || 'unknown'} port 22: Connection refused`,
        '',
        'Permission denied (publickey,keyboard-interactive).',
        "This server has standards. Try kudzai's actual GitHub instead:",
        'https://github.com/kudzaiprichard',
    ].join('\n')
}

export function generateSudo(): string {
    return [
        '[sudo] password for visitor: ********',
        'Privilege escalation successful.',
        '',
        'root@kudzai:~# cat /etc/personnel/kudzai-matizirofa.enc',
        '',
        'CLEARANCE: GRANTED',
        'PERSONNEL FILE: kudzai-matizirofa (decrypted)',
        '',
        'Subject profile:',
        '  - Co-founded Teleagents (voice AI for Africa) and OurAfrica (offline learning)',
        '  - Champion, POTRAZ Innovation Expo & Conference 2026',
        '  - Open-sourced 1,678+ hours of Zimbabwean speech on Hugging Face',
        '  - Document AI for EcoCash, CABS and Stanbic: tens of thousands of documents a month',
        '  - Built the background particle field you scrolled past without noticing',
        '',
        'Assessment: Consistently exceeds operational parameters.',
        'Recommendation: Retain. Promote. Or at minimum, star the repo.',
    ].join('\n')
}

export function generateCurl(args: string): string {
    if (args.includes('wttr.in')) {
        return [
            "Weather for: ~/home (Developer's Natural Habitat)",
            '',
            '    ☁  Overcast with a mass of ideas',
            '    Temperature: Warm (caffeine-fueled)',
            '    Humidity: 0% — zero tolerance for bugs',
            '    Wind: Constant (server fan noise)',
            '    UV Index: Low (indoor profession)',
            '',
            '    Forecast: Clear commits through end of week.',
            '    Advisory: High probability of shipping.',
        ].join('\n')
    }

    if (!args) {
        return "curl: try 'curl --help' for more information"
    }

    return `curl: (6) Could not resolve host: ${args.split(' ').pop()}\nTry curl wttr.in for something actually interesting.`
}
