import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService, videoService } from '../api/services'
import type { ContentListItem } from '../types/api'
import { ContentCard, useContentCopy } from './ContentHubShared'
import './ContentHub.css'

export function ContentHubPreview() {
  const { text } = useContentCopy(); const [videos, setVideos] = useState<ContentListItem[]>([]); const [articles, setArticles] = useState<ContentListItem[]>([])
  useEffect(() => { void Promise.all([videoService.list(1, 3), articleService.list(1, 3)]).then(([videoData, articleData]) => { setVideos(videoData.items); setArticles(articleData.items) }).catch(() => undefined) }, [])
  if (!videos.length && !articles.length) return null
  return <section className="content-hub-preview content-section"><div className="content-section-heading"><div><p className="eyebrow">{text('Content hub', 'مركز المحتوى')}</p><h2>{text('Insights beyond the classroom', 'معرفة تتجاوز قاعة الدرس')}</h2></div><div className="content-section-actions"><Link to="/videos">{text('View videos', 'عرض الفيديوهات')}</Link><Link to="/articles">{text('Read articles', 'قراءة المقالات')}</Link></div></div>{videos.length > 0 && <div className="content-preview-group content-preview-videos"><h3>{text('Latest videos', 'أحدث الفيديوهات')}</h3><div className="content-grid">{videos.map(item => <ContentCard key={item.id} item={item} kind="video" />)}</div></div>}{articles.length > 0 && <div className="content-preview-group content-preview-articles"><h3>{text('Articles & studies', 'المقالات والدراسات')}</h3><div className="content-grid">{articles.map(item => <ContentCard key={item.id} item={item} kind="article" />)}</div></div>}</section>
}
