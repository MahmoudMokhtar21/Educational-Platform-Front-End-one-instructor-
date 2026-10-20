import { useState } from 'react'
import type { PaymentRequiredEnrollment } from '../types/api'
import './PaymentCheckoutDialog.css'

type PaymentCheckoutDialogProps = {
  payment: PaymentRequiredEnrollment
  language: 'en' | 'ar'
  onClose: () => void
  onCompleteMockPayment: () => Promise<void>
  onHostedCheckoutRedirect: () => void
}

const isMockProvider = (provider: string) => provider.trim().toLowerCase() === 'mock'

/**
 * Provider-neutral checkout handoff. The backend remains the source of truth for
 * payment confirmation and enrollment activation; this component never grants
 * course access locally.
 */
export function PaymentCheckoutDialog({ payment, language, onClose, onCompleteMockPayment, onHostedCheckoutRedirect }: PaymentCheckoutDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mockPayment = payment.isMock === true || isMockProvider(payment.provider)
  const checkoutUrl = payment.checkoutUrl
  const copy = language === 'ar'
    ? {
        close: 'إغلاق',
        cancel: 'إلغاء',
        mockTitle: 'دفع تجريبي',
        providerTitle: 'إتمام الشراء',
        mockDescription: 'وضع التطوير مفعّل. لن يتم إنشاء أي معاملة دفع أو خصم مالي حقيقي.',
        providerDescription: 'سيتم نقلك بشكل آمن إلى بوابة الدفع لإتمام العملية. لن تحصل على الوصول إلى الدورة قبل التحقق من الدفع على الخادم.',
        mockAction: 'إتمام الدفع التجريبي',
        providerAction: 'المتابعة إلى بوابة الدفع',
        processing: 'جارٍ المعالجة…',
        unavailable: 'رابط الدفع غير متاح حالياً. حاول مرة أخرى لاحقاً.',
        genericError: 'تعذر إتمام الدفع التجريبي. لم يتغير تسجيلك.'
      }
    : {
        close: 'Close',
        cancel: 'Cancel',
        mockTitle: 'Development payment',
        providerTitle: 'Complete purchase',
        mockDescription: 'Development mode is active. No real payment transaction or charge will be created.',
        providerDescription: 'You will be securely redirected to the payment provider. Course access is granted only after the server verifies the payment.',
        mockAction: 'Complete development payment',
        providerAction: 'Continue to payment',
        processing: 'Processing…',
        unavailable: 'The payment link is unavailable. Please try again shortly.',
        genericError: 'The development payment could not be completed. Your enrollment was not changed.'
      }

  const completeMockPayment = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onCompleteMockPayment()
    } catch {
      setError(copy.genericError)
    } finally {
      setBusy(false)
    }
  }

  const redirectToHostedCheckout = () => {
    if (!checkoutUrl) {
      setError(copy.unavailable)
      return
    }

    try {
      const destination = new URL(checkoutUrl, window.location.origin)
      if (destination.protocol !== 'https:' && destination.protocol !== 'http:') throw new Error('Unsupported payment URL')
      onHostedCheckoutRedirect()
      window.location.assign(destination.toString())
    } catch {
      setError(copy.unavailable)
    }
  }

  return <div className="modal-backdrop payment-checkout-backdrop" role="presentation">
    <section className="modal payment-checkout" role="dialog" aria-modal="true" aria-labelledby="payment-checkout-title" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="modal-heading payment-checkout__heading">
        <div>
          <span className={`payment-checkout__badge${mockPayment ? ' payment-checkout__badge--mock' : ''}`}>
            {mockPayment ? (language === 'ar' ? 'اختبار' : 'Development') : payment.provider}
          </span>
          <h2 id="payment-checkout-title">{mockPayment ? copy.mockTitle : copy.providerTitle}</h2>
        </div>
        <button type="button" className="text-button" onClick={onClose}>{copy.close}</button>
      </div>
      <p className="payment-checkout__description">{mockPayment ? copy.mockDescription : copy.providerDescription}</p>
      {payment.paymentReference && <p className="payment-checkout__reference">{language === 'ar' ? 'مرجع الدفع:' : 'Payment reference:'} <code>{payment.paymentReference}</code></p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions payment-checkout__actions">
        <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
        <button type="button" onClick={mockPayment ? completeMockPayment : redirectToHostedCheckout} disabled={busy}>
          {busy ? copy.processing : (mockPayment ? copy.mockAction : copy.providerAction)}
        </button>
      </div>
    </section>
  </div>
}
