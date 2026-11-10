/* ═══════════════════════════════════════════════════════════
   INTRO SECTION - CONTROLLER
   Cinematic Amazon-style Search, Results Page & Transition
   ═══════════════════════════════════════════════════════════ */
window.IntroSystem = (() => {
    const SEARCH_TEXT = 'systems architect';
    const SUGGESTIONS = [
        'systems architect for scalable applications',
        'systems architect · ai & full stack systems',
        'systems architect automation & cybersecurity'
    ];

    let typingTimeout = null;

    const init = () => {
        startIntro();
    };

    /* ── Progress Bar ── */
    const initProgressBar = () => {
        const bar = document.getElementById('intro-progress');
        if (!bar) return;
        bar.style.display = 'block';
        const setP = (p, dur = 300) => {
            bar.style.transition = `width ${dur}ms var(--ease-out)`;
            bar.style.width = p + '%';
        };
        setTimeout(() => setP(25, 300), 100);
        setTimeout(() => setP(60, 300), 600);
        setTimeout(() => setP(85, 300), 1300);
        setTimeout(() => setP(95, 200), 2000);
        setTimeout(() => {
            setP(100, 200);
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => { bar.style.display = 'none'; }, 300);
            }, 300);
        }, 2600);
    };

    /* ── Smooth Bézier Glide ── */
    const glideGhostCursor = (x0, y0, x1, y1, duration, cpOffsetX = 0, cpOffsetY = -80) => {
        return new Promise(resolve => {
            const dot = document.getElementById('cursor-dot');
            const ring = document.getElementById('cursor-ring');
            const cpX = (x0 + x1) / 2 + cpOffsetX;
            const cpY = Math.min(y0, y1) + cpOffsetY;
            const t0 = performance.now();

            const step = now => {
                if (window.AppState.introSkipped) {
                    resolve();
                    return;
                }
                const raw = Math.min((now - t0) / duration, 1);
                // Cubic ease-in-out
                const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
                const u = 1 - t;
                // Quadratic Bézier
                window.AppState.ghostX = u * u * x0 + 2 * u * t * cpX + t * t * x1;
                window.AppState.ghostY = u * u * y0 + 2 * u * t * cpY + t * t * y1;

                const transformStr = `translate3d(${window.AppState.ghostX}px, ${window.AppState.ghostY}px, 0) translate(-50%, -50%)`;
                if (dot) dot.style.transform = transformStr;
                if (ring) ring.style.transform = transformStr;

                if (raw < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    };

    /* ── Ghost Click Animation ── */
    const clickGhost = (dot) => {
        return new Promise(resolve => {
            document.body.classList.add('cursor-click');
            if (dot) {
                dot.style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)';
                dot.style.transform = `translate3d(${window.AppState.ghostX}px, ${window.AppState.ghostY}px, 0) translate(-50%, -50%) scale(2.4)`;
            }
            setTimeout(() => {
                if (dot) dot.style.transform = `translate3d(${window.AppState.ghostX}px, ${window.AppState.ghostY}px, 0) translate(-50%, -50%) scale(1)`;
                document.body.classList.remove('cursor-click');
                setTimeout(resolve, 100);
            }, 120);
        });
    };

    /* ── Start Intro Sequence ── */
    const startIntro = () => {
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn) {
            skipBtn.style.display = 'flex';
            skipBtn.style.opacity = '';
            skipBtn.style.pointerEvents = '';
        }
        document.documentElement.setAttribute('data-theme', window.AppState.theme);

        // Allow pressing Escape or Space anywhere to skip intro immediately
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Escape' || e.code === 'Escape') && !window.AppState.introDone) {
                skipIntro();
            }
        }, { once: false });

        if (sessionStorage.getItem('intro-played')) {
            skipIntro();
            return;
        }

        initProgressBar();
        // Phase 1: cinematic cursor appears smoothly without delay
        setTimeout(cursorToSearchBar, 120);
    };

    /* ── PHASE 1: Cursor to Central Search Bar ── */
    const cursorToSearchBar = () => {
        if (window.AppState.introSkipped || window.AppState.introDone) return;

        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        const csWrap = document.getElementById('cs-wrap');
        if (!csWrap) {
            runTyping();
            return;
        }

        const rect = csWrap.getBoundingClientRect();
        const targetX = rect.left + rect.width * 0.42;
        const targetY = rect.top + rect.height * 0.5;

        // Start cursor at top-left region, make it visible
        const startX = window.innerWidth * 0.18;
        const startY = window.innerHeight * 0.22;

        window.AppState.ghostMode = true;
        window.AppState.ghostX = startX;
        window.AppState.ghostY = startY;

        const startTransform = `translate3d(${startX}px, ${startY}px, 0) translate(-50%, -50%)`;
        if (dot) {
            dot.style.display = 'block';
            dot.style.transform = startTransform;
        }
        if (ring) {
            ring.style.display = 'block';
            ring.style.transform = startTransform;
        }

        // Fade cursor in
        requestAnimationFrame(() => {
            if (dot) dot.classList.add('active');
            if (ring) ring.classList.add('active');
        });

        // Brief idle so user sees cursor materialise
        setTimeout(async () => {
            if (window.AppState.introSkipped) return;

            // Glide to search bar
            await glideGhostCursor(startX, startY, targetX, targetY, 650, 30, -50);

            // Hover over search bar — ring expands
            document.body.classList.add('cursor-hover');
            window.AppState.ghostX = targetX;
            window.AppState.ghostY = targetY;
            const targetTransform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
            if (dot) dot.style.transform = targetTransform;
            if (ring) ring.style.transform = targetTransform;

            // Brief pause on search bar
            await new Promise(r => setTimeout(r, 220));
            if (window.AppState.introSkipped) return;

            // Click animation
            await clickGhost(dot);

            document.body.classList.remove('cursor-hover');

            // Glow the search input
            const inp = document.getElementById('cs-input');
            if (inp) inp.classList.add('focused');

            // Wait briefly, then start typing
            await new Promise(r => setTimeout(r, 140));
            if (!window.AppState.introSkipped) runTyping();
        }, 180);
    };

    /* ── PHASE 2: Typewriter Effect ── */
    const runTyping = () => {
        if (window.AppState.introSkipped) return;

        const input = document.getElementById('cs-input');
        const sugg = document.getElementById('suggestions');
        let charIdx = 0;

        const typeChar = () => {
            if (window.AppState.introSkipped) return;
            if (charIdx <= SEARCH_TEXT.length) {
                if (input) input.value = SEARCH_TEXT.slice(0, charIdx);
                charIdx++;
                if (charIdx === 8 && sugg) sugg.classList.add('visible');
                typingTimeout = setTimeout(typeChar, 34 + Math.random() * 25);
            } else {
                typingTimeout = setTimeout(triggerSearch, 220);
            }
        };
        typeChar();
    };

    /* ── PHASE 3: Enter Search & Transition to Skeleton ── */
    const triggerSearch = async () => {
        if (window.AppState.introSkipped) return;

        const dot = document.getElementById('cursor-dot');
        const inp = document.getElementById('cs-input');
        const sugg = document.getElementById('suggestions');
        const csWrap = document.getElementById('cs-wrap');
        if (!csWrap) return;

        const rect = csWrap.getBoundingClientRect();
        const btnX = rect.right - 28;
        const btnY = rect.top + rect.height * 0.5;

        await glideGhostCursor(window.AppState.ghostX, window.AppState.ghostY, btnX, btnY, 320, 0, 0);
        document.body.classList.add('cursor-hover');
        await new Promise(r => setTimeout(r, 120));
        await clickGhost(dot);
        document.body.classList.remove('cursor-hover');

        // Flash input (Enter key feel)
        if (inp) {
            inp.style.background = 'rgba(61,139,255,0.1)';
            setTimeout(() => { inp.style.background = ''; }, 120);
        }
        if (sugg) sugg.classList.remove('visible');

        // Fade intro overlay out
        const intro = document.getElementById('intro-overlay');
        if (intro) {
            intro.style.transition = 'opacity 0.35s cubic-bezier(0.23,1,0.32,1)';
            intro.style.opacity = '0';
            setTimeout(() => { intro.style.display = 'none'; }, 360);
        }

        // Show skeleton screen
        const skel = document.getElementById('skeleton-screen');
        if (skel) {
            skel.style.display = 'flex';
            skel.style.opacity = '0';
            skel.style.transition = 'opacity 0.25s';
            requestAnimationFrame(() => { skel.style.opacity = '1'; });
        }

        setTimeout(showResults, 550);
    };

    /* ── PHASE 4: Search Results Revealed ── */
    const showResults = () => {
        if (window.AppState.introSkipped) return;

        const skel = document.getElementById('skeleton-screen');
        const results = document.getElementById('results-page');
        const skip = document.getElementById('skip-btn');

        if (skel) {
            skel.style.opacity = '0';
            setTimeout(() => { skel.style.display = 'none'; }, 250);
        }

        if (results) {
            results.style.display = 'flex';
            results.style.opacity = '0';
            results.style.transition = 'opacity 0.4s cubic-bezier(0.23,1,0.32,1)';
            requestAnimationFrame(() => { results.style.opacity = '1'; });
        }

        setTimeout(animateHeroCardStars, 150);
        setTimeout(animateReviewCounter, 250);
        // After counter finishes, cursor glides to Akshay's card
        setTimeout(autoCursorToCard, 700);

        // Safety watchdog: ensure intro never gets stuck indefinitely
        setTimeout(() => {
            if (!window.AppState.introDone && !window.AppState.introSkipped) {
                clickAkshayCard(null);
            }
        }, 3200);

        if (skip) skip.style.display = 'flex';
    };

    /* ── Star fill animation ── */
    const animateHeroCardStars = () => {
        if (window.AppState.introSkipped) return;
        document.querySelectorAll('#hero-stars .star-svg').forEach((star, i) => {
            setTimeout(() => {
                if (window.AppState.introSkipped) return;
                star.classList.remove('star-empty');
                star.classList.add('star-full');
                star.style.transition = 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), color 0.15s';
                star.style.transform = 'scale(1.4)';
                setTimeout(() => { star.style.transform = 'scale(1)'; }, 180);
            }, i * 50);
        });
    };

    /* ── Counter animation ── */
    const animateReviewCounter = () => {
        if (window.AppState.introSkipped) return;
        const el = document.getElementById('review-counter');
        if (!el) return;

        let count = 0;
        const target = 1e9;
        const duration = 650;
        const start = performance.now();

        const formatNum = n => {
            if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B+';
            if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M+';
            return n.toLocaleString();
        };

        const step = now => {
            if (window.AppState.introSkipped) return;
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4); // ease-out quart
            count = Math.floor(ease * target);
            el.textContent = formatNum(count) + ' Global Trust Signals';
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    /* ── PHASE 5: Auto-Cursor to Akshay's Card ── */
    const autoCursorToCard = async () => {
        if (window.AppState.introSkipped || window.AppState.introDone) return;

        const card = document.getElementById('akshay-card');
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (!card) {
            if (!window.AppState.introDone && !window.AppState.introSkipped) {
                clickAkshayCard(null);
            }
            return;
        }

        try {
            // Target: center of the "View Full Profile" button on the card
            const getTarget = () => {
                const r = card.getBoundingClientRect();
                return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.80 };
            };

            const startX = window.AppState.ghostX || (window.innerWidth * 0.5);
            const startY = window.AppState.ghostY || (window.innerHeight * 0.5);
            const tgt = getTarget();

            // Glide: organic arc from search bar → card
            const cpOffX = (tgt.x - startX) * -0.12;
            await glideGhostCursor(startX, startY, tgt.x, tgt.y, 680, cpOffX, -70);
            if (window.AppState.introSkipped || window.AppState.introDone) return;

            // Hover: ring expands, card lifts with glow
            document.body.classList.add('cursor-hover');
            card.classList.add('auto-hover');
            window.AppState.ghostX = tgt.x;
            window.AppState.ghostY = tgt.y;
            const tgtTransform = `translate3d(${tgt.x}px, ${tgt.y}px, 0) translate(-50%, -50%)`;
            if (dot) dot.style.transform = tgtTransform;
            if (ring) ring.style.transform = tgtTransform;

            // Hover linger — user sees the full card glow
            await new Promise(r => setTimeout(r, 350));
            if (window.AppState.introSkipped || window.AppState.introDone) return;

            // Subtle cursor micro-wiggle
            const wx = tgt.x + 3, wy = tgt.y + 2;
            await glideGhostCursor(tgt.x, tgt.y, wx, wy, 100, 0, 0);
            await new Promise(r => setTimeout(r, 60));
            if (window.AppState.introSkipped || window.AppState.introDone) return;

            await glideGhostCursor(wx, wy, tgt.x, tgt.y, 90, 0, 0);
            await new Promise(r => setTimeout(r, 90));
            if (window.AppState.introSkipped || window.AppState.introDone) return;

            // Click
            document.body.classList.remove('cursor-hover');
            card.style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s';
            card.style.transform = 'translateY(-2px) scale(0.984)';

            if (dot) await clickGhost(dot);
        } catch (err) {
            console.warn('[Intro] autoCursorToCard error:', err);
        } finally {
            if (card) {
                card.classList.remove('auto-hover');
                card.style.transform = '';
            }
            document.body.classList.remove('cursor-hover');
            window.AppState.ghostMode = false; // hand cursor control back to real mouse

            // Fire the morph transition → portfolio
            if (!window.AppState.introDone && !window.AppState.introSkipped) {
                clickAkshayCard(null);
            }
        }
    };

    /* ── PHASE 6: Card Click → Expand Circle Morph Transition ── */
    const clickAkshayCard = (e) => {
        if (window.AppState.introDone) return;
        window.AppState.introDone = true;

        const card = document.getElementById('akshay-card');
        const layer = document.getElementById('transition-layer');
        const results = document.getElementById('results-page');
        const skip = document.getElementById('skip-btn');
        const bar = document.getElementById('intro-progress');

        // Cleanup hover/cursor states immediately
        if (card) {
            card.classList.remove('auto-hover');
            card.style.transform = '';
        }
        document.body.classList.remove('cursor-hover', 'cursor-click');
        window.AppState.ghostMode = false;

        // Hide skip button & progress bar as intro transitions to portfolio
        if (skip) {
            skip.style.opacity = '0';
            skip.style.pointerEvents = 'none';
            setTimeout(() => { skip.style.display = 'none'; }, 220);
        }
        if (bar) {
            bar.style.opacity = '0';
            setTimeout(() => { bar.style.display = 'none'; }, 220);
        }

        if (!card || !layer) {
            revealPortfolio();
            return;
        }

        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxR = Math.hypot(
            Math.max(cx, window.innerWidth - cx),
            Math.max(cy, window.innerHeight - cy)
        ) * 2;

        // Create expanding circle from card center
        const circle = document.createElement('div');
        circle.className = 'expand-circle';
        circle.style.cssText = `
            width:  ${maxR * 2}px;
            height: ${maxR * 2}px;
            left:   ${cx - maxR}px;
            top:    ${cy - maxR}px;
        `;
        layer.appendChild(circle);

        // Slight page dim first
        if (results) {
            results.style.transition = 'filter 0.3s, opacity 0.3s';
            results.style.filter = 'blur(3px)';
            results.style.opacity = '0.7';
        }

        // Trigger circle expansion
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                circle.style.transform = 'scale(1)';
            });
        });

        // After circle covers screen, reveal portfolio
        setTimeout(() => {
            if (results) results.style.display = 'none';
            revealPortfolio();

            // Remove circle, clean transition layer
            setTimeout(() => {
                circle.style.opacity = '0';
                setTimeout(() => {
                    circle.remove();
                    layer.innerHTML = '';
                }, 300);
            }, 400);
        }, 550);

        sessionStorage.setItem('intro-played', '1');
        window.AppState.introPlayed = true;
    };

    /* ── Reveal Main Portfolio & Subsystems ── */
    const revealPortfolio = () => {
        const portfolio = document.getElementById('portfolio');
        const canvas = document.getElementById('three-canvas');
        const panel = document.getElementById('control-panel');
        const skip = document.getElementById('skip-btn');
        const bar = document.getElementById('intro-progress');
        const overlay = document.getElementById('intro-overlay');
        const skeleton = document.getElementById('skeleton-screen');
        const results = document.getElementById('results-page');

        // Ensure all intro-related overlays and buttons are hidden
        if (skip) {
            skip.style.display = 'none';
            skip.style.opacity = '';
            skip.style.pointerEvents = '';
        }
        if (bar) {
            bar.style.display = 'none';
            bar.style.opacity = '0';
        }
        if (overlay) overlay.style.display = 'none';
        if (skeleton) skeleton.style.display = 'none';
        if (results) results.style.display = 'none';

        if (portfolio) {
            portfolio.style.display = 'block';
            portfolio.style.opacity = '0';
            portfolio.style.transition = 'opacity 0.9s cubic-bezier(0.23,1,0.32,1) 0.1s';

            requestAnimationFrame(() => {
                portfolio.style.opacity = '1';
                if (canvas) canvas.classList.add('visible');
            });
        }

        // Cursor: hide ghost cursor, real native mouse takes over with zero load
        window.AppState.ghostMode = false;
        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (dot) {
            dot.classList.remove('active');
            dot.style.display = 'none';
        }
        if (ring) {
            ring.classList.remove('active');
            ring.style.display = 'none';
        }
        document.body.classList.remove('cursor-hover', 'cursor-click');

        // Show control panel
        if (panel) setTimeout(() => { panel.classList.add('visible'); }, 1200);

        // Animate hero text in
        setTimeout(() => {
            const eyebrow = document.getElementById('h-eyebrow');
            const name = document.getElementById('h-name');
            const subtitle = document.getElementById('h-subtitle');
            const roles = document.getElementById('h-roles');
            const ctas = document.getElementById('h-ctas');

            if (eyebrow) eyebrow.classList.add('revealed');
            if (name) setTimeout(() => name.classList.add('revealed'), 200);
            if (subtitle) setTimeout(() => subtitle.classList.add('revealed'), 450);
            if (roles) setTimeout(() => roles.classList.add('revealed'), 650);
            if (ctas) setTimeout(() => ctas.classList.add('revealed'), 800);
        }, 400);

        // Boot interactive observers across sections
        if (window.ScrollEngine && window.ScrollEngine.init) window.ScrollEngine.init();
        if (window.GlowEffects && window.GlowEffects.init) window.GlowEffects.init();
        if (window.TechnicalArsenalSystem && window.TechnicalArsenalSystem.init) window.TechnicalArsenalSystem.init();
        if (window.ProjectPortfolioSystem && window.ProjectPortfolioSystem.init) window.ProjectPortfolioSystem.init();
        if (window.ExperienceSystem && window.ExperienceSystem.init) window.ExperienceSystem.init();
        if (window.ClientReviewSystem && window.ClientReviewSystem.init) window.ClientReviewSystem.init();
    };

    /* ── Skip Intro ── */
    const skipIntro = () => {
        window.AppState.introSkipped = true;
        window.AppState.introDone = true;
        window.AppState.ghostMode = false;
        if (typingTimeout) clearTimeout(typingTimeout);

        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (dot) {
            dot.classList.remove('active');
            dot.style.display = 'none';
        }
        if (ring) {
            ring.classList.remove('active');
            ring.style.display = 'none';
        }
        document.body.classList.remove('cursor-hover', 'cursor-click');

        const overlay = document.getElementById('intro-overlay');
        const skeleton = document.getElementById('skeleton-screen');
        const results = document.getElementById('results-page');
        const skip = document.getElementById('skip-btn');
        const bar = document.getElementById('intro-progress');

        if (overlay) overlay.style.display = 'none';
        if (skeleton) skeleton.style.display = 'none';
        if (results) results.style.display = 'none';
        if (skip) {
            skip.style.display = 'none';
            skip.style.opacity = '';
            skip.style.pointerEvents = '';
        }
        if (bar) {
            bar.style.display = 'none';
            bar.style.opacity = '0';
        }

        revealPortfolio();
        sessionStorage.setItem('intro-played', '1');
        window.AppState.introPlayed = true;
    };

    /* ── Replay Intro ── */
    const replayIntro = () => {
        sessionStorage.removeItem('intro-played');
        window.AppState.introPlayed = false;
        window.AppState.introSkipped = false;
        window.AppState.introDone = false;

        const portfolio = document.getElementById('portfolio');
        const canvas = document.getElementById('three-canvas');
        const panel = document.getElementById('control-panel');
        const intro = document.getElementById('intro-overlay');
        const skipBtn = document.getElementById('skip-btn');
        const bar = document.getElementById('intro-progress');
        const skeleton = document.getElementById('skeleton-screen');
        const results = document.getElementById('results-page');

        if (portfolio) portfolio.style.display = 'none';
        if (canvas) canvas.classList.remove('visible');
        if (panel) panel.classList.remove('visible');
        if (skeleton) skeleton.style.display = 'none';
        if (results) results.style.display = 'none';

        // Reset intro input & suggestions
        const csInput = document.getElementById('cs-input');
        if (csInput) {
            csInput.value = '';
            csInput.classList.remove('focused');
        }
        const sugg = document.getElementById('suggestions');
        if (sugg) sugg.classList.remove('visible');

        // Reset progress bar
        if (bar) {
            bar.style.display = 'block';
            bar.style.opacity = '1';
            bar.style.width = '0%';
        }

        // Show intro overlay
        if (intro) {
            intro.style.display = 'flex';
            intro.style.opacity = '0';
            intro.style.transition = 'opacity 0.5s';
            requestAnimationFrame(() => { intro.style.opacity = '1'; });
        }
        if (skipBtn) {
            skipBtn.style.display = 'flex';
            skipBtn.style.opacity = '';
            skipBtn.style.pointerEvents = '';
        }

        // Reset ghost cursor state
        window.AppState.ghostMode = false;
        window.AppState.ghostX = window.innerWidth / 2;
        window.AppState.ghostY = window.innerHeight / 2;

        const dot = document.getElementById('cursor-dot');
        const ring = document.getElementById('cursor-ring');
        if (dot && ring) {
            dot.classList.remove('active');
            ring.classList.remove('active');
            dot.style.display = 'none';
            ring.style.display = 'none';
        }
        document.body.classList.remove('cursor-hover', 'cursor-click');

        // Restart full sequence
        setTimeout(() => cursorToSearchBar(), 1200);
    };

    return {
        init,
        startIntro,
        skipIntro,
        replayIntro,
        clickAkshayCard,
        revealPortfolio
    };
})();
