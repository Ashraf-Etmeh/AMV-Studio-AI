import { useCallback, useEffect, useState } from 'react'
import type { ProjectRepository } from '../../services/projectRepository'
import type { Project } from './types'

export function useProjects(repository: ProjectRepository) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    repository.list().then((items) => {
      if (active) { setProjects(items); setLoading(false) }
    }).catch(() => {
      if (active) { setError('Projects could not be loaded. Refresh to try again.'); setLoading(false) }
    })
    return () => { active = false }
  }, [repository])

  const create = useCallback(async (name: string) => {
    const project = await repository.create(name)
    setProjects((items) => [project, ...items])
    return project
  }, [repository])

  const rename = useCallback(async (id: string, name: string) => {
    const updated = await repository.rename(id, name)
    setProjects((items) => items.map((project) => project.id === id ? updated : project))
  }, [repository])

  const remove = useCallback(async (id: string) => {
    await repository.remove(id)
    setProjects((items) => items.filter((project) => project.id !== id))
  }, [repository])

  return { projects, loading, error, create, rename, remove }
}
