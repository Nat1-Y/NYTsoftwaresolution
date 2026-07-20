/**
 * NYT Software Solutions Portfolio - Interactive Engine
 * Handles dynamic content switching, ecosystem filters, and mock integrations.
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
