import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

test('sample scene browsing, keyword filters, and responsive layout', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Open project Beneath the Sky' }).click()
  await page.getByRole('button', { name: 'Scene Library' }).click()
  await expect(page.getByRole('heading', { name: 'Sample scenes' })).toBeVisible()
  await expect(page.getByText('Sample scene labels are unrelated to imported files.')).toBeVisible()
  await expect(page.getByText('Keyword matching only · no semantic index')).toBeVisible()
  await expect(page.getByText('0 scenes detected from your videos.')).toBeVisible()

  await page.getByLabel('Search sample descriptions and tags').fill('loss and longing')
  await page.getByRole('button', { name: 'Search samples' }).click()
  await expect(page.getByText('1 of 5 illustrative clips')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Select sample scene Crying in the Rain' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Select sample scene Final Confrontation' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByLabel('Emotion').selectOption('Melancholy')
  await expect(page.getByRole('button', { name: 'Select sample scene Alone at Sunset' })).toBeVisible()
  await expect(page.getByText('1 of 5 illustrative clips')).toBeVisible()
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByRole('button', { name: 'Add Crying in the Rain to demo favorites' }).click()
  await page.getByRole('button', { name: /Demo favorites/ }).click()
  await expect(page.getByText('1 of 5 illustrative clips')).toBeVisible()
  await page.getByRole('button', { name: /Demo favorites/ }).click()
  await page.getByRole('button', { name: 'List view' }).click()
  await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Grid view' }).click()
  await page.screenshot({ path: 'test-results/scene-library-1672x941.png', fullPage: true })
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/scene-library-${viewport.width}x${viewport.height}.png`, fullPage: true })
  }
  expect(errors).toEqual([])
})

test('imported video stays separate from illustrative scene metadata', async ({ page }) => {
  await page.goto('/')
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 36
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.fillStyle = '#9657f5'; context.fillRect(0, 0, 64, 36)
    const stream = canvas.captureStream(6)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    const chunks: Blob[] = []
    const stopped = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
    })
    recorder.start()
    await new Promise((resolve) => setTimeout(resolve, 400))
    context.fillStyle = '#59d5e8'; context.fillRect(0, 0, 64, 36)
    recorder.stop()
    const blob = await stopped
    stream.getTracks().forEach((track) => track.stop())
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = () => reject(new Error('Could not encode test video'))
      reader.readAsDataURL(blob)
    })
  })
  const videoPath = path.resolve('test-results', 'local-anime.webm')
  await mkdir(path.dirname(videoPath), { recursive: true })
  await writeFile(videoPath, Buffer.from(base64, 'base64'))
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'New Project' }).click()
  await page.getByLabel('Project name').fill('My anime scenes')
  await page.getByRole('button', { name: 'Create Project' }).click()
  await page.getByLabel('Choose media files').setInputFiles(videoPath)
  await page.getByRole('button', { name: 'Scene Library' }).click()
  await page.getByRole('button', { name: 'Your videos 1' }).click()
  await expect(page.getByText('No scenes, tags, or search index have been extracted.')).toBeVisible()
  await expect(page.locator('video[aria-label="Preview of local-anime.webm"]')).toHaveAttribute('src', /^blob:/)
  await expect(page.getByText('Sample scene search')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Your videos 1' }).click()
  await expect(page.getByText('Relink required')).toBeVisible()
  await page.getByRole('button', { name: 'Open Media', exact: true }).click()
  await page.getByRole('button', { name: 'Relink file' }).click()
  await page.getByLabel('Choose original file to relink').setInputFiles(videoPath)
  await expect(page.locator('video[aria-label="Preview of local-anime.webm"]')).toHaveAttribute('src', /^blob:/)
})
