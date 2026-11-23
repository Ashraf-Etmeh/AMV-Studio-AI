import type { Project } from '../features/projects/types'

// An eventual backend adapter can implement this contract without changing the UI.
export interface ProjectRepository {
  list(): Promise<Project[]>
  create(name: string): Promise<Project>
  rename(id: string, name: string): Promise<Project>
  remove(id: string): Promise<void>
}
