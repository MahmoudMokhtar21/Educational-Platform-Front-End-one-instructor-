import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import instructorCutout from '../assets/instructor-cutout.png'
import { siteSettingsService } from '../api/services'
import type { SiteSettings } from '../types/api'
import { useLanguage } from '../context/LanguageContext'

const icons: Record<string, string> = { linkedin: 'in', youtube: '▶', facebook: 'f', instagram: '◎', tiktok: '♪', x: '𝕏', whatsapp: '◔', telegram: '➤', chart: '↗' }
export function AboutPage() {
  const { language, t } = useLanguage()
  const [data, setData] = useState<SiteSettings | null>(null)
  useEffect(() => { siteSettingsService.get().then(setData).catch(() => undefined) }, [])
  const title = language === 'ar' ? data?.whoWeAreTitleAr || data?.aboutTitleAr || data?.aboutTitle : data?.whoWeAreTitleEn || data?.aboutTitleEn || data?.aboutTitle
  const description = language === 'ar' ? data?.whoWeAreContentAr || data?.aboutContentAr || data?.aboutContent : data?.whoWeAreContentEn || data?.aboutContentEn || data?.aboutContent
  const overviewTitle = language === 'ar' ? data?.bioTitleAr : data?.bioTitleEn
  const overviewDescription = language === 'ar' ? data?.bioDescriptionAr : data?.bioDescriptionEn
  return <>{data?.isWhoWeAreVisible !== false && <section className="about-hero"><div className="about-hero-copy"><p className="eyebrow">{t('about')} {data?.platformName ?? ''}</p><h1>{title || (language === 'ar' ? 'منصة للتعلم والتطوير المهني' : 'A platform for professional learning')}</h1><p>{description || (language === 'ar' ? 'محتوى عملي يساعدك على بناء مهارات مهنية واتخاذ قرارات أفضل.' : 'Practical learning that helps you build professional skills and make better decisions.')}</p><Link className="button" to="/courses">{t('courses')}</Link></div><aside className="about-hero-aside about-instructor-visual"><img src={instructorCutout} alt={language === 'ar' ? 'صورة المدرّس' : 'Instructor'} /></aside></section>}{(data?.bioStats ?? []).some((stat) => stat.isVisible !== false) && <section className="bio-section"><div className="page-heading"><p className="eyebrow">{language === 'ar' ? 'عن الخبير' : 'About the expert'}</p><h2>{overviewTitle}</h2>{overviewDescription && <p>{overviewDescription}</p>}</div><div className="bio-stats" aria-label="Bio statistics">{data!.bioStats.filter((stat) => stat.isVisible !== false).map((stat) => <a className="bio-stat" key={stat.id} href={stat.url} target="_blank" rel="noreferrer" aria-label={language === 'ar' ? stat.labelAr : stat.labelEn}><span className="bio-icon">{icons[stat.icon] ?? '•'}</span><strong>{stat.count}</strong><span>{language === 'ar' ? stat.labelAr : stat.labelEn}</span><small>{language === 'ar' ? 'عرض التفاصيل' : 'View details'} <b aria-hidden="true">{language === 'ar' ? '←' : '→'}</b></small></a>)}</div></section>}<div className="about-home-link"><Link to="/">{t('home')} <span aria-hidden="true">{language === 'ar' ? '←' : '→'}</span></Link></div></>
}
