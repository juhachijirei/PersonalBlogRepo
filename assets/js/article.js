/**
 * Article page logic:
 * - Reading progress bar
 * - Reveal animations (uses common observer if available)
 */
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            window.addEventListener('scroll', () => {
                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                progressBar.style.width = progress + '%';
            }, { passive: true });
        }

        if (window.__revealObserver) {
            document.querySelectorAll('.reveal').forEach(el => window.__revealObserver.observe(el));
        }
    });
})();
