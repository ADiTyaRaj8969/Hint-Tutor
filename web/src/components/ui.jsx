import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'

const GLYPHS = [['∑', 4, 14], ['π', 90, 20], ['∫', 6, 58], ['√', 92, 66], ['∞', 48, 90], ['≈', 78, 42]]

/** Floating math stickers behind the page: hard-edged, drifting, never in the way. */
export function Background() {
  return (
    <div className="deco" aria-hidden="true">
      {GLYPHS.map(([g, x, y], i) => (
        <span key={g} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 2.6}s` }}>{g}</span>
      ))}
    </div>
  )
}

/** Yellow bar across the top showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24, mass: 0.3 })
  return <motion.div className="scroll-bar" style={{ scaleX }} aria-hidden="true" />
}

const CONFETTI = ['#ffd60a', '#2b5cff', '#00a86b', '#ff3b30', '#ff9500', '#000000']

/** Square confetti burst, brutalist style. Mounts once per `fire` key and cleans itself up. */
export function Confetti() {
  const reduce = useReducedMotion()
  const [alive, setAlive] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setAlive(false), 2400)   // unmount so parked particles never widen the page
    return () => clearTimeout(id)
  }, [])
  if (reduce || !alive) return null
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 34 }, (_, i) => {
        const a = (i / 34) * Math.PI * 2 + (i % 3) * 0.2
        const d = 120 + (i * 37) % 170
        return (
          <motion.i key={i}
            style={{ background: CONFETTI[i % CONFETTI.length], width: 8 + (i % 4) * 3, height: 8 + (i % 4) * 3 }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 90, rotate: (i % 2 ? 1 : -1) * (200 + i * 14), opacity: 0, scale: 0.6 }}
            transition={{ duration: 1.5 + (i % 5) * 0.12, ease: [0.16, 1, 0.3, 1] }} />
        )
      })}
    </div>
  )
}

/** Glass card with a spotlight that follows the cursor. */
export function GlowCard({ children, className = '', ...rest }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <motion.section
      ref={ref}
      onMouseMove={onMove}
      className={`card ${className}`}
      {...rest}
    >
      {children}
    </motion.section>
  )
}

/** Types text out character by character; instant under reduced motion. */
export function useTypewriter(text, { speed = 14, start = true } = {}) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? text.length : 0)

  useEffect(() => {
    if (reduce) { setN(text.length); return }
    if (!start) { setN(0); return }
    setN(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, start, reduce])

  return { shown: text.slice(0, n), done: n >= text.length }
}

/** Counts up to `to` once mounted. */
export function CountUp({ to, ms = 1100 }) {
  const reduce = useReducedMotion()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (reduce) return
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, reduce])
  return <>{v}</>
}

/** Models sometimes emit markdown; the cards render plain text. */
export const plain = (s) => (s || '').replace(/\*\*|__|`/g, '')

export const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
}
