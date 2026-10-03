/**
 * Maths copied off a web page reaches the clipboard twice. The plain-text copy
 * is mangled: the browser puts every symbol on its own line and drops
 * superscripts, so x² arrives as "x" and "2" on separate lines. The HTML copy
 * still holds each formula in machine-readable form (TeX inside KaTeX, MathML
 * elsewhere), so the problem is rebuilt from that whenever it is there.
 */

// Formula wrappers whose visible glyphs would otherwise paste a second, flattened copy.
const WIDGET = '.katex, mjx-container, .MathJax, .MathJax_Display, .mwe-math-element'
const BLOCK = new Set(['p', 'div', 'li', 'tr', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const SKIP = new Set(['script', 'style', 'template', 'noscript'])
const INVISIBLE = { '\u2061': ' ', '\u2062': '', '\u2063': ', ', '\u2064': '+' }
const GAP = /[\s\u200b]/

/** Cleaned text for a paste event, or null when the browser's own paste is fine. */
export function cleanPaste(data) {
  const html = data.getData('text/html')
  if (/<math[\s>]/i.test(html)) {
    const text = fromHtml(html)
    if (text) return text
  }
  const raw = data.getData('text/plain')
  const fixed = joinFragments(raw)
  return fixed === raw ? null : fixed
}

function fromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const maths = [...doc.querySelectorAll('math')]
  for (const m of maths) (m.closest(WIDGET) || m).replaceWith(` ${formula(m)} `)
  return maths.length ? tidy(textOf(doc.body)) : ''
}

/** TeX when the page shipped it (KaTeX, Wikipedia), otherwise the MathML read out as one line. */
function formula(m) {
  const tex = m.querySelector('annotation[encoding="application/x-tex"]')?.textContent
    || m.getAttribute('alttext')
  return tex ? tidyTex(tex) : linear(m).replace(/\s+/g, ' ').trim()
}

const tidyTex = (tex) => tex
  .replace(/^\s*\{\\(?:display|text)style\s*([\s\S]*)\}\s*$/, '$1')   // Wikipedia's wrapper
  .replace(/\\(?:displaystyle|textstyle|left|right)(?![a-zA-Z])\s*/g, '')
  .replace(/\\[,;:!]|\\q?quad(?![a-zA-Z])/g, ' ')
  .replace(/([\^_])\{(\w)\}(?!\w)/g, '$1$2')                          // x^{2} -> x^2, but not ^{3}2x
  .replace(/\s+/g, ' ')
  .trim()

/** MathML as one line of text: x^2, (a+b)/c, √(x), [[1, 2], [3, 4]]. */
function linear(n) {
  const k = [...n.children]
  const at = (i) => (k[i] ? linear(k[i]) : '')
  const unit = (i) => group(at(i))
  switch (n.localName) {
    case 'mi': case 'mn': case 'mo': case 'ms':
      return n.textContent.trim().replace(/[\u2061-\u2064]/g, (c) => INVISIBLE[c])
    case 'mtext': return n.textContent
    case 'mspace': return ' '
    case 'mphantom': case 'annotation': case 'annotation-xml': return ''
    case 'semantics': return at(0)
    case 'msup': return `${unit(0)}^${unit(1)}`
    case 'msub': case 'munder': return `${unit(0)}_${unit(1)}`
    case 'msubsup': case 'munderover': return `${unit(0)}_${unit(1)}^${unit(2)}`
    case 'mover': return n.getAttribute('accent') === 'true' ? at(0) + at(1) : `${unit(0)}^${unit(1)}`
    case 'mfrac': return `${unit(0)}/${unit(1)}`
    case 'msqrt': return `√(${k.map(linear).join('')})`
    case 'mroot': return `${unit(0)}^(1/${at(1)})`
    case 'mtable': return matrix(n)
    case 'mrow':                                   // [table] is a matrix, |table| its determinant
      if (k.length === 3 && k[1].localName === 'mtable') return (/^[|∣]$/.test(at(0)) ? 'det ' : '') + matrix(k[1])
      return k.map(linear).join('')
    default: return k.map(linear).join('')
  }
}

function matrix(table) {
  const rows = [...table.children].map((r) => [...r.children].map((c) => linear(c).trim()).join(', '))
  return `[${rows.map((r) => `[${r}]`).join(', ')}]`
}

/** Bracket a sub-expression unless it is already one unit: x, 12, sin, (a+b). */
function group(s) {
  s = s.trim()
  return s.length <= 1 || /^[\p{L}\p{N}.]+$/u.test(s) || enclosed(s) ? s : `(${s})`
}

function enclosed(s) {
  if (!'([{'.includes(s[0])) return false
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if ('([{'.includes(s[i])) depth++
    else if (')]}'.includes(s[i]) && --depth === 0) return i === s.length - 1
  }
  return false
}

/** Text of a DOM tree, with line breaks where block elements start and end. */
function textOf(node) {
  let out = ''
  for (const c of node.childNodes) {
    if (c.nodeType === Node.TEXT_NODE) out += c.data.replace(/\s+/g, ' ')
    else if (c.nodeType === Node.ELEMENT_NODE && !hidden(c)) {
      if (c.localName === 'br') out += '\n'
      else out += BLOCK.has(c.localName) ? `\n${textOf(c)}\n` : textOf(c)
    }
  }
  return out
}

const hidden = (el) => SKIP.has(el.localName) || /display:\s*none/i.test(el.getAttribute('style') || '')

const tidy = (s) => s
  .replace(/[\u200b\u00ad]/g, '')                 // zero-width spaces and soft hyphens
  .replace(/[ \t]+/g, ' ')
  .replace(/ ([.,;:!?])(?=\s|$)/g, '$1')       // the space left where a formula met its full stop
  .replace(/ *\n */g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

/**
 * Plain-text fallback: glue a one-symbol-per-line run back into a formula, and
 * the formula back into the sentence it was cut out of. A run is four or more
 * short lines, at least half of them a single character, so a list survives.
 */
export function joinFragments(text) {
  const lines = text.split(/\r?\n/)
  const out = []
  let i = 0
  while (i < lines.length) {
    let j = i
    while (j < lines.length && /^\S{1,4}$/.test(lines[j].trim())) j++
    const run = lines.slice(i, j).map((l) => l.trim())
    if (run.length < 4 || run.filter((t) => t.length === 1).length * 2 < run.length) {
      const end = Math.max(j, i + 1)
      out.push(...lines.slice(i, end))
      i = end
      continue
    }
    const math = glue(run)
    const next = (lines[j] ?? '').trim()
    const rest = next ? dropEcho(next, math) : ''
    const before = out.length && out[out.length - 1].trim() ? `${out.pop().trimEnd()} ` : ''
    out.push(`${before}${math}${rest ? ` ${rest}` : ''}`)
    i = next ? j + 1 : j
  }
  return out.join('\n')
}

/** No spaces inside a formula, except where two numbers or a word and a letter would fuse. */
const glue = (tokens) => tokens.map((t, i) => {
  const p = tokens[i - 1]
  const gap = p && ((/\d$/.test(p) && /^\d/.test(t)) || (/^\p{L}{2,}$/u.test(p) && /^\p{L}/u.test(t)))
  return (gap ? ' ' : '') + t
}).join('')

/** KaTeX also pastes its visible glyphs straight after the symbol list; drop that echo. */
function dropEcho(line, math) {
  const want = math.replace(new RegExp(GAP, 'g'), '')
  let k = 0
  let i = 0
  for (; i < line.length && k < want.length; i++) {
    if (GAP.test(line[i])) continue
    if (line[i] !== want[k++]) return line
  }
  return k === want.length ? line.slice(i).trim() : line
}
