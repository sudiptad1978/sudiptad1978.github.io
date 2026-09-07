(function () {
  'use strict';

  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeMenu = document.getElementById('themeMenu');
  const modeOptions = [...document.querySelectorAll('.mode-option')];
  const accentOptions = [...document.querySelectorAll('.accent-option')];
  const postList = document.getElementById('postList');
  const postMeta = document.getElementById('postMeta');
  const postContent = document.getElementById('postContent');
  const postError = document.getElementById('postError');
  const year = document.getElementById('year');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const rail = document.querySelector('.rail');
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  if (year) year.textContent = new Date().getFullYear();

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
      if (event.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  function assignAutomationIds(root, prefix) {
    if (!root) return;
    if (!root.hasAttribute('data-automation-id')) root.setAttribute('data-automation-id', prefix);
    root.querySelectorAll('*').forEach((element, index) => {
      if (!element.hasAttribute('data-automation-id')) {
        element.setAttribute('data-automation-id', `${prefix}-${element.tagName.toLowerCase()}-${index + 1}`);
      }
    });
  }

  function setTheme(mode, save) {
    const effective = mode === 'system' ? (prefersDark && prefersDark.matches ? 'dark' : 'light') : mode;
    body.dataset.theme = effective;
    modeOptions.forEach((option) => option.classList.toggle('active', option.dataset.mode === mode));
    if (save) localStorage.setItem('sd-theme-mode', mode);
  }

  function setAccent(accent, save) {
    body.dataset.accent = accent;
    accentOptions.forEach((option) => option.classList.toggle('active', option.dataset.accent === accent));
    if (save) localStorage.setItem('sd-accent', accent);
  }

  setTheme(localStorage.getItem('sd-theme-mode') || 'dark', false);
  setAccent(localStorage.getItem('sd-accent') || 'mint', false);

  if (themeToggle && themeMenu) {
    themeToggle.addEventListener('click', () => {
      const open = !themeMenu.hidden;
      themeMenu.hidden = open;
      themeToggle.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', (event) => {
      if (!themeMenu.hidden && !themeMenu.contains(event.target) && !themeToggle.contains(event.target)) {
        themeMenu.hidden = true;
        themeToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  modeOptions.forEach((option) => option.addEventListener('click', () => setTheme(option.dataset.mode, true)));
  accentOptions.forEach((option) => option.addEventListener('click', () => setAccent(option.dataset.accent, true)));
  if (prefersDark) prefersDark.addEventListener('change', () => {
    if ((localStorage.getItem('sd-theme-mode') || 'dark') === 'system') setTheme('system', false);
  });

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function parseFrontmatter(markdown) {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { data: {}, content: markdown };
    const data = {};
    match[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':');
      if (separator === -1) return;
      const key = line.slice(0, separator).trim();
      const raw = line.slice(separator + 1).trim();
      if (raw.startsWith('[')) {
        try { data[key] = JSON.parse(raw.replace(/'/g, '"')); } catch (error) { data[key] = raw; }
      } else {
        data[key] = raw.replace(/^['"]|['"]$/g, '');
      }
    });
    return { data, content: match[2] };
  }

  function inlineMarkdown(value) {
    let html = escapeHtml(value);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/!\[([^\]]+)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)/g, '<figure class="post-figure"><img src="$2" alt="$1" loading="lazy"><figcaption>$1</figcaption></figure>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
    return html;
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let paragraph = [];
    let list = null;
    let code = false;
    let codeLanguage = '';
    let codeLines = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (!list) return;
      output.push(`<${list.type}>${list.items.join('')}</${list.type}>`);
      list = null;
    };
    const flushCode = () => {
      if (!code) return;
      output.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      code = false;
      codeLanguage = '';
      codeLines = [];
    };

    lines.forEach((line) => {
      if (line.trim().startsWith('```')) {
        if (code) flushCode();
        else {
          flushParagraph();
          flushList();
          code = true;
          codeLanguage = line.trim().slice(3).trim() || 'text';
        }
        return;
      }
      if (code) { codeLines.push(line); return; }
      if (!line.trim()) { flushParagraph(); flushList(); return; }
      const heading = line.match(/^(#{2,4})\s+(.+)$/);
      if (heading) {
        flushParagraph(); flushList();
        const level = Math.min(heading[1].length, 4);
        output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        return;
      }
      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph(); flushList();
        output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
        return;
      }
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const type = unordered ? 'ul' : 'ol';
        if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
        list.items.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
        return;
      }
      flushList();
      paragraph.push(line.trim());
    });
    flushCode(); flushParagraph(); flushList();
    return output.join('\n');
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  }

  async function loadPosts() {
    const response = await fetch('/content/blog/index.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not load the blog index.');
    const entries = await response.json();
    const posts = await Promise.all(entries.map(async (entry) => {
      const postResponse = await fetch(entry.file, { cache: 'no-cache' });
      if (!postResponse.ok) throw new Error(`Could not load ${entry.slug}.`);
      const parsed = parseFrontmatter(await postResponse.text());
      return { ...entry, ...parsed.data, content: parsed.content };
    }));
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function renderPostList(posts) {
    if (!postList) return;
    postList.innerHTML = posts.map((post, index) => `
      <a class="post-card ${index === 0 ? 'featured-post' : ''}" data-automation-id="post-card-${index + 1}" href="/blog/${encodeURIComponent(post.slug)}">
        <div class="post-card-meta" data-automation-id="post-card-meta-${index + 1}"><span>${escapeHtml(formatDate(post.date))}</span><span>${escapeHtml(post.readTime || 'Technical note')}</span></div>
        <h2 data-automation-id="post-card-title-${index + 1}">${escapeHtml(post.title)}</h2>
        <p data-automation-id="post-card-summary-${index + 1}">${escapeHtml(post.summary)}</p>
        <div class="post-card-footer" data-automation-id="post-card-footer-${index + 1}"><span>${(Array.isArray(post.tags) ? post.tags : []).map((tag, tagIndex) => `<span data-automation-id="post-card-tag-${index + 1}-${tagIndex + 1}">${escapeHtml(tag)}</span>`).join('')}</span><span class="post-arrow">Read note ↗</span></div>
      </a>
    `).join('');
    assignAutomationIds(postList, 'post-list');
  }

  function renderPost(post) {
    if (!postMeta || !postContent) return;
    document.title = `${post.title} — Sudipta Dutta`;
    postMeta.innerHTML = `
      <div class="post-kicker" data-automation-id="post-kicker"><span class="eyebrow-line"></span> ${escapeHtml(formatDate(post.date))} · ${escapeHtml(post.readTime || 'Technical note')}</div>
      <h1 data-automation-id="post-title">${escapeHtml(post.title)}</h1>
      <p class="post-summary" data-automation-id="post-summary">${escapeHtml(post.summary)}</p>
      <div class="post-tags" data-automation-id="post-tags">${(Array.isArray(post.tags) ? post.tags : []).map((tag, index) => `<span data-automation-id="post-tag-${index + 1}">${escapeHtml(tag)}</span>`).join('')}</div>
    `;
    assignAutomationIds(postMeta, 'post-meta');
    postContent.innerHTML = renderMarkdown(post.content);
    assignAutomationIds(postContent, 'post-content');
    if (postError) postError.hidden = true;
  }

  async function boot() {
    try {
      const posts = await loadPosts();
      if (postList) renderPostList(posts);
      if (postContent) {
        const params = new URLSearchParams(window.location.search);
        const fromPath = window.location.pathname.match(/^\/blog\/([^/]+)\/?$/);
        const slug = params.get('slug') || (fromPath ? decodeURIComponent(fromPath[1]) : '');
        const post = posts.find((entry) => entry.slug === slug);
        if (!post) throw new Error('That blog post could not be found.');
        renderPost(post);
      }
    } catch (error) {
      if (postList) {
        postList.innerHTML = '<div class="blog-error" data-automation-id="blog-load-error">Blog notes are temporarily unavailable. Please refresh and try again.</div>';
        assignAutomationIds(postList, 'post-list-error');
      }
      if (postError) { postError.hidden = false; postError.textContent = error.message; }
    }
  }

  boot();
})();
