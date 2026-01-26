import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface MathDisplayProps {
  content: string
  inline?: boolean
  className?: string
}

/**
 * Component to render mathematical formulas using KaTeX
 * 
 * Supports inline and block math rendering
 * Auto-detects LaTeX patterns:
 * - Inline: $formula$ or \(...\)
 * - Block: $$formula$$ or \[...\]
 */
export default function MathDisplay({ content, inline = true, className = '' }: MathDisplayProps) {
  if (!content) return null

  try {
    // Parse and render mixed text + math content
    const renderContent = () => {
      // Split by LaTeX delimiters while preserving them
      // Using a more robust pattern that handles edge cases
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\[\s\S]*?\\]|\\([\s\S]*?\\))/)

      return parts.map((part, index) => {
        if (!part) return null

        // Block math: $$...$$ or \[...\]
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim()
          try {
            return (
              <div key={index} className="my-2 overflow-x-auto w-full flex justify-start sm:justify-start">
                <div className="inline-block min-w-fit">
                  <BlockMath math={formula} />
                </div>
              </div>
            )
          } catch {
            return <span key={index} className="break-words">{part}</span>
          }
        }
        
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const formula = part.slice(2, -2).trim()
          try {
            return (
              <div key={index} className="my-2 overflow-x-auto w-full flex justify-start sm:justify-start">
                <div className="inline-block min-w-fit">
                  <BlockMath math={formula} />
                </div>
              </div>
            )
          } catch {
            return <span key={index} className="break-words">{part}</span>
          }
        }

        // Inline math: $...$ or \(...\)
        if ((part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) || part.length > 2) {
          // Handle inline $ ... $
          if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
            const formula = part.slice(1, -1).trim()
            try {
              return (
                <span key={index} className="inline-block max-w-full overflow-x-auto">
                  <InlineMath math={formula} />
                </span>
              )
            } catch {
              return <span key={index} className="break-words">{part}</span>
            }
          }
        }
        
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const formula = part.slice(2, -2).trim()
          try {
            return (
              <span key={index} className="inline-block max-w-full overflow-x-auto">
                <InlineMath math={formula} />
              </span>
            )
          } catch {
            return <span key={index} className="break-words">{part}</span>
          }
        }

        // Regular text - break words properly on mobile
        return <span key={index} className="break-words">{part}</span>
      })
    }

    return (
      <div className={`math-display w-full overflow-x-auto ${className}`}>
        <div className="inline-block min-w-full">
          {renderContent()}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering math:', error, 'Content:', content)
    // Fallback: just show the content as-is
    return <div className={`${className} break-words`}>{content}</div>
  }
}
