import { useEffect, useRef, useState } from 'react'
import { Clapperboard, MoreHorizontal, Pencil, FolderOpen } from 'lucide-react'
import { demoArt } from '../../assets/demo/manifest'
import { formatDuration } from '../projects/types'
import type { Project } from '../projects/types'
import styles from './Dashboard.module.css'

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
  onRename: (project: Project) => void
}

export function ProjectCard({ project, onOpen, onRename }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuContainer = useRef<HTMLDivElement>(null)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const firstItem = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    firstItem.current?.focus()
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuContainer.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [menuOpen])

  function choose(action: (project: Project) => void) {
    setMenuOpen(false)
    menuTrigger.current?.focus()
    action(project)
  }

  return (
    <article className={styles.projectCard}>
      <button className={styles.projectOpen} onClick={() => onOpen(project)} aria-label={`Open project ${project.name}`}>
        <span className={styles.projectImageWrap}>
          {project.thumbnail ? <img src={demoArt[project.thumbnail]} alt="" /> : <span className={styles.blankProjectArt}><Clapperboard size={38} strokeWidth={1.2} /><span>Your next story</span></span>}
          {project.durationSeconds !== null && <span className={styles.duration}>{formatDuration(project.durationSeconds)}</span>}
        </span>
        <span className={styles.projectText}><strong>{project.name}</strong><span>{project.editedLabel}</span></span>
      </button>
      <div className={styles.projectMenuContainer} ref={menuContainer}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false) }}>
        <button ref={menuTrigger} className={styles.projectMenuTrigger} aria-label={`Options for ${project.name}`} aria-haspopup="menu" aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal size={24} /></button>
        {menuOpen && <div className={styles.projectMenu} role="menu" aria-label={`${project.name} actions`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); menuTrigger.current?.focus() }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
              const index = items.indexOf(document.activeElement as HTMLButtonElement)
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
              items[next]?.focus()
            }
          }}>
          <button ref={firstItem} role="menuitem" onClick={() => choose(onOpen)}><FolderOpen size={17} />Project details</button>
          <button role="menuitem" onClick={() => choose(onRename)}><Pencil size={17} />Rename</button>
        </div>}
      </div>
    </article>
  )
}
