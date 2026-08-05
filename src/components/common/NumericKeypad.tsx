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
  /** Show the built-in Done key. Turn off when a parent already has its own Next/Done action (e.g. wizard footer). */
  showDone?: boolean
}

const DIGIT_ROWS: NumericKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

export default function NumericKeypad({
  onKey,
  onDone,
  allowDecimal = true,
  doneLabel = 'Done',
  className = '',
  disabled,
  showDone = true,
}: NumericKeypadProps) {
  return (
    <div
      className={[
        'grid h-full gap-2 select-none',
        showDone ? 'grid-rows-[1fr_1fr_1fr_1fr_auto]' : 'grid-rows-[1fr_1fr_1fr_1fr]',
        className,
      ].join(' ')}
      role="group"
      aria-label="Numeric keypad"
    >
      {DIGIT_ROWS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-2 min-h-0">
          {row.map((key) => (
            <KeyButton
              key={key}
              label={key}
              disabled={disabled}
              onPress={() => onKey(key)}
            />
          ))}
        </div>
      ))}

      {/* Bottom digit row: . | 0 | backspace */}
      <div className="grid grid-cols-3 gap-2 min-h-0">
        {allowDecimal ? (
          <KeyButton
            label="."
            disabled={disabled}
            onPress={() => onKey('.')}
          />
        ) : (
          <KeyButton label="" disabled className="invisible" onPress={() => {}} />
        )}
        <KeyButton
          label="0"
          disabled={disabled}
          onPress={() => onKey('0')}
        />
        <KeyButton
          label="←"
          ariaLabel="Backspace"
          disabled={disabled}
          onPress={() => onKey('backspace')}
          variant="muted"
        />
      </div>

      {/* Done */}
      {showDone && (
        <div className="shrink-0">
          <KeyButton
            label={doneLabel}
            disabled={disabled}
            onPress={() => onDone?.()}
            variant="primary"
            className="w-full"
          />
        </div>
      )}
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