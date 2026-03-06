/* ===================================================
   FAZ Cyberautics Solutions — Main JavaScript
   =================================================== */

// --- Preloader ---
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.classList.add('loaded');
    initAnimations();
    initNeuralCanvas();
    initAITyping();
  }, 800);
});

// --- Cursor Glow ---
const cursorGlow = document.getElementById('cursor-glow');
if (window.innerWidth > 768) {
  document.addEventListener('mousemove', (e) => {
    requestAnimationFrame(() => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    });
  });
}

// --- Navbar ---
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileClose = document.getElementById('mobileClose');
const mobileLinks = document.querySelectorAll('.mobile-link');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;

  // Back to top button
  const backToTop = document.getElementById('backToTop');
  if (currentScroll > 500) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }

  // Update active nav link
  updateActiveNav();
});

// Mobile menu
function openMobileMenu() {
  mobileMenu.classList.add('active');
  mobileOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('active');
  mobileOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

navToggle.addEventListener('click', openMobileMenu);
mobileClose.addEventListener('click', closeMobileMenu);
mobileOverlay.addEventListener('click', closeMobileMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

// Active nav link on scroll
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.pageYOffset + 200;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// --- Counter Animation ---
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');

  counters.forEach(counter => {
    if (counter.dataset.animated) return;

    const target = parseInt(counter.dataset.count);
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      counter.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target;
      }
    }

    counter.dataset.animated = 'true';
    requestAnimationFrame(update);
  });
}

// --- Scroll Animations (Custom AOS) ---
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.aosDelay) || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, delay);

        // Trigger counter animation when stats are visible
        if (entry.target.classList.contains('hero-stats')) {
          animateCounters();
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
  });

  // Observe hero stats separately
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statsObserver.observe(heroStats);
  }
}

// --- Contact Form (WA Gateway via Backend Proxy) ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById('contactSubmit');
    const name = document.getElementById('contactName').value.trim();
    const whatsapp = document.getElementById('contactWhatsapp').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !whatsapp || !subject || !message) {
      showToast('Mohon lengkapi semua field terlebih dahulu.', 'error');
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> <span>Mengirim...</span>';

    try {
      const response = await fetch('/api/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, subject, message }),
      });

      const data = await response.json();

      if (data.status === true) {
        showToast('Pesan berhasil dikirim via WhatsApp! ✅ Kami akan segera merespons.', 'success');
        contactForm.reset();
      } else {
        showToast(data.msg || 'Gagal mengirim pesan. Silakan coba lagi.', 'error');
      }
    } catch (error) {
      console.error('Send error:', error);
      showToast('Terjadi kesalahan jaringan. Silakan coba lagi nanti.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Kirim via WhatsApp</span> <i class="fab fa-whatsapp"></i>';
    }
  });
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    </div>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto remove after 5s
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// --- Back to Top ---
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// --- Service Cards Tilt Effect ---
if (window.innerWidth > 768) {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ===================================================
// AI FEATURES
// ===================================================

// --- Neural Network Canvas ---
function initNeuralCanvas() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
      ctx.fill();
    }
  }

  // Create particles
  const particleCount = Math.min(80, Math.floor(canvas.width * canvas.height / 15000));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const opacity = (1 - dist / 150) * 0.15;
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();

    animationId = requestAnimationFrame(animate);
  }

  // Only animate when hero is visible
  const heroSection = document.getElementById('hero');
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate();
      } else {
        cancelAnimationFrame(animationId);
      }
    });
  }, { threshold: 0.1 });

  canvasObserver.observe(heroSection);
}

// --- AI Typing Effect in Hero ---
function initAITyping() {
  const typingEl = document.getElementById('aiTypingText');
  if (!typingEl) return;

  const phrases = [
    'Menganalisis kebutuhan bisnis Anda...',
    'Merancang arsitektur AI yang optimal...',
    'Training model machine learning...',
    'Mengoptimalkan performa sistem...',
    'Memproses data dengan neural network...',
    'Automasi proses bisnis dengan AI...',
    'Mendeteksi anomali secara real-time...',
    'Menghasilkan insight dari big data...',
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typingEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let speed = isDeleting ? 30 : 50;

    if (!isDeleting && charIndex === currentPhrase.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      speed = 300;
    }

    setTimeout(type, speed);
  }

  type();
}

// --- AI Chatbot Widget ---
(function initAIChatbot() {
  const widget = document.getElementById('aiChatWidget');
  const fab = document.getElementById('aiChatFab');
  const closeBtn = document.getElementById('aiChatClose');
  const input = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');
  const messages = document.getElementById('aiChatMessages');

  if (!widget || !fab) return;

  // Toggle chat
  fab.addEventListener('click', () => {
    widget.classList.toggle('open');
    if (widget.classList.contains('open')) {
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    widget.classList.remove('open');
  });

  // AI responses database
  const aiResponses = {
    greetings: ['halo', 'hai', 'hi', 'hey', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum'],
    services: ['layanan', 'service', 'jasa', 'produk', 'apa saja', 'penawaran'],
    pricing: ['harga', 'biaya', 'tarif', 'pricing', 'berapa', 'murah', 'mahal', 'paket'],
    ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'chatbot', 'nlp', 'kecerdasan buatan', 'deep learning'],
    security: ['keamanan', 'security', 'cyber', 'siber', 'hack', 'firewall', 'penetration'],
    contact: ['kontak', 'hubungi', 'telepon', 'email', 'whatsapp', 'wa', 'alamat'],
    cloud: ['cloud', 'aws', 'azure', 'google cloud', 'server', 'hosting'],
  };

  const responses = {
    greetings: 'Halo! 👋 Selamat datang di FAZ Cyberautics Solutions. Saya AI Assistant yang siap membantu. Apa yang ingin Anda ketahui tentang layanan kami?',
    services: 'Layanan kami meliputi:\n\n🔹 Software Development\n🔹 Keamanan IT & Cyber Security\n🔹 Cloud Solutions\n🔹 AI & Machine Learning\n🔹 IT Consulting\n🔹 Infrastruktur IT\n🔹 DevOps Solutions\n🔹 IT Support 24/7\n\nMau tahu detail layanan yang mana?',
    pricing: 'Untuk informasi harga, kami menyesuaikan dengan kebutuhan spesifik tiap klien. Silakan hubungi tim kami untuk konsultasi GRATIS:\n\n📞 +62 838 311 77 060\n📧 cyberautics@faz.my.id\n\nAtau klik tombol "Kirim via WhatsApp" di bagian kontak! 😊',
    ai: '🧠 Layanan AI kami mencakup:\n\n• Machine Learning — Predictive analytics, anomaly detection, recommendation engine\n• NLP & Chatbot — Asisten virtual cerdas untuk bisnis Anda\n• Computer Vision — OCR, quality control, analisis gambar\n• Data Analytics — Big data processing & business intelligence\n\nKami sudah men-deploy 50+ model AI untuk berbagai industri!',
    security: '🛡️ Layanan Keamanan IT kami:\n\n• Penetration Testing\n• Security Audit & Assessment\n• SOC (Security Operations Center)\n• Data Encryption & Protection\n• Incident Response\n• Compliance Management\n\nKeamanan data Anda adalah prioritas kami!',
    contact: '📞 Hubungi kami:\n\n• Telepon: +62 838 311 77 060\n• Email: cyberautics@faz.my.id\n• Email: support@faz.my.id\n• Alamat: Jl MT Haryono, Grogol, Sukoharjo\n\nKami siap melayani 24/7!',
    cloud: '☁️ Cloud Solutions kami:\n\n• Multi-cloud management (AWS, Azure, GCP)\n• Cloud migration & consultation\n• Infrastructure as Code (Terraform, Ansible)\n• Container orchestration (Docker, K8s)\n• Cloud cost optimization\n\nPartner resmi berbagai cloud provider!',
    default: 'Terima kasih atas pertanyaan Anda! 🤖 Untuk informasi lebih detail, silakan hubungi tim kami:\n\n📞 +62 838 311 77 060\n📧 cyberautics@faz.my.id\n\nAtau jelaskan lebih detail apa yang Anda butuhkan, saya akan coba bantu!',
  };

  function getAIResponse(message) {
    const lowerMsg = message.toLowerCase();

    for (const [category, keywords] of Object.entries(aiResponses)) {
      for (const keyword of keywords) {
        if (lowerMsg.includes(keyword)) {
          return responses[category];
        }
      }
    }

    return responses.default;
  }

  function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-bot'}`;

    if (!isUser) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-robot';
      msgDiv.appendChild(icon);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'ai-msg-text';
    textDiv.textContent = text;
    msgDiv.appendChild(textDiv);

    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg ai-msg-bot';
    typingDiv.id = 'aiTypingBubble';

    const icon = document.createElement('i');
    icon.className = 'fas fa-robot';
    typingDiv.appendChild(icon);

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'ai-msg-text';
    dotsDiv.innerHTML = '<div class="ai-typing-dots"><span></span><span></span><span></span></div>';
    typingDiv.appendChild(dotsDiv);

    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('aiTypingBubble');
    if (typing) typing.remove();
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';

    // Show typing indicator
    addTypingIndicator();

    // Simulate AI thinking
    const thinkTime = 800 + Math.random() * 1200;
    setTimeout(() => {
      removeTypingIndicator();
      const response = getAIResponse(text);
      addMessage(response);
    }, thinkTime);
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
})();

// --- AI Particles Background for AI Section ---
(function initAIParticles() {
  const container = document.getElementById('aiParticles');
  if (!container) return;

  // Create floating dots
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: rgba(6, 182, 212, ${Math.random() * 0.3 + 0.1});
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation: floatDot ${5 + Math.random() * 10}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(dot);
  }

  // Add keyframes for floating dots
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatDot {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      25% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.2); opacity: 0.6; }
      50% { transform: translate(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px) scale(0.8); opacity: 0.4; }
      75% { transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.1); opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
})();
