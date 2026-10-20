import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { categoryService, courseService } from '../api/services'
import type { Category, Course, PagedResult } from '../types/api'
import { useLanguage } from '../context/LanguageContext'

const formatPrice = (price: number) => price === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

export function CoursesPage() {
  const { t } = useLanguage()
  const [result, setResult] = useState<PagedResult<Course> | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [sort, setSort] = useState('')
  useEffect(() => { categoryService.list().then(setCategories).catch(() => setCategories([])) }, [])
  useEffect(() => { let active = true; setError(''); setResult(null); courseService.list(page, 9, { search: search.trim() || undefined, category: category || undefined, level: level || undefined, sort: sort || undefined }).then(data => { if (active) setResult(data) }).catch(error => { if (active) setError(getErrorMessage(error)) }); return () => { active = false } }, [page, retry, search, category, level, sort])
  if (error) return <section className="empty"><h1>{t('courses')}</h1><p role="alert">{error}</p><button onClick={() => setRetry(value => value + 1)}>Try again</button></section>
  if (!result) return <section className="empty" aria-live="polite"><p>{t('loadingCourses')}</p></section>
  return <section className="catalogue"><div className="page-heading"><p className="eyebrow">{t('courseCatalogue')}</p><h1>{t('findNextSkill')}</h1></div><form className="catalogue-filters" onSubmit={event => event.preventDefault()}><label>{t('search')}<input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder={t('search')} /></label><label>{t('category')}<select value={category} onChange={event => { setCategory(event.target.value); setPage(1) }}><option value="">{t('allCategories')}</option>{categories.filter(item => item.isActive).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label>{t('level')}<select value={level} onChange={event => { setLevel(event.target.value); setPage(1) }}><option value="">{t('allLevels')}</option><option value="beginner">{t('beginner')}</option><option value="intermediate">{t('intermediate')}</option><option value="advanced">{t('advanced')}</option></select></label><label>{t('sort')}<select value={sort} onChange={event => { setSort(event.target.value); setPage(1) }}><option value="">{t('newest')}</option><option value="title">Title</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Highest rated</option></select></label>{(search || category || level || sort) && <button type="button" className="secondary-button" onClick={() => { setSearch(''); setCategory(''); setLevel(''); setSort(''); setPage(1) }}>{t('clearFilters')}</button>}</form>{result.items.length === 0 ? <div className="empty"><h2>{t('noCourses')}</h2><p>Try adjusting your search or filters.</p></div> : <div className="course-grid">{result.items.map(course => <article className="course-card" key={course.id}>{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" /> : <div className="course-image" aria-hidden="true" /> }<div className="course-copy"><span className="level">{course.level}</span><h2><Link to={`/courses/${course.slug}`}>{course.title}</Link></h2><p>{course.shortDescription ?? 'Explore this course and its lessons.'}</p>{course.categories?.length ? <div className="tags course-categories" aria-label={t('category')}>{course.categories.map(categoryItem => <span key={categoryItem.id}>{categoryItem.name}</span>)}</div> : course.category ? <div className="tags course-categories" aria-label={t('category')}><span>{course.category.name}</span></div> : null}<div className="course-meta"><span>{course.totalLessons} lessons</span><span>{course.totalHours} hours</span><span>★ {course.averageRating.toFixed(1)}</span></div><strong>{formatPrice(course.price)}</strong></div></article>)}</div>}{result.totalPages > 1 && <nav className="pagination" aria-label="Course pages"><button disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</button><span>{result.currentPage} / {result.totalPages}</span><button disabled={page === result.totalPages} onClick={() => setPage(page + 1)}>{t('next')}</button></nav>}</section>
}
