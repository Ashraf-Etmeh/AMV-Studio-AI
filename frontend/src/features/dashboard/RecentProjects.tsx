import { ArrowRight, History, Plus } from 'lucide-react'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../projects/types'
import styles from './Dashboard.module.css'

interface RecentProjectsProps {
  projects: Project[]
  loading: boolean
  error: string | null
  onCreate: () => void
  onViewAll: () => void
  onOpen: (project: Project) => void
  onRename: (project: Project) => void
}

export function RecentProjects({ projects, loading, error, onCreate, onViewAll, onOpen, onRename }: RecentProjectsProps) {
  return (
    <section className={styles.recent} aria-labelledby="recent-heading">
      <div className={styles.recentHeader}>
        <h2 id="recent-heading"><History size={30} strokeWidth={1.8} />Recent Projects</h2>
        <span className={styles.demoLabel}>Demo workspace</span>
        <button className={styles.viewAll} onClick={onViewAll}>View All <ArrowRight size={21} /></button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.recentGrid} aria-busy={loading}>
        <button className={styles.newProject} onClick={onCreate}><Plus size={42} strokeWidth={1.8} /><span>New Project</span></button>
        {projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} onOpen={onOpen} onRename={onRename} />)}
        {loading && <p className={styles.loading} role="status">Loading projects…</p>}
      </div>
    </section>
  )
}
