import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { enrollmentService } from '../api/services'
import type { MyCourses } from '../types/api'
import { useLanguage } from '../context/LanguageContext'

export function DashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<MyCourses | null>(null); const [error, setError] = useState('')
  useEffect(() => { enrollmentService.myCourses().then(setData).catch(error => setError(getErrorMessage(error))) }, [])
  if (error) return <section className="empty"><h1>{t('myLearning')}</h1><p role="alert">{error}</p></section>
  if (!data) return <section className="empty" aria-live="polite"><p>{t('loadingLearning')}</p></section>
  return <section className="dashboard"><p className="eyebrow">{t('myLearning')}</p><h1>{t('continueLearning')}</h1><div className="progress-summary"><div><span>{t('activeCourses')}</span><strong>{data.totalActive}</strong></div><div><span>{t('completedCourses')}</span><strong>{data.totalCompleted}</strong></div><div><span>{t('averageProgress')}</span><strong>{Math.round(data.totalProgress)}%</strong></div></div>{data.activeCourses.length === 0 ? <div className="empty"><h2>{t('noActiveCourses')}</h2><Link to="/courses">{t('courses')}</Link></div> : <div className="my-courses">{data.activeCourses.map(course => <article key={course.id} className="learning-card">{course.courseThumbnail && <img src={course.courseThumbnail} alt="" />}<div><h2>{course.courseTitle}</h2><p>{course.completedLessons} / {course.totalLessons}</p><div className="progress-track" aria-label={`${course.progressPercent}%`}><span style={{ width: `${course.progressPercent}%` }} /></div><p>{Math.round(course.progressPercent)}%</p><Link className="button" to={`/learn/${course.courseSlug}`}>{t('continueLearning')}</Link></div></article>)}</div>}</section>
}
