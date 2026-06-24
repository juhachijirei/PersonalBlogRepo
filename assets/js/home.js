/**
 * Homepage logic:
 * - Fetch article metadata from /api/articles (served by Cloudflare Worker)
 * - Render paginated article list
 * - Hero fade behavior on scroll
 *
 * Falls back to /data/articles.json for local static preview without Worker.
 */
(function () {
    const ARTICLES_SOURCE = '/api/articles';
    const ITEMS_PER_PAGE = 6;

    let articles = [];
    let currentPage = 1;

    function renderArticles(page) {
        const list = document.getElementById('articleList');
        const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageArticles = articles.slice(start, end);

        list.innerHTML = pageArticles.map(article => `
            <article class="article-item reveal">
                <a href="/posts/${article.slug}.html" aria-label="${article.title}">
                    <div class="article-meta">
                        <span class="category">${article.category}</span>
                        <span>${article.date}</span>
                    </div>
                    <h2 class="article-title">${article.title}</h2>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <div class="article-footer">
                        <span>${article.readTime}</span>
                        <span>·</span>
                        <span>${article.views} views</span>
                    </div>
                </a>
            </article>
        `).join('');

        // Re-observe newly injected reveal elements
        document.querySelectorAll('.reveal').forEach(el => {
            if (!el.classList.contains('active')) {
                if (window.__revealObserver) window.__revealObserver.observe(el);
            }
        });

        updatePagination(totalPages);
    }

    function updatePagination(totalPages) {
        const pageIndicator = document.getElementById('pageIndicator');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (pageIndicator) pageIndicator.textContent = `${currentPage} / ${totalPages}`;
        if (prevBtn) prevBtn.classList.toggle('disabled', currentPage === 1);
        if (nextBtn) nextBtn.classList.toggle('disabled', currentPage === totalPages || totalPages === 0);
    }

    function bindPagination() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderArticles(currentPage);
                    document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderArticles(currentPage);
                    document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    function initHero() {
        const hero = document.getElementById('hero');
        if (!hero) return;

        let heroHeight = hero.offsetHeight;
        let ticking = false;

        function updateHero() {
            const scrollY = window.scrollY;
            if (scrollY > heroHeight * 0.5) {
                hero.classList.add('hidden');
            } else {
                hero.classList.remove('hidden');
            }
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateHero);
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', () => {
            heroHeight = hero.offsetHeight;
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        initHero();

        try {
            let response = await fetch(ARTICLES_SOURCE);
            // Fallback for local static preview without Worker
            if (!response.ok) {
                response = await fetch('/data/articles.json');
            }
            if (!response.ok) throw new Error('Failed to load articles');
            articles = await response.json();
        } catch (err) {
            console.error('Could not load articles:', err);
            articles = [];
        }

        // Update hero stats if elements exist
        const statCount = document.getElementById('statCount');
        if (statCount) statCount.textContent = articles.length;

        renderArticles(currentPage);
        bindPagination();
    });
})();
