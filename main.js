/* ============================================================
   PORTFOLIO — main.js  (includes all animations)
============================================================ */

// ─── App State ────────────────────────────────────────────
const AppState = {
    currentTheme: 'dark',
    currentSection: 'home',
    isMenuOpen: false,
    isLoaded: false,
    skillsAnimated: false,
    statsAnimated: false,
};

// ─── Entry Point ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    initTheme();
    initI18n();
    initLoader();
    initNavigation();
    initMobileMenu();
    initScrollEffects();
    initFormHandlers();
    generateParticles();
    initSmoothScroll();
    initBackToTop();
    initDnDTrigger();
    registerServiceWorker();
});

// ─── Preferences ──────────────────────────────────────────
function loadPreferences() {
    const saved = localStorage.getItem('portfolio-theme');
    if (saved) AppState.currentTheme = saved;
}

// ─── Theme ────────────────────────────────────────────────
function initTheme() {
    setTheme(AppState.currentTheme, false);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    setTheme(AppState.currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(theme, save = true) {
    AppState.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (save) localStorage.setItem('portfolio-theme', theme);
    updateThemeUI(theme);
}

function updateThemeUI(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('.theme-label');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const key = theme === 'dark' ? 'nav.theme.dark' : 'nav.theme.light';
    if (span && window.PortfolioI18n) span.textContent = PortfolioI18n.get(key);
    else if (span) span.textContent = theme === 'dark' ? 'Oscuro' : 'Claro';
}

// ─── Loader ───────────────────────────────────────────────
function initLoader() {
    const loader = document.querySelector('.loader-screen');
    const pct    = document.querySelector('.loader-percentage');
    const bar    = document.querySelector('.loader-progress-bar');
    if (!loader) { initPageAnimations(); return; }

    let count = 0;
    const timer = setInterval(() => {
        count++;
        if (pct)  pct.textContent = count + '%';
        if (bar)  bar.style.width = count + '%';
        if (count >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                loader.classList.add('hidden');
                AppState.isLoaded = true;
                initPageAnimations();
            }, 450);
        }
    }, 22);
}

// ─── Navigation ───────────────────────────────────────────
function initNavigation() {
    window.addEventListener('scroll', handleScroll, { passive: true });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // close mobile menu
                    if (AppState.isMenuOpen) toggleMobileMenu();
                }
            }
        });
    });
}

function handleScroll() {
    updateHeaderOnScroll();
    updateScrollProgress();
    updateActiveNavLink();
}

function updateHeaderOnScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 60);
}

function updateScrollProgress() {
    const bar = document.querySelector('.scroll-progress-bar');
    if (!bar) return;
    const total = document.body.scrollHeight - window.innerHeight;
    const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
    bar.style.width = pct + '%';
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    let active = '';
    sections.forEach(sec => {
        const top = sec.getBoundingClientRect().top;
        if (top <= 120) active = sec.id;
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === '#' + active);
    });
}

// ─── Mobile Menu ──────────────────────────────────────────
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) toggle.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (e) => {
        if (AppState.isMenuOpen &&
            !e.target.closest('.nav-menu') &&
            !e.target.closest('.menu-toggle')) {
            toggleMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    AppState.isMenuOpen = !AppState.isMenuOpen;
    const menu   = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (menu)   menu.classList.toggle('active', AppState.isMenuOpen);
    if (toggle) {
        toggle.classList.toggle('active', AppState.isMenuOpen);
        toggle.setAttribute('aria-expanded', String(AppState.isMenuOpen));
    }
}

// ─── Scroll Fade-in ──────────────────────────────────────
function initScrollEffects() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

// ─── Form Handler ─────────────────────────────────────────
function initFormHandlers() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name    = form.querySelector('#contactName')?.value.trim() || '';
        const subject = form.querySelector('#contactType')?.value || 'Contacto desde portfolio';
        const msg     = form.querySelector('#contactMessage')?.value.trim() || '';
        if (!name || !msg) {
            showToast(window.PortfolioI18n ? PortfolioI18n.get('form.toast.err') : 'Por favor completá todos los campos.', 'error');
            return;
        }
        const body = encodeURIComponent(`Hola Daniel,\n\nSoy ${name}.\n\n${msg}`);
        const subj = encodeURIComponent(subject);
        window.location.href =
            `mailto:danielsalini77@gmail.com?subject=${subj}&body=${body}`;
        showToast(window.PortfolioI18n ? PortfolioI18n.get('form.toast.ok') : '¡Mensaje enviado!', 'success');
        form.reset();
    });
}

// ─── Particles ────────────────────────────────────────────
function generateParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const symbols = ['{}', '//', '=>', '()', '[]', '<>', '&&', '||', '++', '**', '##'];
    const count = Math.min(18, Math.floor(window.innerWidth / 70));
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'particle';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.top  = Math.random() * 100 + '%';
        el.style.animationDelay    = (Math.random() * 16) + 's';
        el.style.animationDuration = (14 + Math.random() * 12) + 's';
        el.style.fontSize = (0.9 + Math.random() * 0.7) + 'rem';
        container.appendChild(el);
    }
}

// ─── Smooth Scroll ────────────────────────────────────────
function initSmoothScroll() {
    // Exclude .nav-link elements — already handled by initNavigation()
    document.querySelectorAll('a[href^="#"]:not(.nav-link)').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ─── Service Worker ──────────────────────────────────────
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
}

// ============================================================
//  PAGE ANIMATIONS  (called after loader finishes)
// ============================================================
function initPageAnimations() {
    initHeroAnimations();
    initSkillAnimations();
    initTimelineAnimations();
    initProjectAnimations();
    initStatCounters();
}

// ─── Hero Animations ─────────────────────────────────────
function initHeroAnimations() {
    // anime.js typewriter on name-value
    const nameEl = document.querySelector('.name-value');
    if (nameEl && window.anime) {
        const full = nameEl.textContent.trim();
        nameEl.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            nameEl.textContent += full[i++] || '';
            if (i >= full.length) clearInterval(interval);
        }, 80);
    }

    // Fade-in hero elements sequentially
    const els = [
        '.hero-greeting', '.hero-name', '.hero-title',
        '.hero-description', '.hero-buttons', '.hero-social',
    ];
    if (window.anime) {
        anime({
            targets: els.join(', '),
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(120, { start: 300 }),
            duration: 700,
            easing: 'easeOutQuart',
        });
        // Profile image entrance
        anime({
            targets: '.hero-image-container',
            opacity: [0, 1],
            scale: [0.85, 1],
            rotate: [-4, 0],
            duration: 900,
            delay: 200,
            easing: 'easeOutBack',
        });
    } else {
        // Fallback without anime.js
        [...document.querySelectorAll(els.join(', ')),
         document.querySelector('.hero-image-container')].forEach((el, i) => {
            if (!el) return;
            el.style.opacity = '0';
            el.style.transition = `opacity .6s ease ${i * 0.1}s, transform .6s ease ${i * 0.1}s`;
            el.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });
    }
}

// ─── Skill Animations ────────────────────────────────────
function initSkillAnimations() {
    const skillsSection = document.querySelector('.skills-section');
    if (!skillsSection) return;

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !AppState.skillsAnimated) {
                AppState.skillsAnimated = true;
                animateSkillBars();
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    obs.observe(skillsSection);
}

function animateSkillBars() {
    document.querySelectorAll('.skill-item').forEach((item, idx) => {
        const bar     = item.querySelector('.skill-progress');
        const pctEl   = item.querySelector('.skill-percent');
        if (!bar) return;

        const target = parseInt(
            item.getAttribute('data-percent') ||
            bar.getAttribute('aria-valuenow') ||
            bar.getAttribute('data-width') || '80', 10);
        const delay  = idx * 120;

        setTimeout(() => {
            bar.style.width = target + '%';
            if (pctEl && window.anime) {
                anime({
                    targets: pctEl,
                    innerHTML: [0, target],
                    round: 1,
                    duration: 1400,
                    easing: 'easeOutQuart',
                    update: (a) => { pctEl.textContent = Math.round(a.animations[0].currentValue) + '%'; },
                });
            }
        }, delay);
    });
}

// ─── Timeline Animations ─────────────────────────────────
function initTimelineAnimations() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (window.anime) {
                    anime({
                        targets: entry.target,
                        opacity: [0, 1],
                        translateX: [-30, 0],
                        duration: 650,
                        easing: 'easeOutQuart',
                    });
                } else {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.timeline-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = 'opacity .65s ease, transform .65s ease';
        obs.observe(item);
    });
}

// ─── Project Animations ──────────────────────────────────
function initProjectAnimations() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (window.anime) {
                    anime({
                        targets: entry.target,
                        opacity: [0, 1],
                        translateY: [30, 0],
                        scale: [0.96, 1],
                        duration: 600,
                        easing: 'easeOutQuart',
                    });
                } else {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.project-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity .6s ease ${i * 0.08}s, transform .6s ease ${i * 0.08}s`;
        obs.observe(card);
    });
}

// ─── Stat Count-Up ───────────────────────────────────────
function initStatCounters() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !AppState.statsAnimated) {
                AppState.statsAnimated = true;
                animateStats();
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const statsArea = document.querySelector('.about-stats');
    if (statsArea) obs.observe(statsArea);
}

function animateStats() {
    document.querySelectorAll('.stat-number[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.textContent.replace(/\d/g, '').trim();
        if (window.anime) {
            anime({
                targets: el,
                innerHTML: [0, target],
                round: 1,
                duration: 1800,
                easing: 'easeOutQuart',
                update: (a) => {
                    el.textContent = Math.round(a.animations[0].currentValue) + suffix;
                },
            });
        } else {
            // fallback
            let current = 0;
            const step = Math.ceil(target / 50);
            const interval = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = current + suffix;
                if (current >= target) clearInterval(interval);
            }, 35);
        }
    });
}

// ─── i18n Integration ────────────────────────────────────
function initI18n() {
    if (!window.PortfolioI18n) return;
    PortfolioI18n.applyAll();
    const btn = document.getElementById('langToggle');
    if (btn) btn.addEventListener('click', () => {
        PortfolioI18n.toggleLang();
        updateThemeUI(AppState.currentTheme);
    });
}

// ─── Back To Top ─────────────────────────────────────────
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ─── Toast Notifications ─────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ─── D&D Easter Egg Trigger ──────────────────────────────
function initDnDTrigger() {
    // The click handler is bound by dnd-easter-egg.js (loaded before this file).
    // No additional binding needed here.
}
