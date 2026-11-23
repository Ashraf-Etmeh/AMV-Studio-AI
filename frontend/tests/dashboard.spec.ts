import { expect, test } from '@playwright/test'

test('local Dashboard assets and reference-sized layout', async ({ page }) => {
  const errors: string[] = []
  const remoteRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') remoteRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Anime Music Video Creator')
  await expect(page.getByRole('button', { name: 'Open project Beneath the Sky' })).toBeVisible()
  await expect(page.locator('img')).toHaveCount(8)
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0))).toBe(true)
  for (const viewport of [{ width: 1672, height: 941 }, { width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect(page.getByText('Demo workspace', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/dashboard-${viewport.width}x${viewport.height}.png`, fullPage: true })
  }
  expect(remoteRequests).toEqual([])
  expect(errors).toEqual([])
})

test('project creation, focus handling, search, rename, and local persistence', async ({ page }) => {
  await page.goto('/')
  const create = page.getByRole('button', { name: 'Create New Project' })
  await create.click()
  const dialog = page.getByRole('dialog')
  await expect(page.getByLabel('Project name')).toBeFocused()
  await dialog.getByRole('button', { name: 'Create Project', exact: true }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Give your project a name.')
  await page.getByLabel('Project name').fill('  Midnight Reverie  ')
  await dialog.getByRole('button', { name: 'Create Project', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(create).toBeFocused()
  await expect(page.getByLabel('4 projects')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open project Midnight Reverie' })).toBeVisible()

  await page.getByRole('button', { name: 'Options for Midnight Reverie' }).click()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.getByLabel('Project name').fill('Nightfall')
  await page.getByRole('button', { name: 'Save name' }).click()
  await expect(page.getByRole('button', { name: 'Open project Nightfall' })).toBeVisible()

  await page.getByRole('button', { name: 'Open Project', exact: true }).click()
  await page.getByLabel('Search projects').fill('Nightfall')
  await expect(page.getByRole('button', { name: 'Open project Nightfall' })).toBeVisible()
  await page.getByRole('button', { name: 'Open project Nightfall' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nightfall' })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('4 projects')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Nightfall' })).toBeVisible()
  await expect(page.getByText('Your media library is ready')).toBeVisible()
})

test('dialogs trap focus and future workflow controls disclose their scope', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create New Project' }).click()
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Generate AMV', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('Planned capability')).toBeVisible()
  await expect(page.getByText(/does not run AI analysis/)).toBeVisible()
  await page.getByRole('button', { name: 'Back to Dashboard' }).click()
  await expect(page.getByRole('button', { name: 'Generate AMV', exact: true })).toBeFocused()
})
