import { useEffect, useState } from 'react'
import { siteSettingsService } from '../api/services'
import type { SiteSettings } from '../types/api'
import { ConsultationBookingFlow } from '../components/ConsultationBookingFlow'
import { useLanguage } from '../context/LanguageContext'
import './ConsultationPage.css'

/**
 * The page owns only its public presentation. The form, validation, package
 * catalogue, and API submission all live in ConsultationBookingFlow so the
 * same booking experience can be embedded elsewhere without duplicating logic.
 */
export function ConsultationPage() {
  const { language } = useLanguage()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const copy = (en: string, ar: string) => language === 'ar' ? ar : en
  const description = language === 'ar' ? settings?.consultationDescriptionAr : settings?.consultationDescriptionEn

  useEffect(() => {
    siteSettingsService.get().then(setSettings).catch(() => undefined)
  }, [])

  return <div className="consultation-page">
    <section className="consultation-page__hero" aria-labelledby="consultation-page-title">
      <div className="consultation-page__hero-copy">
        <p className="consultation-page__eyebrow">{copy('Business consulting', 'استشارات أعمال')}</p>
        <h1 id="consultation-page-title">{copy('Consultation', 'الاستشارات')}</h1>
        <p>{description?.trim() || copy(
          'Set aside focused time to discuss the challenge, review opportunities, and leave with practical next steps for your business.',
          'خصص وقتاً مركزاً لمناقشة التحدي، مراجعة الفرص، والخروج بخطوات عملية تناسب واقع عملك.'
        )}</p>
      </div>
      <aside className="consultation-page__hero-card" aria-label={copy('What you receive', 'ما الذي ستحصل عليه')}>
        <span className="consultation-page__hero-card-icon" aria-hidden="true">↗</span>
        <strong>{copy('A session built around your priority', 'جلسة مبنية على أولويتك')}</strong>
        <p>{copy(
          'Choose the consultation type and a suitable time; we review every request before confirming it.',
          'اختر نوع الاستشارة والوقت المناسب، وسنراجع طلبك قبل تأكيد الموعد.'
        )}</p>
      </aside>
    </section>

    <ConsultationBookingFlow />
  </div>
}
