/**
 * Editor sabitləri — rəng palitraları və düstur kitabxanası.
 *
 * Bütün sabitlər immutable saxlanılır ki, render-lərdə referans dəyişməsin
 * və lazımsız re-render-lər baş verməsin.
 */

import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mətn rəngi palitrası — 32 rəng (8 sütunda 4 sıra)                  */
/* ------------------------------------------------------------------ */
export const TEXT_COLORS = Object.freeze([
  // Neytral
  '#000000', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
  // Qırmızı / Çəhrayı
  '#E03131', '#F03E3E', '#FA5252', '#FF6B6B', '#C2255C', '#D6336C', '#E64980', '#F783AC',
  // Bənövşəyi / Göy
  '#9C36B5', '#7048E8', '#6741D9', '#4C6EF5', '#3B5BDB', '#1971C2', '#1C7ED6', '#0C8599',
  // Yaşıl / Sarı / Narıncı
  '#0CA678', '#099268', '#2F9E44', '#66A80F', '#FAB005', '#F08C00', '#E8590C', '#D9480F',
  // BDU brend
  '#AA9674', '#2C4B62',
]);

/* ------------------------------------------------------------------ */
/*  Vurğulama (highlight) palitrası — pastel tonlar                    */
/* ------------------------------------------------------------------ */
export const HIGHLIGHT_COLORS = Object.freeze([
  '#FEF3C7', '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#A7F3D0',
  '#A5F3FC', '#BAE6FD', '#C7D2FE', '#DDD6FE', '#FBCFE8', '#E5E7EB',
  '#FCD34D', '#FB7185', '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
]);

/* ------------------------------------------------------------------ */
/*  Cədvəl xanaları üçün arxa fon rəngləri (yumşaq pastellərdən tutmuş
 *  doymuş tonlara qədər)                                              */
/* ------------------------------------------------------------------ */
export const TABLE_CELL_BG_COLORS = Object.freeze([
  '', // şəffaf
  '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
  '#FEE2E2', '#FECACA', '#FCA5A5', '#EF4444', '#DC2626',
  '#FED7AA', '#FDBA74', '#F97316', '#EA580C',
  '#FEF3C7', '#FDE68A', '#FACC15', '#EAB308', '#CA8A04',
  '#D1FAE5', '#A7F3D0', '#6EE7B7', '#10B981', '#059669',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#3B82F6', '#1D4ED8',
  '#E0E7FF', '#C7D2FE', '#A5B4FC', '#6366F1', '#4338CA',
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#EC4899', '#BE185D',
  '#2C4B62', '#AA9674',
]);

/* ------------------------------------------------------------------ */
/*  Cədvəl xanaları üçün mətn rəngləri (kontrast üçün tünd ton + brend) */
/* ------------------------------------------------------------------ */
export const TABLE_CELL_TEXT_COLORS = Object.freeze([
  '', // default (CSS-dən gələn)
  '#000000', '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
  '#B91C1C', '#C2410C', '#A16207', '#15803D', '#1D4ED8', '#6D28D9', '#BE185D',
  '#2C4B62', '#AA9674',
]);

/* ------------------------------------------------------------------ */
/*  Sərhəd rəngləri                                                    */
/* ------------------------------------------------------------------ */
export const TABLE_BORDER_COLORS = Object.freeze([
  '', // default
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899',
  '#2C4B62', '#AA9674',
]);

/** Sərhəd qalınlıqları — px-də */
export const TABLE_BORDER_WIDTHS = Object.freeze(['1px', '2px', '3px', '4px', '6px']);

/** Sərhəd stilləri */
export const TABLE_BORDER_STYLES = Object.freeze([
  { value: 'solid',  label: 'Düz' },
  { value: 'dashed', label: 'Kəsik' },
  { value: 'dotted', label: 'Nöqtəli' },
  { value: 'double', label: 'İkiqat' },
]);

/* ------------------------------------------------------------------ */
/*  Başlıq səviyyələri                                                 */
/* ------------------------------------------------------------------ */
export const HEADING_OPTIONS = Object.freeze([
  { level: 1, label: 'Başlıq 1', icon: Heading1, desc: 'Ən böyük başlıq' },
  { level: 2, label: 'Başlıq 2', icon: Heading2, desc: 'Bölmə başlığı' },
  { level: 3, label: 'Başlıq 3', icon: Heading3, desc: 'Alt bölmə' },
  { level: 4, label: 'Başlıq 4', icon: Heading4, desc: 'Kiçik başlıq' },
  { level: 0, label: 'Normal mətn', icon: Type, desc: 'Paraqraf mətni' },
]);

/* ====================================================================
 *  DÜSTUR (FORMULA) KİTABXANASI
 *  Word-vari təcrübə üçün kateqoriyalara bölünmüş zəngin LaTeX dəstləri.
 *  Hər element: { label (ekran), latex (insert), keywords (axtarış üçün) }
 * ==================================================================== */

const sym = (label, latex, keywords = '') => ({ label, latex, keywords });

export const MATH_CATEGORIES = Object.freeze([
  {
    id: 'basic',
    name: 'Əsaslar',
    items: [
      sym('x²',     'x^{2}',                       'qudra ust square'),
      sym('xⁿ',     'x^{n}',                       'qudra ust power'),
      sym('x₂',     'x_{2}',                       'index alt subscript'),
      sym('√x',     '\\sqrt{x}',                   'kvadrat kok sqrt root'),
      sym('ⁿ√x',    '\\sqrt[n]{x}',                'kok n-ci'),
      sym('a/b',    '\\frac{a}{b}',                'kesir frac dilin'),
      sym('ⁿCₖ',    '\\binom{n}{k}',               'binom secim combination'),
      sym('|x|',    '\\left| x \\right|',          'modul absolute'),
      sym('⌊x⌋',    '\\lfloor x \\rfloor',         'floor'),
      sym('⌈x⌉',    '\\lceil x \\rceil',           'ceiling'),
      sym('x̄',      '\\bar{x}',                    'orta bar'),
      sym('x̂',      '\\hat{x}',                    'hat'),
      sym('x⃗',      '\\vec{x}',                    'vektor arrow'),
      sym('ẋ',      '\\dot{x}',                    'tochka derivative'),
      sym('ẍ',      '\\ddot{x}',                   'iki noqte'),
      sym('xʹ',     "x'",                          'derivative shtrix'),
    ],
  },
  {
    id: 'greek',
    name: 'Yunan hərfləri',
    items: [
      sym('α', '\\alpha', 'alpha'), sym('β', '\\beta', 'beta'),
      sym('γ', '\\gamma', 'gamma'), sym('δ', '\\delta', 'delta'),
      sym('ε', '\\epsilon', 'epsilon'), sym('ζ', '\\zeta', 'zeta'),
      sym('η', '\\eta', 'eta'), sym('θ', '\\theta', 'theta'),
      sym('ι', '\\iota', 'iota'), sym('κ', '\\kappa', 'kappa'),
      sym('λ', '\\lambda', 'lambda'), sym('μ', '\\mu', 'mu'),
      sym('ν', '\\nu', 'nu'), sym('ξ', '\\xi', 'xi'),
      sym('π', '\\pi', 'pi'), sym('ρ', '\\rho', 'rho'),
      sym('σ', '\\sigma', 'sigma'), sym('τ', '\\tau', 'tau'),
      sym('υ', '\\upsilon', 'upsilon'), sym('φ', '\\phi', 'phi'),
      sym('χ', '\\chi', 'chi'), sym('ψ', '\\psi', 'psi'),
      sym('ω', '\\omega', 'omega'),
      sym('Γ', '\\Gamma', 'Gamma'), sym('Δ', '\\Delta', 'Delta'),
      sym('Θ', '\\Theta', 'Theta'), sym('Λ', '\\Lambda', 'Lambda'),
      sym('Ξ', '\\Xi', 'Xi'), sym('Π', '\\Pi', 'Pi'),
      sym('Σ', '\\Sigma', 'Sigma'), sym('Φ', '\\Phi', 'Phi'),
      sym('Ψ', '\\Psi', 'Psi'), sym('Ω', '\\Omega', 'Omega'),
    ],
  },
  {
    id: 'operators',
    name: 'Operatorlar və münasibətlər',
    items: [
      sym('±',  '\\pm',         'plus minus'),
      sym('∓',  '\\mp',         'minus plus'),
      sym('×',  '\\times',      'vurma cross'),
      sym('÷',  '\\div',        'bolme div'),
      sym('·',  '\\cdot',       'nokte dot'),
      sym('∗',  '\\ast',        'asterisk'),
      sym('⊕',  '\\oplus',      'plus dair'),
      sym('⊗',  '\\otimes',     'cross dair'),
      sym('=',  '=',            'equals'),
      sym('≠',  '\\neq',        'beraber deyil not equal'),
      sym('≈',  '\\approx',     'tax beraber approx'),
      sym('≡',  '\\equiv',      'eyni equivalent'),
      sym('≅',  '\\cong',       'congruent'),
      sym('∼',  '\\sim',        'tilde similar'),
      sym('≤',  '\\leq',        'kicik beraber'),
      sym('≥',  '\\geq',        'boyuk beraber'),
      sym('≪',  '\\ll',         'cox kicik'),
      sym('≫',  '\\gg',         'cox boyuk'),
      sym('<',  '<',            'kicik less'),
      sym('>',  '>',            'boyuk greater'),
      sym('∝',  '\\propto',     'mutenasib proportional'),
    ],
  },
  {
    id: 'calculus',
    name: 'Hesab (calculus)',
    items: [
      sym('∑',   '\\sum_{i=1}^{n} x_i',                    'cem sum sigma'),
      sym('∏',   '\\prod_{i=1}^{n} x_i',                   'hasil product'),
      sym('∫',   '\\int_{a}^{b} f(x)\\,dx',                'integral'),
      sym('∬',   '\\iint_{D} f(x,y)\\,dA',                 'iki qat integral double'),
      sym('∭',   '\\iiint_{V} f\\,dV',                     'uc qat integral'),
      sym('∮',   '\\oint_{C} F\\cdot dr',                  'kontur integral'),
      sym('lim', '\\lim_{x \\to \\infty} f(x)',            'limit'),
      sym('∂',   '\\frac{\\partial f}{\\partial x}',       'qismi torme partial'),
      sym('d/dx','\\frac{d}{dx} f(x)',                     'tormə derivative'),
      sym('∇',   '\\nabla f',                              'nabla qradient'),
      sym('Δ',   '\\Delta x',                              'delta deyisme'),
      sym('∞',   '\\infty',                                'sonsuzluq infinity'),
      sym('e',   'e^{x}',                                  'exp eksponent'),
      sym('ln',  '\\ln(x)',                                'natural loqarifma'),
      sym('log', '\\log_{a}(x)',                           'loqarifma'),
    ],
  },
  {
    id: 'trig',
    name: 'Triqonometriya',
    items: [
      sym('sin',  '\\sin(x)',          'sinus'),
      sym('cos',  '\\cos(x)',          'kosinus'),
      sym('tan',  '\\tan(x)',          'tangens'),
      sym('cot',  '\\cot(x)',          'kotangens'),
      sym('sec',  '\\sec(x)',          'sekans'),
      sym('csc',  '\\csc(x)',          'kosekans'),
      sym('arcsin','\\arcsin(x)',      'arksinus'),
      sym('arccos','\\arccos(x)',      'arkkosinus'),
      sym('arctan','\\arctan(x)',      'arktangens'),
      sym('sinh', '\\sinh(x)',         'hiperbolik'),
      sym('cosh', '\\cosh(x)',         'hiperbolik kosinus'),
      sym('tanh', '\\tanh(x)',         'hiperbolik tangens'),
    ],
  },
  {
    id: 'sets',
    name: 'Çoxluqlar və məntiq',
    items: [
      sym('∈',  '\\in',           'aiddir element'),
      sym('∉',  '\\notin',        'aid deyil'),
      sym('∋',  '\\ni',           'saxlayir'),
      sym('⊂',  '\\subset',       'alt coxluq'),
      sym('⊆',  '\\subseteq',     'alt coxluq beraber'),
      sym('⊃',  '\\supset',       'ust coxluq'),
      sym('∪',  '\\cup',          'birlesme union'),
      sym('∩',  '\\cap',          'kesisme intersection'),
      sym('∅',  '\\emptyset',     'bos coxluq empty'),
      sym('∀',  '\\forall',       'her butun for all'),
      sym('∃',  '\\exists',       'movcuddur exists'),
      sym('∄',  '\\nexists',      'movcud deyil'),
      sym('¬',  '\\neg',          'inkar not'),
      sym('∧',  '\\land',         've and'),
      sym('∨',  '\\lor',          'veya or'),
      sym('⊕',  '\\oplus',        'xor'),
      sym('ℕ',  '\\mathbb{N}',    'natural eddet'),
      sym('ℤ',  '\\mathbb{Z}',    'tam eddet integers'),
      sym('ℚ',  '\\mathbb{Q}',    'rasional rationals'),
      sym('ℝ',  '\\mathbb{R}',    'helqiqi reals'),
      sym('ℂ',  '\\mathbb{C}',    'kompleks complex'),
    ],
  },
  {
    id: 'arrows',
    name: 'Oxlar',
    items: [
      sym('→',  '\\to',                'sag ox'),
      sym('←',  '\\leftarrow',         'sol ox'),
      sym('↔',  '\\leftrightarrow',    'iki terefli'),
      sym('⇒',  '\\Rightarrow',        'sag ikiqat'),
      sym('⇐',  '\\Leftarrow',         'sol ikiqat'),
      sym('⇔',  '\\Leftrightarrow',    'iff ikiterefli ikiqat'),
      sym('↑',  '\\uparrow',           'yuxari'),
      sym('↓',  '\\downarrow',         'asagi'),
      sym('↦',  '\\mapsto',            'maps to'),
      sym('⟶',  '\\longrightarrow',    'uzun sag ox'),
      sym('⟵',  '\\longleftarrow',     'uzun sol ox'),
    ],
  },
  {
    id: 'matrices',
    name: 'Matrislər və sistemlər',
    items: [
      sym('Matris (2×2)',
          '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
          'matrix matris pmatrix'),
      sym('Matris [ ]',
          '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
          'matrix kvadrat'),
      sym('Determinant',
          '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
          'determinant det'),
      sym('Matris (3×3)',
          '\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}',
          'matrix 3x3'),
      sym('Tənliklər sistemi',
          '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}',
          'sistem cases tenlik'),
      sym('Hissə-hissə funksiya',
          'f(x) = \\begin{cases} x, & x \\geq 0 \\\\ -x, & x < 0 \\end{cases}',
          'cases funksiya'),
      sym('Cəm + kəsr',
          '\\sum_{i=1}^{n} \\frac{1}{i^2}',
          'sum frac'),
      sym('Riemann inteqralı',
          '\\int_{a}^{b} f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i)\\,\\Delta x',
          'riemann sum integral'),
      sym('Düstur: kvadrat tənlik',
          'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
          'quadratic kvadrat tenlik kok'),
      sym('Pifaqor',
          'a^2 + b^2 = c^2',
          'pythagoras pifaqor'),
      sym('Eyler eyniliyi',
          'e^{i\\pi} + 1 = 0',
          'euler eyler identity'),
    ],
  },
]);

/**
 * Bütün düsturları tek listdə qaytarır (axtarış üçün).
 */
export const ALL_MATH_ITEMS = Object.freeze(
  MATH_CATEGORIES.flatMap((c) => c.items.map((it) => ({ ...it, categoryId: c.id })))
);
