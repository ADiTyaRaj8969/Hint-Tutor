/**
 * Maths copied off a web page reaches the clipboard twice. The plain-text copy
 * is mangled: the browser puts every symbol on its own line and drops
 * superscripts, so x² arrives as "x" and "2" on separate lines. The HTML copy
 * still holds each formula in machine-readable form (TeX inside KaTeX, MathML
 * elsewhere), so the problem is rebuilt from that whenever it is there.
 * PDFs and Word files only give plain text, which is repaired as far as is safe.
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
    if (text) return plainChars(text)
  }
  const raw = data.getData('text/plain').replace(/\r\n?/g, '\n')
  const fixed = repairPlain(raw)
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
    case 'msqrt': return `√(${row(k)})`
    case 'mroot': return `${unit(0)}^(1/${at(1)})`
    case 'mtable': return matrix(n)
    case 'mrow':                                   // [table] is a matrix, |table| its determinant
      if (k.length === 3 && k[1].localName === 'mtable') return (/^[|∣]$/.test(at(0)) ? 'det ' : '') + matrix(k[1])
      return row(k)
    default: return row(k)
  }
}

const SCRIPTED = new Set(['msup', 'msub', 'msubsup', 'munder', 'mover', 'munderover'])

/** Siblings side by side, with a space after a script so log_2 8 does not read log_28. */
function row(kids) {
  return kids.map((c, i) => {
    const s = linear(c)
    return i && SCRIPTED.has(kids[i - 1].localName) && /^[\p{L}\p{N}(√]/u.test(s) ? ` ${s}` : s
  }).join('')
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

/** Plain-text repair, in the order the damage has to be undone. */
export function repairPlain(text) {
  return powers(stackedLimits(joinFragments(plainChars(text))))
}

// Maths-font letters (𝑥, ℎ: what PDFs and Word give) back to ordinary ones, and the invisible
// operators Word and MathML put after a function name out of the way. A row holding only
// one of those looks blank but is not, and would otherwise split a formula.
const plainChars = (s) => s
  .replace(/[\u{1D400}-\u{1D7FF}ℎ]/gu, (c) => c.normalize('NFKC'))
  .replace(/[\u2061-\u2064]/g, (c) => INVISIBLE[c])
  .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')

// Function names and differentials are the only words allowed inside a formula.
const FUNCS = /cosec|arcsin|arccos|arctan|sinh|cosh|tanh|lim|sin|cos|tan|cot|sec|csc|log|ln|exp|det|max|min|\bd[a-z]\b/g
const mathy = (s) => /[\p{L}\d]/u.test(s) && !/\p{L}{2,}/u.test(s.replace(FUNCS, ' '))

/** Put a rebuilt formula back into the sentence it was cut out of. */
function splice(out, formula, next) {
  const before = out.length && out[out.length - 1].trim() ? `${out.pop().trimEnd()} ` : ''
  out.push(`${before}${formula}${next ? ` ${next}` : ''}`)
}

/**
 * Glue a one-symbol-per-line run back into a formula. A run is four or more
 * short lines, at least half of them a single character, so a list survives.
 */
function joinFragments(text) {
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
    splice(out, math, next ? dropEcho(next, math) : '')
    i = next ? j + 1 : j
  }
  return out.join('\n')
}

const SUB = /^[a-z]\s*(?:→|->|⟶)\s*\S+$/

/**
 * A PDF sets a limit as rows: "lim", then "x→a" under it, then the expression,
 * where a fraction is a numerator row over a denominator row.
 */
function stackedLimits(text) {
  const lines = text.split(/\r?\n/)
  const out = []
  // Blank rows may sit before the expression and between its rows; step over
  // them only when more maths follows, so a paragraph break is never swallowed.
  const skip = (k) => {
    let n = k
    while (n < lines.length && !lines[n].trim()) n++
    return mathy(lines[n] ?? '') ? n : k
  }
  for (let i = 0; i < lines.length; i++) {
    const m = /^(.*?)\blim\s*(.*)$/i.exec(lines[i].trim())
    const under = m?.[2] || (lines[i + 1] ?? '').trim()
    if (!m || !SUB.test(under)) {
      out.push(lines[i])
      continue
    }
    let j = skip(m[2] ? i + 1 : i + 2)
    const top = (lines[j] ?? '').trim()
    const b = skip(j + 1)
    const bottom = (lines[b] ?? '').trim()
    const fraction = mathy(top) && mathy(bottom) && !/=/.test(top + bottom)
    const expr = fraction ? `${group(top)}/${group(bottom)}` : mathy(top) ? top : ''
    j = fraction ? b + 1 : expr ? j + 1 : j
    const next = (lines[j] ?? '').trim()
    splice(out, `${m[1]}lim_(${under})${expr ? ` ${expr}` : ''}`, next)
    i = next ? j : j - 1
  }
  return out.join('\n')
}

const VAR_DIGIT = /(?<!\p{L})([a-z])(\d)(?![\d.])/gu
const BARE_VAR = /(?<!\p{L})([a-z])(?![\p{L}\d])/gu
const isFormula = (chunk) => mathy(chunk) && /[\d+\-−=^/()→×÷*√<>≤≥]/.test(chunk)

/**
 * The copy also lowers raised digits, so x² arrives as x2. The ^ goes back only
 * where that reading is safe: the letter also appears on its own (x2 + 2x) and
 * always with the same digit. x1 and x2 together are subscripts and stay.
 */
function powers(text) {
  const digits = {}
  const alone = new Set()
  for (const f of text.split(/\s+/).filter(isFormula)) {
    for (const [, v, d] of f.matchAll(VAR_DIGIT)) (digits[v] ??= new Set()).add(d)
    for (const [, v] of f.matchAll(BARE_VAR)) alone.add(v)
  }
  const sure = (v) => digits[v]?.size === 1 && alone.has(v)
  return text.split(/(\s+)/).map((chunk) => (!isFormula(chunk) ? chunk : chunk
    .replace(VAR_DIGIT, (m, v, d) => (sure(v) ? `${v}^${d}` : m))
    .replace(/(\([^()]*\p{L}[^()]*\))(\d)(?![\d.])/gu, '$1^$2'))).join('')   // (x+1)2 -> (x+1)^2
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
