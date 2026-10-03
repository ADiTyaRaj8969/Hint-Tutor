import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Animated aurora + grid + grain, fixed behind everything. */
export function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="grid-lines" />
      <div className="grain" />
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
