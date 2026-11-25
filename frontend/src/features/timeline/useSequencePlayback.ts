import { useEffect, useRef, useState } from 'react'

export function useSequencePlayback(duration: number) {
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const positionRef = useRef(0)
  const clock = useRef({ position: 0, startedAt: 0 })
  const lastPaint = useRef(0)

  function seek(time: number) {
    const next = Math.max(0, Math.min(Number.isFinite(time) ? time : 0, duration))
    positionRef.current = next
    setPosition(next)
    clock.current = { position: next, startedAt: performance.now() }
  }

  function pause() { setPlaying(false) }

  function play() {
    if (duration <= 0) return
    if (positionRef.current >= duration) seek(0)
    clock.current = { position: positionRef.current, startedAt: performance.now() }
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = (now: number) => {
      const next = Math.min(duration, clock.current.position + (now - clock.current.startedAt) / 1000)
      positionRef.current = next
      if (now - lastPaint.current >= 32 || next >= duration) { setPosition(next); lastPaint.current = now }
      if (next >= duration) { setPlaying(false); return }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, playing])

  return { position, playing, seek, pause, play }
}
