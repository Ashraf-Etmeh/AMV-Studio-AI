import { useEffect, useState } from 'react'
import { DashboardPage } from '../pages/DashboardPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { ProjectWorkspacePage } from '../pages/ProjectWorkspacePage'
import { SongAnalysisPage } from '../pages/SongAnalysisPage'
import { SceneLibraryPage } from '../pages/SceneLibraryPage'
import { createLocalWorkspaceRepository } from '../services/localWorkspaceRepository'

type Route = { page: 'home' } | { page: 'projects' } | { page: 'workspace'; id: string } | { page: 'analysis'; id: string } | { page: 'scenes'; id: string }

function routeFromHash(): Route {
  const path = window.location.hash.slice(1)
  if (path === '/projects') return { page: 'projects' }
  const analysisMatch = /^\/projects\/([^/]+)\/analysis$/.exec(path)
  if (analysisMatch) return { page: 'analysis', id: decodeURIComponent(analysisMatch[1]) }
  const scenesMatch = /^\/projects\/([^/]+)\/scenes$/.exec(path)
  if (scenesMatch) return { page: 'scenes', id: decodeURIComponent(scenesMatch[1]) }
  const match = /^\/projects\/([^/]+)$/.exec(path)
  if (match) return { page: 'workspace', id: decodeURIComponent(match[1]) }
  return { page: 'home' }
}

function navigate(route: Route) {
  const path = route.page === 'home' ? '/' : route.page === 'projects' ? '/projects' : route.page === 'analysis' ? `/projects/${encodeURIComponent(route.id)}/analysis` : route.page === 'scenes' ? `/projects/${encodeURIComponent(route.id)}/scenes` : `/projects/${encodeURIComponent(route.id)}`
  window.location.hash = path
  window.scrollTo({ top: 0 })
}

export function App() {
  const [workspace] = useState(() => {
    try { return { repository: createLocalWorkspaceRepository(), error: null } }
    catch (cause) { return { repository: null, error: cause instanceof Error ? cause.message : 'Browser storage is unavailable.' } }
  })
  const [route, setRoute] = useState<Route>(routeFromHash)
  useEffect(() => {
    const update = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  if (!workspace.repository) return <main style={{ maxWidth: 620, margin: '10vh auto', padding: 24 }}><h1>Workspace unavailable</h1><p>{workspace.error}</p><p>Your saved browser data was left untouched. Check browser storage settings, then reload.</p></main>
  const repository = workspace.repository
  if (route.page === 'projects') return <ProjectsPage repository={repository} onHome={() => navigate({ page: 'home' })} onOpen={(id) => navigate({ page: 'workspace', id })} />
  if (route.page === 'workspace') return <ProjectWorkspacePage key={route.id} projectId={route.id} repository={repository} onHome={() => navigate({ page: 'home' })} onProjects={() => navigate({ page: 'projects' })} onAnalysis={() => navigate({ page: 'analysis', id: route.id })} onScenes={() => navigate({ page: 'scenes', id: route.id })} />
  if (route.page === 'analysis') return <SongAnalysisPage key={route.id} projectId={route.id} repository={repository} onHome={() => navigate({ page: 'home' })} onProjects={() => navigate({ page: 'projects' })} onMedia={() => navigate({ page: 'workspace', id: route.id })} onScenes={() => navigate({ page: 'scenes', id: route.id })} />
  if (route.page === 'scenes') return <SceneLibraryPage key={route.id} projectId={route.id} repository={repository} onHome={() => navigate({ page: 'home' })} onProjects={() => navigate({ page: 'projects' })} onMedia={() => navigate({ page: 'workspace', id: route.id })} onAnalysis={() => navigate({ page: 'analysis', id: route.id })} />
  return <DashboardPage repository={repository} onProjects={() => navigate({ page: 'projects' })} onOpenWorkspace={(id) => navigate({ page: 'workspace', id })} />
}
