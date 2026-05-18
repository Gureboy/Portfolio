/* ============================================================
   i18n.js — Portfolio Internationalization (ES / EN)
============================================================ */
window.PortfolioI18n = (function () {

  const STORAGE_KEY = 'portfolio-lang';

  const t = {
    es: {
      // ── Loader ──────────────────────────────────────────
      'loader.status':    'loading...',

      // ── Nav ─────────────────────────────────────────────
      'nav.home':         'Inicio',
      'nav.about':        'Sobre mí',
      'nav.skills':       'Habilidades',
      'nav.experience':   'Experiencia',
      'nav.projects':     'Proyectos',
      'nav.contact':      'Contacto',
      'nav.theme.dark':   'Oscuro',
      'nav.theme.light':  'Claro',
      'nav.lang.btn':     'EN',
      'nav.lang.title':   'Switch to English',

      // ── Hero ────────────────────────────────────────────
      'hero.greeting':    '¡Hola! Soy',
      'hero.title':       'Ing. Electricista & Full Stack Developer',
      'hero.desc':        'Especialista en <strong>automatización industrial</strong> bajo normas AEA · Profesor en <strong>UPRO</strong> · Sistemas IoT con ESP32/ESP8266 · Músico productor como <strong>Katosx</strong> con Ableton Live y FL Studio.',
      'hero.btn.contact': 'Contactar',
      'hero.btn.projects':'Ver Proyectos',
      'hero.btn.music':   'Música Katosx',
      'hero.scroll':      'Deslizar',

      // ── About ───────────────────────────────────────────
      'about.title':      'Sobre mí',
      'about.p1':         'Soy <strong>Daniel Salini</strong>, Ingeniero Electricista especializado en <strong>automatización industrial</strong> bajo los estándares AEA. Profesor en <strong>UPRO</strong> — Automatización Industrial y Electricidad — con la experiencia transformadora de haber enseñado en la Penitenciaría de San Luis.',
      'about.p2':         'Desarrollador Full Stack con foco en IoT: sistemas de alarmas con <strong>ESP32/ESP8266</strong> y mapas Leaflet. Manejo de <strong>Zendesk, Jira</strong> y CRM corporativos. Músico productor electrónico como <strong>Katosx</strong> con Ableton Live y FL Studio.',
      'about.quote':      '"La ingeniería me enseñó precisión, la programación versatilidad, la docencia el valor del conocimiento, y la música el alma para conectar todo con creatividad."',
      'about.status':     'Disponible para proyectos',
      'cred.engineer':    'Ingeniero Electricista',
      'cred.aea':         'Especialista AEA',
      'cred.teacher':     'Profesor UPRO',
      'cred.prison':      'Docente Penitenciaría',
      'cred.dev':         'Full Stack Developer',
      'cred.crm':         'Especialista CRM',
      'cred.iot':         'IoT — ESP32/ESP8266',
      'cred.music':       'Productor Musical',
      'stat.years':       'Años Exp.',
      'stat.projects':    'Proyectos IoT',
      'stat.students':    'Estudiantes',
      'code.available':   'disponible',

      // ── Skills ──────────────────────────────────────────
      'skills.title':         'Habilidades',
      'skills.engineering':   'Ingeniería Eléctrica',
      'skills.web':           'Desarrollo Web',
      'skills.music':         'Música (Katosx)',
      'skills.crm':           'CRM & Gestión',
      'skill.automation':     'Automatización Industrial',
      'skill.esp':            'ESP32 / ESP8266',
      'skill.aea':            'Normativas AEA',
      'skill.alarms':         'Sistemas de Alarmas IoT',
      'skill.js':             'JavaScript (ES6+)',
      'skill.mix':            'Mezcla & Mastering',
      'skill.music.prod':     'Producción Musical',
      'skill.support':        'Customer Support',
      'skill.pm':             'Project Management',

      // ── Experience ──────────────────────────────────────
      'exp.title':            'Experiencia',
      'exp.current':          'Actual',
      'exp.present':          'Presente',
      'exp.job1.title':       'Ingeniero Electricista & Automatización',
      'exp.job1.company':     'Industria / Proyectos Propios',
      'exp.job1.desc':        'Diseño e implementación de sistemas de automatización industrial bajo normas AEA. Desarrollo de sistemas de alarmas inteligentes con ESP32/ESP8266 y visualización geoespacial con Leaflet Maps.',
      'exp.job2.title':       'Profesor — UPRO',
      'exp.job2.company':     'UPRO — Universidad Provincial',
      'exp.job2.desc':        'Docente de Automatización Industrial y Electricidad. Diseño de contenidos curriculares, evaluaciones prácticas y proyectos de laboratorio. Experiencia única en Penitenciaría de San Luis.',
      'exp.job3.title':       'Full Stack Developer & CRM Specialist',
      'exp.job3.company':     'Proyectos Web & Gestión',
      'exp.job3.desc':        'Desarrollo de aplicaciones web con React y Node.js. Gestión de atención al cliente y tickets usando Zendesk y Jira en entornos corporativos.',
      'exp.job4.title':       'Productor Musical — Katosx',
      'exp.job4.company':     'Proyecto Musical Independiente',
      'exp.job4.desc':        'Producción de música electrónica y beats bajo el alias Katosx, fusionando background técnico con creatividad artística. Publicación en YouTube.',
      'ach.iot':              '20+ proyectos IoT implementados',
      'ach.aea':              'Certificación en normas AEA',
      'ach.leaflet':          'Integración ESP32 + Leaflet en producción',
      'ach.students':         '+100 estudiantes formados',
      'ach.curricula':        'Diseño de currícula práctica IoT',
      'ach.social':           'Impacto social — Penitenciaría de San Luis',
      'ach.github':           'Repositorio GitHub activo (Gureboy)',
      'ach.zendesk':          'Zendesk & Jira en producción',
      'ach.tracks':           'Tracks publicados en YouTube',
      'ach.mastering':        'Mezcla y mastering propios',

      // ── Projects ────────────────────────────────────────
      'projects.title':         'Proyectos',
      'proj1.title':            'Sistema de Alarmas IoT',
      'proj1.desc':             'Sistema inteligente con ESP8266/ESP32 y visualización en tiempo real mediante mapas interactivos Leaflet. Monitoreo remoto y alertas.',
      'proj2.title':            'Katosx — Música Electrónica',
      'proj2.desc':             'Producción musical electrónica fusionando background técnico de ingeniería con creatividad artística. Beats únicos con Ableton Live y FL Studio.',
      'proj3.title':            'Automatización Industrial AEA',
      'proj3.desc':             'Proyectos de automatización de procesos siguiendo estándares AEA para industrias. Control de procesos y monitoreo remoto SCADA.',
      'proj4.title':            'Educación Técnica — UPRO',
      'proj4.desc':             'Diseño de currícula y enseñanza de Automatización Industrial y Electricidad. Educación inclusiva en Penitenciaría de San Luis.',
      'proj5.title':            'CRM & Customer Support',
      'proj5.desc':             'Gestión de tickets, seguimiento de proyectos y atención al cliente con Zendesk, Jira y plataformas CRM especializadas.',
      'proj6.title':            'Desarrollo Full Stack',
      'proj6.desc':             'Aplicaciones web modernas con React, Node.js y APIs REST. Portfolio, dashboards y sistemas disponibles en GitHub (Gureboy).',

      // ── Contact ─────────────────────────────────────────
      'contact.title':          'Contacto',
      'contact.email.label':    'Email Profesional',
      'contact.github.label':   'GitHub',
      'contact.linkedin.label': 'LinkedIn',
      'contact.music.label':    'Katosx — Música',
      'form.type.label':        'Tipo de consulta',
      'form.type.placeholder':  'Seleccionar...',
      'form.type.opt1':         'Proyecto de Ingeniería / IoT',
      'form.type.opt2':         'Desarrollo Web / Software',
      'form.type.opt3':         'CRM / Soporte',
      'form.type.opt4':         'Consulta Académica',
      'form.type.opt5':         'Colaboración Musical',
      'form.type.opt6':         'Otro',
      'form.name.label':        'Nombre',
      'form.name.placeholder':  'Tu nombre completo',
      'form.email.label':       'Email',
      'form.email.placeholder': 'tu@email.com',
      'form.msg.label':         'Mensaje',
      'form.msg.placeholder':   'Cuéntame sobre tu proyecto...',
      'form.submit':            'Enviar Consulta',
      'form.toast.ok':          '¡Mensaje enviado! Te responderé pronto.',
      'form.toast.err':         'Por favor completá todos los campos.',

      // ── Footer ──────────────────────────────────────────
      'footer.built':     'Construido con pasión y código',
      'footer.by':        'by',

      // ── Hero badges ─────────────────────────────────────
      'badge.electrical': 'Ing. Eléctrico',

      // ── Tags ────────────────────────────────────────────
      'tag.teaching':     'Docencia',
      'tag.automation':   'Automatización',
      'tag.inclusion':    'Inclusión',
      'tag.education':    'Educación',

      // ── Easter Egg ──────────────────────────────────────
      'egg.btn':          'Púlsame',
      'egg.hint':         '¿Te atreves a explorar?',
    },

    en: {
      // ── Loader ──────────────────────────────────────────
      'loader.status':    'loading...',

      // ── Nav ─────────────────────────────────────────────
      'nav.home':         'Home',
      'nav.about':        'About',
      'nav.skills':       'Skills',
      'nav.experience':   'Experience',
      'nav.projects':     'Projects',
      'nav.contact':      'Contact',
      'nav.theme.dark':   'Dark',
      'nav.theme.light':  'Light',
      'nav.lang.btn':     'ES',
      'nav.lang.title':   'Cambiar a Español',

      // ── Hero ────────────────────────────────────────────
      'hero.greeting':    'Hello! I\'m',
      'hero.title':       'Electrical Eng. & Full Stack Developer',
      'hero.desc':        'Specialist in <strong>industrial automation</strong> under AEA standards · Professor at <strong>UPRO</strong> · IoT systems with ESP32/ESP8266 · Music producer as <strong>Katosx</strong> with Ableton Live & FL Studio.',
      'hero.btn.contact': 'Contact Me',
      'hero.btn.projects':'View Projects',
      'hero.btn.music':   'Katosx Music',
      'hero.scroll':      'Scroll',

      // ── About ───────────────────────────────────────────
      'about.title':      'About Me',
      'about.p1':         'I\'m <strong>Daniel Salini</strong>, an Electrical Engineer specialized in <strong>industrial automation</strong> under AEA standards. Professor at <strong>UPRO</strong> — Industrial Automation and Electricity — with the transformative experience of teaching at the San Luis Penitentiary.',
      'about.p2':         'Full Stack Developer focused on IoT: alarm systems with <strong>ESP32/ESP8266</strong> and Leaflet maps. Proficient in <strong>Zendesk, Jira</strong> and corporate CRM platforms. Electronic music producer as <strong>Katosx</strong> with Ableton Live and FL Studio.',
      'about.quote':      '"Engineering taught me precision, programming versatility, teaching the value of knowledge, and music the soul to connect everything with creativity."',
      'about.status':     'Available for projects',
      'cred.engineer':    'Electrical Engineer',
      'cred.aea':         'AEA Specialist',
      'cred.teacher':     'UPRO Professor',
      'cred.prison':      'Prison Educator',
      'cred.dev':         'Full Stack Developer',
      'cred.crm':         'CRM Specialist',
      'cred.iot':         'IoT — ESP32/ESP8266',
      'cred.music':       'Music Producer',
      'stat.years':       'Yrs. Exp.',
      'stat.projects':    'IoT Projects',
      'stat.students':    'Students',
      'code.available':   'true',

      // ── Skills ──────────────────────────────────────────
      'skills.title':         'Skills',
      'skills.engineering':   'Electrical Engineering',
      'skills.web':           'Web Development',
      'skills.music':         'Music (Katosx)',
      'skills.crm':           'CRM & Management',
      'skill.automation':     'Industrial Automation',
      'skill.esp':            'ESP32 / ESP8266',
      'skill.aea':            'AEA Standards',
      'skill.alarms':         'IoT Alarm Systems',
      'skill.js':             'JavaScript (ES6+)',
      'skill.mix':            'Mixing & Mastering',
      'skill.music.prod':     'Music Production',
      'skill.support':        'Customer Support',
      'skill.pm':             'Project Management',

      // ── Experience ──────────────────────────────────────
      'exp.title':            'Experience',
      'exp.current':          'Current',
      'exp.present':          'Present',
      'exp.job1.title':       'Electrical Engineer & Automation',
      'exp.job1.company':     'Industry / Own Projects',
      'exp.job1.desc':        'Design and implementation of industrial automation systems under AEA standards. Development of smart alarm systems with ESP32/ESP8266 and geospatial visualization with Leaflet Maps.',
      'exp.job2.title':       'Professor — UPRO',
      'exp.job2.company':     'UPRO — Provincial University',
      'exp.job2.desc':        'Teacher of Industrial Automation and Electricity. Design of curriculum, practical assessments and laboratory projects. Unique experience teaching at San Luis Penitentiary.',
      'exp.job3.title':       'Full Stack Developer & CRM Specialist',
      'exp.job3.company':     'Web Projects & Management',
      'exp.job3.desc':        'Web application development with React and Node.js. Customer and ticket management using Zendesk and Jira in corporate environments.',
      'exp.job4.title':       'Music Producer — Katosx',
      'exp.job4.company':     'Independent Music Project',
      'exp.job4.desc':        'Electronic music and beats production under the alias Katosx, merging technical engineering background with artistic creativity. Published on YouTube.',
      'ach.iot':              '20+ IoT projects implemented',
      'ach.aea':              'AEA standards certification',
      'ach.leaflet':          'ESP32 + Leaflet integration in production',
      'ach.students':         '100+ students trained',
      'ach.curricula':        'Practical IoT curriculum design',
      'ach.social':           'Social impact — San Luis Penitentiary',
      'ach.github':           'Active GitHub repository (Gureboy)',
      'ach.zendesk':          'Zendesk & Jira in production',
      'ach.tracks':           'Tracks published on YouTube',
      'ach.mastering':        'Own mixing and mastering',

      // ── Projects ────────────────────────────────────────
      'projects.title':         'Projects',
      'proj1.title':            'IoT Alarm System',
      'proj1.desc':             'Smart system with ESP8266/ESP32 and real-time visualization through interactive Leaflet maps. Remote monitoring and alerts.',
      'proj2.title':            'Katosx — Electronic Music',
      'proj2.desc':             'Electronic music production merging engineering technical background with artistic creativity. Unique beats with Ableton Live and FL Studio.',
      'proj3.title':            'Industrial Automation AEA',
      'proj3.desc':             'Process automation projects following AEA standards for industries. Process control and remote SCADA monitoring.',
      'proj4.title':            'Technical Education — UPRO',
      'proj4.desc':             'Curriculum design and teaching of Industrial Automation and Electricity. Inclusive education at San Luis Penitentiary.',
      'proj5.title':            'CRM & Customer Support',
      'proj5.desc':             'Ticket management, project tracking and customer service with Zendesk, Jira and specialized CRM platforms.',
      'proj6.title':            'Full Stack Development',
      'proj6.desc':             'Modern web applications with React, Node.js and REST APIs. Portfolio, dashboards and systems available on GitHub (Gureboy).',

      // ── Contact ─────────────────────────────────────────
      'contact.title':          'Contact',
      'contact.email.label':    'Professional Email',
      'contact.github.label':   'GitHub',
      'contact.linkedin.label': 'LinkedIn',
      'contact.music.label':    'Katosx — Music',
      'form.type.label':        'Query type',
      'form.type.placeholder':  'Select...',
      'form.type.opt1':         'Engineering / IoT Project',
      'form.type.opt2':         'Web Development / Software',
      'form.type.opt3':         'CRM / Support',
      'form.type.opt4':         'Academic Inquiry',
      'form.type.opt5':         'Music Collaboration',
      'form.type.opt6':         'Other',
      'form.name.label':        'Name',
      'form.name.placeholder':  'Your full name',
      'form.email.label':       'Email',
      'form.email.placeholder': 'your@email.com',
      'form.msg.label':         'Message',
      'form.msg.placeholder':   'Tell me about your project...',
      'form.submit':            'Send Query',
      'form.toast.ok':          'Message sent! I\'ll get back to you soon.',
      'form.toast.err':         'Please fill in all fields.',

      // ── Footer ──────────────────────────────────────────
      'footer.built':     'Built with passion and code',
      'footer.by':        'by',

      // ── Hero badges ─────────────────────────────────────
      'badge.electrical': 'Elec. Engineer',

      // ── Tags ────────────────────────────────────────────
      'tag.teaching':     'Teaching',
      'tag.automation':   'Automation',
      'tag.inclusion':    'Inclusion',
      'tag.education':    'Education',

      // ── Easter Egg ──────────────────────────────────────
      'egg.btn':          'Press Me',
      'egg.hint':         'Do you dare to explore?',
    }
  };

  let currentLang = localStorage.getItem(STORAGE_KEY) || 'es';

  function get(key) {
    return (t[currentLang] && t[currentLang][key]) || (t['es'][key]) || key;
  }

  function applyAll() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = get(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.tagName === 'OPTION') {
        el.textContent = val;
      } else if (val.includes('<')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = get(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = get(el.getAttribute('data-i18n-title'));
      el.setAttribute('aria-label', get(el.getAttribute('data-i18n-title')));
    });
    // Update page title
    if (currentLang === 'en') {
      document.title = 'Daniel Salini — Electrical Engineer & Full Stack Developer | Katosx';
    } else {
      document.title = 'Daniel Salini — Ingeniero Electricista & Full Stack Developer | Katosx';
    }
  }

  function setLang(lang) {
    if (!t[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyAll();
    // Reset skill animations so they re-trigger on next viewport entry
    window.AppState && (window.AppState.skillsAnimated = false);
  }

  function toggleLang() {
    setLang(currentLang === 'es' ? 'en' : 'es');
  }

  function getCurrent() { return currentLang; }

  return { get, applyAll, setLang, toggleLang, getCurrent };
})();
