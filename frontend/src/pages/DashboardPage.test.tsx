import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { createDemoProjectRepository } from '../services/demoProjectRepository'

async function setup() {
  const repository = createDemoProjectRepository()
  const user = userEvent.setup()
  render(<DashboardPage repository={repository} />)
  await screen.findByRole('button', { name: 'Open project Beneath the Sky' })
  return { user, repository }
}

describe('Dashboard interactions', () => {
  it('validates a new project and updates the visible recent projects and count', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Create New Project' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Saved in this browser')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Create Project' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Give your project a name.')
    await user.type(within(dialog).getByLabelText('Project name'), '  Midnight Reverie  ')
    await user.click(within(dialog).getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByRole('button', { name: 'Open project Midnight Reverie' })).toBeInTheDocument()
    expect(screen.getByLabelText('4 projects')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('locally')
  })

  it('cancels creation without adding metadata', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'New Project' }))
    await user.type(screen.getByLabelText('Project name'), 'Unsaved idea')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('3 projects')).toBeInTheDocument()
  })

  it('renames a project from its overflow menu', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Options for Beneath the Sky' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByLabelText('Project name')
    await user.clear(input)
    await user.type(input, 'A Different Sky')
    await user.click(screen.getByRole('button', { name: 'Save name' }))
    expect(await screen.findByRole('button', { name: 'Open project A Different Sky' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open project Beneath the Sky' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('3 projects')).toBeInTheDocument()
  })

  it('searches projects, shows an empty result, and opens honest sample details', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Open Project' }))
    const search = screen.getByLabelText('Find a project')
    await user.type(search, 'missing title')
    expect(screen.getByText(/No projects match/)).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'FRAGMENTS')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Fragments of Us/ }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Fragments of Us')
    expect(screen.getByText('04:21 (sample)')).toBeInTheDocument()
    expect(screen.getByText(/timeline and processing features are still planned/)).toBeInTheDocument()
  })

  it('identifies analysis and generation as planned capabilities', async () => {
    const { user } = await setup()
    for (const title of ['Analyze Song', 'Build Scene Library', 'Generate AMV']) {
      await user.click(screen.getByRole('button', { name: title }))
      expect(screen.getByText('Planned capability')).toBeInTheDocument()
      expect(screen.getByText(/does not run AI analysis/)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Back to Dashboard' }))
    }
  })

  it('keeps the form and its error visible if the repository rejects creation', async () => {
    const repository = createDemoProjectRepository()
    vi.spyOn(repository, 'create').mockRejectedValue(new Error('Could not create this draft.'))
    const user = userEvent.setup()
    render(<DashboardPage repository={repository} />)
    await screen.findByLabelText('3 projects')
    await user.click(screen.getByRole('button', { name: 'Create New Project' }))
    await user.type(screen.getByLabelText('Project name'), 'Draft')
    await user.click(screen.getByRole('button', { name: 'Create Project' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create this draft.')
    expect(screen.getByRole('button', { name: 'Create Project' })).toBeEnabled()
    expect(screen.getByLabelText('3 projects')).toBeInTheDocument()
  })
})
