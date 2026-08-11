/**
 * Cloudflare Pages _worker.js
 *
 * Intercepts requests to:
 *   - /api/articles       -> returns data/articles.json
 *   - /posts/:slug        -> dynamically renders article from content/:slug.json
 *   - /posts/:slug.html   -> same as above
 *
 * Everything else falls through to static assets deployed on Pages.
 */

const STATIC_ASSET_PREFIXES = [
  '/assets/',
  '/data/',
  '/content/',
];

const STATIC_FILES = [
  '/',
  '/index.html',
  '/about.html',
  '/404.html',
  '/article-template.html',
  '/rss.xml',
  '/sitemap.xml',
  '/robots.txt',
  '/_headers',
  '/_redirects',
];

function isStaticAsset(path) {
  return STATIC_ASSET_PREFIXES.some(p => path.startsWith(p)) ||
         STATIC_FILES.includes(path);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  return tags.map(tag => `<a href="/">${escapeHtml(tag)}</a>`).join('\n            ');
}

async function renderArticle(slug, request, env) {
  const [templateRes, contentRes] = await Promise.all([
    env.ASSETS.fetch(new URL('/article-template.html', request.url)),
    env.ASSETS.fetch(new URL(`/content/${slug}.json`, request.url)),
  ]);

  if (!contentRes.ok) {
    return null;
  }

  if (!templateRes.ok) {
    return new Response('Template not found', { status: 500 });
  }

  const template = await templateRes.text();
  const content = await contentRes.json();

  const url = new URL(request.url);
  const pageUrl = `${url.origin}/posts/${slug}.html`;
  const ogImage = content.ogImage || '/assets/images/og-default.png';

  const prevUrl = content.prevSlug ? `/posts/${content.prevSlug}.html` : '#';
  const nextUrl = content.nextSlug ? `/posts/${content.nextSlug}.html` : '#';

  let postNav = '';
  if (content.prevSlug || content.nextSlug) {
    const prevHtml = content.prevSlug
      ? `<a href="/posts/${content.prevSlug}.html" class="prev">
                <span class="nav-label">← Previous</span>
                <span class="nav-title">${escapeHtml(content.prevTitle || '上一篇')}</span>
            </a>`
      : '';
    const nextHtml = content.nextSlug
      ? `<a href="/posts/${content.nextSlug}.html" class="next">
                <span class="nav-label">Next →</span>
                <span class="nav-title">${escapeHtml(content.nextTitle || '下一篇')}</span>
            </a>`
      : '';
    postNav = `<div class="post-nav">
            ${prevHtml}
            ${nextHtml}
        </div>`;
  }

  let html = template;
  const replacements = {
    '{{TITLE}}': escapeHtml(content.title),
    '{{DESCRIPTION}}': escapeHtml(content.description || content.subtitle || ''),
    '{{URL}}': pageUrl,
    '{{OG_IMAGE}}': ogImage,
    '{{PUBLISHED_TIME}}': escapeHtml(content.publishedTime || content.date || ''),
    '{{CATEGORY}}': escapeHtml(content.category || ''),
    '{{DATE}}': escapeHtml(content.date || ''),
    '{{SUBTITLE}}': escapeHtml(content.subtitle || ''),
    '{{READ_TIME}}': escapeHtml(content.readTime || ''),
    '{{VIEWS}}': escapeHtml(content.views || ''),
    '{{CONTENT}}': content.body || '',
    '{{FOOTNOTES}}': content.footnotes || '',
    '{{TAGS}}': renderTags(content.tags),
    '{{POST_NAV}}': postNav,
    '{{PREV_URL}}': prevUrl,
    '{{PREV_TITLE}}': escapeHtml(content.prevTitle || '上一篇'),
    '{{NEXT_URL}}': nextUrl,
    '{{NEXT_TITLE}}': escapeHtml(content.nextTitle || '下一篇'),
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(key).join(value);
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API: list articles
    if (path === '/api/articles') {
      const res = await env.ASSETS.fetch(new URL('/data/articles.json', request.url));
      const headers = new Headers(res.headers);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(res.body, { status: res.status, headers });
    }

    // Dynamic article pages
    const articleMatch = path.match(/^\/posts\/(.+?)(?:\.html)?$/);
    if (articleMatch) {
      const slug = articleMatch[1];
      const rendered = await renderArticle(slug, request, env);
      if (rendered) return rendered;

      // Content not found -> fall through to 404
      const notFound = await env.ASSETS.fetch(new URL('/404.html', request.url));
      return new Response(notFound.body, { status: 404, headers: notFound.headers });
    }

    // Static assets
    if (isStaticAsset(path)) {
      return env.ASSETS.fetch(request);
    }

    // Everything else -> 404
    const notFound = await env.ASSETS.fetch(new URL('/404.html', request.url));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};
