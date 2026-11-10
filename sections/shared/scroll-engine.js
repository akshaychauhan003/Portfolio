/* ═══════════════════════════════════════════════════════════
   SCROLL ENGINE - ULTRA-SMOOTH MOMENTUM & REVEAL CONTROLLER
   - High-performance IntersectionObserver with auto-unobserve
   - Butter-smooth wheel momentum interpolation (60/120Hz)
   - Layout-thrash-free scroll metrics cache
   - Zero-conflict pass-through for native trackpad gestures
   ═══════════════════════════════════════════════════════════ */
window.ScrollEngine = (() => {
    let observer = null;
    let isInitialized = false;

    // Smooth momentum wheel state
    let targetY = window.pageYOffset || 0;
    let currentY = targetY;
    let isMoving = false;
    let rafId = null;
    let maxScroll = 1;

    const prefersReducedMotion = () => {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    const updateMaxScroll = () => {
        maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0
        );
    };

    // Smooth physics loop
    const smoothStep = () => {
        if (!isMoving) return;
        const diff = targetY - currentY;

        // Snap when very close to target to prevent perpetual sub-pixel drifting
        if (Math.abs(diff) < 0.6) {
            currentY = targetY;
            window.scrollTo(0, currentY);
            isMoving = false;
            return;
        }

        // Fluid spring lerp: 14% step per frame (~60-120fps)
        currentY += diff * 0.14;
        window.scrollTo(0, Math.round(currentY));
        rafId = requestAnimationFrame(smoothStep);
    };

    const onWheel = (e) => {
        // 1. Never intercept scrolling inside inner scrollable containers (experience track, modal, inputs)
        const path = e.composedPath ? e.composedPath() : [];
        for (let i = 0; i < path.length; i++) {
            const el = path[i];
            if (el === document.body || el === document.documentElement) break;
            if (el && el.nodeType === 1) {
                const style = window.getComputedStyle(el);
                const hasVScroll = el.scrollHeight > el.clientHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll');
                const hasHScroll = el.scrollWidth > el.clientWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll');
                if (hasVScroll || hasHScroll) {
                    return;
                }
            }
        }

        if (prefersReducedMotion()) return;

        // 2. Distinguish mouse wheel clicks (stepped delta >= 40 or deltaMode != 0)
        // from continuous high-precision trackpads (smooth fractional deltas)
        const isDiscreteWheel = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 40 || (e.deltaY % 1 === 0 && Math.abs(e.deltaY) >= 20);

        if (isDiscreteWheel) {
            e.preventDefault();
            updateMaxScroll();
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
            if (!isMoving) {
                targetY = currentScroll;
                currentY = currentScroll;
            }

            // Normalize delta
            const multiplier = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? window.innerHeight : 1);
            const delta = e.deltaY * multiplier;
            targetY = Math.min(Math.max(targetY + delta, 0), maxScroll);

            if (!isMoving) {
                isMoving = true;
                rafId = requestAnimationFrame(smoothStep);
            }
        } else {
            // Trackpad scroll: keep target in lockstep with native momentum
            targetY = window.pageYOffset || document.documentElement.scrollTop || 0;
            currentY = targetY;
            if (isMoving) {
                isMoving = false;
                if (rafId) cancelAnimationFrame(rafId);
            }
        }
    };

    const initRevealObserver = () => {
        if (!observer) {
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Unobserve to free up GPU and CPU observation overhead
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.08,
                rootMargin: '0px 0px -40px 0px'
            });
        }

        const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        reveals.forEach(r => {
            if (!r.classList.contains('visible')) {
                observer.observe(r);
            }
        });
    };

    const init = () => {
        initRevealObserver();

        if (isInitialized) return;
        isInitialized = true;

        updateMaxScroll();

        // Listen for wheel events with non-passive listener to smooth out discrete mouse wheels
        window.addEventListener('wheel', onWheel, { passive: false });

        // Cancel smooth interpolation on touch or native gesture interaction
        window.addEventListener('touchstart', () => {
            if (isMoving) {
                isMoving = false;
                if (rafId) cancelAnimationFrame(rafId);
            }
            targetY = window.pageYOffset;
            currentY = targetY;
        }, { passive: true });

        // Update boundaries on resize
        window.addEventListener('resize', updateMaxScroll, { passive: true });

        // Support keyboard scrolling with smooth interpolation
        window.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            const keyDistances = {
                PageDown: window.innerHeight * 0.82,
                PageUp: -window.innerHeight * 0.82,
                Space: e.shiftKey ? -window.innerHeight * 0.75 : window.innerHeight * 0.75,
                ArrowDown: 110,
                ArrowUp: -110
            };
            if (keyDistances[e.code] !== undefined) {
                e.preventDefault();
                updateMaxScroll();
                const currentScroll = window.pageYOffset;
                if (!isMoving) {
                    targetY = currentScroll;
                    currentY = currentScroll;
                }
                targetY = Math.min(Math.max(targetY + keyDistances[e.code], 0), maxScroll);
                if (!isMoving) {
                    isMoving = true;
                    rafId = requestAnimationFrame(smoothStep);
                }
            }
        });
    };

    const observe = (targets) => {
        if (!observer) init();
        if (!targets) return;
        if (targets.nodeType) {
            observer.observe(targets);
        } else if (targets.forEach) {
            targets.forEach(t => observer.observe(t));
        }
    };

    const scrollTo = (target, offset = 0) => {
        let el = typeof target === 'string' ? document.getElementById(target) : target;
        if (!el) return;
        updateMaxScroll();
        const rect = el.getBoundingClientRect();
        const top = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0) + offset;
        targetY = Math.min(Math.max(top, 0), maxScroll);
        currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (!isMoving) {
            isMoving = true;
            rafId = requestAnimationFrame(smoothStep);
        }
    };

    const refresh = () => {
        updateMaxScroll();
        initRevealObserver();
    };

    return {
        init,
        observe,
        scrollTo,
        refresh
    };
})();
