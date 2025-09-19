document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    window.addEventListener('load', function() {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 500);
    });

    // Navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }

        lastScrollY = currentScrollY;
    });

    // Skills animation on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillLevels = entry.target.querySelectorAll('.skill-level');
                skillLevels.forEach(level => {
                    level.style.width = level.dataset.level + '%';
                });
            }
        });
    }, observerOptions);

    const skillsSection = document.querySelector('.skills');
    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }

    // Game Modal functionality
    const gameModal = document.getElementById('game-modal');
    const gameTrigger = document.getElementById('game-trigger');
    const playGameBtn = document.getElementById('play-game-btn');
    const gameClose = document.getElementById('game-close');

    function openGameModal() {
        gameModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize game if not already initialized
        if (window.showWelcomeScreen) {
            window.showWelcomeScreen();
        }
    }

    function closeGameModal() {
        gameModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Event listeners for game modal
    if (gameTrigger) {
        gameTrigger.addEventListener('click', openGameModal);
    }
    
    if (playGameBtn) {
        playGameBtn.addEventListener('click', openGameModal);
    }
    
    if (gameClose) {
        gameClose.addEventListener('click', closeGameModal);
    }

    // Close modal when clicking outside
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            closeGameModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && gameModal.classList.contains('active')) {
            closeGameModal();
        }
    });

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Por favor, completa todos los campos.');
                return;
            }
            
            // Here you would typically send the data to a server
            // For now, we'll just show a success message
            alert('¡Gracias por tu mensaje! Te responderé pronto.');
            this.reset();
        });
    }

    // Add animation class to sections on scroll
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all sections for animation
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        sectionObserver.observe(section);
    });

    // Typing effect for hero title
    function typeWriter(element, text, speed = 100) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    // Start typing effect when hero is visible
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const heroName = entry.target.querySelector('.hero-name');
                if (heroName && !heroName.classList.contains('typed')) {
                    heroName.classList.add('typed');
                    setTimeout(() => {
                        typeWriter(heroName, 'Daniel Salini', 150);
                    }, 500);
                }
            }
        });
    }, { threshold: 0.5 });

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }

    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Project cards hover effect
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) rotateX(5deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateX(0deg)';
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
                const originalText = this.textContent;
                this.textContent = 'Cargando...';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });

    // Mobile performance optimization
    if (window.innerWidth <= 768) {
        // Disable parallax on mobile
        const style = document.createElement('style');
        style.textContent = `
            .hero { transform: none !important; }
            .project-card { transform: none !important; }
        `;
        document.head.appendChild(style);
    }

    // Initialize tooltips for skill items
    document.querySelectorAll('.skill-item').forEach(item => {
        const level = item.querySelector('.skill-level');
        if (level) {
            const percentage = level.dataset.level;
            item.title = `Nivel de competencia: ${percentage}%`;
        }
    });

    // Add social media sharing functionality
    function shareProject(projectName, projectUrl) {
        if (navigator.share) {
            navigator.share({
                title: `Proyecto: ${projectName}`,
                text: `Echa un vistazo a este increíble proyecto de Daniel Salini`,
                url: projectUrl
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const text = `Echa un vistazo a este proyecto: ${projectName} - ${projectUrl}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                alert('¡Enlace copiado al portapapeles!');
            }
        }
    }

    // Initialize intersection observer for fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });

    fadeElements.forEach(el => fadeObserver.observe(el));
});

// Utility functions
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Page Load Time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }, 0);
    });
}

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
