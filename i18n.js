// Internationalization system for Daniel Salini Portfolio

class PortfolioI18n {
  constructor() {
    this.currentLang = localStorage.getItem('portfolio-lang') || 'es';
    this.translations = {
      es: {
        // Header
        'main-title': 'Daniel Salini',
        'alias': 'Katosx',
        'professional-badge': 'Desarrollador Fullstack & Ingeniero & Músico',
        'skill-fullstack': '🚀 Fullstack Developer',
        'skill-plc': '⚡ PLC Programming',
        'skill-music': '🎵 Music Composer',
        'skill-solver': '🎯 Problem Solver',
        'sr-desc': 'Portfolio profesional de Daniel Salini (Katosx) - Desarrollador fullstack, ingeniero y músico',

        // Animation Titles
        'anim-title-0': 'Perfil Profesional',
        'anim-title-1': 'Experiencia Freelance',
        'anim-title-2': 'Profesor UPRO',
        'anim-title-3': 'Proyectos Técnicos',
        'anim-title-4': 'Experiencia en Soporte',
        'anim-title-5': 'Experiencia Técnica',
        'anim-title-6': 'Educación',
        'anim-title-7': 'Habilidades Técnicas',
        'anim-title-8': 'Idiomas',
        'anim-title-9': 'Música & Composición',
        'anim-title-10': 'About me',
        'anim-title-11': 'Contacto',
        'anim-title-12': 'Más sobre mí',

        // Footer
        'footer-main': 'Daniel Salini',
        'footer-alias': 'También conocido como Katosx',
        'footer-quote': '"No tengo capa ni superpoderes, pero cada día me levanto y lucho con lo que tengo. Y eso, para mí, ya es ser héroe."',
        'footer-copyright': '© 2025 Daniel Salini (Katosx) | Desarrollador Fullstack & Ingeniero & Músico',
        'footer-email': 'Email',
        'footer-linkedin': 'LinkedIn',
        'footer-github': 'GitHub',

        // Loading
        'loading-text': 'Cargando portfolio...',

        // Modal Content
        'modal-close': 'Cerrar',
        'modal-contact-btn': '🚀 Contactar por Email',

        // Language Switcher
        'lang-spanish': 'Español',
        'lang-english': 'English'
      },
      en: {
        // Header
        'main-title': 'Daniel Salini',
        'alias': 'Katosx',
        'professional-badge': 'Fullstack Developer & Engineer & Musician',
        'skill-fullstack': '🚀 Fullstack Developer',
        'skill-plc': '⚡ PLC Programming',
        'skill-music': '🎵 Music Composer',
        'skill-solver': '🎯 Problem Solver',
        'sr-desc': 'Professional portfolio of Daniel Salini (Katosx) - Fullstack developer, engineer and musician',

        // Animation Titles
        'anim-title-0': 'Professional Profile',
        'anim-title-1': 'Freelance Experience',
        'anim-title-2': 'UPRO Professor',
        'anim-title-3': 'Technical Projects',
        'anim-title-4': 'Support Experience',
        'anim-title-5': 'Technical Experience',
        'anim-title-6': 'Education',
        'anim-title-7': 'Technical Skills',
        'anim-title-8': 'Languages',
        'anim-title-9': 'Music & Composition',
        'anim-title-10': 'About me',
        'anim-title-11': 'Contact',
        'anim-title-12': 'More about me',

        // Footer
        'footer-main': 'Daniel Salini',
        'footer-alias': 'Also known as Katosx',
        'footer-quote': '"I don\'t have a cape or superpowers, but every day I get up and fight with what I have. And that, for me, is already being a hero."',
        'footer-copyright': '© 2025 Daniel Salini (Katosx) | Fullstack Developer & Engineer & Musician',
        'footer-email': 'Email',
        'footer-linkedin': 'LinkedIn',
        'footer-github': 'GitHub',

        // Loading
        'loading-text': 'Loading portfolio...',

        // Modal Content
        'modal-close': 'Close',
        'modal-contact-btn': '🚀 Contact by Email',

        // Language Switcher
        'lang-spanish': 'Español',
        'lang-english': 'English'
      }
    };

    this.circleData = {
      es: [
        {
          title: "Perfil Profesional",
          text: `<div class="music-description">
                  <strong>Desarrollador Fullstack | Ingeniero Multidisciplinario | Compositor Musical</strong>
                 </div>
                 <p>Soy <strong>Daniel Salini (Katosx)</strong>, un profesional versátil con experiencia en:</p>
                 <ul>
                   <li>🚀 <strong>Desarrollo Web:</strong> React, Node.js, Python, JavaScript</li>
                   <li>⚡ <strong>Programación Industrial:</strong> PLC Siemens, SCADA, automatización</li>
                   <li>🔧 <strong>Diseño Eléctrico:</strong> Esquemas CAD, tableros, normativas AEA</li>
                   <li>🎵 <strong>Composición Musical:</strong> Producción digital, teoría avanzada</li>
                 </ul>
                 <p>Mi enfoque combina <strong>innovación técnica</strong> con <strong>creatividad artística</strong>, entregando soluciones eficientes y resultados cuantificables.</p>`
        },
        // ... más contenido en español
      ],
      en: [
        {
          title: "Professional Profile",
          text: `<div class="music-description">
                  <strong>Fullstack Developer | Multidisciplinary Engineer | Music Composer</strong>
                 </div>
                 <p>I am <strong>Daniel Salini (Katosx)</strong>, a versatile professional with experience in:</p>
                 <ul>
                   <li>🚀 <strong>Web Development:</strong> React, Node.js, Python, JavaScript</li>
                   <li>⚡ <strong>Industrial Programming:</strong> Siemens PLC, SCADA, automation</li>
                   <li>🔧 <strong>Electrical Design:</strong> CAD schematics, panels, AEA standards</li>
                   <li>🎵 <strong>Music Composition:</strong> Digital production, advanced theory</li>
                 </ul>
                 <p>My approach combines <strong>technical innovation</strong> with <strong>artistic creativity</strong>, delivering efficient solutions and quantifiable results.</p>`
        },
        // ... más contenido en inglés
      ]
    };
  }

  init() {
    this.createLanguageSwitch();
    this.translatePage();
    this.setupEventListeners();
  }

  createLanguageSwitch() {
    const langSwitch = document.createElement('div');
    langSwitch.className = 'language-switch';
    langSwitch.innerHTML = `
      <button class="lang-btn ${this.currentLang === 'es' ? 'active' : ''}" data-lang="es">
        🇪🇸 ES
      </button>
      <button class="lang-btn ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">
        🇺🇸 EN
      </button>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .language-switch {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        gap: 5px;
        background: rgba(0, 0, 0, 0.8);
        padding: 5px;
        border-radius: 25px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 122, 0, 0.3);
      }

      .lang-btn {
        background: transparent;
        border: none;
        color: #fff;
        padding: 8px 12px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .lang-btn:hover {
        background: rgba(255, 122, 0, 0.2);
      }

      .lang-btn.active {
        background: #ff7a00;
        color: #000;
      }

      @media (max-width: 768px) {
        .language-switch {
          top: 10px;
          right: 10px;
          padding: 3px;
        }
        
        .lang-btn {
          padding: 6px 10px;
          font-size: 0.8em;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(langSwitch);
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.lang-btn')) {
        const newLang = e.target.dataset.lang;
        this.switchLanguage(newLang);
      }
    });
  }

  switchLanguage(lang) {
    if (lang === this.currentLang) return;
    
    this.currentLang = lang;
    localStorage.setItem('portfolio-lang', lang);
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      }
    });

    // Translate page with animation
    this.translatePageWithAnimation();
  }

  translatePageWithAnimation() {
    // Add fade out effect
    document.body.style.opacity = '0.7';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      this.translatePage();
      
      // Fade back in
      document.body.style.opacity = '1';
      
      // Remove transition after animation
      setTimeout(() => {
        document.body.style.transition = '';
      }, 300);
    }, 150);
  }

  translatePage() {
    // Update document lang attribute
    document.documentElement.lang = this.currentLang;
    
    // Translate elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      const translation = this.translations[this.currentLang][key];
      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Translate elements with data-i18n-html attributes (for HTML content)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.dataset.i18nHtml;
      const translation = this.translations[this.currentLang][key];
      if (translation) {
        element.innerHTML = translation;
      }
    });

    // Update meta tags
    this.updateMetaTags();

    // Update CIRCLE_DATA for modals
    if (window.CIRCLE_DATA && this.circleData[this.currentLang]) {
      window.CIRCLE_DATA = this.circleData[this.currentLang];
    }
  }

  updateMetaTags() {
    const metaTags = {
      es: {
        title: 'Daniel Salini (Katosx) - Portfolio Profesional',
        description: 'Daniel Salini (Katosx) - Desarrollador fullstack, ingeniero multidisciplinario y músico especializado en PLC, desarrollo web y diseño eléctrico.',
        keywords: 'desarrollador fullstack, PLC, JavaScript, Python, React, Node.js, electricidad industrial, Katosx, Daniel Salini, compositor musical'
      },
      en: {
        title: 'Daniel Salini (Katosx) - Professional Portfolio',
        description: 'Daniel Salini (Katosx) - Fullstack developer, multidisciplinary engineer and musician specialized in PLC, web development and electrical design.',
        keywords: 'fullstack developer, PLC, JavaScript, Python, React, Node.js, industrial electricity, Katosx, Daniel Salini, music composer'
      }
    };

    const currentMeta = metaTags[this.currentLang];
    
    document.title = currentMeta.title;
    
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.content = currentMeta.description;
    
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) keywordsMeta.content = currentMeta.keywords;
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = currentMeta.title;
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = currentMeta.description;
  }

  t(key) {
    return this.translations[this.currentLang][key] || key;
  }
}

// Initialize i18n system
window.portfolioI18n = new PortfolioI18n();
