import { ConsultationBookingFlow } from './ConsultationBookingFlow'
import { useLanguage } from '../context/LanguageContext'
import './HomeConsultationSection.css'

type HomeConsultationSectionProps = {
  description?: string
}

/**
 * The Home surface deliberately composes the same booking workflow used by the
 * dedicated route. It owns presentation only; validation, package content,
 * request construction, and submission remain in ConsultationBookingFlow.
 */
export function HomeConsultationSection({ description }: HomeConsultationSectionProps) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return <section className="home-consultation-section" aria-labelledby="home-consultation-title">
    <header className="home-consultation-section__heading">
      <p className="eyebrow">{isArabic ? 'استشارات الأعمال' : 'Business consulting'}</p>
      <h2 id="home-consultation-title">{isArabic ? 'ابدأ طلب استشارتك' : 'Start your consultation request'}</h2>
      <p>{description?.trim() || (isArabic
        ? 'اختر الباقة المناسبة، وشاركنا تفاصيل نشاطك، ثم حدّد الموعد الذي يناسبك — دون مغادرة الصفحة الرئيسية.'
        : 'Choose the right package, share the essentials of your business, and request a suitable time — without leaving the Home page.')}</p>
    </header>
    <ConsultationBookingFlow className="home-consultation-section__flow" />
  </section>
}
