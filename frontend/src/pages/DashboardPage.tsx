import { useState } from 'react'
import { Sidebar } from '../features/dashboard/Sidebar'
import { Hero } from '../features/dashboard/Hero'
import { WorkflowCards } from '../features/dashboard/WorkflowCards'
import { RecentProjects } from '../features/dashboard/RecentProjects'
import { FeatureDialog, ProjectListDialog, ProjectNameDialog, ProjectSummaryDialog } from '../features/projects/ProjectDialogs'
import type { FeatureKey } from '../features/projects/ProjectDialogs'
import type { Project } from '../features/projects/types'
import type { ProjectRepository } from '../services/projectRepository'
import { useProjects } from '../features/projects/useProjects'
import styles from '../features/dashboard/Dashboard.module.css'

type DashboardDialog =
  | { kind: 'create' }
  | { kind: 'list' }
  | { kind: 'summary'; project: Project }
  | { kind: 'rename'; project: Project }
  | { kind: 'feature'; feature: FeatureKey }
  | null

export function DashboardPage({ repository, onProjects, onOpenWorkspace }: { repository: ProjectRepository; onProjects?: () => void; onOpenWorkspace?: (id: string) => void }) {
  const { projects, loading, error, create, rename } = useProjects(repository)
  const [dialog, setDialog] = useState<DashboardDialog>(null)
  const [announcement, setAnnouncement] = useState('')
  const closeDialog = () => setDialog(null)
  const showProjects = () => onProjects ? onProjects() : setDialog({ kind: 'list' })
  const showCreate = () => setDialog({ kind: 'create' })
  const showFeature = (feature: FeatureKey) => setDialog({ kind: 'feature', feature })
  const showProject = (project: Project) => setDialog({ kind: 'summary', project })
  const showRename = (project: Project) => setDialog({ kind: 'rename', project })

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar projectCount={projects.length} onProjects={showProjects} onFeature={(feature) => (feature === 'media' || feature === 'songs') && onProjects ? onProjects() : showFeature(feature)} />
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Hero onCreate={showCreate} onOpen={showProjects} />
        <div className={styles.content}>
          <WorkflowCards onSelect={(feature) => (feature === 'analyze' || feature === 'scenes') && onProjects ? onProjects() : showFeature(feature)} />
          <RecentProjects projects={projects} loading={loading} error={error} onCreate={showCreate} onViewAll={showProjects} onOpen={showProject} onRename={showRename} />
        </div>
      </main>
      <span className="sr-only" role="status">{announcement}</span>
      {dialog?.kind === 'create' && <ProjectNameDialog onClose={closeDialog} onSubmit={async (name) => { await create(name); setAnnouncement(`Created ${name} locally.`) }} />}
      {dialog?.kind === 'rename' && <ProjectNameDialog project={dialog.project} onClose={closeDialog} onSubmit={async (name) => { await rename(dialog.project.id, name); setAnnouncement(`Renamed project to ${name}.`) }} />}
      {dialog?.kind === 'list' && <ProjectListDialog projects={projects} onOpen={showProject} onCreate={showCreate} onClose={closeDialog} />}
      {dialog?.kind === 'summary' && <ProjectSummaryDialog project={dialog.project} onRename={() => showRename(dialog.project)} onOpen={onOpenWorkspace ? () => onOpenWorkspace(dialog.project.id) : undefined} onClose={closeDialog} />}
      {dialog?.kind === 'feature' && <FeatureDialog feature={dialog.feature} onClose={closeDialog} />}
    </div>
  )
}
