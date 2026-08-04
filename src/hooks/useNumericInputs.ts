import { useCallback, useState } from 'react'
import {
  applyNumericKey,
  type ApplyNumericKeyOptions,
  type NumericKey,
} from '../utils/numericInput'

export function useNumericInput(
  initial = '',
  options: ApplyNumericKeyOptions = {},
) {
  const [value, setValue] = useState(initial)

  const onKey = useCallback(
    (key: NumericKey) => {
      setValue((prev) => applyNumericKey(prev, key, options))
    },
    // options object should be stable or you pass primitives:
    // eslint is fine if you memoize options at call site
    [options],
  )

  const reset = useCallback((next = '') => setValue(next), [])

  return { value, setValue, onKey, reset }
}