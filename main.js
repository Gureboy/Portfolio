$(document).ready(function() {
    // Preloader
    $(window).on('load', function() {
        setTimeout(() => {
            $('#preloader').addClass('hidden');
        }, 500);
    });

    // Navigation toggle
    $('#nav-toggle').on('click', function() {
        $('#nav-menu').toggleClass('active');
        $(this).toggleClass('active');
    });

    // Close mobile menu when clicking on a link
    $('.nav-link').on('click', function() {
        $('#nav-menu').removeClass('active');
        $('#nav-toggle').removeClass('active');
    });

    // Smooth scrolling for navigation links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 800);
        }
    });

    // Header scroll effect
    $(window).on('scroll', function() {
        const scrollTop = $(this).scrollTop();
        const $header = $('.header');
        
        if (scrollTop > 100) {
            $header.css({
                'background': 'rgba(255, 255, 255, 0.98)',
                'box-shadow': '0 2px 20px rgba(0, 0, 0, 0.1)'
            });
        } else {
            $header.css({
                'background': 'rgba(255, 255, 255, 0.95)',
                'box-shadow': 'none'
            });
        }
    });

    // Skills animation on scroll
    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                $(entry.target).find('.skill-level').each(function() {
                    const level = $(this).data('level');
                    $(this).css('width', level + '%');
                });
            }
        });
    }, { threshold: 0.5 });

    if ($('.skills')[0]) {
        skillsObserver.observe($('.skills')[0]);
    }

    // Game Modal functionality con jQuery
    function openGameModal() {
        $('#game-modal').addClass('active');
        $('body').css('overflow', 'hidden');
        
        // Initialize game
        if (typeof showWelcomeScreen === 'function') {
            showWelcomeScreen();
        }
    }

    function closeGameModal() {
        $('#game-modal').removeClass('active');
        $('body').css('overflow', 'auto');
    }

    // Event listeners for game modal
    $('#game-trigger, #play-game-btn').on('click', openGameModal);
    $('#game-close').on('click', closeGameModal);

    // Close modal when clicking outside
    $('#game-modal').on('click', function(e) {
        if (e.target === this) {
            closeGameModal();
        }
    });

    // Close modal with Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#game-modal').hasClass('active')) {
            closeGameModal();
        }
    });

    // Contact form handling
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#name').val();
        const email = $('#email').val();
        const message = $('#message').val();
        
        if (!name || !email || !message) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        
        alert('¡Gracias por tu mensaje! Te responderé pronto.');
        this.reset();
    });

    // Add animation to sections on scroll
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                $(entry.target).css({
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            }
        });
    }, { threshold: 0.1 });

    $('.section').each(function() {
        $(this).css({
            'opacity': '0',
            'transform': 'translateY(50px)',
            'transition': 'opacity 0.8s ease, transform 0.8s ease'
        });
        sectionObserver.observe(this);
    });

    // Typing effect for hero title
    function typeWriter($element, text, speed = 100) {
        let i = 0;
        $element.text('');
        
        function type() {
            if (i < text.length) {
                $element.text($element.text() + text.charAt(i));
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
                const $heroName = $(entry.target).find('.hero-name');
                if ($heroName.length && !$heroName.hasClass('typed')) {
                    $heroName.addClass('typed');
                    setTimeout(() => {
                        typeWriter($heroName, 'Daniel Salini', 150);
                    }, 500);
                }
            }
        });
    }, { threshold: 0.5 });

    if ($('.hero')[0]) {
        heroObserver.observe($('.hero')[0]);
    }

    // Parallax effect for hero background
    $(window).on('scroll', function() {
        const scrolled = $(this).scrollTop();
        const $hero = $('.hero');
        if ($hero.length && scrolled < $(window).height()) {
            $hero.css('transform', `translateY(${scrolled * 0.5}px)`);
        }
    });

    // Project cards hover effect
    $('.project-card').on('mouseenter', function() {
        $(this).css('transform', 'translateY(-10px) rotateX(5deg)');
    }).on('mouseleave', function() {
        $(this).css('transform', 'translateY(0) rotateX(0deg)');
    });

    // Add loading states to buttons
    $('.btn').on('click', function() {
        const $btn = $(this);
        if (!$btn.hasClass('loading')) {
            $btn.addClass('loading');
            const originalText = $btn.text();
            $btn.text('Cargando...');
            
            setTimeout(() => {
                $btn.text(originalText);
                $btn.removeClass('loading');
            }, 1000);
        }
    });

    // Circle animation interactivity
    document.querySelectorAll('.circle').forEach(circle => {
        circle.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
            
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
            `;
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        circle.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Intersection Observer para activar animaciones
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };

    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animations
    document.querySelectorAll('.skill-category, .project-card').forEach(el => {
        animateOnScroll.observe(el);
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
