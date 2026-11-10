/**
 * ════════════════════════════════════════════════════════════════
 * ARCHITECT CONSOLE — MOBILE ADMIN DASHBOARD CONTROLLER
 * ════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // State
    const state = {
        activeTab: 'messages',
        messages: [],
        reviews: [],
        experiences: [],
        projects: [],
        unreadCount: 0,
        pendingReviewCount: 0,
        installPrompt: null,
        // Tech stack, In-App Video & Color System State
        selectedTechStack: [],
        selectedCardColor: '#3d8bff',
        currentProjectId: null,
        activeColorTab: 'themes',
        isUnlocked: false,
        expFilter: 'all'
    };

    // DOM Elements
    const elements = {
        syncDot: document.getElementById('sync-status-dot'),
        syncText: document.getElementById('sync-status-text'),
        notifBadge: document.getElementById('notif-badge'),
        notifBar: document.getElementById('notif-permission-bar'),
        enableNotifsBtn: document.getElementById('enable-notifs-btn'),
        navInboxBadge: document.getElementById('nav-inbox-badge'),
        navReviewsBadge: document.getElementById('nav-reviews-badge'),
        messagesContainer: document.getElementById('messages-container'),
        pendingReviewsContainer: document.getElementById('pending-reviews-container'),
        approvedReviewsContainer: document.getElementById('approved-reviews-container'),
        pendingReviewsCount: document.getElementById('pending-reviews-count'),
        approvedReviewsCount: document.getElementById('approved-reviews-count'),
        experiencesContainer: document.getElementById('experiences-container'),
        projectsContainer: document.getElementById('projects-container'),
        toast: document.getElementById('dash-toast'),

        // Modals & Forms
        settingsModal: document.getElementById('settings-modal'),
        settingsForm: document.getElementById('settings-form'),
        expModal: document.getElementById('exp-modal'),
        expForm: document.getElementById('exp-form'),
        projModal: document.getElementById('proj-modal'),
        projForm: document.getElementById('proj-form'),
        projOrder: document.getElementById('proj-order'),
        refreshProjBtn: document.getElementById('refresh-proj-btn'),

        // Security & Auth Lock Elements
        authLockOverlay: document.getElementById('auth-lock-overlay'),
        lockBtn: document.getElementById('lock-btn'),
        lockPinForm: document.getElementById('lock-pin-form'),
        lockPinInput: document.getElementById('lock-pin-input'),
        lockCloudForm: document.getElementById('lock-cloud-form'),
        lockEmailInput: document.getElementById('lock-email-input'),
        lockPasswordInput: document.getElementById('lock-password-input'),
        modePinBtn: document.getElementById('mode-pin-btn'),
        modeCloudBtn: document.getElementById('mode-cloud-btn'),
        lockErrorText: document.getElementById('lock-error-text'),
        cfgAdminPin: document.getElementById('cfg-admin-pin'),
    };

    // Audio chime for new notifications
    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch {}
    };

    // Show Toast
    const showToast = (message) => {
        if (!elements.toast) return;
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => elements.toast.classList.remove('show'), 3000);
    };

    // ─────────────────────────────────────────────────────────────
    // 1. PWA SERVICE WORKER & NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────
    const initPWA = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('[PWA] Service Worker registered:', reg.scope);
                })
                .catch(err => {
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
        }

        // Catch Android beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.installPrompt = e;
            showToast('Tap Settings to install dashboard app on your phone');
        });

        // Check Notification Permission
        if ('Notification' in window) {
            if (Notification.permission === 'default' && elements.notifBar) {
                elements.notifBar.style.display = 'flex';
            }
        }

        if (elements.enableNotifsBtn) {
            elements.enableNotifsBtn.addEventListener('click', async () => {
                if ('Notification' in window) {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        elements.notifBar.style.display = 'none';
                        showToast('Push Notifications Enabled ✓');
                        triggerNotification('Notifications Active', 'You will receive real-time alerts for new client inquiries.');
                    }
                }
            });
        }
    };

    const triggerNotification = (title, body) => {
        playNotificationSound();
        if ('Notification' in window && Notification.permission === 'granted') {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIF', title, body });
            } else {
                new Notification(title, { body, icon: 'icon.png' });
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 2. DATA LOAD & RENDER
    // ─────────────────────────────────────────────────────────────
    const loadAllData = async (forceCloud = false) => {
        try {
            // 1. FAST LOCAL LOAD (0ms) - Populate UI instantly
            if (window.PortfolioData) {
                state.messages = window.PortfolioData.getLocalMessages ? window.PortfolioData.getLocalMessages() : [];
                state.reviews = window.PortfolioData.getLocalReviews ? window.PortfolioData.getLocalReviews(false) : [];
                state.experiences = window.PortfolioData.getLocalExperiences ? window.PortfolioData.getLocalExperiences() : [];
                state.projects = window.PortfolioData.getLocalProjects ? window.PortfolioData.getLocalProjects() : [];

                renderMessages();
                renderReviews();
                renderExperiences();
                renderProjects();
                updateBadges();
            }

            // 2. Update sync status indicator
            const hasCloudKeys = (typeof window !== 'undefined' && window.SUPABASE_KEYS && window.SUPABASE_KEYS.url) || 
                                 (typeof window !== 'undefined' && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url);
            if (elements.syncDot && elements.syncText) {
                if (hasCloudKeys) {
                    elements.syncDot.style.background = 'var(--accent-green)';
                    elements.syncText.textContent = 'PostgreSQL Cloud Synced';
                } else {
                    elements.syncDot.style.background = '#fbbf24';
                    elements.syncText.textContent = 'Instant Local Store (Active)';
                }
            }

            // 3. Authoritative cloud refresh in background
            (async () => {
                try {
                    const [messages, reviews, experiences, projects] = await Promise.all([
                        window.PortfolioData.getMessages({ forceCloud: true }),
                        window.PortfolioData.getAllReviews({ forceCloud: true }),
                        window.PortfolioData.getExperiences({ forceCloud: true }),
                        (window.PortfolioData.getAllProjectsForAdmin ? window.PortfolioData.getAllProjectsForAdmin({ forceCloud: true }) : window.PortfolioData.getProjects({ forceCloud: true }))
                    ]);

                    if (Array.isArray(messages)) state.messages = messages;
                    if (Array.isArray(reviews)) state.reviews = reviews;
                    if (Array.isArray(experiences)) state.experiences = experiences;
                    if (Array.isArray(projects)) state.projects = projects;

                    renderMessages();
                    renderReviews();
                    renderExperiences();
                    renderProjects();
                    updateBadges();
                } catch (cloudErr) {
                    console.warn('[Dashboard] Background cloud refresh note:', cloudErr);
                }
            })();
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    };

    const updateBadges = () => {
        state.unreadCount = state.messages.filter(m => !m.is_read).length;
        state.pendingReviewCount = state.reviews.filter(r => r.status === 'pending').length;

        // Header bell badge
        const totalAlerts = state.unreadCount + state.pendingReviewCount;
        elements.notifBadge.textContent = totalAlerts;
        elements.notifBadge.style.display = totalAlerts > 0 ? 'flex' : 'none';

        // Bottom nav badges
        elements.navInboxBadge.textContent = state.unreadCount;
        elements.navInboxBadge.style.display = state.unreadCount > 0 ? 'flex' : 'none';

        elements.navReviewsBadge.textContent = state.pendingReviewCount;
        elements.navReviewsBadge.style.display = state.pendingReviewCount > 0 ? 'flex' : 'none';

        elements.pendingReviewsCount.textContent = state.pendingReviewCount;
        elements.approvedReviewsCount.textContent = state.reviews.filter(r => r.status === 'approved').length;
    };

    // Format Date Helper
    const formatDate = (isoString) => {
        if (!isoString) return 'Just now';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return isoString;
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 3. TAB 1: MESSAGES (CONTACT + HIRE INQUIRIES)
    // ─────────────────────────────────────────────────────────────
    const renderMessages = () => {
        if (!elements.messagesContainer) return;
        if (state.messages.length === 0) {
            elements.messagesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📬</div>
                    <p>No inquiries yet. Submissions from your portfolio contact form will appear here in real-time.</p>
                </div>`;
            return;
        }

        elements.messagesContainer.innerHTML = state.messages.map(msg => `
            <div class="card-item ${!msg.is_read ? 'unread' : ''}" data-msg-id="${msg.id}">
                <div class="card-header-row">
                    <div>
                        <div class="card-sender-name">${escapeHTML(msg.name)}</div>
                        <div class="card-sender-company">${msg.company ? escapeHTML(msg.company) : 'Independent / Direct'}</div>
                    </div>
                    <div class="card-time">${formatDate(msg.created_at)}</div>
                </div>

                <div class="card-meta-line">
                    <span class="card-meta-pill">✉ ${escapeHTML(msg.email)}</span>
                    ${msg.website ? `<a href="${formatUrl(msg.website)}" target="_blank" rel="noopener" class="card-meta-pill">🌐 ${escapeHTML(msg.website)}</a>` : ''}
                    ${msg.source === 'hire_now_click' ? `<span class="card-meta-pill" style="color:var(--accent-gold);">⚡ "Hire Now" Flow</span>` : ''}
                </div>

                <div class="card-body-text">${escapeHTML(msg.message)}</div>

                <div class="card-actions-row">
                    ${!msg.is_read ? `<button type="button" class="card-btn mark-read" data-action="mark-read" data-id="${escapeHTML(msg.id)}" onclick="window.ConsoleApp.markRead('${escapeHTML(msg.id)}', event)">✓ Mark Read</button>` : ''}
                    <a href="mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent('Re: Systems Architecture Inquiry')}&body=${encodeURIComponent('Hi ' + msg.name + ',\n\nThank you for reaching out regarding your project.\n\nBest regards,\nAkshay Singh Chauhan')}" class="card-btn reply">Reply via Mail ↗</a>
                    <button type="button" class="card-btn delete" data-action="delete-msg" data-id="${escapeHTML(msg.id)}" onclick="window.ConsoleApp.deleteMessage('${escapeHTML(msg.id)}', event)">Delete</button>
                </div>
            </div>
        `).join('');
    };

    // ─────────────────────────────────────────────────────────────
    // 4. TAB 2: REVIEWS MODERATION (PENDING & APPROVED)
    // ─────────────────────────────────────────────────────────────
    const renderReviews = () => {
        const pending = state.reviews.filter(r => r.status === 'pending');
        const approved = state.reviews.filter(r => r.status === 'approved');

        // Render Pending
        if (elements.pendingReviewsContainer) {
            if (pending.length === 0) {
                elements.pendingReviewsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✓</div>
                        <p>No pending reviews. All clear!</p>
                    </div>`;
            } else {
                elements.pendingReviewsContainer.innerHTML = pending.map(rev => {
                    const siteUrl = (rev.company_website || rev.website || '').trim();
                    const siteLink = siteUrl ? `<a href="${formatUrl(siteUrl)}" target="_blank" rel="noopener" class="card-meta-pill" style="display:inline-flex;margin-left:8px;color:var(--accent-blue);">🔗 ${escapeHTML(siteUrl)}</a>` : '';
                    return `
                    <div class="card-item" style="border-left: 4px solid #fbbf24;">
                        <div class="card-header-row">
                            <div>
                                <div class="card-sender-name">${escapeHTML(rev.client_name)}</div>
                                <div class="card-sender-company">${escapeHTML(rev.client_title || '')} ${rev.client_company ? '· ' + escapeHTML(rev.client_company) : ''} ${siteLink}</div>
                            </div>
                            <span class="counter-badge warning">Pending Approval</span>
                        </div>

                        <div class="stars-row">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                        <div class="card-body-text">${escapeHTML(rev.review_text)}</div>

                        <div class="card-actions-row">
                            <button type="button" class="card-btn approve" data-action="approve-review" data-id="${escapeHTML(rev.id)}" onclick="window.ConsoleApp.approveReview('${escapeHTML(rev.id)}', event)">✓ Approve (Publish to Portfolio)</button>
                            <button type="button" class="card-btn delete" data-action="reject-review" data-id="${escapeHTML(rev.id)}" onclick="window.ConsoleApp.rejectReview('${escapeHTML(rev.id)}', event)">Reject</button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        }

        // Render Approved
        if (elements.approvedReviewsContainer) {
            if (approved.length === 0) {
                elements.approvedReviewsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No approved reviews live yet.</p>
                    </div>`;
            } else {
                elements.approvedReviewsContainer.innerHTML = approved.map(rev => {
                    const siteUrl = (rev.company_website || rev.website || '').trim();
                    const siteLink = siteUrl ? `<a href="${formatUrl(siteUrl)}" target="_blank" rel="noopener" class="card-meta-pill" style="display:inline-flex;margin-left:8px;color:var(--accent-blue);">🔗 ${escapeHTML(siteUrl)}</a>` : '';
                    return `
                    <div class="card-item" style="border-left: 4px solid var(--accent-green);">
                        <div class="card-header-row">
                            <div>
                                <div class="card-sender-name">${escapeHTML(rev.client_name)}</div>
                                <div class="card-sender-company">${escapeHTML(rev.client_title || '')} ${rev.client_company ? '· ' + escapeHTML(rev.client_company) : ''} ${siteLink}</div>
                            </div>
                            <span class="counter-badge success">Live on Portfolio</span>
                        </div>

                        <div class="stars-row">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                        <div class="card-body-text">${escapeHTML(rev.review_text)}</div>

                        <div class="card-actions-row">
                            <button type="button" class="card-btn" data-action="unpublish-review" data-id="${escapeHTML(rev.id)}" onclick="window.ConsoleApp.unpublishReview('${escapeHTML(rev.id)}', event)">Unpublish</button>
                            <button type="button" class="card-btn delete" data-action="delete-review" data-id="${escapeHTML(rev.id)}" onclick="window.ConsoleApp.deleteReview('${escapeHTML(rev.id)}', event)">Delete</button>
                        </div>
                    </div>
                `;
                }).join('');
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 5. TAB 3: HORIZONTAL EXPERIENCE MANAGER
    // ─────────────────────────────────────────────────────────────
    const renderExperiences = () => {
        if (!elements.experiencesContainer) return;
        if (state.experiences.length === 0) {
            elements.experiencesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💼</div>
                    <p>No experiences listed. Add your first role using the button above.</p>
                </div>`;
            return;
        }

        let displayedList = state.experiences;
        if (state.expFilter === 'office') {
            displayedList = state.experiences.filter(exp => {
                const isFreelance = exp.category === 'freelance' || exp.type === 'freelance';
                return !isFreelance;
            });
        } else if (state.expFilter === 'freelance') {
            displayedList = state.experiences.filter(exp => {
                const isFreelance = exp.category === 'freelance' || exp.type === 'freelance';
                return isFreelance;
            });
        }

        if (displayedList.length === 0) {
            const trackName = state.expFilter === 'office' ? 'in-office' : 'freelance';
            elements.experiencesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💼</div>
                    <p>No ${trackName} experiences found. Add one or switch filter above.</p>
                </div>`;
            return;
        }

        elements.experiencesContainer.innerHTML = displayedList.map((exp, idx) => {
            let isFreelance = false;
            if (exp.category === 'freelance' || exp.type === 'freelance') {
                isFreelance = true;
            } else if (exp.category === 'office' || exp.type === 'office') {
                isFreelance = false;
            } else {
                const role = (exp.role || '').toLowerCase();
                const company = (exp.company || '').toLowerCase();
                isFreelance = company.includes('travoqix') || company.includes('krisha events') || role.includes('freelance');
            }
            const cleanLoc = (exp.location || '').replace(/\s*\[(freelance|office)\]\s*/gi, '').trim();

            return `
            <div class="card-item">
                <div class="card-header-row">
                    <div>
                        <div class="card-sender-name">${escapeHTML(exp.role)}</div>
                        <div class="card-sender-company">${escapeHTML(exp.company)} ${cleanLoc ? '· ' + escapeHTML(cleanLoc) : ''}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="card-meta-pill ${isFreelance ? 'pill-freelance' : 'pill-office'}">${isFreelance ? '🌐 Freelance' : '🏢 In-Office'}</span>
                        <span class="card-meta-pill">${escapeHTML(exp.duration)}</span>
                    </div>
                </div>

                <div class="card-body-text">${escapeHTML(exp.description)}</div>

                <div class="card-actions-row">
                    <div style="display:flex;gap:6px;">
                        <button type="button" class="card-btn" title="Move Milestone Up" data-action="move-up-exp" data-id="${escapeHTML(exp.id)}" onclick="window.ConsoleApp.moveExperience('${escapeHTML(exp.id)}', 'up', event)">↑</button>
                        <button type="button" class="card-btn" title="Move Milestone Down" data-action="move-down-exp" data-id="${escapeHTML(exp.id)}" onclick="window.ConsoleApp.moveExperience('${escapeHTML(exp.id)}', 'down', event)">↓</button>
                    </div>
                    <button type="button" class="card-btn" data-action="edit-exp" data-id="${escapeHTML(exp.id)}" onclick="window.ConsoleApp.editExperience('${escapeHTML(exp.id)}', event)">Edit</button>
                    <button type="button" class="card-btn delete" data-action="delete-exp" data-id="${escapeHTML(exp.id)}" onclick="window.ConsoleApp.deleteExperience('${escapeHTML(exp.id)}', event)">Delete</button>
                </div>
            </div>
            `;
        }).join('');
    };

    // ─────────────────────────────────────────────────────────────
    // 6. RICH PALETTES, TECH STACK & IN-APP MEDIA ENGINE
    // ─────────────────────────────────────────────────────────────
    const THEME_COLORS = [
        { name: 'Electric Blue', hex: '#3d8bff', tag: 'Neon' },
        { name: 'Emerald Matrix', hex: '#10b981', tag: 'Cyber' },
        { name: 'Celestial Purple', hex: '#8b5cf6', tag: 'Cosmic' },
        { name: 'Solar Amber', hex: '#f59e0b', tag: 'Warm' },
        { name: 'Crimson Hyper', hex: '#ef4444', tag: 'Vibrant' },
        { name: 'Rose Quartz', hex: '#ec4899', tag: 'Neon' },
        { name: 'Cyan Glitch', hex: '#06b6d4', tag: 'Glitch' },
        { name: 'Indigo Twilight', hex: '#6366f1', tag: 'Deep' },
        { name: 'Sunset Coral', hex: '#f97316', tag: 'Fire' },
        { name: 'Lime Surge', hex: '#84cc16', tag: 'Acid' },
        { name: 'Cyber Gold', hex: '#eab308', tag: 'Luxe' },
        { name: 'Teal Aurora', hex: '#14b8a6', tag: 'Fresh' },
        { name: 'Orchid Fuchsia', hex: '#d946ef', tag: 'Bold' },
        { name: 'Carbon Slate', hex: '#475569', tag: 'Stealth' }
    ];

    const GRADIENT_COLORS = [
        { name: 'Neon Horizon', value: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', mainHex: '#3b82f6' },
        { name: 'Aurora Emerald', value: 'linear-gradient(135deg, #10b981, #06b6d4)', mainHex: '#10b981' },
        { name: 'Sunset Flare', value: 'linear-gradient(135deg, #f97316, #ef4444)', mainHex: '#f97316' },
        { name: 'Cyber Matrix', value: 'linear-gradient(135deg, #06b6d4, #3b82f6)', mainHex: '#06b6d4' },
        { name: 'Royal Twilight', value: 'linear-gradient(135deg, #8b5cf6, #ec4899)', mainHex: '#8b5cf6' },
        { name: 'Golden Hour', value: 'linear-gradient(135deg, #f59e0b, #eab308)', mainHex: '#f59e0b' },
        { name: 'Midnight Blaze', value: 'linear-gradient(135deg, #ef4444, #8b5cf6)', mainHex: '#ef4444' },
        { name: 'Mystic Teal', value: 'linear-gradient(135deg, #14b8a6, #3b82f6)', mainHex: '#14b8a6' },
        { name: 'Electric Lime', value: 'linear-gradient(135deg, #84cc16, #10b981)', mainHex: '#84cc16' },
        { name: 'Deep Nebula', value: 'linear-gradient(135deg, #6366f1, #a855f7)', mainHex: '#6366f1' }
    ];

    const PRESET_TECH_STACK = [
        'Go', 'Python', 'TypeScript', 'JavaScript', 'Rust', 'Java', 'C++', 'SQL', 'HTML5/CSS3',
        'React', 'Next.js', 'Node.js', 'FastAPI', 'Vue.js', 'Spring Boot', 'Express', 'Django', 'Flask', 'Electron', 'Three.js',
        'PostgreSQL', 'Supabase', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'TimescaleDB', 'MongoDB', 'GraphQL', 'SQLite',
        'Tailwind CSS', 'Vite', 'WebSockets', 'REST APIs', 'Microservices', 'Face Auth', 'Local Encryption', 'Offline First',
        'Pandas', 'NumPy', 'Scikit-learn', 'PyTorch', 'Power BI', 'Tableau'
    ];

    const normalizeColor = (c) => {
        if (!c) return '';
        let str = String(c).trim().toLowerCase();
        if (/^#[0-9a-f]{3}$/i.test(str)) {
            str = '#' + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
        }
        return str.replace(/\s+/g, ' ');
    };

    const findColorUsage = (color, excludeProjId) => {
        if (!color) return null;
        const normTarget = normalizeColor(color);
        return state.projects.find(p => {
            if (excludeProjId && p.id === excludeProjId) return false;
            const pColor = normalizeColor(p.card_color || (p.preview_color === 'green' ? '#10b981' : (p.preview_color === 'gold' ? '#c8a84b' : '#3d8bff')));
            return pColor === normTarget;
        }) || null;
    };

    const getFreshUniqueColor = (excludeProjId) => {
        for (const t of THEME_COLORS) {
            if (!findColorUsage(t.hex, excludeProjId)) return t.hex;
        }
        for (const g of GRADIENT_COLORS) {
            if (!findColorUsage(g.value, excludeProjId)) return g.value;
        }
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 80%, 55%)`;
    };

    const updateColorSelectionUI = (color, isAutoSelect = false) => {
        if (!color) return;
        state.selectedCardColor = color;
        const hiddenInput = document.getElementById('proj-card-color');
        if (hiddenInput) hiddenInput.value = color;

        const previewDot = document.getElementById('color-preview-dot');
        const nameLabel = document.getElementById('color-name-label');
        if (previewDot) previewDot.style.background = color;

        let labelText = color;
        const themeMatch = THEME_COLORS.find(t => normalizeColor(t.hex) === normalizeColor(color));
        if (themeMatch) labelText = themeMatch.name;
        const gradMatch = GRADIENT_COLORS.find(g => normalizeColor(g.value) === normalizeColor(color));
        if (gradMatch) labelText = gradMatch.name;
        if (nameLabel) nameLabel.textContent = labelText;

        const liveGlow = document.getElementById('live-preview-glow');
        if (liveGlow) liveGlow.style.background = color;

        if (color.startsWith('#') && color.length >= 7) {
            const nativePicker = document.getElementById('proj-native-color-picker');
            const hexInput = document.getElementById('proj-hex-input');
            if (nativePicker) nativePicker.value = color.substring(0, 7);
            if (hexInput) hexInput.value = color.replace('#', '').toUpperCase();
        }

        document.querySelectorAll('.color-swatch-item').forEach(swatch => {
            const swatchColor = swatch.getAttribute('data-swatch-value');
            if (normalizeColor(swatchColor) === normalizeColor(color)) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });

        const repeatAlert = document.getElementById('color-repeat-alert');
        const repeatDetail = document.getElementById('color-repeat-detail');
        const uniqueBadge = document.getElementById('color-unique-badge');
        const repeatCheckbox = document.getElementById('allow-repeat-color-checkbox');

        const repeatedProject = findColorUsage(color, state.currentProjectId);

        if (repeatedProject) {
            if (repeatAlert) repeatAlert.style.display = 'flex';
            if (repeatDetail) repeatDetail.innerHTML = `This colour is already used by project: <strong>"${escapeHTML(repeatedProject.title)}"</strong>.`;
            if (repeatCheckbox && !isAutoSelect) repeatCheckbox.checked = false;
            if (uniqueBadge) uniqueBadge.style.display = 'none';
        } else {
            if (repeatAlert) repeatAlert.style.display = 'none';
            if (repeatCheckbox) repeatCheckbox.checked = false;
            if (uniqueBadge) uniqueBadge.style.display = 'flex';
        }
    };

    const renderColorSwatches = () => {
        const themesContainer = document.getElementById('themes-swatches-grid');
        if (themesContainer) {
            themesContainer.innerHTML = THEME_COLORS.map(t => {
                const isSelected = normalizeColor(state.selectedCardColor) === normalizeColor(t.hex);
                const usedProject = findColorUsage(t.hex, state.currentProjectId);
                return `
                    <div class="color-swatch-item ${isSelected ? 'active' : ''}" data-swatch-value="${t.hex}">
                        <div class="color-swatch-circle" style="background: ${t.hex}"></div>
                        <div class="color-swatch-name">${escapeHTML(t.name)}</div>
                        ${usedProject ? `<span class="color-in-use-tag" title="Used by ${escapeHTML(usedProject.title)}">In Use</span>` : ''}
                    </div>
                `;
            }).join('');
        }

        const gradingContainer = document.getElementById('grading-swatches-grid');
        if (gradingContainer) {
            gradingContainer.innerHTML = GRADIENT_COLORS.map(g => {
                const isSelected = normalizeColor(state.selectedCardColor) === normalizeColor(g.value);
                const usedProject = findColorUsage(g.value, state.currentProjectId);
                return `
                    <div class="color-swatch-item ${isSelected ? 'active' : ''}" data-swatch-value="${g.value}">
                        <div class="color-swatch-circle" style="background: ${g.value}"></div>
                        <div class="color-swatch-name">${escapeHTML(g.name)}</div>
                        ${usedProject ? `<span class="color-in-use-tag" title="Used by ${escapeHTML(usedProject.title)}">In Use</span>` : ''}
                    </div>
                `;
            }).join('');
        }

        document.querySelectorAll('.color-swatch-item').forEach(el => {
            el.addEventListener('click', () => {
                const colorVal = el.getAttribute('data-swatch-value');
                updateColorSelectionUI(colorVal);
            });
        });
    };

    const renderTechChips = () => {
        const container = document.getElementById('tech-chips-container');
        const hiddenInput = document.getElementById('proj-tech-value');
        if (!container) return;

        if (state.selectedTechStack.length === 0) {
            container.innerHTML = `<span class="tech-chips-empty">No stacks added yet. Click "+ Add Stack" below.</span>`;
            if (hiddenInput) hiddenInput.value = '';
            return;
        }

        container.innerHTML = state.selectedTechStack.map(t => `
            <span class="tech-chip">
                <span>${escapeHTML(t)}</span>
                <button type="button" class="tech-chip-remove" data-remove-tech="${escapeHTML(t)}" title="Remove ${escapeHTML(t)}">&times;</button>
            </span>
        `).join('');

        if (hiddenInput) hiddenInput.value = state.selectedTechStack.join(', ');

        container.querySelectorAll('[data-remove-tech]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const techToRemove = btn.getAttribute('data-remove-tech');
                removeTechFromStack(techToRemove);
            });
        });
    };

    const renderTechOptionsList = (filterQuery = '') => {
        const listEl = document.getElementById('tech-options-list');
        if (!listEl) return;
        const q = filterQuery.toLowerCase().trim();

        const filtered = PRESET_TECH_STACK.filter(t => !q || t.toLowerCase().includes(q));

        listEl.innerHTML = filtered.map(t => {
            const isAlreadySelected = state.selectedTechStack.some(st => st.toLowerCase() === t.toLowerCase());
            return `
                <button type="button" class="tech-opt-btn ${isAlreadySelected ? 'selected' : ''}" data-tech-val="${escapeHTML(t)}">
                    ${isAlreadySelected ? '✓ ' : '+ '}${escapeHTML(t)}
                </button>
            `;
        }).join('');

        listEl.querySelectorAll('.tech-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.getAttribute('data-tech-val');
                addTechToStack(val);
            });
        });
    };

    const addTechToStack = (tech) => {
        if (!tech) return;
        const clean = tech.trim();
        if (!clean) return;
        const exists = state.selectedTechStack.some(t => t.toLowerCase() === clean.toLowerCase());
        if (!exists) {
            state.selectedTechStack.push(clean);
            if (!PRESET_TECH_STACK.some(p => p.toLowerCase() === clean.toLowerCase())) {
                PRESET_TECH_STACK.unshift(clean);
            }
            renderTechChips();
            const searchInput = document.getElementById('tech-search-input');
            renderTechOptionsList(searchInput ? searchInput.value : '');
        }
    };

    const removeTechFromStack = (tech) => {
        state.selectedTechStack = state.selectedTechStack.filter(t => t.toLowerCase() !== tech.toLowerCase());
        renderTechChips();
        const searchInput = document.getElementById('tech-search-input');
        renderTechOptionsList(searchInput ? searchInput.value : '');
    };

    const resetVideoUpload = () => {
        const fileInput = document.getElementById('proj-video-file');
        const dataInput = document.getElementById('proj-video-data');
        const previewPlayer = document.getElementById('proj-video-preview');
        const dropzone = document.getElementById('video-dropzone');
        const playerWrap = document.getElementById('video-preview-player-wrap');

        if (fileInput) fileInput.value = '';
        if (dataInput) dataInput.value = '';
        if (previewPlayer) {
            previewPlayer.pause();
            previewPlayer.removeAttribute('src');
            previewPlayer.load();
        }
        if (dropzone) dropzone.style.display = 'flex';
        if (playerWrap) playerWrap.style.display = 'none';
    };

    const handleVideoFile = async (file) => {
        if (!file) return;

        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        if (file.size > 150 * 1024 * 1024) {
            showToast('Video file size exceeds 150MB limit');
            return;
        }

        const nameEl = document.getElementById('video-file-name');
        const sizeEl = document.getElementById('video-file-size');
        const dropzone = document.getElementById('video-dropzone');
        const playerWrap = document.getElementById('video-preview-player-wrap');
        const previewPlayer = document.getElementById('proj-video-preview');
        const dataInput = document.getElementById('proj-video-data');

        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = `${sizeMB} MB`;

        const objectUrl = URL.createObjectURL(file);
        if (previewPlayer) {
            previewPlayer.src = objectUrl;
            previewPlayer.load();
        }

        if (dropzone) dropzone.style.display = 'none';
        if (playerWrap) playerWrap.style.display = 'block';

        showToast('Uploading video to Cloud Storage...');
        try {
            if (window.PortfolioData && typeof window.PortfolioData.uploadMedia === 'function') {
                const res = await window.PortfolioData.uploadMedia(file, 'videos');
                if (res && res.publicUrl) {
                    if (dataInput) dataInput.value = res.publicUrl;
                    showToast('Video uploaded to Cloud Storage ✓');
                    return;
                }
            }
        } catch (uploadErr) {
            console.warn('[VideoUpload] Cloud upload note:', uploadErr);
        }

        // Offline / fallback preview
        if (file.size < 4 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (dataInput) dataInput.value = e.target.result;
                showToast('Video attached (local preview) ✓');
            };
            reader.readAsDataURL(file);
        } else {
            showToast('Video attached locally ✓ (Cloud syncs on connection)');
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 7. TAB 4: PROJECTS SHOWCASE MANAGER (Render)
    // ─────────────────────────────────────────────────────────────
    const renderProjects = () => {
        if (!elements.projectsContainer) return;
        if (state.projects.length === 0) {
            elements.projectsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🚀</div>
                    <p>No projects listed. Add a new project with in-app video preview and custom card color.</p>
                </div>`;
            return;
        }

        elements.projectsContainer.innerHTML = state.projects.map((proj, idx) => {
            const tags = Array.isArray(proj.tech_stack) ? proj.tech_stack : (proj.tech_stack || '').split(',').map(s => s.trim());
            const cardColor = proj.card_color || (proj.preview_color === 'green' ? '#10b981' : (proj.preview_color === 'gold' ? '#c8a84b' : '#3d8bff'));
            const isVideoAttached = Boolean(proj.video_url);
            const orderNum = proj.order_index != null ? Number(proj.order_index) : (idx + 1);
            const isFrontAndCenter = orderNum === 1;

            return `
                <div class="card-item project-card-item" style="border-left: 4px solid ${cardColor.includes('gradient') ? '#3d8bff' : cardColor};">
                    <div class="card-header-row">
                        <div>
                            <div class="card-title-badge-row">
                                <span class="proj-order-badge ${isFrontAndCenter ? 'featured' : ''}" title="Display position in 3D carousel">
                                    #${orderNum} ${isFrontAndCenter ? '· 🌟 Front & Center' : ''}
                                </span>
                                <span class="cloud-sync-pill" title="Synchronized with cloud database">✓ Cloud Synced</span>
                            </div>
                            <div class="card-sender-name">
                                <span class="card-color-indicator" style="background: ${cardColor};" title="Card Accent: ${escapeHTML(cardColor)}"></span>
                                ${escapeHTML(proj.title)}
                            </div>
                            <div class="card-sender-company">${escapeHTML(proj.category || 'Engineering')}</div>
                        </div>
                        ${proj.live_url ? `<a href="${formatUrl(proj.live_url)}" target="_blank" rel="noopener" class="card-btn reply">Visit Site ↗</a>` : ''}
                    </div>

                    <div class="tags-wrap">
                        ${tags.filter(Boolean).map(t => `<span class="tech-tag-pill">${escapeHTML(t)}</span>`).join('')}
                    </div>

                    <div class="card-body-text">${escapeHTML(proj.description)}</div>

                    ${isVideoAttached ? `
                        <div class="card-meta-line">
                            <span class="video-badge-pill">🎥 In-App Video Showcase Active</span>
                        </div>
                    ` : ''}

                    <div class="card-actions-row">
                        <div class="reorder-btn-group">
                            <button type="button" class="card-btn reorder-btn" data-action="move-up-proj" data-id="${escapeHTML(proj.id || proj.slug)}" onclick="window.ConsoleApp.moveProject('${escapeHTML(proj.id || proj.slug)}', 'up', event)" title="Move earlier in carousel" ${idx === 0 ? 'disabled' : ''}>↑ Move Up</button>
                            <button type="button" class="card-btn reorder-btn" data-action="move-down-proj" data-id="${escapeHTML(proj.id || proj.slug)}" onclick="window.ConsoleApp.moveProject('${escapeHTML(proj.id || proj.slug)}', 'down', event)" title="Move later in carousel" ${idx === state.projects.length - 1 ? 'disabled' : ''}>↓ Move Down</button>
                        </div>
                        <div class="standard-btn-group">
                            <button type="button" class="card-btn" data-action="edit-proj" data-id="${escapeHTML(proj.id || proj.slug)}" onclick="window.ConsoleApp.editProject('${escapeHTML(proj.id || proj.slug)}', event)">Edit</button>
                            <button type="button" class="card-btn delete" data-action="delete-proj" data-id="${escapeHTML(proj.id || proj.slug)}" onclick="window.ConsoleApp.deleteProject('${escapeHTML(proj.id || proj.slug)}', event)">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Helper sanitization
    const escapeHTML = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    };

    const formatUrl = (url) => {
        if (!url) return '#';
        const str = String(url).trim();
        if (/^(javascript|data|vbscript):/i.test(str)) {
            return '#';
        }
        if (!str.startsWith('http://') && !str.startsWith('https://')) {
            return 'https://' + str;
        }
        return str;
    };

    // ─────────────────────────────────────────────────────────────
    // 7. EVENT LISTENERS & TAB NAVIGATION
    // ─────────────────────────────────────────────────────────────
    const setupEvents = () => {
        // Global resilient action delegation for all dashboard cards (desktop & mobile WebView)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (!id) return;

            // Prevent duplicate double-invocation if inline onclick also fired
            if (btn._actionBusy) return;
            btn._actionBusy = true;
            setTimeout(() => { btn._actionBusy = false; }, 400);

            if (action === 'mark-read') window.ConsoleApp.markRead(id, e);
            else if (action === 'delete-msg') window.ConsoleApp.deleteMessage(id, e);
            else if (action === 'approve-review') window.ConsoleApp.approveReview(id, e);
            else if (action === 'reject-review') window.ConsoleApp.rejectReview(id, e);
            else if (action === 'unpublish-review') window.ConsoleApp.unpublishReview(id, e);
            else if (action === 'delete-review') window.ConsoleApp.deleteReview(id, e);
            else if (action === 'edit-exp') window.ConsoleApp.editExperience(id, e);
            else if (action === 'delete-exp') window.ConsoleApp.deleteExperience(id, e);
            else if (action === 'move-up-exp') window.ConsoleApp.moveExperience(id, 'up', e);
            else if (action === 'move-down-exp') window.ConsoleApp.moveExperience(id, 'down', e);
            else if (action === 'move-up-proj') window.ConsoleApp.moveProject(id, 'up', e);
            else if (action === 'move-down-proj') window.ConsoleApp.moveProject(id, 'down', e);
            else if (action === 'edit-proj') window.ConsoleApp.editProject(id, e);
            else if (action === 'delete-proj') window.ConsoleApp.deleteProject(id, e);
        });

        // Cloud Database Refresh Trigger
        elements.refreshProjBtn?.addEventListener('click', async () => {
            elements.refreshProjBtn.disabled = true;
            elements.refreshProjBtn.textContent = '🔄 Syncing...';
            showToast('Syncing with Supabase Cloud...');
            try {
                state.projects = await window.PortfolioData.getAllProjectsForAdmin();
                renderProjects();
                showToast('Projects refreshed from cloud ✓');
            } catch (err) {
                showToast('Failed to refresh from cloud');
            } finally {
                elements.refreshProjBtn.disabled = false;
                elements.refreshProjBtn.textContent = '🔄 Refresh Cloud';
            }
        });

        // Carousel Order Preset buttons in modal
        document.querySelectorAll('.btn-order-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-order-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = btn.dataset.orderPreset;
                const orderInput = document.getElementById('proj-order');
                if (preset === '1') {
                    if (orderInput) orderInput.value = '1';
                } else if (preset === 'end') {
                    if (orderInput) orderInput.value = String(state.projects.length + 1);
                }
            });
        });

        // Security Lock & Unlock Handlers
        elements.lockBtn?.addEventListener('click', () => {
            window.PortfolioData?.logoutAdmin();
            lockConsole();
            showToast('Console Locked 🔒');
        });

        document.getElementById('settings-logout-btn')?.addEventListener('click', () => {
            window.PortfolioData?.logoutAdmin();
            closeModal('settings-modal');
            lockConsole();
            showToast('Console Locked 🔒');
        });

        elements.lockPinForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pin = elements.lockPinInput?.value;
            if (!window.PortfolioData?.verifyAdminPin) return;
            const result = await window.PortfolioData.verifyAdminPin(pin);
            if (result && result.ok) {
                unlockConsole();
            } else {
                if (elements.lockErrorText) {
                    elements.lockErrorText.textContent = 'Invalid security PIN. Please try again.';
                    elements.lockErrorText.style.display = 'block';
                }
            }
        });

        // Tab switching
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                const targetPane = document.getElementById(`pane-${tab}`);
                if (targetPane) targetPane.classList.add('active');
                state.activeTab = tab;
            });
        });

        // Experience Track Filter switching (All, In-Office, Freelance)
        document.querySelectorAll('.exp-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.exp-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.expFilter = btn.dataset.expFilter || 'all';
                renderExperiences();
            });
        });

        // Refresh buttons
        const refMsg = document.getElementById('refresh-messages-btn');
        if (refMsg) refMsg.addEventListener('click', () => { loadAllData(); showToast('Inquiries refreshed'); });
        const refRev = document.getElementById('refresh-reviews-btn');
        if (refRev) refRev.addEventListener('click', () => { loadAllData(); showToast('Reviews refreshed'); });

        // Live Cross-Tab & Real-Time Sync
        window.addEventListener('storage', (e) => {
            if (!e.key || e.key.startsWith('portfolio_')) {
                if (state.isUnlocked) loadAllData();
            }
        });

        // Supabase Realtime synchronization listeners
        window.addEventListener('portfolio-sync-status', (e) => {
            const status = e.detail?.status;
            if (elements.syncDot && elements.syncText) {
                if (status === 'connected') {
                    elements.syncDot.style.background = 'var(--accent-green)';
                    elements.syncText.textContent = 'PostgreSQL Cloud Synced';
                } else if (status === 'connecting') {
                    elements.syncDot.style.background = '#38bdf8';
                    elements.syncText.textContent = 'Cloud Connecting...';
                } else {
                    elements.syncDot.style.background = '#fbbf24';
                    elements.syncText.textContent = 'Instant Local Store (Active)';
                }
            }
        });

        window.addEventListener('portfolio-message-received', (e) => {
            if (state.isUnlocked) {
                loadAllData();
                const m = e.detail;
                triggerNotification('New Portfolio Message 📬', `${m?.name || 'Visitor'} sent an inquiry.`);
            }
        });

        window.addEventListener('portfolio-review-saved', (e) => {
            if (state.isUnlocked) {
                loadAllData();
                const r = e.detail;
                if (r && r.status === 'pending') {
                    triggerNotification('New Review Submitted ⭐', `${r.author_name || 'Client'} submitted a review.`);
                }
            }
        });

        window.addEventListener('portfolio-project-saved', () => {
            if (state.isUnlocked) {
                loadAllData();
            }
        });

        window.addEventListener('portfolio-experience-saved', () => {
            if (state.isUnlocked) {
                loadAllData(true);
            }
        });

        // Authoritative refetch after Realtime reconnect / auth change
        window.addEventListener('portfolio-cloud-resync', () => {
            if (state.isUnlocked) {
                loadAllData(true);
            }
        });

        window.addEventListener('portfolio-sync-error', (e) => {
            const msg = e.detail?.error || 'Cloud sync error';
            const collection = e.detail?.collection ? ` (${e.detail.collection})` : '';
            showToast(`⚠ Cloud sync failed${collection}: ${msg}`);
            if (elements.syncDot && elements.syncText) {
                elements.syncDot.style.background = '#ef4444';
                elements.syncText.textContent = 'Cloud sync error';
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && state.isUnlocked) {
                loadAllData(true);
            }
        });

        // Modal triggers
        document.getElementById('settings-btn')?.addEventListener('click', () => openModal('settings-modal'));
        document.getElementById('settings-logout-btn')?.addEventListener('click', async () => {
            await window.PortfolioData?.logoutAdmin();
            closeModal('settings-modal');
            lockConsole();
            showToast('Signed out of Supabase Cloud');
        });

        document.getElementById('add-exp-btn')?.addEventListener('click', () => {
            elements.expForm.reset();
            document.getElementById('exp-id').value = '';
            const catEl = document.getElementById('exp-category');
            if (catEl) catEl.value = 'office';
            const orderEl = document.getElementById('exp-order');
            if (orderEl) orderEl.value = String(state.experiences.length + 1);
            const videoEl = document.getElementById('exp-video-url');
            if (videoEl) videoEl.value = '';
            const liveEl = document.getElementById('exp-live-url');
            if (liveEl) liveEl.value = '';
            document.getElementById('exp-modal-title').textContent = 'Add Career Milestone';
            openModal('exp-modal');
        });
        // ── ADD NEW PROJECT TRIGGER ──
        document.getElementById('add-proj-btn')?.addEventListener('click', () => {
            state.currentProjectId = null;
            elements.projForm.reset();
            document.getElementById('proj-id').value = '';
            document.getElementById('proj-modal-title').textContent = 'Add Portfolio Project';

            // Reset carousel order to 1 (Front & Center) for new project
            const orderInput = document.getElementById('proj-order');
            if (orderInput) orderInput.value = '1';
            document.querySelectorAll('.btn-order-preset').forEach(b => {
                b.classList.toggle('active', b.dataset.orderPreset === '1');
            });

            // Reset github url
            const githubInput = document.getElementById('proj-github-url');
            if (githubInput) githubInput.value = '';

            // Reset video
            resetVideoUpload();

            // Reset tech stack chips
            state.selectedTechStack = [];
            renderTechChips();

            // Auto-select a unique, non-repeated color
            const freshColor = getFreshUniqueColor(null);
            updateColorSelectionUI(freshColor, true);
            renderColorSwatches();

            openModal('proj-modal');
        });

        // Close modal buttons
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-close-modal');
                closeModal(id);
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.dash-modal').forEach(m => {
            m.addEventListener('click', (e) => {
                if (e.target === m) closeModal(m.id);
            });
        });

        // ── TECH STACK PICKER EVENTS ──
        const openTechBtn = document.getElementById('open-tech-picker-btn');
        const techPopover = document.getElementById('tech-picker-popover');
        const techSearch = document.getElementById('tech-search-input');
        const addCustomTechBtn = document.getElementById('add-custom-tech-btn');

        if (openTechBtn && techPopover) {
            openTechBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = techPopover.style.display !== 'none';
                techPopover.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) {
                    renderTechOptionsList(techSearch ? techSearch.value : '');
                    if (techSearch) techSearch.focus();
                }
            });

            // Filter on search
            techSearch?.addEventListener('input', () => {
                renderTechOptionsList(techSearch.value);
            });

            // Add custom stack on Enter
            techSearch?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (techSearch.value.trim()) {
                        addTechToStack(techSearch.value.trim());
                        techSearch.value = '';
                        renderTechOptionsList('');
                    }
                }
            });

            // Add custom stack on button click
            addCustomTechBtn?.addEventListener('click', () => {
                if (techSearch && techSearch.value.trim()) {
                    addTechToStack(techSearch.value.trim());
                    techSearch.value = '';
                    renderTechOptionsList('');
                }
            });

            // Close popover on document click
            document.addEventListener('click', (e) => {
                if (techPopover && !techPopover.contains(e.target) && e.target !== openTechBtn) {
                    techPopover.style.display = 'none';
                }
            });
        }

        // ── IN-APP DIRECT VIDEO UPLOAD EVENTS ──
        const videoFileInput = document.getElementById('proj-video-file');
        const chooseVideoBtn = document.getElementById('choose-video-btn');
        const videoDropzone = document.getElementById('video-dropzone');
        const replaceVideoBtn = document.getElementById('replace-video-btn');
        const removeVideoBtn = document.getElementById('remove-video-btn');

        chooseVideoBtn?.addEventListener('click', () => videoFileInput?.click());
        replaceVideoBtn?.addEventListener('click', () => videoFileInput?.click());
        removeVideoBtn?.addEventListener('click', resetVideoUpload);

        videoFileInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleVideoFile(e.target.files[0]);
            }
        });

        // Dropzone drag & drop
        if (videoDropzone) {
            videoDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                videoDropzone.classList.add('dragover');
            });
            videoDropzone.addEventListener('dragleave', () => videoDropzone.classList.remove('dragover'));
            videoDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                videoDropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleVideoFile(e.dataTransfer.files[0]);
                }
            });
        }

        // ── PROJECT CARD COLOUR SELECTOR EVENTS ──
        document.querySelectorAll('.color-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabType = tabBtn.getAttribute('data-color-tab');
                document.querySelectorAll('.color-tab-btn').forEach(b => b.classList.remove('active'));
                tabBtn.classList.add('active');

                document.querySelectorAll('.color-tab-panel').forEach(p => p.style.display = 'none');
                const targetPanel = document.getElementById(`color-panel-${tabType}`);
                if (targetPanel) targetPanel.style.display = 'block';
                state.activeColorTab = tabType;
            });
        });

        // Native Color Picker Input
        const nativePicker = document.getElementById('proj-native-color-picker');
        nativePicker?.addEventListener('input', (e) => {
            updateColorSelectionUI(e.target.value);
        });

        // Hex Code Input & Apply
        const hexInput = document.getElementById('proj-hex-input');
        const applyHexBtn = document.getElementById('apply-hex-btn');
        const applyHex = () => {
            if (!hexInput) return;
            let val = hexInput.value.trim().replace('#', '');
            if (val.length === 3 || val.length === 6) {
                updateColorSelectionUI('#' + val);
            } else {
                showToast('Please enter a valid 3 or 6 digit hex code');
            }
        };
        applyHexBtn?.addEventListener('click', applyHex);
        hexInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyHex();
            }
        });

        // Settings Form Submit
        if (elements.settingsForm) {
            elements.settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const emailService = document.getElementById('cfg-emailjs-service')?.value.trim();
                const emailTemplate = document.getElementById('cfg-emailjs-template')?.value.trim();
                const newPin = document.getElementById('cfg-admin-pin')?.value.trim();

                if (emailService) localStorage.setItem('portfolio_emailjs_service_id', emailService);
                if (emailTemplate) localStorage.setItem('portfolio_emailjs_template_id', emailTemplate);
                if (newPin) {
                    try {
                        window.PortfolioData.setAdminPin(newPin);
                        showToast('Security PIN updated ✓');
                    } catch (err) {
                        alert(err.message);
                    }
                }

                closeModal('settings-modal');
                showToast('Settings saved ✓');
                loadAllData();
            });
        }

        // Experience Form Submit
        if (elements.expForm) {
            elements.expForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rawExpId = document.getElementById('exp-id').value.trim();
                const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const id = (rawExpId && uuidRe.test(rawExpId))
                    ? rawExpId
                    : ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null);
                if (!id) {
                    showToast('⚠ Unable to generate a valid experience id');
                    return;
                }
                const role = document.getElementById('exp-role').value.trim();
                const company = document.getElementById('exp-company').value.trim();
                const location = document.getElementById('exp-location').value.trim();
                const category = document.getElementById('exp-category')?.value || 'office';
                const type = category === 'freelance' ? 'freelance' : 'office';
                const duration = document.getElementById('exp-duration').value.trim();
                const description = document.getElementById('exp-desc').value.trim();
                const video_url = document.getElementById('exp-video-url')?.value.trim() || '';
                const live_url = document.getElementById('exp-live-url')?.value.trim() || '';

                const orderInput = document.getElementById('exp-order');
                const parsedOrder = orderInput ? parseInt(orderInput.value, 10) : NaN;
                const existingExp = state.experiences.find(expItem => expItem.id === id);
                const order_index = !isNaN(parsedOrder) && parsedOrder > 0
                    ? parsedOrder
                    : ((existingExp && existingExp.order_index != null) ? existingExp.order_index : (state.experiences.length + 1));

                const exp = {
                    id,
                    role,
                    company,
                    location,
                    duration,
                    description,
                    order_index,
                    category,
                    type,
                    video_url,
                    live_url,
                    is_active: true
                };

                // Optimistic UI
                const eIdx = state.experiences.findIndex(expItem => expItem.id === exp.id);
                if (eIdx >= 0) state.experiences[eIdx] = { ...state.experiences[eIdx], ...exp };
                else state.experiences.push(exp);
                state.experiences.sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

                closeModal('exp-modal');
                renderExperiences();
                showToast('Saving experience to Supabase…');

                try {
                    const saved = await window.PortfolioData.saveExperience(exp);
                    if (saved && saved.id) {
                        const i = state.experiences.findIndex(x => x.id === exp.id || x.id === saved.id);
                        if (i >= 0) state.experiences[i] = { ...state.experiences[i], ...saved };
                        renderExperiences();
                    }
                    showToast('Experience saved to cloud ✓');
                } catch (err) {
                    showToast(`⚠ Experience cloud save failed: ${err.message || err}`);
                    await loadAllData(true);
                }
            });
        }

        // ── PROJECT FORM SUBMIT (NO COMPULSORY FIELDS) ──
        if (elements.projForm) {
            elements.projForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rawId = (document.getElementById('proj-id').value || '').trim();
                const rawTitle = document.getElementById('proj-title').value.trim();
                const category = document.getElementById('proj-category').value.trim();
                const live_url = document.getElementById('proj-live-url')?.value.trim() || '';
                const github_url = document.getElementById('proj-github-url')?.value.trim() || '';
                const video_url = document.getElementById('proj-video-data').value.trim();
                const card_color = document.getElementById('proj-card-color').value.trim() || '#3d8bff';
                const description = document.getElementById('proj-desc').value.trim();

                // Locate existing project by ID, slug, currentProjectId, or normalized title to guarantee UPDATE instead of duplicate INSERT
                let existing = null;
                if (rawId) {
                    existing = state.projects.find(p => p.id === rawId || p.slug === rawId);
                }
                if (!existing && state.currentProjectId) {
                    existing = state.projects.find(p => p.id === state.currentProjectId || p.slug === state.currentProjectId);
                }
                if (!existing && rawTitle) {
                    const normTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (normTitle) {
                        existing = state.projects.find(p => (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle);
                    }
                }

                const title = rawTitle || (existing && existing.title ? existing.title : 'Untitled Project');

                // Preserve original slug; always use UUID primary keys for cloud persistence
                const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const slug = existing && existing.slug
                    ? existing.slug
                    : (cleanSlug || ('project-' + Date.now()));
                const finalId = (existing && existing.id && uuidRe.test(existing.id))
                    ? existing.id
                    : ((rawId && uuidRe.test(rawId)) ? rawId : ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('proj-' + Date.now())));
                if (!finalId) {
                    showToast('⚠ Unable to generate a valid project id');
                    return;
                }

                // Read desired carousel position
                const orderInput = document.getElementById('proj-order');
                const parsedOrder = orderInput ? parseInt(orderInput.value, 10) : NaN;
                const order_index = !isNaN(parsedOrder) && parsedOrder > 0
                    ? parsedOrder
                    : ((existing && existing.order_index != null) ? existing.order_index : 1);

                // If project is assigned a position, push conflicting projects down
                const projectsToShift = [];
                state.projects.forEach(p => {
                    if ((p.id !== finalId && p.slug !== slug) && (Number(p.order_index) || 0) >= order_index) {
                        p.order_index = (Number(p.order_index) || 0) + 1;
                        projectsToShift.push(p);
                    }
                });

                const proj = {
                    id: finalId,
                    slug,
                    title,
                    category,
                    tech_stack: [...(state.selectedTechStack || [])],
                    live_url,
                    github_url,
                    video_url,
                    card_color,
                    description,
                    preview_type: video_url ? 'video' : 'surface',
                    is_active: existing ? existing.is_active !== false : true,
                    order_index,
                    thumbnail_url: existing ? (existing.thumbnail_url || '') : ''
                };

                // Optimistic UI
                const pIdx = state.projects.findIndex(p => p.id === finalId || p.slug === slug);
                if (pIdx >= 0) state.projects[pIdx] = { ...state.projects[pIdx], ...proj };
                else state.projects.push(proj);
                state.projects.sort((a, b) => (Number(a.order_index) || 0) - (Number(b.order_index) || 0));

                state.currentProjectId = null;
                document.getElementById('proj-id').value = '';
                closeModal('proj-modal');
                renderProjects();
                showToast('Saving project to Supabase…');

                try {
                    const saved = await window.PortfolioData.saveProject(proj);
                    if (saved && saved.id) {
                        const i = state.projects.findIndex(p => p.slug === slug || p.id === finalId || p.id === saved.id);
                        if (i >= 0) state.projects[i] = { ...state.projects[i], ...saved };
                        renderProjects();
                    }
                    if (projectsToShift.length > 0 && window.PortfolioData?.batchUpdateProjectOrder) {
                        window.PortfolioData.batchUpdateProjectOrder(state.projects);
                    }
                    showToast('Project saved to cloud ✓');
                } catch (err) {
                    showToast(`⚠ Project cloud save failed: ${err.message || err}`);
                    await loadAllData(true);
                }
            });
        }
    };

    const confirmAction = ({ title, message, confirmText = 'Confirm', danger = true }) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-modal-title');
            const descEl = document.getElementById('confirm-modal-desc');
            const okBtn = document.getElementById('confirm-modal-ok-btn');
            const cancelBtn = document.getElementById('confirm-modal-cancel-btn');
            const closeBtn = modal ? modal.querySelector('.modal-close') : null;

            if (!modal || !okBtn) {
                let res = true;
                try {
                    res = (typeof window.confirm === 'function') ? window.confirm(message || title) : true;
                } catch (_) {
                    res = true;
                }
                return resolve(res);
            }

            if (titleEl) titleEl.textContent = title || 'Confirm Action';
            if (descEl) descEl.textContent = message || 'Are you sure you want to proceed?';
            okBtn.textContent = confirmText;
            if (danger) {
                okBtn.className = 'btn-primary btn-danger';
            } else {
                okBtn.className = 'btn-primary';
            }

            let resolved = false;
            const finish = (result) => {
                if (resolved) return;
                resolved = true;
                closeModal('confirm-modal');
                okBtn.removeEventListener('click', onOk);
                if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
                if (closeBtn) closeBtn.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdrop);
                resolve(result);
            };

            const onOk = (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                finish(true);
            };
            const onCancel = (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                finish(false);
            };
            const onBackdrop = (e) => {
                if (e && e.target === modal) finish(false);
            };

            okBtn.addEventListener('click', onOk);
            if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
            if (closeBtn) closeBtn.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdrop);

            openModal('confirm-modal');
        });
    };

    const openModal = async (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('open');
        if (id === 'settings-modal' && window.PortfolioData) {
            try {
                const userEl = document.getElementById('settings-auth-user');
                const logoutBtn = document.getElementById('settings-logout-btn');
                if (userEl) userEl.textContent = 'PIN Protected (Active)';
                if (logoutBtn) logoutBtn.style.display = 'inline-block';
            } catch (_) {}
        }
    };

    const closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('open');
    };

    // ─────────────────────────────────────────────────────────────
    // 8. PUBLIC EXPOSED ACTIONS (Called from UI inline onclicks & global delegation)
    // ─────────────────────────────────────────────────────────────
    window.ConsoleApp = {
        async markRead(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const msg = state.messages.find(m => m.id === id);
            if (msg) msg.is_read = true;
            renderMessages();
            updateBadges();
            showToast('Marked as read ✓');
            window.PortfolioData?.markMessageRead(id);
        },

        async deleteMessage(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const confirmed = await confirmAction({
                title: 'Delete Message',
                message: 'Are you sure you want to delete this contact message? This action cannot be undone.',
                confirmText: 'Delete Message',
                danger: true
            });
            if (!confirmed) return;
            state.messages = state.messages.filter(m => m.id !== id);
            renderMessages();
            updateBadges();
            try {
                await window.PortfolioData?.deleteMessage(id);
                showToast('Message deleted ✓');
            } catch (err) {
                showToast(`⚠ Delete failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async approveReview(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const rev = state.reviews.find(r => r.id === id);
            if (rev) rev.status = 'approved';
            renderReviews();
            updateBadges();
            try {
                await window.PortfolioData?.updateReviewStatus(id, 'approved');
                showToast('Review approved & published to portfolio ✓');
            } catch (err) {
                showToast(`⚠ Approve failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async rejectReview(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const confirmed = await confirmAction({
                title: 'Reject Review',
                message: 'Are you sure you want to reject and remove this pending review?',
                confirmText: 'Reject Review',
                danger: true
            });
            if (!confirmed) return;
            state.reviews = state.reviews.filter(r => r.id !== id);
            renderReviews();
            updateBadges();
            try {
                await window.PortfolioData?.deleteReview(id);
                showToast('Review rejected & removed ✓');
            } catch (err) {
                showToast(`⚠ Reject failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async unpublishReview(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const rev = state.reviews.find(r => r.id === id);
            if (rev) rev.status = 'pending';
            renderReviews();
            updateBadges();
            try {
                await window.PortfolioData?.updateReviewStatus(id, 'pending');
                showToast('Review unpublished (moved to pending) ✓');
            } catch (err) {
                showToast(`⚠ Unpublish failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async deleteReview(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const confirmed = await confirmAction({
                title: 'Permanently Delete Review',
                message: 'Are you sure you want to permanently delete this review from both your portfolio and cloud database?',
                confirmText: 'Delete Permanently',
                danger: true
            });
            if (!confirmed) return;
            state.reviews = state.reviews.filter(r => r.id !== id);
            renderReviews();
            updateBadges();
            try {
                await window.PortfolioData?.deleteReview(id);
                showToast('Review deleted permanently ✓');
            } catch (err) {
                showToast(`⚠ Delete failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        editExperience(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const exp = state.experiences.find(e => e.id === id);
            if (!exp) return;
            document.getElementById('exp-id').value = exp.id;
            document.getElementById('exp-role').value = exp.role;
            document.getElementById('exp-company').value = exp.company;
            const cleanLoc = (exp.location || '').replace(/\s*\[(freelance|office)\]\s*/gi, '').trim();
            document.getElementById('exp-location').value = cleanLoc;

            let isFreelance = false;
            if (exp.category === 'freelance' || exp.type === 'freelance') {
                isFreelance = true;
            } else if (exp.category === 'office' || exp.type === 'office') {
                isFreelance = false;
            } else {
                const role = (exp.role || '').toLowerCase();
                const company = (exp.company || '').toLowerCase();
                isFreelance = company.includes('travoqix') || company.includes('krisha events') || role.includes('freelance');
            }

            const catEl = document.getElementById('exp-category');
            if (catEl) catEl.value = isFreelance ? 'freelance' : 'office';
            document.getElementById('exp-duration').value = exp.duration;
            document.getElementById('exp-desc').value = exp.description;

            const orderEl = document.getElementById('exp-order');
            if (orderEl) orderEl.value = exp.order_index != null ? exp.order_index : 1;

            const videoEl = document.getElementById('exp-video-url');
            if (videoEl) videoEl.value = exp.video_url || '';

            const liveEl = document.getElementById('exp-live-url');
            if (liveEl) liveEl.value = exp.live_url || '';

            document.getElementById('exp-modal-title').textContent = 'Edit Career Milestone';
            openModal('exp-modal');
        },

        async moveExperience(id, direction, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            try {
                const updated = await window.PortfolioData?.reorderExperience(id, direction, state.expFilter);
                if (Array.isArray(updated)) state.experiences = updated;
                renderExperiences();
                showToast('Position updated & synced to portfolio ✓');
            } catch (err) {
                showToast(`⚠ Reorder failed: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async deleteExperience(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const confirmed = await confirmAction({
                title: 'Remove Milestone',
                message: 'Are you sure you want to remove this experience milestone from your portfolio timeline?',
                confirmText: 'Remove Experience',
                danger: true
            });
            if (!confirmed) return;
            state.experiences = state.experiences.filter(e => e.id !== id);
            renderExperiences();
            try {
                await window.PortfolioData?.deleteExperience(id);
                showToast('Experience milestone removed ✓');
            } catch (err) {
                showToast(`⚠ Delete failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        async moveProject(id, direction, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            try {
                const updated = await window.PortfolioData?.reorderProject(id, direction);
                if (Array.isArray(updated)) state.projects = updated;
                else {
                    const idx = state.projects.findIndex(p => p.id === id || p.slug === id);
                    if (idx !== -1) {
                        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                        if (targetIdx >= 0 && targetIdx < state.projects.length) {
                            const temp = state.projects[idx];
                            state.projects[idx] = state.projects[targetIdx];
                            state.projects[targetIdx] = temp;
                            state.projects.forEach((p, i) => { p.order_index = i + 1; });
                        }
                    }
                }
                renderProjects();
                showToast('Position updated & synced to portfolio ✓');
            } catch (err) {
                showToast(`⚠ Reorder failed: ${err.message || err}`);
                await loadAllData(true);
            }
        },

        editProject(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const proj = state.projects.find(p => p.id === id || p.slug === id);
            if (!proj) return;
            state.currentProjectId = proj.id || proj.slug;
            document.getElementById('proj-id').value = proj.id || '';
            document.getElementById('proj-title').value = proj.title || '';
            document.getElementById('proj-category').value = proj.category || '';

            // Populate Carousel Display Position
            const orderInput = document.getElementById('proj-order');
            const orderVal = proj.order_index != null ? proj.order_index : 1;
            if (orderInput) {
                orderInput.value = orderVal;
                document.querySelectorAll('.btn-order-preset').forEach(b => {
                    b.classList.toggle('active', String(orderVal) === b.dataset.orderPreset);
                });
            }

            // Populate Tech Stack Chips
            if (Array.isArray(proj.tech_stack)) {
                state.selectedTechStack = [...proj.tech_stack];
            } else if (typeof proj.tech_stack === 'string') {
                state.selectedTechStack = proj.tech_stack.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                state.selectedTechStack = [];
            }
            renderTechChips();

            // Populate URLs & Video Preview
            const liveUrlInput = document.getElementById('proj-live-url');
            if (liveUrlInput) liveUrlInput.value = proj.live_url || '';

            const githubUrlInput = document.getElementById('proj-github-url');
            if (githubUrlInput) githubUrlInput.value = proj.github_url || '';

            const videoUrl = proj.video_url || '';
            const videoDataInput = document.getElementById('proj-video-data');
            if (videoDataInput) videoDataInput.value = videoUrl;

            const videoPlayer = document.getElementById('proj-video-preview');
            const videoWrap = document.getElementById('video-preview-player-wrap');
            const dropzone = document.getElementById('video-dropzone');
            const fileInfo = document.getElementById('video-file-name');

            if (videoUrl) {
                if (videoPlayer && videoWrap && dropzone) {
                    videoPlayer.src = videoUrl;
                    videoWrap.style.display = 'block';
                    dropzone.style.display = 'none';
                    if (fileInfo) fileInfo.textContent = videoUrl.startsWith('data:') ? 'Embedded Video Media' : videoUrl;
                }
            } else {
                resetVideoUpload();
            }

            // Populate Card Color System
            const cardColor = proj.card_color || '#3d8bff';
            updateColorSelectionUI(cardColor, false);
            renderColorSwatches();

            document.getElementById('proj-desc').value = proj.description || '';
            document.getElementById('proj-modal-title').textContent = 'Edit Project';
            openModal('proj-modal');
        },

        async deleteProject(id, evt) {
            if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
            const confirmed = await confirmAction({
                title: 'Remove Project',
                message: 'Are you sure you want to remove this project from your portfolio showcase and database?',
                confirmText: 'Remove Project',
                danger: true
            });
            if (!confirmed) return;
            state.projects = state.projects.filter(p => p.id !== id && p.slug !== id);
            renderProjects();
            try {
                await window.PortfolioData?.deleteProject(id);
                showToast('Project removed from portfolio showcase ✓');
            } catch (err) {
                showToast(`⚠ Delete failed in cloud: ${err.message || err}`);
                await loadAllData(true);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 9. SECURITY & BOOTSTRAP
    // ─────────────────────────────────────────────────────────────
    const lockConsole = () => {
        state.isUnlocked = false;
        if (elements.authLockOverlay) {
            elements.authLockOverlay.classList.add('visible');
            if (elements.lockPinInput) {
                elements.lockPinInput.value = '';
                if (typeof elements.lockPinInput.focus === 'function') elements.lockPinInput.focus();
            }
        }
        if (elements.lockErrorText) elements.lockErrorText.style.display = 'none';
    };

    const unlockConsole = () => {
        state.isUnlocked = true;
        if (elements.authLockOverlay) {
            elements.authLockOverlay.classList.remove('visible');
        }
        loadAllData();
        showToast('Console Unlocked ✓ Authenticated');
    };

    const checkInitialAuth = async () => {
        const isUnlocked = window.PortfolioData && window.PortfolioData.isConsoleUnlocked();
        if (isUnlocked) {
            unlockConsole();
        } else {
            lockConsole();
        }
    };

    const boot = () => {
        initPWA();
        setupEvents();
        checkInitialAuth();

        // Native Capacitor (APK) vs Web Browser adaptations
        try {
            const isNative = (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
            if (isNative) {
                const apkBtn = document.getElementById('apk-download-btn');
                if (apkBtn) apkBtn.style.display = 'none';
                if (elements.notifBar) elements.notifBar.style.display = 'none';
            }
        } catch (_) {}

        // Cross-device continuous synchronization poll (messages, reviews, projects, experiences)
        setInterval(async () => {
            if (!state.isUnlocked) return;

            const prevMsgIds = new Set(state.messages.map(m => m.id));
            const prevPendingReviews = state.reviews.filter(r => r.status === 'pending').length;
            const prevPendingIds = new Set(
                state.reviews.filter(r => r.status === 'pending').map(r => r.id)
            );
            const prevProjSig = state.projects.map(p => `${p.id}:${p.order_index}:${p.title}`).join('|');
            const prevExpSig = state.experiences.map(e => `${e.id}:${e.order_index}:${e.role}`).join('|');

            try {
                const [latestMsgs, latestReviews, latestProjs, latestExps] = await Promise.all([
                    window.PortfolioData.getMessages({ forceCloud: true }),
                    window.PortfolioData.getAllReviews({ forceCloud: true }),
                    (window.PortfolioData.getAllProjectsForAdmin ? window.PortfolioData.getAllProjectsForAdmin({ forceCloud: true }) : window.PortfolioData.getProjects({ forceCloud: true })),
                    window.PortfolioData.getExperiences({ forceCloud: true })
                ]);

                if (Array.isArray(latestMsgs)) {
                    const newOnes = latestMsgs.filter(m => m.id && !prevMsgIds.has(m.id));
                    state.messages = latestMsgs;
                    renderMessages();
                    updateBadges();
                    if (newOnes.length > 0) {
                        const newest = newOnes[0];
                        triggerNotification('New Portfolio Message 📬', `${newest.name} from ${newest.company || 'Direct'} sent an inquiry.`);
                    }
                }

                if (Array.isArray(latestReviews)) {
                    const newPending = latestReviews.filter(
                        r => r.status === 'pending' && r.id && !prevPendingIds.has(r.id)
                    );
                    state.reviews = latestReviews;
                    renderReviews();
                    updateBadges();
                    if (newPending.length > 0 || latestReviews.filter(r => r.status === 'pending').length > prevPendingReviews) {
                        if (newPending.length > 0) {
                            triggerNotification('New Client Review ⭐', 'A client has submitted a review.');
                        }
                    }
                }

                if (Array.isArray(latestProjs)) {
                    const newProjSig = latestProjs.map(p => `${p.id}:${p.order_index}:${p.title}`).join('|');
                    if (newProjSig !== prevProjSig) {
                        state.projects = latestProjs;
                        renderProjects();
                    }
                }

                if (Array.isArray(latestExps)) {
                    const newExpSig = latestExps.map(e => `${e.id}:${e.order_index}:${e.role}`).join('|');
                    if (newExpSig !== prevExpSig) {
                        state.experiences = latestExps;
                        renderExperiences();
                    }
                }
            } catch (_) {}
        }, 6000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
