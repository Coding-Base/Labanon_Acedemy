/**
 * Math & Chemistry Notation Utilities
 * 
 * Provides helper functions for working with mathematical and chemical formulas
 * in the CBT exam system.
 */

// Common chemical formulas for auto-detection
export const CHEMICAL_FORMULAS = [
  'Ca(OH)2', 'Mg(OH)2', 'Al(OH)3', 'Fe(OH)3', 'Cu(OH)2',
  'Na2CO3', 'CaCO3', 'NaHCO3', 'K2CO3', 'MgCO3',
  'H2SO4', 'Na2SO4', 'CuSO4', 'FeSO4', 'MgSO4', 'ZnSO4', 'K2SO4', 'BaSO4',
  'HNO3', 'NaNO3', 'KNO3', 'AgNO3', 'Ca(NO3)2',
  'Na2O', 'CaO', 'MgO', 'Al2O3', 'Fe2O3', 'Fe3O4', 'CO2', 'SO2', 'SO3', 'NO2', 'P2O5',
  'NaCl', 'KCl', 'CaCl2', 'HCl', 'FeCl3', 'FeCl2', 'AlCl3', 'MgCl2', 'NH4Cl', 'ZnCl2',
  'NaOH', 'KOH',
  'H2O2', 'H2O',
  'NH3', 'NH4',
  'CH3COOH', 'C2H5OH', 'CH3OH', 'C6H12O6', 'C12H22O11', 'C2H4', 'C2H2', 'CH4',
  'C6H6', 'C3H8', 'C4H10', 'C2H6',
  'KMnO4', 'K2Cr2O7', 'K2MnO4',
  'PbO2', 'PbO', 'MnO2', 'SiO2', 'TiO2',
  'Na2S', 'H2S', 'FeS', 'FeS2', 'ZnS', 'CuS', 'PbS',
  'NaF', 'KF', 'CaF2', 'HF',
  'KBr', 'NaBr', 'HBr',
  'KI', 'NaI', 'HI',
  'O2', 'N2', 'H2', 'F2', 'Cl2', 'Br2', 'I2',
]

const CHEMICAL_LIKE_PATTERN = /^[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*(?:\([A-Z][a-z]?\d*\)\d*)*$/

export function isChemicalFormula(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 2) return false
  if (CHEMICAL_FORMULAS.includes(trimmed)) return true
  return CHEMICAL_LIKE_PATTERN.test(trimmed) && /\d/.test(trimmed)
}

export function convertReactionArrows(text: string): string {
  let result = text
  result = result.replace(/\s*<\s*=\s*>\s*/g, ' $\\rightleftharpoons$ ')
  result = result.replace(/\s*<\s*-\s*>\s*/g, ' $\\rightleftharpoons$ ')
  result = result.replace(/\s*⇌\s*/g, ' $\\rightleftharpoons$ ')
  result = result.replace(/\s*-\s*-\s*>\s*/g, ' $\\rightarrow$ ')
  result = result.replace(/\s*-\s*>\s*/g, ' $\\rightarrow$ ')
  result = result.replace(/\s*→\s*/g, ' $\\rightarrow$ ')
  return result
}

export function convertScientificNotation(text: string): string {
  let result = text
  result = result.replace(
    /(\d+\.?\d*)\s*[x×\*]\s*10\s*\^\s*\{?\s*(-?\d+)\s*\}?/g,
    '$$$1 \\times 10^{$2}$$'
  )
  result = result.replace(
    /(\d+\.?\d*)\s*[eE]\s*(-?\d+)/g,
    '$$$1 \\times 10^{$2}$$'
  )
  return result
}

export function convertIonicCharges(text: string): string {
  return text.replace(
    /\b([A-Z][a-z]?(?:\d*))\s*\^\s*(\d*[+-])/g,
    '$\\text{$1}^{$2}$'
  )
}

export function convertToLatex(text: string): string {
  if (!text) return text
  let result = text
  result = result.replace(/\^(\d+)/g, '^{$1}')
  result = result.replace(/\^([a-zA-Z])/g, '^{$1}')
  result = result.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
  result = result.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
  result = result.replace(/_(\d+)/g, '_{$1}')
  result = result.replace(/_([a-zA-Z])/g, '_{$1}')
  return result
}

export function hasMathNotation(text: string): boolean {
  if (!text) return false
  const mathPatterns = [
    /\^{/,
    /_{/,
    /\\sqrt/,
    /\\frac/,
    /\w\^\d/,
    /\w\^[a-zA-Z]/,
    /\w_\d/,
    /sqrt\(/,
    /\d+\/\d+/,
    /\\[a-z]+{/,
  ]
  return mathPatterns.some((pattern) => pattern.test(text))
}

function wrapSegmentMath(text: string): string {
  const tokens = text.split(/(\s+)/)
  return tokens
    .map((token) => {
      if (!token || /^\s+$/.test(token)) return token

      const stripped = token.replace(/^[.,;:!?()[\]{}]+|[.,;:!?()[\]{}]+$/g, '')
      const leadingMatch = token.match(/^[.,;:!?()[\]{}]+/)
      const leading = leadingMatch ? leadingMatch[0] : ''
      const trailingMatch = token.match(/[.,;:!?()[\]{}]+$/)
      const trailing = trailingMatch ? trailingMatch[0] : ''

      if (isChemicalFormula(stripped)) {
        return `${leading}$\\ce{${stripped}}${trailing}`
      }
      if (hasMathNotation(stripped)) {
        const converted = convertToLatex(stripped)
        return `${leading}$${converted}$${trailing}`
      }
      return token
    })
    .join('')
}

export function formatMathQuestion(questionText: string): string {
  if (!questionText) return ''
  if (questionText.includes('$')) return questionText

  let text = convertReactionArrows(questionText)
  text = convertScientificNotation(text)
  text = convertIonicCharges(text)

  const parts = text.split(/(\$[^$]+\$|\$\$[^$]+\$\$)/g)
  return parts
    .map((part) => {
      if (!part) return ''
      if (part.startsWith('$')) return part
      return wrapSegmentMath(part)
    })
    .join('')
}

export function formatMathChoices(choices: string[]): string[] {
  return choices.map((choice) => formatMathQuestion(choice))
}
