import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import 'katex/contrib/mhchem' // Enable \ce{} chemistry commands
import { formatMathQuestion, sanitizeEscapedLatex } from '../../utils/mathUtils'

interface MathDisplayProps {
  content: string
  inline?: boolean
  className?: string
}

/**
 * Universal component to render text with embedded LaTeX math and chemistry.
 * 
 * Supports:
 * - Inline math: $formula$ or \(...\)
 * - Block math: $$formula$$ or \[...\]
 * - Chemistry via mhchem: $\ce{H2O}$, $\ce{2H2 + O2 -> 2H2O}$
 * - Mixed HTML + math content (HTML rendered via dangerouslySetInnerHTML)
 * - Plain text with auto-detected math / chemistry shorthand
 * 
 * Backward-compatible with existing questions in production.
 */
export default function MathDisplay({ content, inline = true, className = '' }: MathDisplayProps) {
  if (!content) return null

  try {
    // Pre-format any shorthand math/chemistry notations if not already formatted with $
    const formattedContent = formatMathQuestion(content)
    const rendered = renderContent(formattedContent)

    return (
      <div className={`math-display w-full overflow-x-auto ${className}`}>
        <div className="inline-block min-w-full">
          {rendered}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering math:', error, 'Content:', content)
    // Fallback: show the content as-is
    return <div className={`${className} break-words`}>{content}</div>
  }
}

/**
 * Parse content string into React elements, handling math delimiters and HTML.
 */
function renderContent(content: string): React.ReactNode[] {
  // Check if content contains HTML tags
  const hasHtml = /<[^>]+>/.test(content)

  if (hasHtml) {
    return renderHtmlWithMath(content)
  }

  return renderPlainWithMath(content)
}

/**
 * Render content that contains HTML tags with embedded math.
 * Uses placeholder substitution to protect math from HTML processing.
 */
function renderHtmlWithMath(content: string): React.ReactNode[] {
  const mathPlaceholders: Map<string, { type: 'inline' | 'block'; formula: string }> = new Map()
  let counter = 0
  let processed = content

  // Extract block math first ($$...$$) — must come before inline
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const placeholder = `__MATH_BLOCK_${counter}__`
    mathPlaceholders.set(placeholder, { type: 'block', formula: formula.trim() })
    counter++
    return placeholder
  })

  // Extract inline math ($...$)
  processed = processed.replace(/\$([^$]+?)\$/g, (_match, formula) => {
    const placeholder = `__MATH_INLINE_${counter}__`
    mathPlaceholders.set(placeholder, { type: 'inline', formula: formula.trim() })
    counter++
    return placeholder
  })

  // If no math was found, just render as HTML
  if (mathPlaceholders.size === 0) {
    return [<span key="html" dangerouslySetInnerHTML={{ __html: content }} />]
  }

  // Split by placeholders and render each part
  const placeholderKeys = Array.from(mathPlaceholders.keys())
  const splitPattern = new RegExp(
    `(${placeholderKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`
  )
  const parts = processed.split(splitPattern)

  return parts.map((part, index) => {
    if (!part) return null

    const mathInfo = mathPlaceholders.get(part)
    if (mathInfo) {
      return renderMathElement(mathInfo.type, mathInfo.formula, index)
    }

    // Render HTML part
    return <span key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part }} />
  }).filter(Boolean) as React.ReactNode[]
}

/**
 * Render plain text (no HTML) with embedded math delimiters.
 */
function renderPlainWithMath(content: string): React.ReactNode[] {
  // Split by block math first ($$...$$), then inline ($...$)
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g)

  return parts.map((part, index) => {
    if (!part) return null

    // Block math: $$...$$
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2).trim()
      return renderMathElement('block', formula, index)
    }

    // Inline math: $...$
    if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
      const formula = part.slice(1, -1).trim()
      if (formula) {
        return renderMathElement('inline', formula, index)
      }
    }

    // Check for \[...\] block math
    if (part.includes('\\[')) {
      const subParts = part.split(/(\\\[[\s\S]*?\\\])/g)
      return (
        <span key={index}>
          {subParts.map((sub, subIdx) => {
            if (sub.startsWith('\\[') && sub.endsWith('\\]')) {
              const formula = sub.slice(2, -2).trim()
              return renderMathElement('block', formula, `${index}-${subIdx}`)
            }
            // Check for \(...\) inline math in remaining text
            return renderInlineLatexDelimiters(sub, `${index}-${subIdx}`)
          })}
        </span>
      )
    }

    // Check for \(...\) inline math
    if (part.includes('\\(')) {
      return renderInlineLatexDelimiters(part, index)
    }

    // Regular text
    return <span key={index} className="break-words">{part}</span>
  }).filter(Boolean) as React.ReactNode[]
}

/**
 * Handle \(...\) inline LaTeX delimiters within a text segment.
 */
function renderInlineLatexDelimiters(text: string, keyPrefix: string | number): React.ReactNode {
  if (!text.includes('\\(')) {
    return <span key={keyPrefix} className="break-words">{text}</span>
  }

  const parts = text.split(/(\\\([\s\S]*?\\\))/g)
  return (
    <span key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const formula = part.slice(2, -2).trim()
          return renderMathElement('inline', formula, `${keyPrefix}-${idx}`)
        }
        return <span key={`${keyPrefix}-text-${idx}`} className="break-words">{part}</span>
      })}
    </span>
  )
}

/**
 * Render a single math element (inline or block) with error handling.
 */
function renderMathElement(
  type: 'inline' | 'block',
  formula: string,
  key: string | number
): React.ReactNode {
  if (!formula) return null
  const cleanFormula = sanitizeEscapedLatex(formula).trim()
  if (!cleanFormula) return null

  try {
    if (type === 'block') {
      return (
        <div key={key} className="my-2 overflow-x-auto w-full flex justify-start">
          <div className="inline-block min-w-fit">
            <BlockMath math={cleanFormula} />
          </div>
        </div>
      )
    }

    return (
      <span key={key} className="inline-block max-w-full overflow-x-auto">
        <InlineMath math={cleanFormula} />
      </span>
    )
  } catch (e) {
    console.warn(`Failed to render ${type} math:`, cleanFormula, e)
    return (
      <span key={key} className="break-words font-mono text-xs px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
        {cleanFormula}
      </span>
    )
  }
}
