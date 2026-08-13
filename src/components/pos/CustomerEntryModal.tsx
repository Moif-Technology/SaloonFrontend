import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { X, ChevronLeft, ChevronRight, Save, Keyboard } from 'lucide-react'
import Button from '../common/Button'
import type { CustomerFormValues, CustomerWizardStep } from '../../types/customer'
import {
  canSaveCustomer,
  getEmailError,
  getMobileError,
  getNameError,
  isValidCustomerName,
  isValidEmail,
  isValidMobile,
} from '../../utils/customerValidation'
import { createCustomer, updateCustomer } from '../../api/customers.ts'
import NumericKeypad from '../common/NumericKeypad'
import AlphaKeyboard from '../common/AlphaKeyboard'
import { applyNumericKey, type NumericKey } from '../../utils/numericInput'

export type InitialCustomer = {
  id: string
  name: string
  mobile: string
  email?: string
  address?: string
  code?: string
}

interface CustomerEntryModalProps {
  open: boolean
  onClose: () => void
  /** Pass when editing an existing customer */
  initialCustomer?: InitialCustomer | null
  /** Prefill create form (e.g. mobile from Select Customer search) */
  prefill?: Partial<Pick<CustomerFormValues, 'name' | 'mobile' | 'email' | 'address'>> | null
  /** Called after successful create — parent can set Walk-in → name, refresh list, etc. */
  onSaved?: (customer: unknown) => void
  /** Optional: show errors via snackbar from parent */
  onError?: (message: string) => void
}

const STEP_LABELS = ['Customer Name', 'Mobile Number', 'Email', 'Address'] as const

const emptyForm: CustomerFormValues = {
  name: '',
  mobile: '',
  email: '',
  address: '',
}

export default function CustomerEntryModal({
  open,
  onClose,
  initialCustomer = null,
  prefill = null,
  onSaved,
  onError,
}: CustomerEntryModalProps) {
  const [step, setStep] = useState<CustomerWizardStep>(1)
  const [form, setForm] = useState<CustomerFormValues>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [keyboardField, setKeyboardField] = useState<'name' | 'email' | 'address' | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const backdropDownRef = useRef(false)
  const sessionKeyRef = useRef<string | null>(null)
  const isEdit = Boolean(initialCustomer?.id)

  // Reset once per open session (not on every parent re-render / new initialCustomer object)
  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null
      return
    }
    const key = initialCustomer?.id
      ? `edit:${initialCustomer.id}`
      : `new:${prefill?.mobile ?? ''}|${prefill?.name ?? ''}`
    if (sessionKeyRef.current === key) return
    sessionKeyRef.current = key
    if (initialCustomer?.id) {
      setStep(1)
      setForm({
        name: initialCustomer.name ?? '',
        mobile: initialCustomer.mobile ?? '',
        email: initialCustomer.email ?? '',
        address: initialCustomer.address ?? '',
      })
    } else {
      const next = {
        ...emptyForm,
        name: prefill?.name ?? '',
        mobile: prefill?.mobile ?? '',
        email: prefill?.email ?? '',
        address: prefill?.address ?? '',
      }
      setForm(next)
      // If search was a mobile number, land on Mobile step so it is visible
      setStep(next.mobile && !next.name ? 2 : 1)
    }
    setFieldError(null)
    setSaving(false)
    setKeyboardField(null)
  }, [open, initialCustomer, prefill])

  // Close the on-screen keyboard when moving between steps
  useEffect(() => {
    setKeyboardField(null)
  }, [step])

  // Auto-focus active field whenever step changes / modal opens
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      // Keep field above keyboard on touch devices
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, step])

  // Android soft keyboard: pin footer using visualViewport
  useEffect(() => {
    if (!open || step === 2 || !window.visualViewport) return
    const vv = window.visualViewport
  
    function sync() {
      const el = panelRef.current
      if (!el) return
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.transform = inset > 0 ? `translateY(-${Math.min(inset, 120)}px)` : ''
    }
  
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    sync()
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      if (panelRef.current) panelRef.current.style.transform = ''
    }
  }, [open])

  function handleMobileKey(key: NumericKey) {
    setForm((prev) => ({
      ...prev,
      mobile: applyNumericKey(prev.mobile, key, {
        allowDecimal: false,
        allowLeadingZeros: true, // phone can have leading 0 in some locales; IN 10-digit usually not
        maxLength: 10,
      }),

    }))
    setFieldError(null)
  }
  if (!open) return null

  function updateField<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  function canGoNextFromStep(s: CustomerWizardStep): boolean {
    if (s === 1) return isValidCustomerName(form.name)
    if (s === 2) return isValidMobile(form.mobile)
    if (s === 3) return isValidEmail(form.email) // empty OK
    return true
  }

  function goNext() {
    if (step === 1) {
      const err = getNameError(form.name)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const err = getMobileError(form.mobile)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      const err = getEmailError(form.email)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(4)
    }
  }

  function goPrevious() {
    setFieldError(null)
    if (step > 1) setStep((s) => (s - 1) as CustomerWizardStep)
  }

  function skipOptional() {
    // Skip only on steps 3 and 4
    if (step === 3) {
      updateField('email', '')
      setFieldError(null)
      setStep(4)
      return
    }
    if (step === 4) {
      updateField('address', '')
      void handleSave()
    }
  }

  async function handleSave() {
    if (!canSaveCustomer(form) || saving) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        code: initialCustomer?.code?.trim() || undefined,
      }
      const customer =
        isEdit && initialCustomer
          ? await updateCustomer(initialCustomer.id, payload)
          : await createCustomer(payload)
      onSaved?.(customer)
      onClose()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to save customer'
      onError?.(message)
      setFieldError(message)
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    // Textarea: allow Shift+Enter for newline; plain Enter advances/saves
    if (step === 4 && e.shiftKey) return
    e.preventDefault()
    if (step < 3) {
      goNext()
    } else if (step === 3) {
      if (canGoNextFromStep(3)) goNext()
    } else {
      if (canSaveCustomer(form)) void handleSave()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (step < 4) goNext()
    else void handleSave()
  }

  const nextDisabled =
    (step === 1 && !isValidCustomerName(form.name)) ||
    (step === 2 && !isValidMobile(form.mobile)) ||
    (step === 3 && !isValidEmail(form.email))

  const saveDisabled = !canSaveCustomer(form) || saving

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-entry-title"
      onMouseDown={(e) => {
        backdropDownRef.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !backdropDownRef.current) return
        backdropDownRef.current = false
        if (window.getSelection()?.toString()) return
        onClose()
      }}
    >
      <div
        ref={panelRef}
        className="flex w-full max-w-[720px] h-[min(560px,90dvh)] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_32px_rgba(31,17,20,0.18)] transition-transform duration-200"
        onMouseDown={() => {
          backdropDownRef.current = false
        }}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-salon-border px-5 py-4">
          <div>
            <h2 id="customer-entry-title" className="text-xl font-bold text-salon-text">
              {isEdit ? 'Edit Customer' : 'Customer Entry'}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Step {step} of 4 · {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* Step pills */}
        <div className="flex shrink-0 gap-2 px-5 pt-4">
          {([1, 2, 3, 4] as const).map((n) => (
            <div
              key={n}
              className={[
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                n <= step ? 'bg-salon-primary' : 'bg-salon-border',
              ].join(' ')}
              aria-hidden
            />
          ))}
        </div>

        {/* Body: one field */}
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
         <div className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto px-5 pt-5 pb-4">
            <div
              key={step}
              className="w-full animate-[fadeIn_0.2s_ease-out]"
            >
              {step === 1 && (
                <FieldBlock
                  label="Customer Name"
                  required
                  error={fieldError}
                >
                  <div className="relative">
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      onKeyDown={onKeyDown}
                      className={`${inputClass} pr-14`}
                      placeholder="Enter full name"
                    />
                    <KeyboardToggleButton
                      active={keyboardField === 'name'}
                      onClick={() =>
                        setKeyboardField((f) => (f === 'name' ? null : 'name'))
                      }
                    />
                  </div>
                </FieldBlock>
              )}

{step === 2 && (
  <div className="flex items-start gap-4">
    {/* LEFT: active field only */}
    <div className="flex w-[45%] flex-col justify-start">
      <FieldBlock label="Mobile Number" required error={fieldError}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          readOnly
          inputMode="none"
          autoComplete="off"
          value={form.mobile}
          onKeyDown={onKeyDown}
          className={inputClass}
          placeholder="10-digit mobile"
        />
      </FieldBlock>
    </div>

    {/* RIGHT: keypad */}
    <div className="w-[55%] rounded-xl bg-salon-bg p-3">
      <NumericKeypad
        allowDecimal={false}
        showDone={false}
        onKey={handleMobileKey}
        onDone={goNext}
      />
    </div>
  </div>
)}

{step === 3 && (
  <FieldBlock label="Email" required={false} error={fieldError}>
    <div className="relative">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="next"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        onKeyDown={onKeyDown}
        className={`${inputClass} pr-14`}
        placeholder="Optional"
      />
      <KeyboardToggleButton
        active={keyboardField === 'email'}
        onClick={() => setKeyboardField((f) => (f === 'email' ? null : 'email'))}
      />
    </div>
  </FieldBlock>
)}

              {step === 4 && (
                <FieldBlock label="Address" required={false} error={fieldError}>
                  <div className="relative">
                    <textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      rows={3}
                      enterKeyHint="done"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      onKeyDown={onKeyDown}
                      className={`${inputClass} resize-none pr-14`}
                      placeholder="Optional"
                    />
                    <KeyboardToggleButton
                      top="top-6"
                      active={keyboardField === 'address'}
                      onClick={() =>
                        setKeyboardField((f) => (f === 'address' ? null : 'address'))
                      }
                    />
                  </div>
                </FieldBlock>
              )}
            </div>
          </div>

          {/* Fixed footer navigation — always visible */}
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-salon-border bg-salon-bg/80 px-3 py-2.5 backdrop-blur-sm">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="secondary"
                icon={<ChevronLeft size={22} />}
                onClick={goPrevious}
                className="min-w-[120px] flex-1"
              >
                Previous
              </Button>
            )}

            {(step === 3 || step === 4) && (
              <Button
                type="button"
                variant="outline"
                size="secondary"
                onClick={skipOptional}
                disabled={saving}
                className="min-w-[100px] flex-1"
              >
                Skip
              </Button>
            )}

            {step < 4 && (
              <Button
                type="button"
                variant="primary"
                size="secondary"
                icon={<ChevronRight size={22} />}
                onClick={goNext}
                disabled={nextDisabled}
                className="min-w-[120px] flex-[1.4]"
              >
                Next
              </Button>
            )}

            {step === 4 && (
              <Button
                type="button"
                variant="primary"
                size="secondary"
                icon={<Save size={22} />}
                onClick={() => void handleSave()}
                disabled={saveDisabled}
                className="min-w-[120px] flex-[1.4]"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </footer>
        </form>
      </div>

      {/* Click-outside catcher — closes the keyboard without closing the modal */}
      {keyboardField && (
        <div
          className="fixed inset-0 z-[105]"
          aria-hidden
          onClick={() => setKeyboardField(null)}
        />
      )}

      {/* Alphabet keyboard — slides up from the bottom of the whole screen */}
      <div
        className={[
          'fixed inset-x-0 bottom-0 z-[110] rounded-t-2xl border-t border-salon-border bg-white shadow-[0_-8px_32px_rgba(31,17,20,0.25)] transition-transform duration-300 ease-out',
          keyboardField ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-sm font-semibold text-salon-muted">Keyboard</span>
          <button
            type="button"
            onClick={() => setKeyboardField(null)}
            aria-label="Close keyboard"
            className="flex h-8 w-8 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-3 pt-1">
          {keyboardField && (
            <AlphaKeyboard
              onChar={(c) => updateField(keyboardField, form[keyboardField] + c)}
              onBackspace={() =>
                updateField(keyboardField, form[keyboardField].slice(0, -1))
              }
              onDone={() => setKeyboardField(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function KeyboardToggleButton({
  active,
  onClick,
  top = 'top-1/2',
}: {
  active: boolean
  onClick: () => void
  /** Tailwind top-position class; textarea needs a fixed offset instead of centering. */
  top?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle on-screen keyboard"
      aria-pressed={active}
      className={[
        'absolute right-2 mt-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors',
        top,
        active
          ? 'bg-salon-primary text-white'
          : 'bg-salon-bg text-salon-muted hover:bg-salon-primary-light',
      ].join(' ')}
    >
      <Keyboard size={20} />
    </button>
  )
}

const inputClass =
  'mt-2 w-full rounded-xl border-2 border-salon-border bg-white px-4 py-3.5 text-xl font-medium text-salon-text outline-none transition-colors placeholder:text-salon-muted/60 focus:border-salon-primary'

  function FieldBlock({
    label,
    required,
    error,
    children,
  }: {
    label: string
    required: boolean
    error: string | null
    children: React.ReactNode
  }) {
    return (
      <label className="block">
        <span className="text-base font-semibold text-salon-text">
          {label}
          {required ? (
            <span className="text-salon-danger"> *</span>
          ) : (
            <span className="font-medium text-salon-muted"> (optional)</span>
          )}
        </span>
        {children}
        {error && (
          <p className="mt-2 text-sm font-medium text-salon-danger" role="alert">
            {error}
          </p>
        )}
      </label>
    )
  }
