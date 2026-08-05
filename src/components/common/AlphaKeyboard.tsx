import { useState } from 'react'
import { ArrowBigUp, CornerDownLeft, Delete } from 'lucide-react'

interface AlphaKeyboardProps {
  onChar: (char: string) => void
  onBackspace: () => void
  onDone?: () => void
  doneLabel?: string
  className?: string
  disabled?: boolean
}

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

export default function AlphaKeyboard({
  onChar,
  onBackspace,
  onDone,
  doneLabel = 'Enter',
  className = '',
  disabled,
}: AlphaKeyboardProps) {
  const [shift, setShift] = useState(true)

  function pressChar(c: string) {
    onChar(shift ? c.toUpperCase() : c)
  }

  // Shape/behavior only — no color classes here, so callers never end up
  // combining two conflicting bg-*/text-* utilities on one element (that's
  // what made the Caps/Enter keys render invisible: white-on-white).
  const keyShape =
    'flex items-center justify-center rounded-xl text-lg font-bold ' +
    'min-h-[46px] md:min-h-[52px] touch-manipulation border-2 ' +
    'active:scale-[0.97] transition-transform duration-75 ' +
    'disabled:opacity-40 disabled:pointer-events-none'

  const keyDefault =
    'bg-white border-salon-border text-salon-text ' +
    'hover:border-salon-primary/40 active:bg-salon-primary-light'

  const keyPrimary =
    'bg-salon-primary border-salon-primary text-white ' +
    'hover:bg-salon-primary-dark active:bg-salon-primary-dark'

  return (
    <div
      className={`flex flex-col gap-1.5 select-none ${className}`}
      role="group"
      aria-label="Alphabet keyboard"
    >
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5">
          {ri === 2 && (
            <button
              type="button"
              disabled={disabled}
              aria-label={shift ? 'Caps lock on' : 'Caps lock off'}
              aria-pressed={shift}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShift((s) => !s)}
              className={[
                keyShape,
                shift ? keyPrimary : keyDefault,
                'flex-[1.7] flex-col gap-0.5 text-[10px] font-bold tracking-wide',
                shift ? 'ring-2 ring-salon-primary/30 ring-offset-1' : '',
              ].join(' ')}
            >
              <ArrowBigUp size={18} fill={shift ? 'currentColor' : 'none'} />
              CAPS
            </button>
          )}
          {row.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pressChar(c)}
              className={[keyShape, keyDefault, 'flex-1'].join(' ')}
            >
              {shift ? c.toUpperCase() : c}
            </button>
          ))}
          {ri === 2 && (
            <button
              type="button"
              disabled={disabled}
              aria-label="Backspace"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onBackspace}
              className={[keyShape, keyDefault, 'flex-[1.5]'].join(' ')}
            >
              <Delete size={20} />
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => pressChar(' ')}
          className={[keyShape, keyDefault, 'flex-[3]'].join(' ')}
        >
          Space
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={doneLabel}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onDone?.()}
          className={[keyShape, keyPrimary, 'flex-[1.4] gap-1.5'].join(' ')}
        >
          {doneLabel}
          <CornerDownLeft size={18} />
        </button>
      </div>
    </div>
  )
}
