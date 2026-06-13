/* =====================================================
   SAKTHIVEL P — PORTFOLIO
   script.js
   Modules: Loader · Network Canvas · Typed Text ·
            Navbar · Mobile Menu · Scroll Reveal ·
            Back-to-Top · Active Nav · Contact Form
   ===================================================== */

'use strict';

/* ── 1. LOADING SCREEN ──────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Hide loader after animation completes (~2s)
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Allow body scrolling after load
      document.body.style.overflow = '';
    }, 2000);
  });

  // Prevent scroll during load
  document.body.style.overflow = 'hidden';
})();


/* ── 2. NETWORK TOPOLOGY CANVAS ─────────────────── */
(function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes, animFrameId;

  // Colors pulled from CSS variables conceptually
  const CYAN  = '#00d4ff';
  const GREEN = '#39ff14';
  const WHITE = 'rgba(240, 246, 255, 0.6)';

  /* Resize canvas to full window */
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNodes();
  }

  /* Build network nodes */
  function buildNodes() {
    const count = Math.min(Math.floor((W * H) / 18000), 60);
    nodes = Array.from({ length: count }, (_, i) => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.35,
      vy:   (Math.random() - 0.5) * 0.35,
      r:    Math.random() * 2.5 + 1.5,
      pulse: Math.random() * Math.PI * 2, // phase offset for pulsing
      type:  i < 5 ? 'hub' : 'node',     // first 5 are larger hubs
    }));
  }

  /* Draw a single frame */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const now = Date.now() / 1000;

    // Draw connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[j].x - nodes[i].x;
        const dy   = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxD = nodes[i].type === 'hub' || nodes[j].type === 'hub' ? 200 : 140;

        if (dist < maxD) {
          const alpha = (1 - dist / maxD) * 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          // Hub connections glow cyan, regular connections are dim
          const isHubConn = nodes[i].type === 'hub' || nodes[j].type === 'hub';
          ctx.strokeStyle = isHubConn
            ? `rgba(0, 212, 255, ${alpha})`
            : `rgba(136, 146, 164, ${alpha * 0.5})`;
          ctx.lineWidth = isHubConn ? 0.8 : 0.4;
          ctx.stroke();

          // Animate a "packet" traveling along hub connections
          if (isHubConn && dist < 150) {
            const progress = ((now * 0.4 + i * 0.3 + j * 0.17) % 1);
            const px = nodes[i].x + dx * progress;
            const py = nodes[i].y + dy * progress;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 1.5})`;
            ctx.fill();
          }
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pulse = (Math.sin(now * 1.8 + node.pulse) + 1) / 2; // 0–1

      if (node.type === 'hub') {
        // Outer glow ring
        const glowR = node.r * 2.5 + pulse * 6;
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR * 2);
        grad.addColorStop(0, `rgba(0, 212, 255, ${0.3 + pulse * 0.2})`);
        grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + pulse * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = CYAN;
        ctx.shadowBlur = 12;
        ctx.shadowColor = CYAN;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Regular node — small dot with subtle pulse
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * (0.7 + pulse * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(136, 146, 164, ${0.4 + pulse * 0.3})`;
        ctx.fill();
      }

      // Move nodes
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > W) node.vx *= -1;
      if (node.y < 0 || node.y > H) node.vy *= -1;
    }

    animFrameId = requestAnimationFrame(draw);
  }

  /* Pause animation when not visible (performance) */
  const observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        if (!animFrameId) animFrameId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }
  });
  observer.observe(canvas.closest('.hero'));

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
})();


/* ── 3. TYPED ROLE EFFECT ───────────────────────── */
(function initTypedText() {
  const el = document.getElementById('typed-role');
  if (!el) return;

  const roles = [
    'Network Security Engineer',
    'Cisco ISE Specialist',
    'FortiNAC Engineer',
    'Network Access Control',
    'Cybersecurity Enthusiast',
  ];

  let roleIdx  = 0;
  let charIdx  = 0;
  let deleting = false;
  let timeout;

  function type() {
    const current = roles[roleIdx];

    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        // Pause at end before deleting
        timeout = setTimeout(() => { deleting = true; type(); }, 2200);
        return;
      }
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        roleIdx  = (roleIdx + 1) % roles.length;
        timeout  = setTimeout(type, 400);
        return;
      }
    }

    const speed = deleting ? 45 : 80;
    timeout = setTimeout(type, speed);
  }

  // Start after loader ~2s
  setTimeout(type, 2200);
})();


/* ── 4. NAVBAR SCROLL EFFECT ────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ── 5. ACTIVE NAV LINKS (IntersectionObserver) ── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    }
  }, { threshold: 0.3, rootMargin: '-60px 0px -40% 0px' });

  sections.forEach(section => observer.observe(section));
})();


/* ── 6. MOBILE MENU TOGGLE ──────────────────────── */
(function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('nav-links-mobile');
  if (!hamburger || !mobileMenu) return;

  function close() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on link click
  mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) close();
  });
})();


/* ── 7. SCROLL REVEAL ───────────────────────────── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Animate once
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/* ── 8. BACK TO TOP BUTTON ──────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ── 9. SMOOTH SCROLL (fallback for older browsers) */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 70; // navbar height
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ── 10. CONTACT FORM ───────────────────────────── */
(function initContactForm() {
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className   = `form-note mono-text ${type}`;
  }

  function clearStatus() {
    status.textContent = '';
    status.className   = 'form-note mono-text';
  }

  function validate() {
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    if (!name)    { setStatus('› Please enter your name.', 'error');    return false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('› Please enter a valid email.', 'error'); return false;
    }
    if (!subject) { setStatus('› Please add a subject.', 'error');     return false; }
    if (!message) { setStatus('› Please write a message.', 'error');   return false; }
    return true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearStatus();

    if (!validate()) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Sending...';

    /*
     * NOTE FOR DEPLOYMENT:
     * Replace this simulated delay with a real form service:
     *   - Formspree:  https://formspree.io/
     *   - EmailJS:    https://www.emailjs.com/
     *   - Netlify Forms (if hosted on Netlify)
     *
     * Example Formspree integration:
     *   const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({
     *       name: form.name.value,
     *       email: form.email.value,
     *       subject: form.subject.value,
     *       message: form.message.value,
     *     }),
     *   });
     */

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Success state
    setStatus('› Message sent! I\'ll get back to you shortly.', 'success');
    form.reset();

    btn.disabled    = false;
    btn.innerHTML   = '<i class="ph ph-paper-plane-tilt" aria-hidden="true"></i> Send Message';

    setTimeout(clearStatus, 6000);
  });
})();


/* ── 11. TERMINAL TYPING ANIMATION ─────────────── */
(function initTerminalAnimation() {
  const terminal = document.querySelector('.terminal-body');
  if (!terminal) return;

  // Add a subtle scan-line blink to make the terminal feel live
  let lineVisible = true;
  const blinkLine = terminal.querySelector('.t-blink');
  if (blinkLine) {
    setInterval(() => {
      blinkLine.style.opacity = lineVisible ? '0' : '1';
      lineVisible = !lineVisible;
    }, 600);
  }
})();


/* ── 12. SKILL CARD HOVER RIPPLE ────────────────── */
(function initSkillRipple() {
  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y    = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });
})();


/* ── 13. STATS COUNTER ANIMATION ────────────────── */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;

  function animateCount(el) {
    const text = el.textContent;
    const num  = parseFloat(text);
    if (isNaN(num)) return;

    const suffix  = text.replace(/[\d.]/g, '');
    const isFloat = text.includes('.');
    const duration = 1600;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = num * eased;

      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = text; // Ensure exact final value
    }

    requestAnimationFrame(step);
  }

  // Trigger when hero stats are in view
  const heroStats = document.querySelector('.hero-stats');
  if (!heroStats) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        stats.forEach(animateCount);
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.5 });

  observer.observe(heroStats);
})();
