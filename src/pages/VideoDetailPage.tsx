import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { videoService } from '../api/services'
import type { ExternalVideo } from '../types/api'
import { ContentTags, formatContentDate, useContentCopy } from '../components/ContentHubShared'
import '../components/ContentHub.css'

export function VideoDetailPage() {
  const { slug = '' } = useParams(); const { ar, text } = useContentCopy(); const [video, setVideo] = useState<ExternalVideo | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(true)
  useEffect(() => { setBusy(true); void videoService.detail(slug).then(setVideo).catch(e => setError(getErrorMessage(e))).finally(() => setBusy(false)) }, [slug])
  if (busy) return <section className="content-page content-section"><div className="content-loading">{text('Loading video…', 'جار تحميل الفيديو…')}</div></section>
  if (!video) return <section className="content-page content-section"><p className="form-error">{error || text('Video not found.', 'الفيديو غير موجود.')}</p><Link className="secondary-button" to="/videos">{text('Back to videos', 'العودة للفيديوهات')}</Link></section>
  return <article className="content-detail content-detail-video content-section"><Link className="content-back" to="/videos">← {text('All videos', 'كل الفيديوهات')}</Link><div className="content-detail-layout"><div className="content-player"><iframe src={video.embedUrl} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div><div className="content-detail-summary"><span className="content-kind">{video.platform}</span><h1>{video.title}</h1><p className="content-meta"><span>{video.categoryName ?? text('Knowledge hub', 'مركز المعرفة')}</span><span>{formatContentDate(video.publishedAt, ar)}</span></p>{video.description && <p>{video.description}</p>}<ContentTags tags={video.tags} />{video.relatedCourseId && <p className="content-relation">{text('This video is connected to a course.', 'هذا الفيديو مرتبط بدورة.')}</p>}</div></div><div className="content-embed-note"><p>{text('If the external provider prevents embedded playback, open the original source.', 'إذا منعت المنصة التشغيل المضمّن، افتح المصدر الأصلي.')}</p><a className="secondary-button" href={video.url} target="_blank" rel="noreferrer">{text('Open original video', 'فتح الفيديو الأصلي')}</a></div></article>
}
