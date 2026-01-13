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
            return <BlockMath key={index} math={formula} />
          } catch {
            return <span key={index}>{part}</span>
          }
        }
        
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const formula = part.slice(2, -2).trim()
          try {
            return <BlockMath key={index} math={formula} />
          } catch {
            return <span key={index}>{part}</span>
          }
        }

        // Inline math: $...$ or \(...\)
        if ((part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) || part.length > 2) {
          // Handle inline $ ... $
          if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
            const formula = part.slice(1, -1).trim()
            try {
              return <InlineMath key={index} math={formula} />
            } catch {
              return <span key={index}>{part}</span>
            }
          }
        }
        
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const formula = part.slice(2, -2).trim()
          try {
            return <InlineMath key={index} math={formula} />
          } catch {
            return <span key={index}>{part}</span>
          }
        }

        // Regular text
        return <span key={index}>{part}</span>
      })
    }

    return (
      <div className={`math-display ${className}`}>
        {renderContent()}
      </div>
    )
  } catch (error) {
    console.error('Error rendering math:', error, 'Content:', content)
    // Fallback: just show the content as-is
    return <div className={className}>{content}</div>
  }
}
