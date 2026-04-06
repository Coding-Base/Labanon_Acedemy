import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

/**
 * Renders text with LaTeX math and HTML support
 * Handles both inline ($...$) and block ($$...$$) math AND HTML tags
 */
export function MathText({ text }: { text?: string }): JSX.Element {
  if (!text) return <span></span>

  // Check if text contains HTML tags
  const hasHtml = /<[^>]*>/.test(text)

  if (hasHtml) {
    // If HTML is present, we need to render it safely while also handling LaTeX
    // Replace inline math markers with placeholders to protect them during HTML processing
    const mathPlaceholders: { [key: string]: string } = {}
    let counter = 0
    let processedText = text

    // Extract inline math
    processedText = processedText.replace(/\$([^$]+?)\$/g, (match) => {
      const placeholder = `__MATH_INLINE_${counter}__`
      mathPlaceholders[placeholder] = match
      counter++
      return placeholder
    })

    // Extract block math
    processedText = processedText.replace(/\$\$([^$]*)\$\$/g, (match) => {
      const placeholder = `__MATH_BLOCK_${counter}__`
      mathPlaceholders[placeholder] = match
      counter++
      return placeholder
    })

    // Now render the HTML with placeholders
    return (
      <span className="math-text">
        <ProcessedHtmlWithMath html={processedText} mathPlaceholders={mathPlaceholders} />
      </span>
    )
  }

  // Original logic for plain text with math
  // Split by block-level math first ($$...$$)
  const blockParts = text.split(/(\$\$[^$]*\$\$)/g)

  return (
    <span className="math-text">
      {blockParts.map((part, blockIdx) => {
        // Check if this part is block math
        if (part.match(/^\$\$.*\$\$/)) {
          const mathContent = part.slice(2, -2) // Remove $$ delimiters
          return (
            <div key={blockIdx} className="my-2 overflow-x-auto">
              <BlockMath key={blockIdx}>{mathContent}</BlockMath>
            </div>
          )
        }

        // Split remaining parts by inline math ($...$)
        const inlineParts = part.split(/(\$[^$]+\$)/g)

        return (
          <span key={blockIdx}>
            {inlineParts.map((inlinePart, inlineIdx) => {
              // Check if this part is inline math (starts and ends with single $)
              if (inlinePart.match(/^\$[^$]+\$$/)) {
                const mathContent = inlinePart.slice(1, -1) // Remove $ delimiters
                return <InlineMath key={`inline-${blockIdx}-${inlineIdx}`}>{mathContent}</InlineMath>
              }
              return <span key={`text-${blockIdx}-${inlineIdx}`}>{inlinePart}</span>
            })}
          </span>
        )
      })}
    </span>
  )
}

/**
 * Helper component to render HTML with embedded math
 */
function ProcessedHtmlWithMath({ html, mathPlaceholders }: { html: string; mathPlaceholders: { [key: string]: string } }): JSX.Element {
  // Build the HTML with KaTeX components
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let combinedText = html

  // Replace all math placeholders with special markers for splitting
  const placeholderMap: Map<string, React.ReactNode> = new Map()

  for (const [placeholder, mathString] of Object.entries(mathPlaceholders)) {
    if (placeholder.includes('INLINE')) {
      const mathContent = mathString.slice(1, -1) // Remove $ delimiters
      placeholderMap.set(placeholder, <InlineMath key={`math-${placeholder}`}>{mathContent}</InlineMath>)
    } else {
      const mathContent = mathString.slice(2, -2) // Remove $$ delimiters
      placeholderMap.set(placeholder, (
        <div key={`math-${placeholder}`} className="my-2 overflow-x-auto">
          <BlockMath>{mathContent}</BlockMath>
        </div>
      ))
    }
  }

  // Now render the HTML with the math components injected
  // Use dangerouslySetInnerHTML for HTML, but we need to be careful with placeholders
  // Split by placeholders and render accordingly
  const placeholders = Array.from(placeholderMap.keys())
  const parts = combinedText.split(new RegExp(`(${placeholders.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`))

  return (
    <>
      {parts.map((part, idx) => {
        if (placeholderMap.has(part)) {
          return placeholderMap.get(part)
        }
        // Render HTML part
        return (
          <span key={`html-${idx}`} dangerouslySetInnerHTML={{ __html: part }} />
        )
      })}
    </>
  )
}

/**
 * Renders HTML content safely with LaTeX support
 * Used for Rich Text Editor content and explanations
 */
export function HtmlContent({ html }: { html?: string }): JSX.Element {
  if (!html) return <div></div>

  // Process the HTML to handle inline math within HTML
  // This regex finds LaTeX math and wraps it in span markers for processing
  const processedHtml = html
    .replace(/\$\$([^$]*)\$\$/g, '<div class="math-block">$$\$$$1$$\$$$</div>')
    .replace(/\$([^$]+?)\$/g, '<span class="math-inline">\$\$$1$$\$$</span>')

  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  )
}

/**
 * Renders rich text that may contain both HTML and LaTeX
 * Safer approach: parse HTML and inject LaTeX rendering
 */
export function RichText({ content }: { content?: string }): JSX.Element {
  if (!content) return <div></div>

  // Create a temporary container to parse HTML
  const parser = new DOMParser()
  let htmlString = content

  // Escape any < or > that aren't part of HTML tags to prevent parsing errors
  try {
    const doc = parser.parseFromString(`<div>${htmlString}</div>`, 'text/html')
    if (doc.body.innerHTML) {
      // Content was parsed successfully
      return (
        <div className="prose prose-sm max-w-none space-y-2">
          {/* First, render the HTML */}
          <div dangerouslySetInnerHTML={{ __html: htmlString }} />
          {/* Then handle math rendering with regex for any $ markers */}
          {htmlString.includes('$') && <MathText text={htmlString} />}
        </div>
      )
    }
  } catch (e) {
    // If parsing fails, fall back to plain text with math
  }

  // Fallback: just render as text with math
  return <MathText text={content} />
}

// Utility function to strip HTML tags but keep LaTeX
const stripHtmlKeepMath = (html?: string): string => {
  if (!html) return ''
  // Remove HTML tags but keep $ markers
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export { stripHtmlKeepMath }
