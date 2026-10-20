import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
export function NotFoundPage() { const { t } = useLanguage(); return <section className="empty"><h1>{t('pageNotFound')}</h1><p>{t('pageMissing')}</p><Link to="/">{t('returnHome')}</Link></section> }
