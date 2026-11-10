/* ═══════════════════════════════════════════════════════════
   HEADER SECTION - CONTROLLER
   Navbar, Scroll Progress, & Section Dots
   ═══════════════════════════════════════════════════════════ */
window.HeaderSystem = (() => {
    const init = () => {
        initScrollProgress();
        initNavScroll();
    };

    const initScrollProgress = () => {
        const fill = document.getElementById('scroll-progress-fill');
        const dots = document.getElementById('section-dots');
        const nav = document.getElementById('port-nav');
        const sectionIds = ['hero', 'about', 'skills', 'projects', 'experience', 'credentials', 'reviews', 'contact'];

        let maxScroll = 1;
        let cachedItems = [];

        const updateMetrics = () => {
            maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            cachedItems = sectionIds.map(id => {
                const el = document.getElementById(id);
                const dot = dots ? dots.querySelector(`[data-target="${id}"]`) : null;
                return {
                    id,
                    el,
                    dot,
                    top: el ? (el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0)) : 0,
                    height: el ? el.offsetHeight : 0
                };
            }).filter(item => item.el !== null);
        };

        const updateProgress = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            const scrollPercent = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
            if (fill) fill.style.width = scrollPercent + '%';

            if (nav) {
                if (scrollY > 80) nav.classList.add('scrolled');
                else nav.classList.remove('scrolled');
            }

            // Active dot with cached offsets — ZERO synchronous DOM reflow
            const scrollPos = scrollY + window.innerHeight * 0.35;
            for (let i = 0; i < cachedItems.length; i++) {
                const item = cachedItems[i];
                if (item.dot) {
                    if (scrollPos >= item.top && scrollPos < item.top + item.height) {
                        item.dot.classList.add('active');
                    } else {
                        item.dot.classList.remove('active');
                    }
                }
            }
        };

        let tick = false;
        const onScroll = () => {
            if (!tick) {
                tick = true;
                requestAnimationFrame(() => {
                    updateProgress();
                    tick = false;
                });
            }
        };

        updateMetrics();
        window.addEventListener('resize', () => {
            updateMetrics();
            updateProgress();
        }, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });

        // Update cached metrics once fonts & dynamic images settle
        setTimeout(updateMetrics, 600);
        setTimeout(updateMetrics, 1800);
        updateProgress();
    };

    const initNavScroll = () => {
        // Handled in unified RAF onScroll loop above
    };

    const scrollToSection = (id) => {
        if (window.ScrollEngine && window.ScrollEngine.scrollTo) {
            window.ScrollEngine.scrollTo(id, -70);
        } else {
            const el = document.getElementById(id);
            if (el) {
                const y = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - 70;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
        }
    };

    return {
        init,
        scrollToSection
    };
})();
