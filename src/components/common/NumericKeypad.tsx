import type { NumericKey } from '../../utils/numericInput'
import { Delete } from 'lucide-react' // or use "←" text

interface NumericKeypadProps {
  onKey: (key: NumericKey) => void
  onDone?: () => void
  /** Hide decimal key (qty, mobile) */
  allowDecimal?: boolean
  doneLabel?: string
  className?: string
  disabled?: boolean
}

const DIGIT_ROWS: NumericKey[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['00', '0', '.'],
]

export default function NumericKeypad({
  onKey,
  onDone,
  allowDecimal = true,
  doneLabel = 'Done',
  className = '',
  disabled,
}: NumericKeypadProps) {
  return (
    <div
      className={`grid h-full grid-rows-[1fr_1fr_1fr_1fr_auto] gap-2 select-none ${className}`}
      role="group"
      aria-label="Numeric keypad"
    >
      {DIGIT_ROWS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-2 min-h-0">
          {row.map((key) => {
            const isDot = key === '.'
            if (isDot && !allowDecimal) {
              return (
                <KeyButton
                  key="blank"
                  label=""
                  disabled
                  className="invisible"
                  onPress={() => {}}
                />
              )
            }
            return (
              <KeyButton
                key={key}
                label={key}
                disabled={disabled}
                onPress={() => onKey(key)}
              />
            )
          })}
        </div>
      ))}

      {/* Bottom: Backspace | Clear | Done */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <KeyButton
          label="←"
          ariaLabel="Backspace"
          disabled={disabled}
          onPress={() => onKey('backspace')}
          variant="muted"
        />
        <KeyButton
          label="Clear"
          disabled={disabled}
          onPress={() => onKey('clear')}
          variant="muted"
        />
        <KeyButton
          label={doneLabel}
          disabled={disabled}
          onPress={() => onDone?.()}
          variant="primary"
        />
      </div>
    </div>
  )
}

function KeyButton({
  label,
  onPress,
  disabled,
  variant = 'default',
  ariaLabel,
  className = '',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: 'default' | 'muted' | 'primary'
  ariaLabel?: string
  className?: string
}) {
  const base =
    'flex items-center justify-center rounded-xl text-2xl font-bold ' +
    'min-h-[56px] md:min-h-[64px] touch-manipulation ' +
    'active:scale-[0.97] transition-transform duration-75 ' +
    'disabled:opacity-40 disabled:pointer-events-none'

  const variants = {
    default:
      'bg-white border-2 border-salon-border text-salon-text ' +
      'hover:border-salon-primary/40 active:bg-salon-primary-light',
    muted:
      'bg-salon-bg border-2 border-salon-border text-salon-text ' +
      'active:bg-salon-primary-light',
    primary:
      'bg-salon-primary text-white border-2 border-salon-primary ' +
      'hover:bg-salon-primary-dark active:bg-salon-primary-dark',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      // Prevents focus steal from your "active field" display
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {label === '←' ? <Delete size={22} /> : label}
    </button>
  )
}