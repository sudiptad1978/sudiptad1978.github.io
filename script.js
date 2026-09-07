(function () {
  'use strict';

  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeMenu = document.getElementById('themeMenu');
  const themeStatus = document.getElementById('themeStatus');
  const year = document.getElementById('year');
  const copyLink = document.getElementById('copyLink');
  const toast = document.getElementById('toast');
  const qrCode = document.getElementById('qrCode');
  const modeOptions = [...document.querySelectorAll('.mode-option')];
  const accentOptions = [...document.querySelectorAll('.accent-option')];
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const rail = document.querySelector('.rail');
  const blogCarousel = document.getElementById('blogCarousel');
  const blogCarouselPrevious = document.getElementById('blogCarouselPrevious');
  const blogCarouselNext = document.getElementById('blogCarouselNext');
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  year.textContent = new Date().getFullYear();

  function setMenu(open) {
    if (!menuToggle || !siteNav || !rail) return;
    rail.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }

  if (menuToggle && siteNav && rail) {
    menuToggle.addEventListener('click', () => setMenu(!rail.classList.contains('menu-open')));
    siteNav.addEventListener('click', (event) => {
      if (event.target.closest('.nav-link')) setMenu(false);
    });
    document.addEventListener('click', (event) => {
      if (rail.classList.contains('menu-open') && !rail.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      setMenu(false);
      if (themeMenu && !themeMenu.hidden) {
        themeMenu.hidden = true;
        themeToggle.setAttribute('aria-expanded', 'false');
        themeToggle.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  function escapeBlogValue(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseBlogFrontmatter(markdown) {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) return {};
    const data = {};
    match[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':');
      if (separator === -1) return;
      const key = line.slice(0, separator).trim();
      const raw = line.slice(separator + 1).trim();
      if (raw.startsWith('[')) {
        try { data[key] = JSON.parse(raw.replace(/'/g, '"')); } catch (error) { data[key] = []; }
      } else {
        data[key] = raw.replace(/^['"]|['"]$/g, '');
      }
    });
    return data;
  }

  function formatBlogDate(date) {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  }

  function renderPortfolioBlog(posts) {
    if (!blogCarousel) return;
    blogCarousel.innerHTML = posts.map((post, index) => `
      <a class="portfolio-blog-card" href="/blog/${encodeURIComponent(post.slug)}" aria-label="Read article: ${escapeBlogValue(post.title)}" data-automation-id="portfolio-blog-card-${index + 1}">
        <div class="portfolio-blog-card-meta" data-automation-id="portfolio-blog-card-meta-${index + 1}"><span>${escapeBlogValue(formatBlogDate(post.date))}</span><span>${escapeBlogValue(post.readTime || 'Technical note')}</span></div>
        <h3 data-automation-id="portfolio-blog-card-title-${index + 1}">${escapeBlogValue(post.title)}</h3>
        <p data-automation-id="portfolio-blog-card-summary-${index + 1}">${escapeBlogValue(post.summary || '')}</p>
        <span class="portfolio-blog-card-link">Read note <span>↗</span></span>
      </a>
    `).join('');
    blogCarousel.querySelectorAll('*').forEach((element, index) => {
      if (!element.hasAttribute('data-automation-id')) element.setAttribute('data-automation-id', `portfolio-blog-element-${index + 1}`);
    });
  }

  async function loadPortfolioBlog() {
    if (!blogCarousel) return;
    try {
      const indexResponse = await fetch('/content/blog/index.json', { cache: 'no-cache' });
      if (!indexResponse.ok) throw new Error('Could not load blog index.');
      const entries = await indexResponse.json();
      const posts = await Promise.all(entries.map(async (entry) => {
        const postResponse = await fetch(entry.file, { cache: 'no-cache' });
        if (!postResponse.ok) throw new Error(`Could not load ${entry.slug}.`);
        return { ...entry, ...parseBlogFrontmatter(await postResponse.text()) };
      }));
      renderPortfolioBlog(posts.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      blogCarousel.innerHTML = '<div class="portfolio-blog-loading" data-automation-id="portfolio-blog-error">Notes are temporarily unavailable. Visit the blog to try again.</div>';
    }
  }

  if (blogCarousel) {
    const scrollCarousel = (direction) => blogCarousel.scrollBy({ left: direction * Math.max(blogCarousel.clientWidth * .82, 290), behavior: 'smooth' });
    if (blogCarouselPrevious) blogCarouselPrevious.addEventListener('click', () => scrollCarousel(-1));
    if (blogCarouselNext) blogCarouselNext.addEventListener('click', () => scrollCarousel(1));
    blogCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); scrollCarousel(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); scrollCarousel(1); }
    });
    loadPortfolioBlog();
  }

  function setTheme(mode, save) {
    const effective = mode === 'system' ? (prefersDark && prefersDark.matches ? 'dark' : 'light') : mode;
    body.dataset.theme = effective;
    modeOptions.forEach((option) => {
      const selected = option.dataset.mode === mode;
      option.classList.toggle('active', selected);
      option.setAttribute('aria-checked', String(selected));
      option.setAttribute('aria-pressed', String(selected));
    });
    if (themeToggle) themeToggle.setAttribute('aria-label', `Open appearance settings. Current mode: ${mode}.`);
    if (save) {
      localStorage.setItem('sd-theme-mode', mode);
      if (themeStatus) themeStatus.textContent = `Color mode set to ${mode}.`;
    }
  }

  function setAccent(accent, save) {
    body.dataset.accent = accent;
    accentOptions.forEach((option) => {
      const selected = option.dataset.accent === accent;
      option.classList.toggle('active', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    if (save) {
      localStorage.setItem('sd-accent', accent);
      if (themeStatus) themeStatus.textContent = `${accent} accent selected.`;
    }
  }

  const savedMode = localStorage.getItem('sd-theme-mode') || 'dark';
  const savedAccent = localStorage.getItem('sd-accent') || 'mint';
  setTheme(savedMode, false);
  setAccent(savedAccent, false);

  themeToggle.addEventListener('click', () => {
    const isOpen = !themeMenu.hidden;
    themeMenu.hidden = isOpen;
    themeToggle.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) window.setTimeout(() => modeOptions[0]?.focus(), 0);
  });
  modeOptions.forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.mode, true)));
  accentOptions.forEach((button) => button.addEventListener('click', () => setAccent(button.dataset.accent, true)));
  document.addEventListener('click', (event) => {
    if (!themeMenu.hidden && !themeMenu.contains(event.target) && !themeToggle.contains(event.target)) {
      themeMenu.hidden = true;
      themeToggle.setAttribute('aria-expanded', 'false');
    }
  });
  if (prefersDark) prefersDark.addEventListener('change', () => {
    if ((localStorage.getItem('sd-theme-mode') || 'dark') === 'system') setTheme('system', false);
  });

  function enableAnchorFocus() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        const targetId = link.getAttribute('href').slice(1);
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        window.setTimeout(() => {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }, 0);
      });
    });
  }
  enableAnchorFocus();

  // A small dependency-free QR encoder. It creates a QR for the current deployed URL,
  // so the code remains correct on a custom Cloudflare Pages domain without a build step.
  const QR = (() => {
    const EXP = new Array(512);
    const LOG = new Array(256);
    let value = 1;
    for (let i = 0; i < 255; i += 1) {
      EXP[i] = value;
      LOG[value] = i;
      value <<= 1;
      if (value & 0x100) value ^= 0x11d;
    }
    for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
    const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);
    const bchDigit = (data) => {
      let digit = 0;
      while (data !== 0) { digit += 1; data >>>= 1; }
      return digit;
    };
    const bchTypeInfo = (data) => {
      let d = data << 10;
      const g = 0x537;
      while (bchDigit(d) - bchDigit(g) >= 0) d ^= g << (bchDigit(d) - bchDigit(g));
      return ((data << 10) | d) ^ 0x5412;
    };
    const generator = (length) => {
      let poly = [1];
      for (let i = 0; i < length; i += 1) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j += 1) {
          next[j] ^= poly[j];
          next[j + 1] ^= mul(poly[j], EXP[i]);
        }
        poly = next;
      }
      return poly;
    };
    const ecc = (data, length) => {
      const gen = generator(length);
      const result = new Array(length).fill(0);
      data.forEach((byte) => {
        const factor = byte ^ result[0];
        for (let i = 0; i < length - 1; i += 1) result[i] = result[i + 1] ^ mul(gen[i + 1], factor);
        result[length - 1] = mul(gen[length], factor);
      });
      return result;
    };
    const utf8 = (text) => {
      const bytes = [];
      for (const char of text) {
        const code = char.codePointAt(0);
        if (code < 0x80) bytes.push(code);
        else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
      return bytes;
    };
    const bitStream = (bytes, capacity) => {
      const bits = [];
      const push = (number, count) => { for (let i = count - 1; i >= 0; i -= 1) bits.push((number >>> i) & 1); };
      push(0x4, 4); // byte mode
      push(bytes.length, 8);
      bytes.forEach((byte) => push(byte, 8));
      for (let i = 0; i < Math.min(4, capacity * 8 - bits.length); i += 1) bits.push(0);
      while (bits.length % 8) bits.push(0);
      const data = [];
      for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, bit) => (n << 1) | bit, 0));
      let pad = 0;
      while (data.length < capacity) data.push((pad++ % 2 === 0) ? 0xec : 0x11);
      return data;
    };
    const mask = (pattern, row, col) => {
      switch (pattern) {
        case 0: return (row + col) % 2 === 0;
        case 1: return row % 2 === 0;
        case 2: return col % 3 === 0;
        case 3: return (row + col) % 3 === 0;
        case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
        case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
        case 6: return ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0;
        default: return ((((row * col) % 3) + ((row + col) % 2)) % 2) === 0;
      }
    };
    const makeMatrix = (version, codewords, pattern, test) => {
      const size = version * 4 + 17;
      const modules = Array.from({ length: size }, () => Array(size).fill(null));
      const finder = (row, col) => {
        for (let r = -1; r <= 7; r += 1) {
          if (row + r < 0 || row + r >= size) continue;
          for (let c = -1; c <= 7; c += 1) {
            if (col + c < 0 || col + c >= size) continue;
            modules[row + r][col + c] = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          }
        }
      };
      finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
      const centers = version === 4 ? [6, 26] : [6, 30];
      centers.forEach((row) => centers.forEach((col) => {
        if (modules[row][col] !== null) return;
        for (let r = -2; r <= 2; r += 1) for (let c = -2; c <= 2; c += 1) modules[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
      }));
      for (let i = 8; i < size - 8; i += 1) {
        if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
        if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
      }
      const info = bchTypeInfo((1 << 3) | pattern); // error correction L
      for (let i = 0; i < 15; i += 1) {
        const bit = !test && ((info >> i) & 1) === 1;
        if (i < 6) modules[i][8] = bit;
        else if (i < 8) modules[i + 1][8] = bit;
        else modules[size - 15 + i][8] = bit;
        if (i < 8) modules[8][size - i - 1] = bit;
        else if (i < 9) modules[8][15 - i - 1 + 1] = bit;
        else modules[8][15 - i - 1] = bit;
      }
      modules[size - 8][8] = !test;
      let row = size - 1; let inc = -1; let bitIndex = 0; let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1;
        while (true) {
          for (let j = 0; j < 2; j += 1) {
            const currentCol = col - j;
            if (modules[row][currentCol] !== null) continue;
            let dark = false;
            if (byteIndex < codewords.length) dark = ((codewords[byteIndex] >>> (7 - bitIndex)) & 1) === 1;
            if (mask(pattern, row, currentCol)) dark = !dark;
            modules[row][currentCol] = dark;
            bitIndex += 1;
            if (bitIndex === 8) { byteIndex += 1; bitIndex = 0; }
          }
          row += inc;
          if (row < 0 || row >= size) { row -= inc; inc = -inc; break; }
        }
      }
      return modules;
    };
    const lostPoints = (matrix) => {
      const size = matrix.length; let lost = 0; let dark = 0;
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
        if (matrix[row][col]) dark += 1;
        let same = 0;
        for (let r = -1; r <= 1; r += 1) for (let c = -1; c <= 1; c += 1) {
          if (r === 0 && c === 0) continue;
          const rr = row + r; const cc = col + c;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size && matrix[row][col] === matrix[rr][cc]) same += 1;
        }
        if (same > 5) lost += 3 + same - 5;
        if (row < size - 1 && col < size - 1) {
          const block = matrix[row][col] === matrix[row + 1][col] && matrix[row][col] === matrix[row][col + 1] && matrix[row][col] === matrix[row + 1][col + 1];
          if (block) lost += 3;
        }
        if (col < size - 6 && matrix[row][col] && !matrix[row][col + 1] && matrix[row][col + 2] && matrix[row][col + 3] && matrix[row][col + 4] && !matrix[row][col + 5] && matrix[row][col + 6]) lost += 40;
        if (row < size - 6 && matrix[row][col] && !matrix[row + 1][col] && matrix[row + 2][col] && matrix[row + 3][col] && matrix[row + 4][col] && !matrix[row + 5][col] && matrix[row + 6][col]) lost += 40;
      }
      lost += Math.floor(Math.abs(100 * dark / (size * size) - 50) / 5) * 10;
      return lost;
    };
    const create = (text) => {
      const bytes = utf8(text);
      const version = bytes.length <= 78 ? 4 : 5;
      const dataCapacity = version === 4 ? 80 : 108;
      const eccLength = version === 4 ? 20 : 26;
      const data = bitStream(bytes, dataCapacity);
      const codewords = data.concat(ecc(data, eccLength));
      let best = null; let bestScore = Infinity;
      for (let pattern = 0; pattern < 8; pattern += 1) {
        const matrix = makeMatrix(version, codewords, pattern, false);
        const score = lostPoints(matrix);
        if (score < bestScore) { bestScore = score; best = matrix; }
      }
      const size = best.length; const quiet = 4; const total = size + quiet * 2;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="QR code"><rect width="${total}" height="${total}" fill="#fff"/>`;
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) if (best[row][col]) svg += `<rect x="${col + quiet}" y="${row + quiet}" width="1" height="1" fill="#07100c"/>`;
      return `${svg}</svg>`;
    };
    return { create };
  })();

  const profileUrl = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://sudipta-dutta.pages.dev/';
  qrCode.innerHTML = QR.create(profileUrl);
  qrCode.setAttribute('data-automation-id', 'profile-qr-code');
  qrCode.setAttribute('data-qr-value', profileUrl);
  qrCode.querySelectorAll('*').forEach((element, index) => {
    if (!element.hasAttribute('data-automation-id')) element.setAttribute('data-automation-id', `profile-qr-element-${index + 1}`);
  });
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 2400);
  }

  copyLink.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      copyLink.setAttribute('aria-label', 'Profile link copied');
      showToast('Profile link copied to clipboard.');
      setTimeout(() => copyLink.setAttribute('aria-label', 'Copy profile link'), 2200);
    } catch (error) {
      window.prompt('Copy this profile link:', profileUrl);
    }
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '-32% 0px -62% 0px', threshold: 0 });
  sections.forEach((section) => observer.observe(section));
})();
