import katex from 'katex'

export interface MathSegment {
  type: 'text' | 'math'
  text: string
  display?: boolean
  delimited?: boolean
  raw?: string
}

const STOP = new Set([
  'of', 'to', 'in', 'on', 'is', 'it', 'as', 'at', 'by', 'or', 'an', 'be', 'we', 'if', 'vs', 'so', 'no', 'do',
  'and', 'the', 'for', 'with', 'from', 'into', 'over', 'than', 'that', 'this', 'when', 'both', 'same', 'each',
  'all', 'are', 'has', 'was', 'not', 'but', 'can', 'one', 'two', 'use', 'via', 'per', 'due', 'only', 'also',
  'such', 'then', 'mass', 'body', 'free', 'fall', 'unit', 'law', 'work', 'done', 'rate', 'area', 'plus',
  'true', 'just', 'like', 'near', 'away', 'back', 'line', 'side', 'top', 'out', 'set', 'let', 'may', 'will',
  'once', 'form', 'kind', 'case', 'step', 'axis', 'time', 'zero', 'net', 'its', 'used', 'acts', 'act', 'any',
  'too', 'much', 'than', 'less', 'more', 'very', 'only',
  'new', 'old', 'big', 'low', 'high', 'per', 'fig', 'eq', 'see', 'note', 'part', 'call', 'made', 'make',
])

const GREEK: Record<string, string> = {
  α: '\\alpha',
  β: '\\beta',
  γ: '\\gamma',
  δ: '\\delta',
  Δ: '\\Delta',
  ε: '\\epsilon',
  θ: '\\theta',
  λ: '\\lambda',
  μ: '\\mu',
  π: '\\pi',
  ρ: '\\rho',
  σ: '\\sigma',
  τ: '\\tau',
  φ: '\\phi',
  Φ: '\\Phi',
  ω: '\\omega',
  Ω: '\\Omega',
  η: '\\eta',
  ℓ: '\\ell',
  Σ: '\\Sigma',
}

const SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ₓ': 'x',
}

const SUP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
}

const MOD = /[₀-₉ₓ⁰¹²³⁴⁵⁶⁷⁸⁹\u0304\u0302]/

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function consumeModifiers(text: string, index: number): number {
  let j = index
  if (text[j] === '_') {
    j += 1
    if (text[j] === '{') {
      const end = text.indexOf('}', j + 1)
      j = end === -1 ? j : end + 1
    } else {
      while (/[A-Za-z0-9]/.test(text[j] || '')) j += 1
    }
  }
  if (text[j] === '^') {
    j += 1
    if (text[j] === '{') {
      const end = text.indexOf('}', j + 1)
      j = end === -1 ? j : end + 1
    } else {
      while (/[A-Za-z0-9]/.test(text[j] || '')) j += 1
    }
  }
  while (MOD.test(text[j] || '')) j += 1
  return j
}

function readToken(text: string, index: number, allowProduct: boolean, honorStop = true): number {
  if (index >= text.length) return index
  const func = /^(sin|cos|tan|lim|log|ln|max|min)(?![A-Za-z])/.exec(text.slice(index))
  if (func) return index + func[0].length

  const ch = text[index] || ''
  if (GREEK[ch]) {
    let j = index + 1
    if (text[j] === '_') {
      j = consumeModifiers(text, j)
    } else if (ch === 'μ') {
      const sub = /^[a-z]{1,3}(?![A-Za-z])/.exec(text.slice(j))
      if (sub) j += sub[0].length
    }
    while (MOD.test(text[j] || '')) j += 1
    return j
  }
  if (ch === '½' || ch === '√') return index + 1
  if (/[0-9]/.test(ch)) {
    let j = index + 1
    while (/[0-9.]/.test(text[j] || '')) j += 1
    return consumeModifiers(text, j)
  }
  if (/[A-Za-z]/.test(ch)) {
    const word = /^[A-Za-z]+/.exec(text.slice(index))
    if (!word) return index
    const end = index + word[0].length
    const modified = consumeModifiers(text, end)
    if (modified > end) return modified
    if (word[0].length === 1) {
      const prev = text[index - 1] || ''
      if (/[A-Za-z]/.test(prev)) return index
      return end
    }
    if (word[0].length <= 6 && word[0] === word[0].toUpperCase() && /[A-Z]/.test(word[0])) return end
    if (allowProduct && word[0].length <= 4 && !(honorStop && STOP.has(word[0].toLowerCase()))) return end
    return index
  }
  return index
}

function operatorLength(text: string, index: number): number {
  const two = text.slice(index, index + 2)
  if (two === '<=' || two === '>=') return 2
  const ch = text[index] || ''
  if (!ch) return 0
  if ('=≠≤≥≈<>+−-×·⋅/↔⇒→⟂⊥^,()'.includes(ch)) return 1
  return 0
}

function trimTrailingOperators(text: string, start: number, end: number): number {
  let j = end
  while (j > start && text[j - 1] === ' ') j -= 1
  while (j > start) {
    const prev = j - (text.slice(j - 2, j) === '<=' || text.slice(j - 2, j) === '>=' ? 2 : 1)
    const op = operatorLength(text, prev)
    if (!op || prev + op !== j) break
    if (text[prev] === ')') break
    j = prev
    while (j > start && text[j - 1] === ' ') j -= 1
  }
  return j
}

function equationProduct(text: string, index: number): number {
  if (/[A-Za-z]/.test(text[index - 1] || '')) return index
  const end = readToken(text, index, true)
  if (end <= index) return index
  let k = end
  while (text[k] === ' ') k += 1
  const op = text[k] || ''
  if ('=≠≤≥≈'.includes(op)) return end
  return index
}

function parenIsProse(text: string, parenIndex: number): boolean {
  let k = parenIndex + 1
  while (text[k] === ' ') k += 1
  if (!/[A-Za-z]/.test(text[k] || '') || /[A-Za-z]/.test(text[k + 1] || '')) return false
  let j = k + 1
  while (text[j] === ' ') j += 1
  const word = /^[a-z]{3,}/.exec(text.slice(j))
  if (!word) return false
  const after = text[j + word[0].length] || ''
  if (/^(sin|cos|tan|lim|log|ln|max|min)$/.test(word[0]) && !/[A-Za-z]/.test(after)) return false
  return true
}

function readSpan(text: string, start: number): number {
  let i = start
  while (text[i] === '(' || text[i] === '−' || text[i] === '-') i += 1
  let first = readToken(text, i, false)
  if (first <= i) first = equationProduct(text, i)
  if (first <= i) return start
  i = first
  let expectValue = false
  let guard = 0
  while (i < text.length && i - start < 160 && guard < 80) {
    guard += 1
    const before = i
    let k = i
    let spaces = 0
    while (text[k] === ' ') {
      k += 1
      spaces += 1
    }
    if (spaces > 1) break
    if (expectValue && text[k] === '(') {
      if (parenIsProse(text, k)) break
      i = k + 1
      continue
    }
    if (expectValue && (text[k] === '−' || text[k] === '-' || text[k] === '+')) {
      let k2 = k + 1
      while (text[k2] === ' ') k2 += 1
      const signed = readToken(text, k2, true)
      if (signed > k2) {
        i = signed
        expectValue = false
        continue
      }
    }
    if (spaces === 1 && !expectValue) {
      const unit = /^[A-Za-z]{2,4}/.exec(text.slice(k))
      const follow = text[k + (unit?.[0].length ?? 0)] || ''
      if (unit && follow && !STOP.has(unit[0].toLowerCase()) && '/·⋅×'.includes(follow)) {
        i = k + unit[0].length
        expectValue = false
        continue
      }
    }
    const op = operatorLength(text, k)
    if (op && text[k] === ',') {
      let look = k + 1
      while (text[look] === ' ') look += 1
      const letter = text[look] || ''
      const after = text[look + 1] || ''
      if (/[A-Za-z]/.test(letter) && !/[A-Za-z0-9]/.test(after) && (after === '.' || after === ',')) break
    }
    if (op && !expectValue) {
      if (text[k] === '(' && parenIsProse(text, k)) break
      i = k + op
      expectValue = text[k] !== ')'
      if (i === before) break
      continue
    }
    const next = readToken(text, k, expectValue || spaces === 0, spaces !== 0)
    if (next <= k) break
    i = next
    expectValue = false
    if (i === before) break
  }
  return trimTrailingOperators(text, start, i)
}

function isStrong(slice: string): boolean {
  return /[=≠≤≥≈<>_^√½×·⋅/↔⇒→⟂⊥°μθαβγωπρτσηλΔΣΩℓδφΦε⁰¹²³⁴⁵⁶⁷⁸⁹₀-₉ₓ]|[\u0304\u0302]/.test(slice)
}

function autodetect(text: string): MathSegment[] {
  const out: MathSegment[] = []
  let cursor = 0
  let i = 0
  while (i < text.length) {
    let begin = i
    while (begin > cursor && text[begin - 1] === '(') begin -= 1
    if (begin > cursor && (text[begin - 1] === '−' || text[begin - 1] === '-') && !/[A-Za-z0-9)]/.test(text[begin - 2] || '')) {
      begin -= 1
    }
    const tokenEnd = readToken(text, i, false) > i ? readToken(text, i, false) : equationProduct(text, i)
    if (tokenEnd <= i) {
      i += 1
      continue
    }
    const end = readSpan(text, begin)
    const slice = text.slice(begin, end)
    const acronymSlash = /^[A-Z]{2,8}(?:\/[A-Z]{2,8})+$/.test(slice.trim())
    if (end > begin && isStrong(slice) && !acronymSlash) {
      if (begin > cursor) out.push({ type: 'text', text: text.slice(cursor, begin) })
      out.push({ type: 'math', text: slice, raw: slice })
      cursor = end
      i = end
      continue
    }
    i += 1
  }
  if (cursor < text.length) out.push({ type: 'text', text: text.slice(cursor) })
  return out
}

function splitDelimited(input: string): MathSegment[] {
  const out: MathSegment[] = []
  let buf = ''
  let i = 0
  const flush = () => {
    if (!buf) return
    out.push({ type: 'text', text: buf })
    buf = ''
  }
  while (i < input.length) {
    const openers: Array<{ marker: string, close: string, display: boolean }> = [
      { marker: '$$', close: '$$', display: true },
      { marker: '\\[', close: '\\]', display: true },
      { marker: '\\(', close: '\\)', display: false },
    ]
    const opener = openers.find((item) => input.startsWith(item.marker, i))
    if (opener) {
      const end = input.indexOf(opener.close, i + opener.marker.length)
      if (end !== -1) {
        flush()
        out.push({
          type: 'math',
          text: input.slice(i + opener.marker.length, end),
          display: opener.display,
          delimited: true,
          raw: input.slice(i, end + opener.close.length),
        })
        i = end + opener.close.length
        continue
      }
    }
    if (input[i] === '$' && !/[0-9]/.test(input[i + 1] || '')) {
      const end = input.indexOf('$', i + 1)
      if (end !== -1 && !input.slice(i + 1, end).includes('\n')) {
        flush()
        out.push({
          type: 'math',
          text: input.slice(i + 1, end),
          display: false,
          delimited: true,
          raw: input.slice(i, end + 1),
        })
        i = end + 1
        continue
      }
    }
    buf += input[i]
    i += 1
  }
  flush()
  return out
}

export function segmentMath(input: string, autodetectPlain = true): MathSegment[] {
  const parts = splitDelimited(input)
  if (!autodetectPlain) return parts
  return parts.flatMap((part) => (part.type === 'text' ? autodetect(part.text) : [part]))
}

function normalizeFormula(input: string): string {
  let text = input
  text = text.replace(/([A-Za-zα-ωΑ-Ω])\u0304/g, (_, ch: string) => `\\bar{${GREEK[ch] ?? ch}}`)
  text = text.replace(/([A-Za-z])\u0302/g, '\\hat{$1}')
  text = text.replace(/μ(?!_)([a-z]{1,3})(?![A-Za-z])/g, '\\mu_{$1}')
  text = text.replace(/([A-Za-z])([₀-₉ₓ]+)/g, (_, ch: string, marks: string) => {
    const body = [...marks].map((mark) => SUB[mark] ?? mark).join('')
    return `${ch}_{${body}}`
  })
  text = text.replace(/([A-Za-z0-9}])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, ch: string, marks: string) => {
    const body = [...marks].map((mark) => SUP[mark] ?? mark).join('')
    return `${ch}^{${body}}`
  })
  text = text.replace(/½/g, '\\frac{1}{2}')
  text = text.replace(/√\(([^()]*)\)/g, '\\sqrt{$1}')
  text = text.replace(/√([A-Za-z0-9\\]+)/g, '\\sqrt{$1}')
  text = text.replace(/_([A-Za-z0-9]+),max\b/g, '_{$1,\\max}')
  text = text.replace(/\^max\b/g, '^{\\max}')
  text = text.replace(/_([A-Za-z]{2,})/g, '_{$1}')
  text = text.replace(/[αβγδΔεθλπρστφΦωΩηℓΣμ]/g, (ch, offset, source: string) => {
    const cmd = GREEK[ch] ?? ch
    const next = source[offset + 1] || ''
    return /[A-Za-z]/.test(next) ? `${cmd} ` : cmd
  })
  text = text.replace(/−|–/g, '-')
  text = text.replace(/[·⋅]/g, '\\cdot ')
  text = text.replace(/×/g, '\\times ')
  text = text.replace(/≠/g, '\\neq ')
  text = text.replace(/≤/g, '\\leq ')
  text = text.replace(/≥/g, '\\geq ')
  text = text.replace(/≈/g, '\\approx ')
  text = text.replace(/↔/g, '\\leftrightarrow ')
  text = text.replace(/⇒/g, '\\Rightarrow ')
  text = text.replace(/→/g, '\\to ')
  text = text.replace(/[⟂⊥]/g, '\\perp ')
  text = text.replace(/°/g, '^{\\circ}')
  text = text.replace(/(^|[^\\A-Za-z])(sin|cos|tan|lim|log|ln)(?![A-Za-z])/g, '$1\\$2')
  return text
}

export function renderLatex(tex: string, displayMode: boolean): string | null {
  const trimmed = tex.trim()
  if (!trimmed) return null
  try {
    const html = katex.renderToString(trimmed, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
      trust: false,
    })
    if (html.includes('katex-error')) return null
    return html
  } catch {
    return null
  }
}

export function renderMathHtml(input: string, autodetectPlain = true): string {
  if (!input) return ''
  return segmentMath(input, autodetectPlain).map((segment) => {
    if (segment.type === 'text') return escapeHtml(segment.text)
    const tex = segment.delimited ? segment.text : normalizeFormula(segment.text)
    const html = renderLatex(tex, segment.display === true)
    if (!html) return escapeHtml(segment.raw ?? segment.text)
    const cls = segment.display ? 'math-display' : 'math-inline'
    return `<span class="${cls}">${html}</span>`
  }).join('')
}
