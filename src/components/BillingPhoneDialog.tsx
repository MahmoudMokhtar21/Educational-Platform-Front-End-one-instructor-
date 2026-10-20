import { FormEvent, useState } from 'react'
import './BillingPhoneDialog.css'

type BillingPhoneDialogProps = {
  language: 'en' | 'ar'
  onClose: () => void
  onSubmit: (phoneNumber: string) => Promise<void>
}

/** Shown only after the Paymob-backed API explicitly requests a billing phone. */
export function BillingPhoneDialog({ language, onClose, onSubmit }: BillingPhoneDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const copy = language === 'ar'
    ? { title: 'رقم هاتف الفاتورة', description: 'تحتاج Paymob إلى رقم هاتف صالح لإتمام الدفع. لن يُطلب هذا الرقم في وضع الدفع التجريبي.', label: 'رقم الهاتف', placeholder: 'مثال: +201001234567', cancel: 'إلغاء', continue: 'المتابعة إلى الدفع', processing: 'جارٍ المعالجة…', required: 'أدخل رقم هاتف صالحاً للمتابعة.' }
    : { title: 'Billing phone number', description: 'Paymob requires a valid phone number to create this payment. This is not required for development Mock payments.', label: 'Phone number', placeholder: 'For example: +201001234567', cancel: 'Cancel', continue: 'Continue to payment', processing: 'Processing…', required: 'Enter a valid phone number to continue.' }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = phoneNumber.trim()
    if (!value) {
      setError(copy.required)
      return
    }

    setBusy(true)
    setError('')
    try {
      await onSubmit(value)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.required)
    } finally {
      setBusy(false)
    }
  }

  return <div className="modal-backdrop" role="presentation">
    <section className="modal billing-phone-dialog" role="dialog" aria-modal="true" aria-labelledby="billing-phone-title" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="modal-heading">
        <div><span className="billing-phone-dialog__badge">Paymob</span><h2 id="billing-phone-title">{copy.title}</h2></div>
        <button type="button" className="text-button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
      </div>
      <p className="billing-phone-dialog__description">{copy.description}</p>
      <form className="billing-phone-dialog__form" onSubmit={submit}>
        <label htmlFor="payment-phone">{copy.label}<input id="payment-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={copy.placeholder} value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} disabled={busy} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions billing-phone-dialog__actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>{copy.cancel}</button><button disabled={busy}>{busy ? copy.processing : copy.continue}</button></div>
      </form>
    </section>
  </div>
}
