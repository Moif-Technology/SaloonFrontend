export type NumericKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '00' | '.' | 'backspace' | 'clear'

export interface ApplyNumericKeyOptions {
  allowDecimal?: boolean
  /** Max digits after decimal (default 2 for money) */
  maxDecimalPlaces?: number
  /** Total max length of the string (e.g. 10 for mobile) */
  maxLength?: number
  /** Allow leading zeros (true for mobile; false for money usually) */
  allowLeadingZeros?: boolean
  /** Integer-only max value guard (optional; prefer existing validators for errors) */
  maxIntegerDigits?: number
}

/**
 * Applies one keypad action to a string value.
 * Returns the next string. Does NOT throw; silent no-ops for invalid keys.
 */
export function applyNumericKey(
  current: string,
  key: NumericKey,
  opts: ApplyNumericKeyOptions = {},
): string {
  const {
    allowDecimal = true,
    maxDecimalPlaces = 2,
    maxLength,
    allowLeadingZeros = false,
  } = opts

  if (key === 'clear') return ''

  if (key === 'backspace') {
    return current.slice(0, -1)
  }

  if (key === '.') {
    if (!allowDecimal) return current
    if (current.includes('.')) return current
    if (current === '') return '0.'
    return append(current, '.', maxLength)
  }

  if (key === '00') {
    if (!allowLeadingZeros && (current === '' || current === '0')) {
      // "00" on empty/"0" → stay "0" or become "0" depending on product feel
      return current === '' ? '0' : current
    }
    let next = current
    for (const d of '00') {
      next = appendDigit(next, d, { allowDecimal, maxDecimalPlaces, maxLength, allowLeadingZeros })
    }
    return next
  }

  // single digit 0-9
  return appendDigit(current, key, { allowDecimal, maxDecimalPlaces, maxLength, allowLeadingZeros })
}

function appendDigit(
  current: string,
  digit: string,
  opts: Required<Pick<ApplyNumericKeyOptions, 'allowDecimal' | 'maxDecimalPlaces' | 'allowLeadingZeros'>> &
    Pick<ApplyNumericKeyOptions, 'maxLength'>,
): string {
  const { allowDecimal, maxDecimalPlaces, maxLength, allowLeadingZeros } = opts

  // Decimal place limit
  if (allowDecimal && current.includes('.')) {
    const [, frac = ''] = current.split('.')
    if (frac.length >= maxDecimalPlaces) return current
  }

  // Leading zero normalization for money-like values
  if (!allowLeadingZeros && !current.includes('.')) {
    if (current === '0') {
      return append(digit, '', maxLength) // replace leading 0 with new digit
        ? digit
        : digit
    }
    if (current === '' && digit === '0' && allowDecimal) {
      return '0' // allow typing 0.xx later
    }
  }

  return append(current, digit, maxLength)
}

function append(base: string, chunk: string, maxLength?: number): string {
  const next = base + chunk
  if (maxLength != null && next.length > maxLength) return base
  return next
}

/** Parse keypad string to number for calculations. Empty → 0. Trailing "." ok. */
export function parseNumericString(value: string): number {
  if (!value || value === '.' || value === '-') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}