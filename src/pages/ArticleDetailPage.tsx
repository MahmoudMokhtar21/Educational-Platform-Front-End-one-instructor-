import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { articleService } from '../api/services'
import { getErrorMessage } from '../api/client'
import type { KnowledgeArticle } from '../types/api'
import { ContentTags, SafeArticleContent, formatContentDate, useContentCopy } from '../components/ContentHubShared'
import '../components/ContentHub.css'

export function ArticleDetailPage() {
  const { slug = '' } = useParams(); const { ar, text } = useContentCopy(); const [article, setArticle] = useState<KnowledgeArticle | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(true)
  useEffect(() => { setBusy(true); void articleService.detail(slug).then(setArticle).catch(e => setError(getErrorMessage(e))).finally(() => setBusy(false)) }, [slug])
  if (busy) return <section className="content-page content-section"><div className="content-loading">{text('Loading article…', 'جار تحميل المقال…')}</div></section>
  if (!article) return <section className="content-page content-section"><p className="form-error">{error || text('Article not found.', 'المقال غير موجود.')}</p><Link className="secondary-button" to="/articles">{text('Back to articles', 'العودة للمقالات')}</Link></section>
  return <article className="article-detail article-detail-page content-section"><Link className="content-back" to="/articles">← {text('All articles & studies', 'كل المقالات والدراسات')}</Link><header><div className="content-meta"><span className="content-kind">{article.contentType}</span><span>{article.categoryName ?? text('Knowledge hub', 'مركز المعرفة')}</span></div><h1>{article.title}</h1>{article.subtitle && <p className="article-subtitle">{article.subtitle}</p>}<p className="content-meta"><span>{formatContentDate(article.publishedAt, ar)}</span><span>{article.readingTimeMinutes} {text('min read', 'دقائق للقراءة')}</span></p></header>{article.thumbnailUrl && <img className="article-cover" src={article.thumbnailUrl} alt="" />}<SafeArticleContent content={article.content} /><ContentTags tags={article.tags} />{article.relatedCourseId && <p className="content-relation">{text('This article is connected to a course.', 'هذا المقال مرتبط بدورة.')}</p>}</article>
}
