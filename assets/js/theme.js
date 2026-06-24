/**
 * Theme toggle logic.
 * Reads/writes the preferred theme from localStorage and the data-theme attribute.
 */
(function () {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme');

    function applyTheme(theme) {
        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else {
            html.removeAttribute('data-theme');
        }
    }

    if (savedTheme) {
        applyTheme(savedTheme);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('theme', next);
        });
    });
})();
