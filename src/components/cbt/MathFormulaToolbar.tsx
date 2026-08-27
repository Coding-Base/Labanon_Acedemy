import React, { useState } from 'react'
import { Sparkles, Eye, EyeOff, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import MathDisplay from './MathDisplay'

interface MathFormulaToolbarProps {
  onInsert: (snippet: string) => void
  currentValue?: string
  label?: string
}

interface SymbolGroup {
  name: string
  items: Array<{
    label: string
    insert: string
    display?: string
    tooltip?: string
  }>
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    name: 'Math Basics',
    items: [
      { label: 'x²', insert: '$x^{2}$', tooltip: 'Power / Square ($x^{2}$)' },
      { label: 'xⁿ', insert: '$x^{n}$', tooltip: 'Generic Power ($x^{n}$)' },
      { label: 'x₁', insert: '$x_{1}$', tooltip: 'Subscript ($x_{1}$)' },
      { label: '√x', insert: '$\\sqrt{x}$', tooltip: 'Square Root ($\\sqrt{x}$)' },
      { label: 'ⁿ√x', insert: '$\\sqrt[n]{x}$', tooltip: 'N-th Root ($\\sqrt[n]{x}$)' },
      { label: 'a/b', insert: '$\\frac{a}{b}$', tooltip: 'Fraction ($\\frac{a}{b}$)' },
      { label: '±', insert: '$\\pm$', tooltip: 'Plus-minus ($\\pm$)' },
      { label: '×', insert: '$\\times$', tooltip: 'Multiplication ($\\times$)' },
      { label: '÷', insert: '$\\div$', tooltip: 'Division ($\\div$)' },
      { label: 'π', insert: '$\\pi$', tooltip: 'Pi ($\\pi$)' },
      { label: '°', insert: '$^\\circ$', tooltip: 'Degree ($^\\circ$)' },
      { label: '∞', insert: '$\\infty$', tooltip: 'Infinity ($\\infty$)' },
    ],
  },
  {
    name: 'Relations & Calculus',
    items: [
      { label: '≠', insert: '$\\neq$', tooltip: 'Not Equal ($\\neq$)' },
      { label: '≈', insert: '$\\approx$', tooltip: 'Approximately Equal ($\\approx$)' },
      { label: '≤', insert: '$\\leq$', tooltip: 'Less Than or Equal ($\\leq$)' },
      { label: '≥', insert: '$\\geq$', tooltip: 'Greater Than or Equal ($\\geq$)' },
      { label: '∫', insert: '$\\int_{a}^{b} f(x)\\,dx$', tooltip: 'Definite Integral' },
      { label: '∑', insert: '$\\sum_{i=1}^{n} x_i$', tooltip: 'Summation' },
      { label: 'lim', insert: '$\\lim_{x \\to 0}$', tooltip: 'Limit' },
      { label: 'θ', insert: '$\\theta$', tooltip: 'Theta ($\\theta$)' },
      { label: 'α', insert: '$\\alpha$', tooltip: 'Alpha ($\\alpha$)' },
      { label: 'β', insert: '$\\beta$', tooltip: 'Beta ($\\beta$)' },
      { label: 'Δ', insert: '$\\Delta$', tooltip: 'Delta ($\\Delta$)' },
    ],
  },
  {
    name: 'Chemistry',
    items: [
      { label: '\\ce{...}', insert: '$\\ce{H2SO4}$', tooltip: 'Chemical Formula Wrapper' },
      { label: '→', insert: '$\\rightarrow$', tooltip: 'Reaction Arrow' },
      { label: '⇌', insert: '$\\rightleftharpoons$', tooltip: 'Equilibrium Arrow' },
      { label: '⁺ (Ion)', insert: '$\\text{Ca}^{2+}$', tooltip: 'Positive Ion Charge' },
      { label: '⁻ (Ion)', insert: '$\\text{SO}_4^{2-}$', tooltip: 'Negative Ion Charge' },
      { label: 'H₂O', insert: '$\\ce{H2O}$', tooltip: 'Water' },
      { label: 'CO₂', insert: '$\\ce{CO2}$', tooltip: 'Carbon Dioxide' },
      { label: 'H₂SO₄', insert: '$\\ce{H2SO4}$', tooltip: 'Sulfuric Acid' },
      { label: 'NaCl', insert: '$\\ce{NaCl}$', tooltip: 'Sodium Chloride' },
      { label: 'Ca(OH)₂', insert: '$\\ce{Ca(OH)2}$', tooltip: 'Calcium Hydroxide' },
      { label: 'C₆H₁₂O₆', insert: '$\\ce{C6H12O6}$', tooltip: 'Glucose' },
    ],
  },
]

export default function MathFormulaToolbar({
  onInsert,
  currentValue,
  label = 'Math & Chemistry Formula Helper'
}: MathFormulaToolbarProps) {
  const [isOpen, setIsOpen] = useState(true) // Open by default for immediate convenience
  const [activeTab, setActiveTab] = useState<'Math Basics' | 'Relations & Calculus' | 'Chemistry'>('Math Basics')
  const [showPreview, setShowPreview] = useState(true) // Show preview by default when value exists

  // Clean HTML from Quill for raw text preview check
  const cleanPreviewText = currentValue ? currentValue.replace(/<[^>]+>/g, '').trim() : ''

  return (
    <div className="border border-indigo-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-lg p-3 mb-3 text-xs shadow-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold">{label}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex items-center gap-2">
          {cleanPreviewText && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                showPreview
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
              }`}
            >
              {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Toolbar Buttons */}
      {isOpen && (
        <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-slate-700">
          {/* Tabs */}
          <div className="flex gap-1.5 mb-2.5 border-b border-indigo-100 dark:border-slate-700 pb-1.5">
            {SYMBOL_GROUPS.map((group) => (
              <button
                key={group.name}
                type="button"
                onClick={() => setActiveTab(group.name as any)}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                  activeTab === group.name
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-100/70 dark:hover:bg-slate-700'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Buttons in Active Tab */}
          <div className="flex flex-wrap gap-1.5">
            {SYMBOL_GROUPS.find((g) => g.name === activeTab)?.items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                title={item.tooltip || item.label}
                onClick={() => onInsert(item.insert)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-400 active:bg-indigo-100 dark:active:bg-indigo-950 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 inline flex-shrink-0" />
            <span>Click any symbol to insert it. Enclose expressions in <code>$...$</code> or chemistry in <code>\ce{`{H2SO4}`}</code>.</span>
          </p>
        </div>
      )}

      {/* Live Preview Box */}
      {showPreview && cleanPreviewText && (
        <div className="mt-2.5 p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-950 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Live Rendered Output:
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              (How students will see this question)
            </span>
          </div>
          <div className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto min-h-[42px] flex items-center">
            <MathDisplay content={currentValue || ''} />
          </div>
        </div>
      )}
    </div>
  )
}
