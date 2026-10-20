import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useLanguage } from '../context/LanguageContext'
import type { ContentListItem } from '../types/api'

export function useContentCopy() {
  const { language } = useLanguage()
  const ar = language === 'ar'
  return { ar, text: (en: string, arabic: string) => ar ? arabic : en }
}

export function formatContentDate(value: string | undefined, ar: boolean) {
  if (!value) return ''
  return new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { dateStyle: 'medium' }).format(new Date(value))
}

export function ContentTags({ tags }: { tags: string[] }) {
  return tags.length ? <div className="content-tags">{tags.slice(0, 4).map(tag => <span key={tag}>#{tag}</span>)}</div> : null
}

export function ContentCard({ item, kind }: { item: ContentListItem; kind: 'video' | 'article' }) {
  const { ar, text } = useContentCopy()
  const destination = kind === 'video' ? `/videos/${item.slug}` : `/articles/${item.slug}`
  const label = kind === 'video' ? (item.platform ?? text('Video', 'فيديو')) : (item.contentType ?? text('Article', 'مقال'))
  return <article className="content-card">
    <Link to={destination} className="content-card-media" aria-label={`${text('Open', 'فتح')} ${item.title}`}>
      {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <span className={`content-media-placeholder ${kind}`} aria-hidden="true">{kind === 'video' ? '▶' : '✦'}</span>}
      <span className="content-kind">{label}</span>{item.isFeatured && <span className="content-featured">{text('Featured', 'مميز')}</span>}
    </Link>
    <div className="content-card-body"><div className="content-meta"><span>{item.categoryName ?? text('Knowledge hub', 'مركز المعرفة')}</span><span>{formatContentDate(item.publishedAt ?? item.createdAt, ar)}</span></div><h3><Link to={destination}>{item.title}</Link></h3>{item.description && <p>{item.description}</p>}{kind === 'article' && item.readingTimeMinutes ? <small>{item.readingTimeMinutes} {text('min read', 'دقائق للقراءة')}</small> : null}<ContentTags tags={item.tags} /></div>
  </article>
}

export function ContentEmpty({ title }: { title: string }) { return <div className="content-empty"><span aria-hidden="true">◇</span><p>{title}</p></div> }

function articleEmbedUrl(raw: string) {
  try { const uri = new URL(raw); const host = uri.hostname.toLowerCase(); const path = uri.pathname.replace(/^\/+|\/+$/g, ''); const parts = path.split('/'); const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`); if (matches('youtube.com') || host === 'youtu.be') { const marker = parts.findIndex(part => part === 'embed' || part === 'shorts'); const id = host === 'youtu.be' ? parts[0] : uri.searchParams.get('v') ?? (marker >= 0 ? parts[marker + 1] : ''); return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null } if (matches('vimeo.com')) { const id = parts[parts.length - 1] ?? ''; return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null } if (matches('tiktok.com')) { const id = [...parts].reverse().find(part => /^\d+$/.test(part)); return id ? `https://www.tiktok.com/embed/v2/${id}` : null } if (matches('facebook.com') || host === 'fb.watch') return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false`; return null } catch { return null }
}

function InlineMarkdown({ line }: { line: string }) {
  const parts: ReactNode[] = []
  let last = 0; const expression = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|!?\[[^\]]*\]\(https?:\/\/[^\s)]+\))/g; let match: RegExpExecArray | null
  while ((match = expression.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index)); const token = match[0]
    if (token.startsWith('**')) parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith('*')) parts.push(<em key={match.index}>{token.slice(1, -1)}</em>)
    else if (token.startsWith('`')) parts.push(<code key={match.index}>{token.slice(1, -1)}</code>)
    else { const image = token.startsWith('!'); const divider = token.indexOf(']('); const label = token.slice(image ? 2 : 1, divider); const url = token.slice(divider + 2, -1); const embedded = !image && label.toLowerCase() === 'embed' ? articleEmbedUrl(url) : null; parts.push(image ? <img className="article-inline-image" key={match.index} src={url} alt={label} loading="lazy" /> : embedded ? <span className="article-embedded-video" key={match.index}><iframe src={embedded} title="Embedded video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /></span> : <a key={match.index} href={url} target="_blank" rel="noreferrer">{label}</a>) }
    last = expression.lastIndex
  }
  if (last < line.length) parts.push(line.slice(last)); return <>{parts}</>
}

/** Safe renderer for the Markdown subset accepted by the API; no raw HTML is used. */
export function SafeArticleContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/); const nodes: ReactNode[] = []; let list: string[] = []; let table: string[][] = []; let codeLines: string[] = []; let inCodeBlock = false
  const flush = () => { if (list.length) { nodes.push(<ul key={`list-${nodes.length}`}>{list.map((item, index) => <li key={index}><InlineMarkdown line={item} /></li>)}</ul>); list = [] } }
  const flushTable = () => { if (table.length) { const rows = table.filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell))); const header = rows.shift(); if (header) nodes.push(<div className="article-table" key={`table-${nodes.length}`} role="table"><div role="row" className="article-table-row article-table-head">{header.map((cell, index) => <strong key={index} role="columnheader"><InlineMarkdown line={cell} /></strong>)}</div>{rows.map((row, rowIndex) => <div role="row" className="article-table-row" key={rowIndex}>{row.map((cell, index) => <span key={index} role="cell"><InlineMarkdown line={cell} /></span>)}</div>)}</div>); table = [] } }
  const flushCode = () => { if (codeLines.length) { nodes.push(<pre className="article-code-block" key={`code-${nodes.length}`}><code>{codeLines.join('\n')}</code></pre>); codeLines = [] } }
  lines.forEach((raw, index) => {
    if (/^```/.test(raw.trim())) { flush(); flushTable(); if (inCodeBlock) { flushCode(); inCodeBlock = false } else inCodeBlock = true; return }
    if (inCodeBlock) { codeLines.push(raw); return }
    const line = raw.trim(); if (/^\|.*\|$/.test(line)) { flush(); table.push(line.slice(1, -1).split('|').map(cell => cell.trim())); return } flushTable(); if (/^[-*]\s+/.test(line)) { list.push(line.replace(/^[-*]\s+/, '')); return } flush(); if (!line) return; if (/^###\s+/.test(line)) nodes.push(<h4 key={index}><InlineMarkdown line={line.replace(/^###\s+/, '')} /></h4>); else if (/^##\s+/.test(line)) nodes.push(<h3 key={index}><InlineMarkdown line={line.replace(/^##\s+/, '')} /></h3>); else if (/^#\s+/.test(line)) nodes.push(<h2 key={index}><InlineMarkdown line={line.replace(/^#\s+/, '')} /></h2>); else if (/^>\s+/.test(line)) nodes.push(<blockquote key={index}><InlineMarkdown line={line.replace(/^>\s+/, '')} /></blockquote>); else nodes.push(<p key={index}><InlineMarkdown line={line} /></p>)
  }); if (inCodeBlock) flushCode(); flush(); flushTable(); return <div className="article-rich-content">{nodes}</div>
}
