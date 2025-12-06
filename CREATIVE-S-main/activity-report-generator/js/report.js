/* =====================================================
   Activity Report Generator
   Core Report Logic
   File: js/report.js
   ===================================================== */

// ---------- STATE ----------
const R = {
  templates: [],
  selectedTemplate: null,
  reportHTML: '',
  settings: {
    fontFamily: 'Poppins',
    fontSize: 16,
    textAlign: 'left',
    textColor: '#000000'
  }
};

// ---------- ELEMENTS ----------
const el = {
  tabs: document.querySelectorAll('#navTabs a'),
  sections: document.querySelectorAll('.tab-section'),
  templateGallery: document.getElementById('templateGallery'),
  reportCanvas: document.getElementById('reportCanvas'),
  previewFrame: document.getElementById('previewFrame'),
  btnDarkMode: document.getElementById('btnDarkMode'),
  btnAnalyzeTemplate: document.getElementById('btnAnalyzeTemplate'),
  templateUpload: document.getElementById('templateUpload'),
  btnAddSection: document.getElementById('btnAddSection'),
  btnResetReport: document.getElementById('btnResetReport'),
  fontFamily: document.getElementById('fontFamily'),
  fontSize: document.getElementById('fontSize'),
  textAlign: document.getElementById('textAlign'),
  textColor: document.getElementById('textColor'),
  logoUpload: document.getElementById('logoUpload'),
  logoAlign: document.getElementById('logoAlign'),
  logoSize: document.getElementById('logoSize'),
  btnGenLogo: document.getElementById('btnGenLogo')
};

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', init);

function init() {
  console.log('%cActivity Report Generator Loaded', 'color:#06b6d4;font-weight:bold;');
  buildTemplateGallery();
  wireControls();
  restoreFromStorage();
  applyTextSettings();
  updatePreview();
  wireLogoUpload();
    wireTemplateUpload();
}

// ---------- NAVIGATION ----------
el.tabs.forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    const target = tab.dataset.tab;
    el.tabs.forEach(t => t.classList.remove('active'));
    el.sections.forEach(s => s.classList.add('d-none'));
    tab.classList.add('active');
    document.getElementById(`tab-${target}`).classList.remove('d-none');
    if (target === 'preview') updatePreview();
  });
});

// ---------- TEMPLATE GALLERY ----------
function buildTemplateGallery() {
  const templates = [
    { id: 'corporate', name: 'Corporate Classic', color: '#0ea5e9' },
    { id: 'modern', name: 'Modern Gradient', color: '#9333ea' },
    { id: 'minimal', name: 'Minimal Monochrome', color: '#111' },
    { id: 'timeline', name: 'Creative Timeline', color: '#16a34a' },
    { id: 'grid', name: 'Professional Grid', color: '#3b82f6' },
    { id: 'academic', name: 'Academic Report', color: '#1e3a8a' },
    { id: 'pastel', name: 'Elegant Pastel', color: '#f472b6' },
    { id: 'vibrant', name: 'Vibrant Neon', color: '#e11d48' },
    { id: 'institutional', name: 'Institutional Blue-Grey', color: '#334155' },
    { id: 'ai-template', name: 'AI Auto Template', color: '#06b6d4' }
  ];
  R.templates = templates;

  el.templateGallery.innerHTML = templates.map(t => `
    <div class="template-card" data-id="${t.id}">
      <div style="background:${t.color};height:4px;"></div>
      <img src="assets/backgrounds/${t.id}.jpg" alt="${t.name}">
      <div class="info"><h6>${t.name}</h6></div>
    </div>
  `).join('');

  el.templateGallery.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => selectTemplate(card.dataset.id));
  });
}

function selectTemplate(id) {
  R.selectedTemplate = id;
  document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`.template-card[data-id="${id}"]`)?.classList.add('active');
  loadTemplateHTML(id);
  saveToStorage();
}

async function loadTemplateHTML(id) {
  try {
    const res = await fetch(`templates/${id}.html`);
    const html = await res.text();
    el.reportCanvas.innerHTML = html;
    R.reportHTML = html;
    saveToStorage();
    // ensure a generated logo is present for this template when none exists
    ensureLogoForTemplate(id);
  } catch (err) {
    console.warn('Template load error:', err);
  }
}

// ---------- CONTROLS ----------
function wireControls() {
  // Text style settings
  el.fontFamily.addEventListener('change', e => {
    R.settings.fontFamily = e.target.value;
    applyTextSettings();
    saveToStorage();
  });
  el.fontSize.addEventListener('input', e => {
    R.settings.fontSize = e.target.value;
    applyTextSettings();
    saveToStorage();
  });
  el.textAlign.addEventListener('change', e => {
    R.settings.textAlign = e.target.value;
    applyTextSettings();
    saveToStorage();
  });
  el.textColor.addEventListener('input', e => {
    R.settings.textColor = e.target.value;
    applyTextSettings();
    saveToStorage();
  });

  el.btnDarkMode.addEventListener('click', toggleDarkMode);
  el.btnAnalyzeTemplate.addEventListener('click', analyzeTemplateAI);
  el.btnAddSection.addEventListener('click', addSection);
  el.btnResetReport.addEventListener('click', resetReport);
  el.logoUpload?.addEventListener('change', handleLogoUpload);
  el.templateUpload?.addEventListener('change', handleTemplateFile);
  el.logoAlign?.addEventListener('change', applyLogoSettings);
  el.logoSize?.addEventListener('input', applyLogoSettings);
  el.btnGenLogo?.addEventListener('click', () => generateAndInsertLogo());
}

function wireTemplateUpload(){
  el.btnAnalyzeTemplate?.addEventListener('click', ()=>el.templateUpload?.click());
}

function handleTemplateFile(e){
  const f = e.target.files?.[0];
  if(!f) return;
  // For now pass the file name to the AI stub; future: read file bytes and send to backend
  analyzeTemplateAI(f);
}

function wireLogoUpload(){
  // placeholder in case we need to initialize something later
}

function handleLogoUpload(e){
  const f = e.target.files?.[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    const url = evt.target.result;
    // replace first image in reportCanvas if present, else prepend
    let img = el.reportCanvas.querySelector('img.report-logo') || el.reportCanvas.querySelector('img');
    if(img){
      img.src = url;
    } else {
      const div = document.createElement('div');
      div.className = 'logo-holder mb-3';
      div.innerHTML = `<img src="${url}" alt="Logo" class="report-logo">`;
      el.reportCanvas.prepend(div);
      img = div.querySelector('img');
    }
    // ensure classes and sizing
    img.classList.add('report-logo');
    applyLogoSettings();
    saveToStorage();
    updatePreview();
  };
  reader.readAsDataURL(f);
}

// ---------- LOGO GENERATION & HELPERS ----------
function generateLogoSVG(color = '#6366f1', text = 'AR') {
  const bg1 = color;
  // derive a secondary color by lightening
  const bg2 = shadeColor(color, 18);
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='${bg1}' />
        <stop offset='100%' stop-color='${bg2}' />
      </linearGradient>
    </defs>
    <rect rx='28' width='200' height='200' fill='url(#g)' />
    <text x='50%' y='54%' font-family='Poppins, sans-serif' font-size='72' font-weight='700' fill='white' text-anchor='middle' alignment-baseline='middle'>${escapeXml(text)}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function generateAndInsertLogo(){
  // pick color from selected template or default
  const tpl = R.templates.find(t=>t.id===R.selectedTemplate) || {color:'#6366f1', name:'AR'};
  const initials = tpl.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'AR';
  const url = generateLogoSVG(tpl.color||'#6366f1', initials);
  // insert at top
  let img = el.reportCanvas.querySelector('img.report-logo') || el.reportCanvas.querySelector('img');
  if(img){ img.src = url; img.classList.add('report-logo'); }
  else{
    const div = document.createElement('div'); div.className='logo-holder mb-3'; div.innerHTML = `<img src="${url}" class="report-logo" alt="Logo">`;
    el.reportCanvas.prepend(div);
  }
  applyLogoSettings(); saveToStorage(); updatePreview();
}

function applyLogoSettings(){
  const img = el.reportCanvas.querySelector('img.report-logo') || el.reportCanvas.querySelector('img');
  if(!img) return;
  const align = el.logoAlign?.value || 'center';
  img.classList.remove('left','right');
  if(align==='left') img.classList.add('left');
  if(align==='right') img.classList.add('right');
  img.style.height = (el.logoSize?.value || 60) + 'px';
}

function ensureLogoForTemplate(id){
  // If there's already a logo image, don't overwrite
  const existing = el.reportCanvas.querySelector('img');
  if(existing) { applyLogoSettings(); return; }
  const tpl = R.templates.find(t=>t.id===id) || {color:'#6366f1', name:'Activity'};
  const initials = tpl.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const url = generateLogoSVG(tpl.color, initials);
  const div = document.createElement('div'); div.className='text-center mb-3'; div.innerHTML = `<img src="${url}" class="report-logo" alt="Logo">`;
  el.reportCanvas.prepend(div);
  applyLogoSettings();
}

function shadeColor(hex, percent) {
  // simple lighten function
  const f = parseInt(hex.slice(1),16), t = percent<0?0:255, p = Math.abs(percent)/100;
  const Rr = Math.round((t - (f>>16)) * p) + (f>>16);
  const Gg = Math.round((t - (f>>8 & 0x00FF)) * p) + (f>>8 & 0x00FF);
  const Bb = Math.round((t - (f & 0x0000FF)) * p) + (f & 0x0000FF);
  return `#${(Rr<<16 | Gg<<8 | Bb).toString(16).padStart(6,'0')}`;
}

function escapeXml(unsafe) { return String(unsafe).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

function applyTextSettings() {
  const style = el.reportCanvas.style;
  style.fontFamily = R.settings.fontFamily;
  style.fontSize = `${R.settings.fontSize}px`;
  style.textAlign = R.settings.textAlign;
  style.color = R.settings.textColor;
}

// ---------- REPORT CONTENT ----------
function addSection() {
  const div = document.createElement('div');
  div.innerHTML = `
    <h5 contenteditable="true">New Section</h5>
    <p contenteditable="true">Write your content here...</p>
  `;
  el.reportCanvas.appendChild(div);
  saveToStorage();
}

function resetReport() {
  if (!confirm('Reset the report content?')) return;
  el.reportCanvas.innerHTML = `
    <h3 class="text-center">Activity Report Title</h3>
    <p class="text-muted text-center">Organization / Department</p>
    <hr>
    <h5>1. Introduction</h5>
    <p>Enter activity introduction here...</p>
    <h5>2. Objective</h5>
    <p>Describe objectives...</p>
    <h5>3. Summary</h5>
    <p>Summarize event outcomes...</p>
    <h5>4. Participants</h5>
    <ul><li>Student A</li><li>Student B</li><li>Student C</li></ul>
    <h5>5. Date & Venue</h5>
    <p>Held on DD-MM-YYYY at Auditorium.</p>
    <h5>6. Conclusion</h5>
    <p>Write closing remarks here.</p>
  `;
  R.reportHTML = el.reportCanvas.innerHTML;
  saveToStorage();
}

// ---------- PREVIEW ----------
function updatePreview() {
  const doc = el.previewFrame.contentDocument || el.previewFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <html><head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
      body { font-family:${R.settings.fontFamily}; font-size:${R.settings.fontSize}px; 
             text-align:${R.settings.textAlign}; color:${R.settings.textColor}; padding:40px;}
    </style>
    </head><body>${el.reportCanvas.innerHTML}</body></html>
  `);
  doc.close();
}

// ---------- STORAGE ----------
function saveToStorage() {
  const data = {
    template: R.selectedTemplate,
    html: el.reportCanvas.innerHTML,
    settings: R.settings
  };
  localStorage.setItem('report_draft', JSON.stringify(data));
}

function restoreFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem('report_draft') || '{}');
    if (data.html) el.reportCanvas.innerHTML = data.html;
    if (data.template) R.selectedTemplate = data.template;
    if (data.settings) R.settings = data.settings;
    applyTextSettings();
  } catch (e) {
    console.warn('Restore error:', e);
  }
}

// ---------- DARK MODE ----------
function toggleDarkMode() {
  const html = document.documentElement;
  const theme = html.getAttribute('data-bs-theme');
  html.setAttribute('data-bs-theme', theme === 'light' ? 'dark' : 'light');
}

// ---------- AI PLACEHOLDER ----------
async function analyzeTemplateAI(file) {
  note('Analyzing uploaded report template...', 'info');
  const f = file || 'Sample Activity Report.pdf';
  const result = await analyzeReportTemplate(f);
  console.log('AI Analysis Result:', result);
  alert('AI detected structure:\n' + (result.suggestions||[]).join('\n'));
}

// ---------- TOAST / NOTE ----------
function note(msg, type = 'info') {
  const elNote = document.createElement('div');
  elNote.className = `alert alert-${type} position-fixed top-0 end-0 m-3 shadow`;
  elNote.textContent = msg;
  document.body.appendChild(elNote);
  setTimeout(() => elNote.remove(), 2000);
}
fetch('./data/demo.json')
  .then(res => res.json())
  .then(data => {
    document.getElementById('reportTitle').innerText = data.reportMeta.title;
    document.getElementById('reportCanvas').innerHTML += `<p>${data.overview.summary}</p>`;
  });
