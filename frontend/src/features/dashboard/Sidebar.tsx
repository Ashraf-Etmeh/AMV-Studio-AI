import { Clapperboard, Film, Folder, Home, Music2, Settings } from 'lucide-react'
import { demoArt } from '../../assets/demo/manifest'
import styles from './Dashboard.module.css'

interface SidebarProps {
  projectCount: number
  onProjects: () => void
  onFeature: (feature: 'media' | 'songs' | 'settings') => void
  onHome?: () => void
  active?: 'home' | 'projects' | 'media'
}

export function Sidebar({ projectCount, onProjects, onFeature, onHome, active = 'home' }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <img className={styles.sidebarArt} src={demoArt.sidebar} alt="" />
      <a className={styles.brand} href="#/" onClick={onHome} aria-label="AMV Studio AI home">
        <Clapperboard className={styles.brandIcon} size={50} strokeWidth={1.5} />
        <span><strong>AMV Studio AI</strong><small>AI-Powered Creative Editor</small></span>
      </a>
      <nav className={styles.navigation} aria-label="Main navigation">
        <a href="#/" onClick={onHome} className={`${styles.navItem} ${active === 'home' ? styles.navActive : ''}`} aria-label="Home" aria-current={active === 'home' ? 'page' : undefined}><Home /><span>Home</span></a>
        <button className={`${styles.navItem} ${active === 'projects' ? styles.navActive : ''}`} onClick={onProjects} aria-label="Projects" aria-current={active === 'projects' ? 'page' : undefined}><Folder /><span>Projects</span><span className={styles.projectCount} aria-label={`${projectCount} projects`}>{projectCount}</span></button>
        <button className={`${styles.navItem} ${active === 'media' ? styles.navActive : ''}`} onClick={() => onFeature('media')} aria-label="Media Library" aria-current={active === 'media' ? 'page' : undefined}><Film /><span>Media Library</span></button>
        <button className={styles.navItem} onClick={() => onFeature('songs')} aria-label="Songs"><Music2 /><span>Songs</span></button>
        <button className={styles.navItem} onClick={() => onFeature('settings')} aria-label="Settings"><Settings /><span>Settings</span></button>
      </nav>
      <div className={styles.sessionNote}><span>Local workspace</span><p>Projects and media details save here.</p></div>
    </aside>
  )
}
