import { Play, PenLine } from 'lucide-react'
import { GlowCard } from './ui'
import { cleanPaste } from '../paste'

const MAX = 2000

export default function ProblemPanel({ problem, setProblem, onStart, busy }) {
  const over = problem.length > MAX

  // Maths pasted from a web page, PDF or Word file arrives mangled; repair it first.
  function onPaste(e) {
    const text = cleanPaste(e.clipboardData)
    if (text === null) return
    e.preventDefault()
    // insertText keeps Ctrl+Z working; writing the state directly would not.
    if (!document.execCommand('insertText', false, text)) {
      const { selectionStart: a, selectionEnd: b } = e.currentTarget
      setProblem(problem.slice(0, a) + text + problem.slice(b))
    }
  }

  return (
    <GlowCard initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
      <h2 className="card-title"><PenLine size={18} /> Your problem</h2>

      <div className="field-label">
        <label htmlFor="problem">Problem</label>
        <span className={`count ${over ? 'over' : ''}`}>{problem.length} / {MAX}</span>
      </div>
      <textarea
        id="problem" rows={4} value={problem}
        onChange={(e) => setProblem(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onStart() }}
        placeholder="Paste any school-level word problem…"
      />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onStart} disabled={busy}>
        {busy ? <span className="spinner" /> : <Play size={17} fill="currentColor" />}
        {busy ? 'Working…' : 'Start tutoring'}
        {!busy && <kbd>Ctrl ↵</kbd>}
      </button>
    </GlowCard>
  )
}
