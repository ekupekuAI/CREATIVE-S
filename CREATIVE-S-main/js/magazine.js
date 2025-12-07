// Magazine page logic (moved from the provided HTML into a separate file)

function buildPrompt(data) {
  return `Act as a professional Magazine Feature Writer and Editor for a college publication titled '${data.magTitle || 'The Campus Chronicle'}'.\n\n` +
    `Generate a concise 2-paragraph summary (first "thick" paragraph and second "thin" concluding paragraph), a 400-word feature article, two short photo captions, and one bold impactful pull-quote. Use an upbeat, encouraging, and professional tone. Include any raw facts provided below and adapt names/dates as given.\n\n` +
    `Event: ${data.eventName}\nRaw: ${data.rawData}\nArticle type: ${data.articleType}\nIssue: ${data.magIssue}\n\n` +
    `Format your output in JSON with keys: summary_thick, summary_thin, main_body, pull_quote, caption1, caption2.\n`;
}

async function callOpenAI(prompt, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('OpenAI error: ' + res.status + ' — ' + text);
  }
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch (e) {
    const match = content.match(/\{[\s\S]*\}/m);
    if (match) return JSON.parse(match[0]);
    return { summary_thick: '', summary_thin: '', main_body: content, pull_quote: '', caption1: '', caption2: '' };
  }
}

function placeholderGeneration(data) {
  const thick = `This wasn’t just an event — it was history with Wi-Fi. Our college brought together students, faculty, and visiting experts for a creativity fest that had more drama than a reality show and more innovation than half the internet. Held during ${data.magIssue || 'Q1'}, the event showcased wild student projects and competitive highlights that had everyone whispering, "Did they just do that?" The vibe? Half professional, half chaos, all legendary.`;
  
  const thin = `The legacy continues — the next event promises even more chaos, creativity, and caffeine-fueled brilliance.`;
  
  const main = `${thick}\n\nOrganizers didn’t sleep for weeks — planning logistics, chasing sponsors, and juggling schedules like tech ninjas. Student volunteers handled registration and judging so smoothly, even Excel got jealous.  

And when the dust settled… Team Tamasha rose like Wi-Fi after a power cut — Siddu, Charan, Srinath, Ekansh, and Keshava proving that brilliance mixed with a little madness always wins.  

The crowd went wild. Dr. Vishal himself dropped wisdom bombs on interdisciplinary learning, probably still wondering how these legends pulled it off.  

The event’s hands-on vibe gave students a shot to flex their ideas in front of industry mentors — which somehow turned into real internships and epic collabs.  

Basically, this event wasn’t just successful — it was a college myth in the making.`;
  
  const pull = `"This event redefined creativity — a fusion of chaos, collaboration, and pure genius," said Dr. Vishal Khanna with a proud grin.`;
  
  const c1 = `Team Tamasha rising like Wi-Fi after a power cut — absolute legends.`;
  const c2 = `Student projects lighting up the event floor — innovation went viral.`;
  
  return { summary_thick: thick, summary_thin: thin, main_body: main, pull_quote: pull, caption1: c1, caption2: c2 };
}


function readImages(files) {
  return Promise.all(Array.from(files).map(f => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res({ name: f.name, dataUrl: e.target.result });
    reader.onerror = rej;
    reader.readAsDataURL(f);
  })));
}

// Bind UI after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Advanced templates with layout stubs
  const magazineTemplates = {
    classic: { name: 'Classic', primary: '#0b2545', accent: '#c59d5f', font: 'Playfair Display', layout: 'cover-left' },
    modern: { name: 'Modern', primary: '#0f1724', accent: '#06b6d4', font: 'Poppins', layout: 'cover-right' },
    editorial: { name: 'Editorial', primary: '#111827', accent: '#ef4444', font: 'Playfair Display', layout: 'full-bleed' },
    student: { name: 'Student Life', primary: '#065f46', accent: '#f6b200', font: 'Poppins', layout: 'photo-led' },
    fashion: { name: 'Fashion', primary: '#2b0d1a', accent: '#f472b6', font: 'Playfair Display', layout: 'image-led' },
    tech: { name: 'Tech', primary: '#021026', accent: '#00e5ff', font: 'Poppins', layout: 'grid' },
    minimalist: { name: 'Minimalist', primary: '#111827', accent: '#94a3b8', font: 'Poppins', layout: 'text-led' },
    retro: { name: 'Retro', primary: '#5b3419', accent: '#ffd166', font: 'Poppins', layout: 'photo-led' }
  };

  // Persisted keys
  const STORAGE_KEY = 'magazine_state_v1';

  // Utility: dynamically add google font link
  function loadGoogleFont(family) {
    if (!family) return;
    const name = family.replace(/\s+/g, '+');
    const id = 'font-' + name;
    if (document.getElementById(id)) return Promise.resolve();
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${name}:wght@300;400;600;700&display=swap`;
    document.head.appendChild(link);
    return new Promise(res => { link.onload = res; link.onerror = res; });
  }

  function renderTemplateGrid() {
    const grid = document.getElementById('templateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(magazineTemplates).forEach(key => {
      const t = magazineTemplates[key];
      const card = document.createElement('div');
      card.className = 'template-card p-2 d-flex align-items-start justify-content-between';
      card.dataset.template = key;

      // left: text
  const left = document.createElement('div');
  left.innerHTML = `<strong class="title">${t.name}</strong><div class="small text-muted">${t.font}</div>`;

      // right: thumbnail canvas
      const thumb = document.createElement('canvas');
      thumb.width = 140; thumb.height = 90; thumb.className = 'template-thumb';
      renderThumbnail(thumb, t);

      card.appendChild(left);
      card.appendChild(thumb);
      card.addEventListener('click', () => { applyTemplate(key); saveState(); });
      grid.appendChild(card);
    });
  }

  // Render a small thumbnail for a template onto a canvas element
  function renderThumbnail(canvasEl, tpl) {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    // base
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvasEl.width,canvasEl.height);
    // accent bar
    ctx.fillStyle = tpl.accent;
    ctx.fillRect(0, canvasEl.height - 12, canvasEl.width, 12);
    // title stub
    ctx.fillStyle = tpl.primary;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(tpl.name, 6, 16);
    // layout hint shapes
    ctx.fillStyle = '#f0f0f0';
    if (tpl.layout === 'cover-left') ctx.fillRect(6, 24, 56, 40); else if (tpl.layout === 'cover-right') ctx.fillRect(78, 24, 56, 40); else if (tpl.layout === 'grid') { ctx.fillRect(6,24,36,30); ctx.fillRect(48,24,36,30); ctx.fillRect(90,24,36,30);} else if (tpl.layout === 'image-led') ctx.fillRect(6,24,128,40); else ctx.fillRect(6,24,84,40);
    // border
    ctx.strokeStyle = '#e6e6e6'; ctx.strokeRect(0,0,canvasEl.width,canvasEl.height);
  }

  // Apply template to preview
  async function applyTemplate(key) {
    const tpl = magazineTemplates[key];
    if (!tpl) return;
    await loadGoogleFont(tpl.font);
    const preview = document.getElementById('magazinePreview');
    if (preview) {
      // background choices
      if (tpl.layout === 'full-bleed') { preview.style.background = tpl.primary; preview.style.color = '#fff'; }
      else { preview.style.background = '#fff'; preview.style.color = tpl.primary; }
      // font
      document.getElementById('coverTitle').style.fontFamily = `${tpl.font}, serif`;
      document.getElementById('mainBodyText').style.fontFamily = tpl.font === 'Poppins' ? 'Poppins, sans-serif' : `${tpl.font}, serif`;
    }
    const pull = document.getElementById('pullQuote'); if (pull) pull.style.color = tpl.accent;
    const badge = document.getElementById('issueBadge'); if (badge) { badge.style.background = tpl.primary; badge.style.color = '#fff'; }
    // mark active
    document.querySelectorAll('.template-card').forEach(el => el.classList.remove('active'));
    const selected = document.querySelector(`.template-card[data-template="${key}"]`);
    if (selected) selected.classList.add('active');
    // Add glow to the selected template title and ensure titles use glow color
    document.querySelectorAll('.template-card .title').forEach(el => el.classList.remove('glow'));
    if (selected) {
      const tTitle = selected.querySelector('.title');
      if (tTitle) tTitle.classList.add('glow');
    }
    // Update hero/cover title glow color to match accent (via inline text-shadow)
    const cover = document.getElementById('coverTitle');
    if (cover) {
      cover.classList.add('glow');
      // apply tinted shadow using accent color
      cover.style.textShadow = `0 0 18px ${hexToRgba(tpl.accent,0.95)}, 0 0 36px ${hexToRgba(tpl.accent,0.28)}`;
    }
    // remember selected template
    state.selectedTemplate = key;
    saveState();
  }

  // Utility: convert hex to rgba with alpha
  function hexToRgba(hex, alpha=1) {
    if (!hex) return `rgba(99,102,241,${alpha})`;
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // State persistence
  const state = loadState() || { selectedTemplate: 'classic', lastDesign: null };
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch(e) { return null; } }

  // Save/Load design (basic JSON of content + selected template)
  function exportDesignState() { const s = { template: state.selectedTemplate, content: { magTitle: document.getElementById('magTitle').value, magIssue: document.getElementById('magIssue').value, articleType: document.getElementById('articleType').value, rawData: document.getElementById('rawData').value } }; return s; }
  function saveDesignLocal() { try { const s = exportDesignState(); localStorage.setItem('magazine_design', JSON.stringify(s)); alert('Design saved locally'); } catch(e) { alert('Save failed'); } }
  function loadDesignLocal() { try { const raw = localStorage.getItem('magazine_design'); if (!raw) { alert('No saved design'); return; } const s = JSON.parse(raw); document.getElementById('magTitle').value = s.content.magTitle || ''; document.getElementById('magIssue').value = s.content.magIssue || ''; document.getElementById('articleType').value = s.content.articleType || ''; document.getElementById('rawData').value = s.content.rawData || ''; applyTemplate(s.template || 'classic'); alert('Design loaded'); } catch(e) { alert('Load failed'); } }

  renderTemplateGrid();

  // On init, apply saved template
  if (state && state.selectedTemplate) applyTemplate(state.selectedTemplate);

  // Wire save/load buttons
  const saveDesignBtn = document.getElementById('saveDesignBtn'); if (saveDesignBtn) saveDesignBtn.addEventListener('click', saveDesignLocal);
  const loadDesignBtn = document.getElementById('loadDesignBtn'); if (loadDesignBtn) loadDesignBtn.addEventListener('click', loadDesignLocal);

  // Export PDF with page sizes (robust handler)
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', async () => {
    const sizeEl = document.getElementById('exportSize');
    const size = sizeEl ? sizeEl.value : 'a4';
    const preview = document.getElementById('magazinePreview'); if (!preview) { alert('Nothing to export'); return; }
    // page sizes in points
    let page = { w: 595, h: 842 }; // A4
    if (size === 'letter') page = { w: 612, h: 792 };
    if (size === 'screen') page = { w: 800, h: 600 };
    const scale = 2;
    try {
      // html2canvas with useCORS improves cross-origin image handling when images allow it
      const canvas = await html2canvas(preview, { scale, useCORS: true, backgroundColor: null, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
      if (!jsPDFClass) { alert('PDF library not available'); return; }
      const pdf = new jsPDFClass({ unit: 'pt', format: [page.w, page.h] });
      // Fit canvas into page width while preserving aspect ratio
      const ratio = page.w / canvas.width;
      const imgH = canvas.height * ratio;
      pdf.addImage(imgData, 'PNG', 0, 0, page.w, imgH);
      pdf.save((document.getElementById('magTitle').value || 'magazine') + '.pdf');
    } catch (e) { alert('Export failed: ' + (e && e.message ? e.message : e)); console.error('Export error:', e); }
  });

  // Wire legacy export button id (if any) to the new handler
  const legacyExport = document.getElementById('exportPdfBtn');
  if (legacyExport && exportBtn) legacyExport.addEventListener('click', () => exportBtn.click());

  // Adjust top padding based on navbar height so fixed navbar doesn't overlap content
  function adjustTopPadding() {
    const nav = document.querySelector('nav.navbar');
    const main = document.querySelector('.container-fluid');
    if (!main) return;
    const navH = nav ? nav.getBoundingClientRect().height : 72;
    main.style.paddingTop = Math.max(72, Math.ceil(navH + 12)) + 'px';
  }
  // Run on init and on resize
  adjustTopPadding();
  window.addEventListener('resize', adjustTopPadding);

  // ---- Glow and focus wiring ----
  // Add focus/blur listeners to form inputs inside the sidebar (.mag-control is a conceptual container)
  function wireFocusGlows() {
    const inputs = document.querySelectorAll('.sidebar-content input, .sidebar-content textarea, .sidebar-content select');
    inputs.forEach(inp => {
      inp.addEventListener('focus', () => {
        inp.classList.add('soft-glow');
        // also highlight the preview cover title while typing
        const cover = document.getElementById('coverTitle'); if (cover) cover.classList.add('glow');
      });
      inp.addEventListener('blur', () => { inp.classList.remove('soft-glow'); });
    });

    // contenteditable cover title focus/blur
    const cover = document.getElementById('coverTitle');
    if (cover) {
      cover.addEventListener('focus', () => { cover.classList.add('glow'); cover.setAttribute('aria-live','polite'); });
      cover.addEventListener('blur', () => { /* keep glow but reduce intensity */ });
      // when cover text changes, mirror to hidden magTitle input
      cover.addEventListener('input', () => {
        const magTitle = document.getElementById('magTitle'); if (magTitle) magTitle.value = cover.textContent.trim();
      });
    }
  }
  // initialize glow wiring
  wireFocusGlows();

  // Wire save/load local buttons
  const saveLocalBtn = document.getElementById('saveLocalBtn'); if (saveLocalBtn) saveLocalBtn.addEventListener('click', () => { state.lastDesign = exportDesignState(); saveState(); alert('State saved'); });
  const loadLocalBtn = document.getElementById('loadLocalBtn'); if (loadLocalBtn) loadLocalBtn.addEventListener('click', () => { const s = loadState(); if (s && s.lastDesign) { document.getElementById('magTitle').value = s.lastDesign.content.magTitle || ''; document.getElementById('magIssue').value = s.lastDesign.content.magIssue || ''; document.getElementById('rawData').value = s.lastDesign.content.rawData || ''; applyTemplate(s.lastDesign.template || 'classic'); alert('State restored'); } else alert('No saved state'); });

  // layout toggle: clicking coverImage swaps left/right presentation
  const coverImgEl = document.getElementById('coverImage');
  const coverEl = document.getElementById('cover');
  if (coverImgEl && coverEl) {
    coverImgEl.addEventListener('click', () => {
      coverEl.classList.toggle('reverse-cover');
    });
  }
  const generateBtn = document.getElementById('generateBtn');
  const previewBtn = document.getElementById('previewBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const magTitle = document.getElementById('magTitle').value.trim() || 'The Campus Chronicle';
      const magIssue = document.getElementById('magIssue').value.trim() || 'Q1';
      const eventName = document.getElementById('eventName').value.trim() || 'College Event';
      const rawData = document.getElementById('rawData').value.trim() || '';
      const articleType = document.getElementById('articleType').value;

      const formData = { magTitle, magIssue, eventName, rawData, articleType };

      const outputEl = document.getElementById('generatedOutput');
      if (outputEl) outputEl.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Generating...';

      try {
        const response = await fetch('http://localhost:8000/api/magazine/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Generation failed');
        const result = await response.json();

        const out = document.getElementById('generatedOutput');
        if (out) out.innerHTML = `<pre style="white-space:pre-wrap">${JSON.stringify(result, null, 2)}</pre>`;

        // Update preview
        if (document.getElementById('previewTitle')) document.getElementById('previewTitle').textContent = magTitle;
        if (document.getElementById('issueBadge')) document.getElementById('issueBadge').textContent = 'Issue: ' + magIssue;
        if (document.getElementById('coverTitle')) document.getElementById('coverTitle').textContent = magTitle;
        if (document.getElementById('coverSubtitle')) document.getElementById('coverSubtitle').textContent = magIssue;
        if (document.getElementById('articleHeading')) document.getElementById('articleHeading').textContent = (articleType || 'Featured Article') + ' — ' + eventName;
        if (document.getElementById('summaryThick')) document.getElementById('summaryThick').textContent = result.summary_thick || '';
        if (document.getElementById('summaryThin')) document.getElementById('summaryThin').textContent = result.summary_thin || '';
        if (document.getElementById('mainBodyText')) document.getElementById('mainBodyText').textContent = result.main_body || '';
        if (document.getElementById('pullQuote')) document.getElementById('pullQuote').textContent = result.pull_quote || '';
        if (document.getElementById('captions')) document.getElementById('captions').innerHTML = (result.caption1? ('Photo: ' + result.caption1 + '<br>') : '') + (result.caption2? ('Photo: ' + result.caption2) : '');

        // color styling
        const preview = document.getElementById('magazinePreview');
        if (preview) preview.style.color = document.getElementById('primaryColor').value;
        if (document.getElementById('pullQuote')) document.getElementById('pullQuote').style.color = document.getElementById('accentColor').value;

        // handle images
        const imageFiles = document.getElementById('images').files;
        if (imageFiles && imageFiles.length) {
          const imgs = await readImages(imageFiles);
          const first = imgs[0];
          const articleImg = document.getElementById('articleImagePreview');
          if (articleImg) { articleImg.src = first.dataUrl; articleImg.style.display = 'block'; }
          const coverImg = document.getElementById('coverImage');
          if (coverImg) { coverImg.src = imgs.length > 1 ? imgs[1].dataUrl : first.dataUrl; coverImg.style.display = 'block'; }
        }

      } catch (e) {
        const out = document.getElementById('generatedOutput');
        if (out) out.innerHTML = `<div class="text-danger">Error: ${e.message}</div>`;
      }
    });
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const title = document.getElementById('magTitle').value || 'Magazine';
      const issue = document.getElementById('magIssue').value || 'Issue';
      if (document.getElementById('previewTitle')) document.getElementById('previewTitle').textContent = title;
      if (document.getElementById('issueBadge')) document.getElementById('issueBadge').textContent = 'Issue: ' + issue;
    });
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', async () => {
      const preview = document.getElementById('magazinePreview');
      if (!preview) return;
      const { jsPDF } = window.jspdf || {};
      const doc = new (window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF)('p', 'pt', 'a4');
      const scale = 2;
      try {
        await html2canvas(preview, { scale: scale }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const imgProps = { width: doc.internal.pageSize.getWidth(), height: (canvas.height * doc.internal.pageSize.getWidth()) / canvas.width };
          doc.addImage(imgData, 'PNG', 0, 0, imgProps.width, imgProps.height);
          doc.save((document.getElementById('magTitle').value || 'magazine') + '.pdf');
        });
      } catch (e) { alert('Export error: ' + e.message); }
    });
  }

});