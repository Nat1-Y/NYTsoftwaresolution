/**
 * NYT Software Solutions Portfolio - Interactive Engine
 * Handles dynamic content switching, ecosystem filters, chatbot, and professional interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const body = document.body;
  const btnBusiness = document.getElementById('btn-business');
  const btnTech = document.getElementById('btn-tech');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const servicesSubtitle = document.getElementById('services-subtitle');
  const dynamicBadge = document.getElementById('dynamic-badge');

  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileMenu = document.getElementById('mobile-nav-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');

  const techFilters = document.querySelectorAll('.filter-btn');
  const techCards = document.querySelectorAll('.tech-card');

  const projectCards = document.querySelectorAll('.project-card');
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  // ============================================================
  // 0. PAGE LOADER
  // ============================================================
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    // Hide loader after page assets ready
    window.addEventListener('load', () => {
      setTimeout(() => {
        pageLoader.classList.add('hidden');
      }, 1600); // Give the progress bar animation time to finish
    });
    // Fallback: hide after 2.5s no matter what
    setTimeout(() => pageLoader.classList.add('hidden'), 2500);
  }

  // ============================================================
  // SCROLL TO TOP
  // ============================================================
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // SCROLL REVEAL (Intersection Observer)
  // ============================================================
  const revealElements = document.querySelectorAll(
    '.section-header, .service-card, .project-card, .testimonial-card, .about-info-card, .timeline-step, .tech-card'
  );
  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => revealObserver.observe(el));

  // ============================================================
  // ANIMATED STAT COUNTERS
  // ============================================================
  function animateCounter(el, target, suffix) {
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statNums = document.querySelectorAll('.stat-num');
  const counterData = [
    { target: 20, suffix: '+' },
    { target: 8,  suffix: '+' },
    { target: 20, suffix: '+' },
    { target: 100, suffix: '%' },
  ];

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNums.forEach((el, i) => {
          if (counterData[i]) animateCounter(el, counterData[i].target, counterData[i].suffix);
        });
        statObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  if (statNums.length) statObserver.observe(statNums[0].closest('.hero-stats') || statNums[0]);

  // ============================================================
  // ACTIVE NAV HIGHLIGHT ON SCROLL
  // ============================================================
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main section[id]');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active-nav');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active-nav');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(sec => navObserver.observe(sec));

  // ============================================================
  // TESTIMONIALS CAROUSEL
  // ============================================================
  const track = document.getElementById('testimonials-track');
  const slides = track ? track.querySelectorAll('.testimonial-slide') : [];
  const dots = document.querySelectorAll('.testi-dot');
  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');
  let currentSlide = 0;
  let autoSlideTimer = null;

  function goToSlide(idx) {
    currentSlide = (idx + slides.length) % slides.length;
    slides.forEach(s => {
      s.style.transform = `translateX(-${currentSlide * 100}%)`;
    });
    dots.forEach(d => d.classList.remove('active'));
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  }

  function startAutoSlide() {
    autoSlideTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
  }

  if (slides.length) {
    // Lay all slides in a row
    slides.forEach(s => { s.style.transform = 'translateX(0)'; });
    track.style.position = 'relative';

    prevBtn && prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoSlide(); });
    nextBtn && nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoSlide(); });
    dots.forEach(dot => {
      dot.addEventListener('click', () => { goToSlide(+dot.dataset.idx); resetAutoSlide(); });
    });

    startAutoSlide();
  }

  // ============================================================
  // CHATBOT ENGINE
  // ============================================================
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotMinimize = document.getElementById('chatbot-minimize');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSend = document.getElementById('chatbot-send');
  const chatbotNotif = document.querySelector('.chatbot-notif');
  const openIcon = document.querySelector('.chatbot-open-icon');
  const closeIcon = document.querySelector('.chatbot-close-icon');
  const suggestBtns = document.querySelectorAll('.suggest-btn');

  let chatOpen = false;
  let greeted = false;

  // FAQ Knowledge Base
  const faqDB = [
    {
      patterns: ['service', 'offer', 'do', 'what', 'build', 'develop'],
      response: "We specialize in 5 core areas:\n\n• 🏢 **Enterprise ERP & SaaS** — Multi-tenant, role-based systems\n• 🍽️ **Hospitality & POS** — Restaurant POS with offline resilience\n• 🏥 **Healthcare Systems** — Patient EHR, billing & HIPAA compliance\n• 🛒 **E-Commerce & Logistics** — Multi-vendor marketplaces\n• 📱 **Mobile Apps** — Flutter & React Native cross-platform\n\nReach out via the Contact section to discuss your specific needs!"
    },
    {
      patterns: ['quote', 'price', 'cost', 'how much', 'rate', 'pricing'],
      response: "Our pricing depends on project scope, timeline, and complexity. We offer:\n\n• **Fixed-price** quotes for well-defined projects\n• **Monthly retainer** for ongoing remote team partnerships\n• **Milestone-based** billing for larger platforms\n\nUse the Contact form below for a free, no-obligation quote. We typically respond within 4 hours! 📩"
    },
    {
      patterns: ['remote', 'international', 'global', 'timezone', 'hire'],
      response: "Yes! We actively partner with international companies as a dedicated remote engineering team.\n\nWe offer:\n✓ Timezone-adapted stand-ups (EU, US, Asia-friendly)\n✓ Fluent technical English communication\n✓ GitHub-based workflows & sprint reports\n✓ Cost-efficient rates vs. Western agencies\n\nWe're based in Addis Ababa, Ethiopia 🇪🇹 — perfect for overlap with EU/Africa timezones."
    },
    {
      patterns: ['tech', 'stack', 'technology', 'framework', 'language'],
      response: "Our full tech ecosystem includes:\n\n**Frontend:** Next.js, React, Vue.js, Flutter, TypeScript\n**Backend:** Node.js, NestJS, FastAPI, Laravel, Python\n**Databases:** PostgreSQL, MongoDB, MySQL, Redis, Firebase\n**Infrastructure:** AWS, Google Cloud, Docker, Nginx, CI/CD Pipelines\n\nScroll to the Tech Ecosystem section to explore our full stack! ⚡"
    },
    {
      patterns: ['project', 'portfolio', 'case', 'example', 'work', 'sample'],
      response: "Our live production case studies include:\n\n• 🍖 **Fikrekun Spagna** — Multi-tenant restaurant & butchery POS\n• 🏥 **Saron Orthopedic** — Clinical patient management ERP\n• 🎡 **Bora Amusement Park** — QR ticketing (5,000+ daily validations)\n• 🛒 **Merkato88** — Multi-vendor marketplace (150+ merchants)\n\nEach project card has a live URL you can visit right now!"
    },
    {
      patterns: ['contact', 'reach', 'email', 'talk', 'call', 'consult'],
      response: "You can reach us directly:\n\n📧 **Email:** nytsoftwaresolutionplc@gmail.com\n💻 **GitHub:** github.com/Nat1-Y\n📍 **Location:** Addis Ababa, Ethiopia\n\nOr fill in the **Contact Form** at the bottom of this page — we reply within 4 hours during business days! 🕐"
    },
    {
      patterns: ['cafe', 'manager', 'flagship', 'nyt cafe', 'saas'],
      response: "**NYT Cafe Manager** is our flagship SaaS platform built for modern hospitality:\n\n✓ Multi-Tenant Schema isolation\n✓ Kitchen Display System (KDS)\n✓ Offline POS Resiliency\n✓ OTA Software Delivery\n✓ COGS & Profit Dashboards\n✓ Multi-Branch Sync\n\nRequest a demo via the Contact section — we'll set up a personalized walkthrough! 🚀"
    },
    {
      patterns: ['hello', 'hi', 'hey', 'good', 'morning', 'afternoon', 'evening'],
      response: "Hello! 👋 Welcome to NYT Software Solutions!\n\nI'm here to answer any questions about our services, projects, tech stack, or how to get started. What can I help you with today?"
    },
    {
      patterns: ['thank', 'thanks', 'great', 'awesome', 'perfect', 'nice'],
      response: "You're welcome! 😊 If you have any other questions about NYT Software Solutions or want to start a project conversation, feel free to ask or use the Contact form below!"
    }
  ];

  function getBotResponse(userText) {
    const text = userText.toLowerCase();
    for (const faq of faqDB) {
      if (faq.patterns.some(p => text.includes(p))) {
        return faq.response;
      }
    }
    return "That's a great question! For specific inquiries, please reach out directly at **nytsoftwaresolutionplc@gmail.com** or use the Contact form below — our team will get back to you within 4 hours. 📩\n\nYou can also ask me about our services, pricing, tech stack, or case studies!";
  }

  function renderMessage(text, role) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'bot' ? 'NYT' : 'You';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    // Convert **bold** markdown
    bubble.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    msgEl.appendChild(avatar);
    msgEl.appendChild(bubble);
    chatbotMessages.appendChild(msgEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function showTyping() {
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message bot';
    typingEl.id = 'typing-indicator-msg';
    typingEl.innerHTML = `
      <div class="msg-avatar">NYT</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    chatbotMessages.appendChild(typingEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingEl;
  }

  function sendMessage(text) {
    if (!text.trim()) return;

    // Hide suggestions after first real message
    const sugg = document.getElementById('chatbot-suggestions');
    if (sugg) sugg.style.display = 'none';

    renderMessage(text, 'user');
    chatbotInput.value = '';

    const typingEl = showTyping();
    const delay = 800 + Math.random() * 700;

    setTimeout(() => {
      typingEl.remove();
      renderMessage(getBotResponse(text), 'bot');
    }, delay);
  }

  function openChat() {
    chatOpen = true;
    chatbotWindow.classList.add('open');
    openIcon.style.display = 'none';
    closeIcon.style.display = 'flex';
    if (chatbotNotif) chatbotNotif.classList.add('hidden');

    if (!greeted) {
      greeted = true;
      setTimeout(() => {
        renderMessage("👋 Hi! I'm the NYT Assistant. How can I help you today?\n\nAsk me about our **services**, **tech stack**, **pricing**, or **case studies**!", 'bot');
      }, 400);
    }
    setTimeout(() => chatbotInput.focus(), 500);
  }

  function closeChat() {
    chatOpen = false;
    chatbotWindow.classList.remove('open');
    openIcon.style.display = 'flex';
    closeIcon.style.display = 'none';
  }

  chatbotToggle && chatbotToggle.addEventListener('click', () => chatOpen ? closeChat() : openChat());
  chatbotMinimize && chatbotMinimize.addEventListener('click', closeChat);

  chatbotSend && chatbotSend.addEventListener('click', () => sendMessage(chatbotInput.value));
  chatbotInput && chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(chatbotInput.value);
  });

  suggestBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!chatOpen) openChat();
      setTimeout(() => sendMessage(btn.dataset.question), chatOpen ? 0 : 600);
    });
  });

  // Auto-open chat after 8 seconds with a greeting notification
  setTimeout(() => {
    if (!chatOpen && chatbotNotif) {
      chatbotNotif.style.animation = 'notifBounce 0.5s ease 3';
    }
  }, 8000);

  // --- 1. Global Perspective Switching Logic ---

  // High-converting copywriting variations for the modes
  const copywriting = {
    business: {
      badge: "Serving Clients Worldwide | Based in Ethiopia",
      heroSubtitle: "We build robust, secure, and highly scalable software solutions. From hospital ERP systems and offline-first retail POS networks to multi-vendor marketplaces, we align technical depth with real business outcomes.",
      servicesSubtitle: "Enterprise software built to automate operations, eliminate data leaks, and accelerate business growth."
    },
    tech: {
      badge: "Remote Engineering Partner | Agile & Fluent English",
      heroSubtitle: "Enterprise-grade engineering for scalable cloud networks. Specializing in schema-isolated multi-tenancy, serverless background workers, offline-resilient local caches, and optimized API design.",
      servicesSubtitle: "Vetted frameworks, modular components, and highly structured logic layouts optimized for global standards."
    }
  };

  /**
   * Updates the global page perspective mode
   * @param {string} mode - Either 'business' or 'tech'
   */
  function setPerspectiveMode(mode) {
    if (mode === 'business') {
      body.classList.remove('mode-tech');
      body.classList.add('mode-business');

      btnTech.classList.remove('active');
      btnBusiness.classList.add('active');

      // Update Copywriting
      updateTextContent(dynamicBadge, copywriting.business.badge);
      updateTextContent(heroSubtitle, copywriting.business.heroSubtitle);
      updateTextContent(servicesSubtitle, copywriting.business.servicesSubtitle);

      // Force all case study inner tabs to align to 'business'
      alignCaseStudyTabs('business');
    } else {
      body.classList.remove('mode-business');
      body.classList.add('mode-tech');

      btnBusiness.classList.remove('active');
      btnTech.classList.add('active');

      // Update Copywriting
      updateTextContent(dynamicBadge, copywriting.tech.badge);
      updateTextContent(heroSubtitle, copywriting.tech.heroSubtitle);
      updateTextContent(servicesSubtitle, copywriting.tech.servicesSubtitle);

      // Force all case study inner tabs to align to 'tech'
      alignCaseStudyTabs('tech');
    }
  }

  /**
   * Helper to animate text updates for polished UX
   */
  function updateTextContent(element, newText) {
    if (!element) return;
    element.style.opacity = 0;
    setTimeout(() => {
      element.textContent = newText;
      element.style.transition = 'opacity 0.3s ease';
      element.style.opacity = 1;
    }, 200);
  }

  /**
   * Aligns all project card inner tabs to the selected global view
   */
  function alignCaseStudyTabs(targetTab) {
    projectCards.forEach(card => {
      const tabButtons = card.querySelectorAll('.card-tab-btn');
      const tabContents = card.querySelectorAll('.card-tab-content');

      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === targetTab) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      tabContents.forEach(content => {
        if (content.getAttribute('data-tab-content') === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  }

  // Bind Switcher Clicks
  btnBusiness.addEventListener('click', () => setPerspectiveMode('business'));
  btnTech.addEventListener('click', () => setPerspectiveMode('tech'));


  // --- 2. Case Study Card Individual Tab Switchers ---
  projectCards.forEach(card => {
    const tabButtons = card.querySelectorAll('.card-tab-btn');
    const tabContents = card.querySelectorAll('.card-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        // Deactivate all buttons/contents in this specific card
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate selected tab & matching content
        btn.classList.add('active');
        card.querySelector(`[data-tab-content="${targetTab}"]`).classList.add('active');
      });
    });
  });


  // --- 3. Tech Ecosystem Categorization & Filters ---
  techFilters.forEach(button => {
    button.addEventListener('click', () => {
      // Toggle active filter button
      techFilters.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const filterValue = button.getAttribute('data-filter');

      techCards.forEach(card => {
        const categories = card.getAttribute('data-category').split(' ');

        if (filterValue === 'all' || categories.includes(filterValue)) {
          card.classList.remove('hidden');
          card.style.transform = 'scale(1)';
        } else {
          card.classList.add('hidden');
          card.style.transform = 'scale(0.92)';
        }
      });
    });
  });


  // --- 4. Mobile Dropdown Menu Logic ---
  mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');

    // Animate hamburger lines
    const bars = mobileToggle.querySelectorAll('.bar');
    if (mobileMenu.classList.contains('active')) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
      bars[0].style.transform = 'none';
      bars[1].style.opacity = '1';
      bars[2].style.transform = 'none';
    }
  });

  // Close mobile menu when nav link is clicked
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      const bars = mobileToggle.querySelectorAll('.bar');
      bars[0].style.transform = 'none';
      bars[1].style.opacity = '1';
      bars[2].style.transform = 'none';
    });
  });


  // --- 5. Interactive Consultation Form Verification ---
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('.form-submit');
      const originalBtnText = submitBtn.innerHTML;

      // UI validation check
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        showStatus('Please fill in all required fields.', 'error');
        return;
      }

      // Enter Sending/Loading State
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span>Sending...</span>
        <svg class="animate-pulse" viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
      `;
      formStatus.textContent = '';

      // Simulate network request latency (1.2 seconds)
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        // Success Feedback
        showStatus('✓ Thank you! Your request has been received. Our team will review and reply within 4 hours.', 'success');
        contactForm.reset();
      }, 1200);
    });
  }

  function showStatus(text, type) {
    formStatus.textContent = text;
    formStatus.className = 'form-status'; // Reset classes
    formStatus.classList.add(type);

    // Auto-clear error statuses after 5s, keep success visible
    if (type === 'error') {
      setTimeout(() => {
        if (formStatus.textContent === text) {
          formStatus.textContent = '';
        }
      }, 5000);
    }
  }

  // --- Initial Setup Execution ---
  // Default to business view initially
  setPerspectiveMode('business');
});
