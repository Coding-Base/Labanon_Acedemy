/**
 * Math Notation Utilities
 * 
 * Provides helper functions for working with mathematical formulas
 * in the CBT exam system.
 */

/**
 * Convert simple math notation to LaTeX format
 * 
 * Examples:
 * - "3x^2" -> "3x^{2}"
 * - "sqrt(x)" -> "\sqrt{x}"
 * - "1/2" -> "\frac{1}{2}"
 * - "x_1" -> "x_{1}"
 * 
 * @param text - The text to convert
 * @returns Formatted text with LaTeX notation
 */
export function convertToLatex(text: string): string {
  if (!text) return text

  let result = text

  // Convert powers: x^2 -> x^{2}, x^n -> x^{n}
  result = result.replace(/\^(\d+)/g, '^{$1}')
  result = result.replace(/\^([a-zA-Z])/g, '^{$1}')

  // Convert square root: sqrt(x) -> \sqrt{x}
  result = result.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')

  // Convert fractions: 1/2 -> \frac{1}{2}
  result = result.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')

  // Convert subscripts: x_1 -> x_{1}, x_n -> x_{n}
  result = result.replace(/_(\d+)/g, '_{$1}')
  result = result.replace(/_([a-zA-Z])/g, '_{$1}')

  return result
}

/**
 * Check if text contains mathematical notation
 * 
 * @param text - The text to check
 * @returns true if text contains math notation
 */
export function hasMathNotation(text: string): boolean {
  if (!text) return false

  // Check for common math patterns
  const mathPatterns = [
    /\^/, // Power
    /sqrt\(/, // Square root
    /\//, // Fraction
    /_/, // Subscript
    /\\/, // LaTeX command
    /\$/, // LaTeX delimiters
  ]

  return mathPatterns.some((pattern) => pattern.test(text))
}

/**
 * Wrap text in LaTeX inline math delimiters if needed
 * 
 * @param text - The text to wrap
 * @returns Text wrapped in $ delimiters if it contains math notation
 */
export function wrapInMath(text: string): string {
  if (!text || (text.startsWith('$') && text.endsWith('$'))) {
    return text
  }

  if (hasMathNotation(text)) {
    return `$${text}$`
  }

  return text
}

/**
 * Extract all mathematical expressions from text
 * 
 * @param text - The text to search
 * @returns Array of math expressions found
 */
export function extractMathExpressions(text: string): string[] {
  if (!text) return []

  const expressions: string[] = []

  // Extract inline math: $...$
  const inlineMath = text.match(/\$([^$]+)\$/g) || []
  expressions.push(...inlineMath.map((m) => m.slice(1, -1)))

  // Extract block math: $$...$$
  const blockMath = text.match(/\$\$([^$]+)\$\$/g) || []
  expressions.push(...blockMath.map((m) => m.slice(2, -2)))

  // Extract LaTeX commands: \(...\), \[...\]
  const latexInline = text.match(/\\\(([^\)]+)\\\)/g) || []
  expressions.push(...latexInline.map((m) => m.slice(2, -2)))

  const latexBlock = text.match(/\\\[([^\]]+)\\\]/g) || []
  expressions.push(...latexBlock.map((m) => m.slice(2, -2)))

  return expressions
}

/**
 * Validate LaTeX syntax (basic check)
 * 
 * @param latex - LaTeX string to validate
 * @returns true if LaTeX appears to be valid
 */
export function isValidLatex(latex: string): boolean {
  if (!latex) return false

  // Check for balanced braces
  let braceCount = 0
  for (const char of latex) {
    if (char === '{') braceCount++
    if (char === '}') braceCount--
    if (braceCount < 0) return false
  }

  return braceCount === 0
}

/**
 * Format a mathematical question for display
 * 
 * Combines multiple utilities to prepare a question for rendering
 * 
 * @param questionText - The question text
 * @returns Formatted question text ready for KaTeX rendering
 */
export function formatMathQuestion(questionText: string): string {
  if (!questionText) return ''

  let formatted = convertToLatex(questionText)
  formatted = wrapInMath(formatted)

  return formatted
}

/**
 * Format an array of answer choices
 * 
 * @param choices - Array of choice texts
 * @returns Array of formatted choice texts
 */
export function formatMathChoices(choices: string[]): string[] {
  return choices.map((choice) => formatMathQuestion(choice))
}

/**
 * Common mathematical constants and symbols
 */
export const MATH_SYMBOLS = {
  pi: '\\pi',
  PI: '\\pi',
  pi_value: '3.14159',
  sqrt2: '\\sqrt{2}',
  sqrt3: '\\sqrt{3}',
  infinity: '\\infty',
  infinity_symbol: '∞',
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  theta: '\\theta',
  lambda: '\\lambda',
  mu: '\\mu',
  sigma: '\\sigma',
  sum: '\\sum',
  product: '\\prod',
  integral: '\\int',
  partial: '\\partial',
  nabla: '\\nabla',
  approx: '\\approx',
  not_equal: '\\neq',
  less_equal: '\\leq',
  greater_equal: '\\geq',
  approximately_equal: '\\approx',
  plus_minus: '\\pm',
  degree: '^\\circ',
}

/**
 * Replace common symbol names with LaTeX equivalents
 * 
 * Example: "pi" -> "\pi"
 * 
 * @param text - Text containing symbol names
 * @returns Text with symbols replaced by LaTeX
 */
export function replaceSymbols(text: string): string {
  if (!text) return text

  let result = text

  // Replace symbol names with LaTeX
  Object.entries(MATH_SYMBOLS).forEach(([name, latex]) => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi')
    result = result.replace(regex, latex)
  })

  return result
}
