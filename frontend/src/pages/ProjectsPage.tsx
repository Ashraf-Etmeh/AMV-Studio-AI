import { useState } from 'react'
import { ArrowLeft, Clapperboard, Plus, Search, Trash2 } from 'lucide-react'
import { Sidebar } from '../features/dashboard/Sidebar'
import { ProjectCard } from '../features/dashboard/ProjectCard'
import { ProjectNameDialog } from '../features/projects/ProjectDialogs'
import { FeatureDialog } from '../features/projects/ProjectDialogs'
import { useProjects } from '../features/projects/useProjects'
import type { Project } from '../features/projects/types'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import styles from './Workspace.module.css'

type Dialog = { kind: 'create' } | { kind: 'rename'; project: Project } | { kind: 'delete'; project: Project } | null

export function ProjectsPage({ repository, onHome, onOpen }: { repository: WorkspaceRepository; onHome: () => void; onOpen: (id: string) => void }) {
  const { projects, loading, error, create, rename, remove } = useProjects(repository)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [feature, setFeature] = useState<'settings' | null>(null)
  const matches = projects.filter((project) => project.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const localCount = projects.filter((project) => project.source === 'local').length

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#projects-main">Skip to content</a>
      <Sidebar projectCount={projects.length} active="projects" onHome={onHome} onProjects={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onFeature={(key) => {
        if (key === 'settings') setFeature('settings')
        else setInfo(key === 'songs' ? 'Choose a project to see its music files.' : 'Choose a project to see its media library.')
      }} />
      <main className={styles.main} id="projects-main" tabIndex={-1}>
        <div className={styles.topline}><button onClick={onHome} className={styles.back}><ArrowLeft size={18} /> Dashboard</button><span className={styles.kicker}>YOUR CREATIVE WORKSPACE</span></div>
        <header className={styles.pageHeader}>
          <div><h1>Projects</h1><p>Start a new AMV or return to a project and its local media.</p></div>
          <Button variant="primary" onClick={() => setDialog({ kind: 'create' })}><Plus size={20} /> New Project</Button>
        </header>
        <div className={styles.summaryStrip}><span><Clapperboard size={20} /> {localCount} local {localCount === 1 ? 'project' : 'projects'}</span><span>{projects.length - localCount} reference samples</span><span>Names and media details save in this browser</span></div>
        <div className={styles.filterBar}><label htmlFor="project-filter"><Search size={19} /> Search projects</label><input id="project-filter" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" /></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {info && <p role="status" className={styles.notice}>{info}</p>}
        {actionError && <p role="alert" className={styles.error}>{actionError}</p>}
        {loading ? <p role="status">Loading projects…</p> : matches.length ? (
          <div className={styles.projectGrid}>
            {matches.map((project) => <div key={project.id} className={styles.projectGridItem}>
              <ProjectCard project={project} onOpen={() => onOpen(project.id)} onRename={() => setDialog({ kind: 'rename', project })} />
              <div className={styles.projectGridFooter}><span>{project.source === 'sample' ? 'Reference sample' : 'Local project'}</span>{project.source === 'local' && <button onClick={() => setDialog({ kind: 'delete', project })} aria-label={`Delete ${project.name}`}><Trash2 size={17} /> Delete</button>}</div>
            </div>)}
          </div>
        ) : <p className={styles.emptyState}>No projects match your search.</p>}
      </main>
      {dialog?.kind === 'create' && <ProjectNameDialog onClose={() => setDialog(null)} onSubmit={async (name) => { const project = await create(name); setDialog(null); onOpen(project.id) }} />}
      {dialog?.kind === 'rename' && <ProjectNameDialog project={dialog.project} onClose={() => setDialog(null)} onSubmit={(name) => rename(dialog.project.id, name)} />}
      {dialog?.kind === 'delete' && <Modal title={`Delete ${dialog.project.name}?`} description="This removes the project and its media records from this browser. Your original files stay on your computer." onClose={() => setDialog(null)}>
        <div className={styles.dialogActions}><Button onClick={() => setDialog(null)}>Cancel</Button><Button variant="primary" onClick={async () => { try { await remove(dialog.project.id); setDialog(null); setActionError(null) } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Could not delete project.'); setDialog(null) } }}>Delete project</Button></div>
      </Modal>}
      {feature && <FeatureDialog feature={feature} onClose={() => setFeature(null)} />}
    </div>
  )
}
