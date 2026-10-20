import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { categoryService, siteSettingsService } from '../api/services'
import type { Category } from '../types/api'
import { StudentReviews } from '../components/StudentReviews'
import { ContentHubPreview } from '../components/ContentHubPreview'
import './Navbar.css'

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = { linkedin: 'M6.9 8.5A2.4 2.4 0 1 0 6.9 3.7a2.4 2.4 0 0 0 0 4.8zM4.8 9.9H9V21H4.8zm6.9 0h4v1.5h.1c.6-1.1 1.9-2.2 4-2.2 4.2 0 5 2.8 5 6.4V21h-4.2v-4.7c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5V21h-4.2z', facebook: 'M14.4 21v-7h2.4l.3-2.7h-2.7V9.5c0-.8.2-1.3 1.4-1.3h1.4V5.8c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H9.2V14h2.4v7z', instagram: 'M8.2 3h7.6A5.2 5.2 0 0 1 21 8.2v7.6a5.2 5.2 0 0 1-5.2 5.2H8.2A5.2 5.2 0 0 1 3 15.8V8.2A5.2 5.2 0 0 1 8.2 3zm0 2A3 3 0 0 0 5 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm3.8 2.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z', youtube: 'M21.6 7.2a3 3 0 0 0-2.1-2.1c-1.9-.5-7.5-.5-7.5-.5s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1C1.9 9.1 1.9 12 1.9 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.8 15V9l5.3 3z', tiktok: 'M16.7 3c.3 2.5 1.7 4 4.3 4.2v3.1c-1.7.1-3.2-.4-4.2-1.2v6.4c0 5.9-6.5 7.7-9.1 4.1-1.7-2.4-.8-6.6 2.4-7.3.5-.1 1-.1 1.5 0v3.2c-.4-.1-.9-.1-1.3.1-1.1.4-1.3 1.8-.7 2.5 1.2 1.4 4 .3 3.9-2.4V3h3.2z', x: 'M4 4l6.2 8.3L4.3 20H7l4.5-5.5 4.1 5.5H20l-6.5-8.7L19 4h-2.7l-4 4.9L8.7 4H4z', whatsapp: 'M12 3a9 9 0 0 0-7.7 13.7L3 21l4.5-1.2A9 9 0 1 0 12 3zm0 16.3c-1.4 0-2.7-.4-3.8-1.1l-.3-.2-2.6.7.7-2.5-.2-.3A6.3 6.3 0 1 1 12 19.3zm3.5-4.7c-.2-.1-1.3-.6-1.5-.7s-.4-.1-.6.1-.6.7-.7.8-.3.2-.5.1a5.1 5.1 0 0 1-1.5-.9 5.7 5.7 0 0 1-1-1.3c-.1-.2 0-.4.1-.5l.3-.4.2-.4c.1-.1 0-.3 0-.4s-.6-1.4-.8-1.9c-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.4.1-.6.3s-.8.8-.8 2 .8 2.3.9 2.5a7.8 7.8 0 0 0 3 3c.4.2.8.4 1.1.5.5.2 1 .2 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.2-1s-.1-.2-.3-.3z', telegram: 'M21.5 4.2 18.6 19c-.2 1-.8 1.2-1.6.7l-4.4-3.2-2.1 2c-.2.2-.4.4-.8.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.5-.2L7.6 13.2 3.3 12c-.9-.3-.9-.9.2-1.3L20.2 4c.8-.3 1.5.2 1.3.2z' }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] ?? ''} /></svg>
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const { language, setLanguage, t } = useLanguage()
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [socialLinkVisibility, setSocialLinkVisibility] = useState<Record<string, boolean>>({})
  const [navigationLinks, setNavigationLinks] = useState<Record<string, string>>({})
  const [navigationLabels, setNavigationLabels] = useState<Record<string, string>>({})
  const [platformName, setPlatformName] = useState('Northstar Learning')
  const [theme, setTheme] = useState(() => localStorage.getItem('platform-theme') === 'light' ? 'light' : 'dark')
  const [categories, setCategories] = useState<Category[]>([])
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const navigationRef = useRef<HTMLElement>(null)
  useEffect(() => { siteSettingsService.get().then(settings => { setSocialLinks(settings.socialLinks); setSocialLinkVisibility(settings.socialLinkVisibility ?? {}); setNavigationLinks(settings.navigationLinks); setNavigationLabels(settings.navigationLabels); setPlatformName(settings.platformName || 'Northstar Learning'); document.title = settings.platformName || 'Northstar Learning' }).catch(() => undefined) }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('platform-theme', theme) }, [theme])
  useEffect(() => { categoryService.list().then(items => setCategories(items.filter(item => item.isActive))).catch(() => undefined) }, [])
  useEffect(() => { setMobileNavigationOpen(false); setAccountMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (mobileNavigationOpen) return
    navigationRef.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false })
  }, [mobileNavigationOpen])
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNavigationOpen(false) }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape) }, [])
  useEffect(() => { document.body.classList.toggle('navigation-open', mobileNavigationOpen); return () => document.body.classList.remove('navigation-open') }, [mobileNavigationOpen])

  return <div className="app-shell">
    <header className="app-header">
      <div className="app-header-inner">
        <Link to={navigationLinks.home ?? '/'} className="brand"><span className="brand-mark" aria-hidden="true">N</span><span className="brand-label" title={platformName}>{platformName}</span></Link>
        <button type="button" className="nav-menu-toggle" aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'} aria-expanded={mobileNavigationOpen} aria-controls="primary-navigation" onClick={() => setMobileNavigationOpen(current => !current)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg><span>{language === 'ar' ? 'القائمة' : 'Menu'}</span></button>
        <nav ref={navigationRef} id="primary-navigation" className={`app-nav${mobileNavigationOpen ? ' is-open' : ''}`} aria-label="Primary navigation" onClick={event => { if ((event.target as HTMLElement).closest('a')) setMobileNavigationOpen(false) }}>
          <NavLink to={navigationLinks.home ?? '/'}>{navigationLabels.home ?? t('home')}</NavLink>
          <NavLink to={navigationLinks.courses ?? '/courses'}>{navigationLabels.courses ?? t('courses')}</NavLink>
          <details className="category-menu content-menu"><summary>{language === 'ar' ? 'المحتوى' : 'Content'}</summary><div className="category-dropdown"><Link to="/videos">{language === 'ar' ? 'الفيديوهات' : 'Videos'}</Link><Link to="/articles">{language === 'ar' ? 'المقالات والدراسات' : 'Articles & Studies'}</Link></div></details>
          <details className="category-menu"><summary>{navigationLabels.categories ?? t('categories')}</summary><div className="category-dropdown">{categories.length ? categories.map(category => <Link key={category.id} to={`${navigationLinks.categories ?? '/courses'}?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>) : <span>{language === 'ar' ? 'لا توجد تصنيفات بعد' : 'No categories yet'}</span>}</div></details>
          <NavLink to={navigationLinks.about ?? '/about'}>{navigationLabels.about ?? t('about')}</NavLink>
          {user?.role !== 'admin' && <NavLink className="consultation-nav-link" to="/consultation">{language === 'ar' ? 'احجز استشارتك' : 'Book Your Consultation'}</NavLink>}
          {user?.role === 'admin' && <details className="administrator-menu"><summary>{t('administrator')}</summary><div className="administrator-dropdown"><NavLink to="/admin">{t('dashboard')}</NavLink><NavLink to="/dashboard">{language === 'ar' ? 'تعلّمي كطالب' : 'My Learning as a Student'}</NavLink><NavLink to="/consultation">{language === 'ar' ? 'استخدم الاستشارة كمستخدم' : 'As a User Consultant'}</NavLink><NavLink to="/admin/courses">{t('manageCourses')}</NavLink><NavLink to="/admin/courses/new">{t('createCourse')}</NavLink><NavLink to="/admin/categories">{t('categories')}</NavLink><NavLink to="/admin/site-settings">{t('adminSettings')}</NavLink><NavLink to="/admin/sponsors">{language === 'ar' ? 'الرعاة' : 'Sponsors'}</NavLink><NavLink to="/admin/videos">{language === 'ar' ? 'إدارة الفيديوهات' : 'Manage videos'}</NavLink><NavLink to="/admin/articles">{language === 'ar' ? 'إدارة المقالات والدراسات' : 'Manage articles & studies'}</NavLink><NavLink to="/admin/student-reviews">{language === 'ar' ? 'آراء الدارسين' : 'Student reviews'}</NavLink><NavLink to="/admin/consultations">{language === 'ar' ? 'طلبات الاستشارات' : 'Consultation requests'}</NavLink><NavLink to="/admin/course-access-codes">{language === 'ar' ? 'أكواد وصول الدورات' : 'Course access codes'}</NavLink></div></details>}
        </nav>
        <div className="app-actions">
          <button className="language-toggle" type="button" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} aria-label="Switch language">{language === 'en' ? 'العربية' : 'English'}</button><button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? t('light') : t('dark')}</button>
          {user ? <details className="user-menu" open={accountMenuOpen} onToggle={event => setAccountMenuOpen((event.currentTarget as HTMLDetailsElement).open)}>
            <summary aria-label={language === 'ar' ? 'فتح قائمة الحساب' : 'Open account menu'}>
              <span className="user-menu__avatar" aria-hidden="true"><span>{user.firstName.trim().slice(0, 1).toUpperCase() || 'U'}</span>{user.profilePictureUrl && <img src={user.profilePictureUrl} alt="" onError={event => { event.currentTarget.hidden = true }} />}</span>
              <span className="user-menu__name">{language === 'ar' ? `مرحباً، ${user.firstName}` : `Hi, ${user.firstName}`}</span>
            </summary>
            <div className="user-menu__dropdown">
              {user.role !== 'admin' && <NavLink to="/dashboard">{t('myLearning')}</NavLink>}
              <NavLink to="/account">{t('account')}</NavLink>
              <button type="button" onClick={() => { setAccountMenuOpen(false); logout() }}>{t('logout')}</button>
            </div>
          </details> : <><Link className="login-link" to={navigationLinks.login ?? '/login'}>{navigationLabels.login ?? t('login')}</Link><Link className="button" to={navigationLinks.register ?? '/register'}>{navigationLabels.register ?? t('join')}</Link></>}
        </div>
      </div>
      {mobileNavigationOpen && <button type="button" className="nav-mobile-backdrop" aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setMobileNavigationOpen(false)} />}
    </header>
    <main className="app-main"><Outlet />{pathname === '/' && <ContentHubPreview />}{(pathname === '/' || pathname === '/about') && <StudentReviews />}</main>
    <footer className="app-footer">
      <div className="footer-intro">
        <Link to={navigationLinks.home ?? '/'} className="brand footer-brand"><span className="brand-mark" aria-hidden="true">N</span><span className="brand-label">{platformName}</span></Link>
        <p>{language === 'ar' ? 'معرفة عملية للنمو المهني واتخاذ قرارات أفضل.' : 'Practical knowledge for professional growth and better decisions.'}</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link to={navigationLinks.home ?? '/'}>{navigationLabels.home ?? t('home')}</Link>
        <Link to={navigationLinks.courses ?? '/courses'}>{navigationLabels.courses ?? t('courses')}</Link>
        <Link to="/videos">{language === 'ar' ? 'الفيديوهات' : 'Videos'}</Link>
        <Link to="/articles">{language === 'ar' ? 'المقالات والدراسات' : 'Articles & Studies'}</Link>
        <Link to={navigationLinks.about ?? '/about'}>{navigationLabels.about ?? t('about')}</Link>
        {user?.role !== 'admin' && <Link to="/consultation">{language === 'ar' ? 'احجز استشارتك' : 'Book Your Consultation'}</Link>}
      </nav>
      <div className="footer-social" aria-label="Social media links">
        {Object.entries(socialLinks).filter(([name, url]) => url && socialLinkVisibility[name] !== false).map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name}><SocialIcon name={name} /></a>)}
      </div>
      <p className="footer-legal">© {new Date().getFullYear()} {platformName}</p>
      <p className="footer-developer">{language === 'ar' ? 'تم التطوير بواسطة ' : 'Developed by '}<a href="https://www.linkedin.com/in/mahmoud-mokhtar-ba2372177" target="_blank" rel="noopener noreferrer" aria-label={language === 'ar' ? 'ملف Mahmoud Mokhtar على لينكدإن' : 'Mahmoud Mokhtar on LinkedIn'}><bdi>Mahmoud Mokhtar</bdi></a>{language === 'ar' ? ' | مهندس برمجيات' : ' | Software Engineer'}</p>
    </footer>
  </div>
}
