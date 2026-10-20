import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { categoryService, courseService, siteSettingsService, sponsorService } from '../api/services'
import { resolveMediaUrl } from '../api/client'
import type { Category, Course, SiteSettings, Sponsor } from '../types/api'
import { useLanguage } from '../context/LanguageContext'
import { HomeConsultationSection } from '../components/HomeConsultationSection'

const icons: Record<string, string> = { linkedin: 'in', youtube: '▶', facebook: 'f', instagram: '◎', chart: '↗' }
const initialSettings: SiteSettings = {
  platformName: '', aboutTitle: '', aboutContent: '', aboutTitleEn: '', aboutTitleAr: '', aboutContentEn: '', aboutContentAr: '', isAboutVisible: true, whoWeAreTitleEn: '', whoWeAreTitleAr: '', whoWeAreContentEn: '', whoWeAreContentAr: '', isWhoWeAreVisible: true,
  bioTitleEn: '', bioTitleAr: '', bioDescriptionEn: '', bioDescriptionAr: '', consultationDescriptionEn: '', consultationDescriptionAr: '', bioStats: [], socialLinks: {}, socialLinkVisibility: {}, navigationLinks: {}, navigationLabels: {},
}

function SponsorMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  const items = [...sponsors, ...sponsors]
  return <div className="sponsor-marquee" aria-label="Sponsors"><div className="sponsor-marquee-track">{items.map((sponsor, index) => <div className="sponsor-marquee-item" key={`${sponsor.id}-${index}`} aria-hidden={index >= sponsors.length}><img src={resolveMediaUrl(sponsor.logoUrl)} alt={index < sponsors.length ? sponsor.name : ''} /></div>)}</div></div>
}

const categoryTones = ['programming', 'design', 'business', 'languages', 'science', 'math'] as const
type CategoryTone = typeof categoryTones[number]

function categoryTone(slug: string, index: number): CategoryTone {
  // The home grid intentionally displays at most six categories. Assigning its
  // six palettes by visible position guarantees neighboring cards never share a color.
  void slug
  return categoryTones[index % categoryTones.length]
}

function CategoryIcon({ tone }: { tone: CategoryTone }) {
  const paths: Record<CategoryTone, string> = {
    programming: 'M8 9 5 12l3 3m8-6 3 3-3 3M13.5 5l-3 14',
    design: 'M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.6-2.6l-.4-.8a1.8 1.8 0 0 1 1.6-2.6H18A3 3 0 0 0 21 12a9 9 0 0 0-9-9ZM7.5 12h.01M10 7.5h.01M15 7.5h.01M16.5 12h.01',
    business: 'M4 8h16v11H4zM9 8V5h6v3m-11 4h16M10 12v2h4v-2',
    languages: 'M4 5h9m-4.5 0c0 6-2.5 9-4.5 10m4.5-10c1 4 3 7 5 8m2-5h5m-2.5-3c0 7-2 12-4 14m0-14c1 5 3 9 5 11',
    science: 'M9 3h6m-3 0v6l5.3 8.4A2.3 2.3 0 0 1 15.4 21H8.6a2.3 2.3 0 0 1-1.9-3.6L12 9m-3.2 7h6.4',
    math: 'M7 4v16m-3-8h6m5-5 5 10m0-10-5 10m-5-8h8',
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[tone]} /></svg>
}

export function HomePage() {
  const { language, t } = useLanguage()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<SiteSettings>(initialSettings)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  useEffect(() => { courseService.list(1, 3, { sort: 'rating' }).then((result) => setCourses(result.items)).catch(() => undefined); categoryService.list().then((items) => setCategories(items.filter((item) => item.isActive).slice(0, 6))).catch(() => undefined); siteSettingsService.get().then((data) => setSettings({ ...data, isAboutVisible: data.isWhoWeAreVisible ?? data.isAboutVisible })).catch(() => undefined); sponsorService.list().then(setSponsors).catch(() => undefined) }, [])
  const overviewTitle = language === 'ar' ? settings?.bioTitleAr || settings?.aboutTitle : settings?.bioTitleEn || settings?.aboutTitle
  const overviewDescription = language === 'ar' ? settings?.bioDescriptionAr || settings?.aboutContent : settings?.bioDescriptionEn || settings?.aboutContent
  const aboutTitle = language === 'ar' ? settings?.whoWeAreTitleAr || settings?.aboutTitleAr || settings?.aboutTitle : settings?.whoWeAreTitleEn || settings?.aboutTitleEn || settings?.aboutTitle
  const aboutDescription = language === 'ar' ? settings?.whoWeAreContentAr || settings?.aboutContentAr || settings?.aboutContent : settings?.whoWeAreContentEn || settings?.aboutContentEn || settings?.aboutContent
  const consultationDescription = language === 'ar' ? settings.consultationDescriptionAr : settings.consultationDescriptionEn
  const bioStats = settings?.bioStats ?? []

  return <>
    <section className="hero">
      <p className="eyebrow">{t('learnWithoutLimits')}</p>
      <h1>{t('heroTitle')}</h1>
      <p>{t('heroDescription')}</p>
      <Link className="button" to="/courses">{t('courses')}</Link>
    </section>

    {settings && <section className="home-overview">
      <div className="overview-copy">
        <span className="overview-badge">{language === 'ar' ? 'استشارات وإدارة وتسويق' : 'Consulting, management & marketing'}</span>
        <h2>{overviewTitle}</h2>
        <p>{overviewDescription}</p>
      </div>
      {bioStats.length > 0 && <div className="overview-stats">
        {bioStats.map((stat) => <a className="overview-stat" key={stat.id} href={stat.url} target="_blank" rel="noreferrer" aria-label={language === 'ar' ? stat.labelAr : stat.labelEn}>
          <span className="overview-icon">{icons[stat.icon] ?? '•'}</span><strong>{stat.count}</strong><small>{language === 'ar' ? stat.labelAr : stat.labelEn}</small><em>{language === 'ar' ? 'عرض الرابط' : 'View link'}</em>
        </a>)}
      </div>}
      <Link className="overview-cta" to="/about"><span aria-hidden="true">{language === 'ar' ? '←' : '→'}</span>{t('about')} {settings.platformName}</Link>
    </section>}

    <section className="home-section">
      <div className="page-heading"><p className="eyebrow">{t('popularNow')}</p><h2>{t('featuredCourses')}</h2></div>
      <div className="course-grid">{courses.map((course) => <article className="course-card" key={course.id}>
        {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" /> : <div className="course-image" />}
        <div className="course-copy"><span className="level">{course.level}</span><h2><Link to={`/courses/${course.slug}`}>{course.title}</Link></h2><p>{course.shortDescription}</p></div>
      </article>)}</div>
    </section>

    <section className="home-section">
      <div className="page-heading"><p className="eyebrow">{t('browseTopics')}</p><h2>{t('exploreCategories')}</h2></div>
      <div className="category-grid">{categories.map((category, index) => {
        const tone = categoryTone(category.slug, index)
        return <Link className={`category-tile category-tile-${tone}`} key={category.id} to={`/courses?category=${encodeURIComponent(category.slug)}`}>
          <span className="category-icon"><CategoryIcon tone={tone} /></span><strong>{category.name}</strong><span>{category.description || t('courses')}</span>
        </Link>
      })}</div>
    </section>

    {sponsors.length > 0 && <section className="sponsors-section">
      <div className="page-heading"><p className="eyebrow">{language === 'ar' ? 'شركاء النجاح' : 'Our partners'}</p><h2>{language === 'ar' ? 'نفخر بثقة شركائنا' : 'Trusted by our partners'}</h2></div>
      <div className="sponsor-grid">{sponsors.map((sponsor) => sponsor.websiteUrl ? <a className="sponsor-logo" key={sponsor.id} href={sponsor.websiteUrl} target="_blank" rel="noreferrer" aria-label={sponsor.name}><img src={resolveMediaUrl(sponsor.logoUrl)} alt={sponsor.name} /></a> : <div className="sponsor-logo" key={sponsor.id}><img src={resolveMediaUrl(sponsor.logoUrl)} alt={sponsor.name} /></div>)}</div>
      <SponsorMarquee sponsors={sponsors} />
    </section>}

    <HomeConsultationSection description={consultationDescription} />

    {settings?.isAboutVisible !== false && <section className="about-panel">
      <p className="eyebrow">{t('about')} {settings.platformName}</p><h2>{aboutTitle}</h2><p>{aboutDescription}</p><Link to="/about">{t('learnMore')}</Link>
    </section>}
  </>
}
