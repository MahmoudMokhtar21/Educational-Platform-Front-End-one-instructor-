import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './ConsultationSection.css'

export type ConsultationSectionProps = {
  className?: string
  to?: string
}

/**
 * A compact, reusable invitation for the home page (or another public surface).
 * It deliberately owns no request state; the full intake is handled by
 * ConsultationPage.
 */
export function ConsultationSection({ className = '', to = '/consultation' }: ConsultationSectionProps) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return <section className={`consultation-promo ${className}`.trim()} aria-labelledby="consultation-promo-title">
    <div className="consultation-promo__copy">
      <p className="consultation-promo__eyebrow">{isArabic ? 'استشارات أعمال متخصصة' : 'Specialist business consulting'}</p>
      <h2 id="consultation-promo-title">{isArabic ? 'حوّل خطتك إلى خطوات واضحة قابلة للتنفيذ.' : 'Turn your next business move into a clear plan.'}</h2>
      <p>{isArabic ? 'احجز جلسة مركّزة لمراجعة التحديات والفرص وخطوتك التالية مع خطة عملية تناسب عملك.' : 'Book a focused session to review your challenge, uncover opportunities, and leave with a practical next-step plan.'}</p>
      <div className="consultation-promo__actions">
        <Link className="consultation-promo__cta" to={to}>{isArabic ? 'احجز استشارتك' : 'Book Your Consultation'} <span aria-hidden="true">{isArabic ? '←' : '→'}</span></Link>
        <span className="consultation-promo__note">{isArabic ? 'أونلاين أو في مقرّ العمل' : 'Remote or on-site options'}</span>
      </div>
    </div>
    <dl className="consultation-promo__highlights" aria-label={isArabic ? 'مزايا الاستشارة' : 'Consultation highlights'}>
      <div><dt>{isArabic ? 'جلسة مخصصة' : 'Tailored session'}</dt><dd>{isArabic ? 'حسب أولويتك' : 'Built around your priority'}</dd></div>
      <div><dt>{isArabic ? 'توقيت مرن' : 'Flexible timing'}</dt><dd>{isArabic ? 'اختر الوقت المناسب' : 'Choose a suitable window'}</dd></div>
      <div><dt>{isArabic ? 'خطة عملية' : 'Action plan'}</dt><dd>{isArabic ? 'خطوات واضحة بعد الجلسة' : 'Clear next steps after the session'}</dd></div>
    </dl>
  </section>
}
