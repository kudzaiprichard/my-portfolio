import { expect, test } from '@playwright/test'

test('boot, hero, terminal help and snake', async ({ page }) => {
    await page.goto('/')

    // Any click on the boot screen while it is logging skips it.
    const boot = page.locator('.boot-screen')
    await expect(boot).toBeVisible()
    await boot.click()
    await expect(boot).toBeHidden()

    // The hero types `whoami` and then prints the name.
    await expect(page.locator('#home .hero-section-name')).toBeVisible()

    // Go to the terminal and wait for its intro to finish (the input mounts after).
    await page.locator('#terminal').scrollIntoViewIfNeeded()
    const input = page.locator('#terminal [data-terminal-input]')
    await expect(input).toBeVisible({ timeout: 45_000 })

    // Typing with nothing focused goes to the terminal and moves focus into its input

    await page.keyboard.type('help')
    await page.keyboard.press('Enter')
    await expect(page.locator('#terminal')).toContainText('Up/Down for command history', { timeout: 120_000 })

    await page.keyboard.type('snake')
    await page.keyboard.press('Enter')
    await expect(page.locator('#terminal .terminal-snake-grid')).toBeVisible()

    await page.keyboard.press('q')
    await expect(page.locator('#terminal .terminal-snake-grid')).toBeHidden()

    // The input is a real text field: typing into it directly works too
    await input.click()
    await input.pressSequentially('whoami')
    await expect(input).toHaveValue('whoami')
    await page.keyboard.press('Enter')
    await expect(page.locator('#terminal')).toContainText('AI / ML Engineer · Co-Founder of Teleagents', { timeout: 60_000 })

    // Regression: a sent command echoes on one line, not one letter per line
    const echo = page.locator('#terminal .terminal-interactive-line.terminal-interactive-input').last()
    await expect(echo).toContainText('whoami')
    const box = await echo.boundingBox()
    expect(box!.height).toBeLessThan(40)
    expect(box!.width).toBeGreaterThan(100)
})

test('tmux bar changes section; the boot shows once per tab, a refresh goes straight to typing', async ({ page }) => {
    await page.goto('/')
    await page.locator('.boot-screen').click()
    await expect(page.locator('.boot-screen')).toBeHidden()

    await page.locator('.tmux-bar-window', { hasText: 'projects' }).click()
    await expect(page.locator('.tmux-bar-window[aria-current="true"]')).toContainText('projects')

    // A refresh in the same tab: no boot, the hero types again
    await page.evaluate(() => history.replaceState(null, '', '/#home'))
    await page.reload()
    await expect(page.locator('.boot-screen')).toBeHidden()
    // Sound is blocked until a gesture after a refresh: the hero waits for one
    await expect(page.locator('#home .section-start-hint')).toBeVisible()
    await page.mouse.click(5, 300)
    await expect(page.locator('#home .section-start-hint')).toBeHidden()
    await expect(page.locator('#home [data-reveal].is-revealed').first()).toBeVisible({ timeout: 5_000 })

    // A new tab boots again
    const again = await page.context().newPage()
    await again.goto('/')
    await expect(again.locator('.boot-screen')).toBeVisible()

    // Deep links and in-site navigation never boot
    await again.goto('/projects/sentinel')
    await expect(again.locator('.boot-screen')).toBeHidden()
    await again.locator('.project-page-back a').click()
    await expect(again.locator('#projects')).toBeVisible()
    await expect(again.locator('.boot-screen')).toBeHidden()
})

test('project pages open without the boot screen', async ({ page }) => {
    await page.goto('/projects/sentinel')
    await expect(page.locator('h1')).toHaveText('Sentinel')
    await expect(page.locator('.boot-screen')).toBeHidden()
    await expect(page.locator('.project-page-links a', { hasText: 'README' })).toHaveAttribute('href', /github\.com\/kudzaiprichard\/sentinel/)
})

test('apps link to their latest release, and private source shows no code link', async ({ page }) => {
    await page.goto('/projects/whiteboard-studio')
    await expect(page.locator('.project-page-links a', { hasText: 'download' })).toHaveAttribute('href', /whiteboard-studio-releases\/releases\/latest/)
    await expect(page.locator('.project-page-links a', { hasText: 'code' })).toHaveCount(0)
})

test('plain mode shows everything at once and is remembered', async ({ page }) => {
    await page.goto('/')
    await page.locator('.boot-screen').click()
    await page.locator('.plain-mode-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'plain')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'plain')
    await expect(page.locator('#projects .projects-section-card').first()).toBeVisible()
    await expect(page.locator('#home a.hero-section-cv')).toBeVisible()
    // Visible means opaque too: every revealed output block, at full opacity
    const faded = await page.locator('#home [data-reveal]').evaluateAll(els =>
        els.filter(el => Number(getComputedStyle(el).opacity) < 1).length)
    expect(faded).toBe(0)
})

test('a section left mid-typing starts over when you come back', async ({ page }) => {
    await page.goto('/')
    await page.locator('.boot-screen-start-btn').first().click()
    await expect(page.locator('.boot-screen')).toBeHidden()
    await page.locator('.tmux-bar-window', { hasText: 'about' }).click()
    await expect(page.locator('#about [data-reveal].is-revealed').first()).toBeVisible({ timeout: 5_000 })
    // Leave before it finishes, then come back: nothing revealed, typing again from the top
    await page.locator('.tmux-bar-window', { hasText: 'projects' }).click()
    await expect(page.locator('#about [data-reveal].is-revealed')).toHaveCount(0)
    await page.locator('.tmux-bar-window', { hasText: 'about' }).click()
    await expect(page.locator('#about [data-reveal]').first()).toHaveClass(/is-typing|is-revealed/)
    await expect(page.locator('#about [data-reveal]').last()).not.toHaveClass(/is-revealed/)
})

test('the send button and Enter both send, even while output is still printing', async ({ page }) => {
    await page.goto('/')
    await page.locator('.boot-screen-start-btn').first().click()
    await page.keyboard.press('x')
    const input = page.locator('#home [data-terminal-input]')
    const echoed = page.locator('#home .terminal-interactive-line.terminal-interactive-input')
    await input.click()
    await page.keyboard.type('whoami')
    await page.locator('#home .terminal-interactive-send').click()
    await expect(echoed.last()).toContainText('whoami')
    // Enter while `help` is still printing finishes it and sends the next command
    await input.click()
    await page.keyboard.type('help')
    await page.keyboard.press('Enter')
    await page.keyboard.type('ls')
    await page.keyboard.press('Enter')
    await expect(echoed.last()).toContainText('ls')
})

test('the mouse wheel pages between sections', async ({ page }) => {
    await page.goto('/')
    await page.locator('.boot-screen-start-btn').first().click()
    await expect(page.locator('.boot-screen')).toBeHidden()
    await page.mouse.move(40, 400)
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 100)
    await expect(page).toHaveURL(/#about$/)
    await page.waitForTimeout(900)
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -100)
    await expect(page).toHaveURL(/#home$/)
})

test('the games are one click away, count achievements, and play from any section', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-plain', 'on'))
    await page.goto('/#terminal')
    const games = page.locator('#terminal .terminal-interactive-games button')
    await expect(games).toHaveCount(5)
    await expect(page.locator('.tmux-bar-achievements')).toHaveText('★ 0/11')

    // A whole typing race
    await games.filter({ hasText: 'wpm' }).click()
    const field = page.locator('.terminal-wpm-field')
    await expect(field).toBeVisible()
    const passage = (await page.locator('.terminal-wpm-target').textContent()) ?? ''
    await field.pressSequentially(passage.slice(0, 12))
    await field.fill(passage)
    await expect(page.locator('.terminal-game-result')).toContainText('words per minute')
    await expect(page.locator('.tmux-bar-achievements')).toHaveText('★ 1/11')
    await page.keyboard.press('Escape')

    // The quiz answers from its option chips
    await games.filter({ hasText: 'quiz' }).click()
    for (let i = 0; i < 3; i++) await page.locator('#terminal .terminal-interactive-chip', { hasText: /^▸ b\) / }).click()
    await expect(page.locator('#terminal')).toContainText('You scored')

    // Asked for in another section, a game opens in the terminal
    await page.goto('/#about')
    const about = page.locator('#about .terminal-interactive-field')
    await about.fill('train')
    await about.press('Enter')
    await expect(page.locator('.terminal-train-plot')).toBeVisible({ timeout: 15_000 })
})
