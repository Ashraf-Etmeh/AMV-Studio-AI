import { demoProjects } from '../features/projects/fixtures'
import { validateProjectName } from '../features/projects/types'
import type { Project } from '../features/projects/types'
import type { ProjectRepository } from './projectRepository'

function checkedName(name: string): string {
  const error = validateProjectName(name)
  if (error) throw new Error(error)
  return name.trim()
}

export function createDemoProjectRepository(seed: readonly Project[] = demoProjects): ProjectRepository {
  let projects = seed.map((project) => ({ ...project }))

  return {
    async list() {
      return projects.map((project) => ({ ...project }))
    },
    async create(name) {
      const project: Project = {
        id: crypto.randomUUID(), name: checkedName(name), thumbnail: null,
        durationSeconds: null, editedLabel: 'Created just now', source: 'local',
      }
      projects = [project, ...projects]
      return { ...project }
    },
    async rename(id, name) {
      const existing = projects.find((project) => project.id === id)
      if (!existing) throw new Error('This project is no longer available.')
      const updated = { ...existing, name: checkedName(name), editedLabel: 'Edited just now' }
      projects = projects.map((project) => project.id === id ? updated : project)
      return { ...updated }
    },
    async remove(id) {
      const existing = projects.find((project) => project.id === id)
      if (!existing) throw new Error('This project is no longer available.')
      if (existing.source === 'sample') throw new Error('Sample projects cannot be removed.')
      projects = projects.filter((project) => project.id !== id)
    },
  }
}
