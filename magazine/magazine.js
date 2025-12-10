// Futuristic Magazine Maker logic — keeps API + export intact, adds UI polish.

function buildPrompt(data) {
  return `Act as a professional Magazine Feature Writer and Editor for a college publication titled '${data.magTitle || 'The Campus Chronicle'}'.\n\n` +
    `Generate a concise 2-paragraph summary (first "thick" paragraph and second "thin" concluding paragraph), a 400-word feature article, two short photo captions, and one bold impactful pull-quote. Use an upbeat, encouraging, and professional tone. Include any raw facts provided below and adapt names/dates as given.\n\n` +
    `Event: ${data.eventName}\nRaw: ${data.rawData}\nArticle type: ${data.articleType}\nIssue: ${data.magIssue}\nUser instructions: ${data.userPrompt || 'N/A'}\n\n` +
    `Format your output in JSON with keys: summary_thick, summary_thin, main_body, pull_quote, caption1, caption2.\n`;
}

async function callAIBackend(prompt) {
  // Route requests through backend (Gemini/OpenAI decided server-side)
  const res = await fetch('/api/magazine/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt: prompt })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('AI generate failed: ' + res.status + ' — ' + text);
  }
  return res.json();
}

function placeholderGeneration(data) {
  const thick = `${data.eventName || 'A memorable college event'} brought together students, faculty, and visiting experts to celebrate creativity and collaboration. Held during ${data.magIssue || 'this quarter'}, the event showcased multiple student projects and competitive highlights. The atmosphere combined professional rigor and playful experimentation.`;
  const thin = `Looking forward, the college plans to build on this momentum with more hands-on workshops and student-led showcases.`;
  const main = `${thick}\n\nOrganizers worked for weeks to plan logistics, secure sponsorship, and schedule panels. Student volunteers coordinated registration and judging, ensuring smooth execution. The winning teams, including Team Tamasha, demonstrated innovative solutions to real problems, Dr. Vishal emphasized the importance of interdisciplinary learning. The event's hands-on nature gave students the chance to present ideas to industry mentors, leading to several internship opportunities and new collaborations.`;
  const pull = `"This event proves our students' creativity and thinking out of the box" said Dr.Vishal Khanna.`;
  const c1 = `Team Alpha celebrates on stage after receiving the trophy.`;
  const c2 = `Student prototype showcased at the event — a crowd favorite.`;
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

async function tryBackendGenerate(formData) {
  const response = await fetch('/api/magazine/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (!response.ok) throw new Error('Generation failed');
  return response.json();
}

function applyResultToUI(result, formData) {
  const magTitle = formData.magTitle;
  const magIssue = formData.magIssue;
  const eventName = formData.eventName;
  const articleType = formData.articleType;

  const bind = (id, value, isHTML=false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isHTML) el.innerHTML = value;
    else el.textContent = value;
  };

  bind('previewTitle', magTitle);
  bind('issueBadge', 'Issue: ' + magIssue);
  bind('issueBadgeSecondary', 'Issue: ' + magIssue);
  bind('coverTitle', magTitle);
  bind('coverSubtitle', magIssue);
  bind('articleHeading', (articleType || 'Featured Article') + ' — ' + eventName);
  bind('summaryThick', formatParas(result.summary_thick), true);
  bind('summaryThin', formatParas(result.summary_thin), true);
  bind('mainBodyText', formatParas(result.main_body), true);
  bind('pullQuote', result.pull_quote || '');
  const captions = document.getElementById('captions');
  if (captions) captions.innerHTML = (result.caption1 ? ('Photo: ' + result.caption1 + '<br>') : '') + (result.caption2 ? ('Photo: ' + result.caption2) : '');
}

function formatParas(text) {
  if (!text) return '';
  const parts = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  return parts.map(p => `<p>${p}</p>`).join('');
}

function updateColors() {
  const preview = document.getElementById('magazinePreview');
  if (preview) preview.style.color = document.getElementById('primaryColor').value;
  const pull = document.getElementById('pullQuote');
  if (pull) pull.style.color = document.getElementById('accentColor').value;
}

function snapshotTimeline() {
  const timeline = document.getElementById('pageTimeline');
  const preview = document.getElementById('magazinePreview');
  if (!timeline || !preview || typeof html2canvas === 'undefined') return;
  const slot = document.createElement('div');
  slot.className = 'thumb slide-in';
  slot.textContent = 'Snapshot';
  html2canvas(preview, { scale: 0.35 }).then(canvas => {
    slot.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;
    slot.style.backgroundSize = 'cover';
    slot.style.color = '#0f172a';
    timeline.prepend(slot);
  }).catch(()=>{});
}

function applyTheme(theme) {
  const body = document.body;
  const root = document.documentElement;
  const themes = ['cyber','pastel','pro','mint','royal'];
  themes.forEach(t => body.classList.remove(`theme-${t}`));
  body.classList.add(`theme-${theme}`);
  root.classList.remove(...themes.map(t=>`theme-${t}`));
  root.classList.add(`theme-${theme}`);
  document.querySelectorAll('.theme-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.theme === theme));
}

function addDropCap() {
  const body = document.getElementById('mainBodyText');
  if (!body) return;
  const text = body.textContent || '';
  if (!text) return;
  const first = text.trim().charAt(0);
  const rest = text.trim().slice(1);
  body.innerHTML = `<span class="dropcap">${first}</span>${rest}`;
}

function setTypography() {
  const font = document.getElementById('headlineFont')?.value || 'Playfair Display';
  const lineHeight = document.getElementById('lineHeight')?.value || 1.4;
  const letterSpacing = document.getElementById('letterSpacing')?.value || 0;
  const cover = document.getElementById('coverTitle');
  const body = document.getElementById('mainBodyText');
  if (cover) cover.style.fontFamily = `${font}, serif`;
  if (body) { body.style.lineHeight = lineHeight; body.style.letterSpacing = `${letterSpacing}px`; }
}

function toggleGuides(show) {
  document.querySelectorAll('.page-guides, .page-safe-area').forEach(el => { el.style.display = show ? 'block' : 'none'; });
}

function wireDragAndDrop() {
  const palette = document.querySelectorAll('.drag-card');
  const preview = document.getElementById('magazinePreview');
  if (!preview) return;
  preview.addEventListener('dragover', e => e.preventDefault());
  preview.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer?.getData('block');
    if (!type) return;
    createBlock(preview, type);
  });
  palette.forEach(card => {
    card.addEventListener('dragstart', e => { e.dataTransfer?.setData('block', card.dataset.block); });
  });
}

function createBlock(target, type) {
  const block = document.createElement('div');
  block.className = 'dropped-block flip-enter';
  if (type === 'title') block.innerHTML = '<h2 contenteditable="true">New Feature Title</h2>';
  if (type === 'text') block.innerHTML = '<p contenteditable="true">Editable paragraph text. Double click to refine.</p>';
  if (type === 'quote') block.innerHTML = '<blockquote contenteditable="true">“Add a bold quote here.”</blockquote>';
  if (type === 'image') block.innerHTML = '<div class="image-mask"><span>Image mask</span></div>';
  if (type === 'caption') block.innerHTML = '<div class="caption-pair"><div>Caption one</div><div>Caption two</div></div>';
  target.appendChild(block);
  pushUndoState(target);
}

const undoStack = [];
const redoStack = [];
function pushUndoState(preview) {
  if (!preview) return;
  undoStack.push(preview.innerHTML);
  if (undoStack.length > 10) undoStack.shift();
  redoStack.length = 0;
}
function undo(preview) {
  if (!preview || undoStack.length === 0) return;
  const last = undoStack.pop();
  redoStack.push(preview.innerHTML);
  preview.innerHTML = last;
}
function redo(preview) {
  if (!preview || redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(preview.innerHTML);
  preview.innerHTML = next;
}

function wireToolbarMirrors() {
  document.querySelectorAll('[data-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.trigger);
      if (target) target.click();
    });
  });
}

function wirePanels() {
  document.querySelectorAll('.panel-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.querySelector(btn.dataset.target);
      if (!panel) return;
      panel.classList.toggle('collapsed');
    });
  });
}

function wireLayoutSuggestions() {
  document.querySelectorAll('#layoutSuggestions li').forEach(item => {
    item.addEventListener('click', () => {
      const layout = item.dataset.layout;
      const preview = document.getElementById('magazinePreview');
      if (!preview) return;
      preview.dataset.layout = layout;
    });
  });
}

function wireStyleCards() {
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      const style = card.dataset.style;
      document.getElementById('magazinePreview')?.setAttribute('data-style', style);
    });
  });
}

function wire3DFlip() {
  const btn = document.getElementById('flipPageBtn');
  const page = document.getElementById('page3d');
  if (!btn || !page) return;
  btn.addEventListener('click', () => { page.classList.toggle('flip'); });
}

function wireZoom() {
  const btn = document.getElementById('zoomPulse');
  const shell = document.getElementById('canvasShell');
  if (!btn || !shell) return;
  btn.addEventListener('click', () => {
    shell.classList.toggle('zoomed');
    shell.style.transform = shell.classList.contains('zoomed') ? 'scale(1.04)' : 'scale(1)';
  });
}

function wireGuidesToggle() {
  const guides = document.getElementById('safeGuides');
  const flipSafe = document.getElementById('flipSafeBtn');
  const handler = show => toggleGuides(show);
  if (guides) guides.addEventListener('change', e => handler(e.target.checked));
  if (flipSafe) flipSafe.addEventListener('click', () => {
    const show = !(document.querySelector('.page-guides')?.style.display === 'none');
    toggleGuides(!show);
  });
}

function wireTypographyControls() {
  ['headlineFont','lineHeight','letterSpacing'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', setTypography);
  });
  const dropCap = document.getElementById('enableDropCap');
  if (dropCap) dropCap.addEventListener('change', e => { if (e.target.checked) addDropCap(); else setTypography(); });
}

function wireColorPickers() {
  ['primaryColor','accentColor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateColors);
  });
}

function wireUndoRedo(preview) {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const undoFab = document.getElementById('undoFab');
  const redoFab = document.getElementById('redoFab');
  [undoBtn, undoFab].forEach(btn => btn && btn.addEventListener('click', () => undo(preview)));
  [redoBtn, redoFab].forEach(btn => btn && btn.addEventListener('click', () => redo(preview)));
}

function wireSaveDraft(preview) {
  const saveDraft = document.getElementById('saveLocalBtn');
  const restoreDraft = document.getElementById('loadLocalBtn');
  const indicator = document.getElementById('saveIndicator');
  if (saveDraft) saveDraft.addEventListener('click', async () => {
    pushUndoState(preview);
    try { await window.AppStorage.save('magazine/autosave', preview.innerHTML); indicator?.classList.add('pulse'); } catch(e) {}
  });
  if (restoreDraft) restoreDraft.addEventListener('click', async () => {
    try {
      const raw = await window.AppStorage.load('magazine/autosave');
      if (typeof raw === 'string') preview.innerHTML = raw;
      else if (raw && raw.html) preview.innerHTML = raw.html;
    } catch(e) {}
  });
}

function bindStorageButtons() {
  const stateKey = 'magazine_state_v2';
  const saveDesignBtn = document.getElementById('saveDesignBtn');
  const loadDesignBtn = document.getElementById('loadDesignBtn');
  const exportDesignState = () => {
    return {
      template: document.getElementById('magazinePreview')?.dataset.style || 'classic',
      content: {
        magTitle: document.getElementById('magTitle').value,
        magIssue: document.getElementById('magIssue').value,
        articleType: document.getElementById('articleType').value,
        rawData: document.getElementById('rawData').value
      }
    };
  };
  const save = async () => { try { await window.AppStorage.save('magazine/state_v2', exportDesignState()); } catch(e) {} };
  const load = async () => {
    try {
      const s = await window.AppStorage.load('magazine/state_v2');
      if (!s) return;
      document.getElementById('magTitle').value = s.content?.magTitle || '';
      document.getElementById('magIssue').value = s.content?.magIssue || '';
      document.getElementById('articleType').value = s.content?.articleType || '';
      document.getElementById('rawData').value = s.content?.rawData || '';
      document.getElementById('magazinePreview').dataset.style = s.template || 'classic';
    } catch(e) {}
  };
  if (saveDesignBtn) saveDesignBtn.addEventListener('click', save);
  if (loadDesignBtn) loadDesignBtn.addEventListener('click', load);
}

function bindGenerate(preview) {
  const generateBtn = document.getElementById('generateBtn');
  if (!generateBtn) return;
  generateBtn.addEventListener('click', async () => {
    const magTitle = document.getElementById('magTitle').value.trim() || 'The Campus Chronicle';
    const magIssue = document.getElementById('magIssue').value.trim() || 'Q1';
    const eventName = document.getElementById('eventName').value.trim() || 'College Event';
    const rawData = document.getElementById('rawData').value.trim() || '';
    const articleType = document.getElementById('articleType').value;
    const userPrompt = (document.getElementById('aiPrompt')?.value || '').trim();
    const apiKey = (document.getElementById('openaiKey')?.value || '').trim();
    const formData = { magTitle, magIssue, eventName, rawData, articleType, userPrompt };

    const outputEl = document.getElementById('generatedOutput');
    if (outputEl) outputEl.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div> Generating...';

    try {
      let result;
      const prompt = buildPrompt(formData);
      // Always use backend (prevents exposing keys and uses Gemini when configured)
      result = await callAIBackend(prompt);

      if (outputEl) outputEl.innerHTML = `<pre style="white-space:pre-wrap">${JSON.stringify(result, null, 2)}</pre>`;
      applyResultToUI(result, formData);
      updateColors();
      if (document.getElementById('enableDropCap')?.checked) addDropCap();
      snapshotTimeline();
      pushUndoState(preview);

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
      if (outputEl) outputEl.innerHTML = `<div class="text-danger">Error: ${e.message}</div>`;
    }
  });
}

function bindPreview() {
  const previewBtn = document.getElementById('previewBtn');
  if (!previewBtn) return;
  previewBtn.addEventListener('click', () => {
    const title = document.getElementById('magTitle').value || 'Magazine';
    const issue = document.getElementById('magIssue').value || 'Issue';
    const titleEl = document.getElementById('previewTitle');
    if (titleEl) titleEl.textContent = title;
    const issueEl = document.getElementById('issueBadge');
    if (issueEl) issueEl.textContent = 'Issue: ' + issue;
    const issueEl2 = document.getElementById('issueBadgeSecondary');
    if (issueEl2) issueEl2.textContent = 'Issue: ' + issue;
  });
}

function bindExport(preview) {
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (!exportPdfBtn) return;
  exportPdfBtn.addEventListener('click', async () => {
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

function bindAlignment(preview) {
  document.querySelectorAll('[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!preview) return;
      preview.style.textAlign = btn.dataset.align;
    });
  });
}

function wireTimelineClicks(preview) {
  document.querySelectorAll('#pageTimeline .thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('#pageTimeline .thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      preview.classList.add('flip-enter');
      setTimeout(() => preview.classList.remove('flip-enter'), 600);
    });
  });
}

function initFocusGlow() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(inp => {
    inp.addEventListener('focus', () => inp.classList.add('soft-glow'));
    inp.addEventListener('blur', () => inp.classList.remove('soft-glow'));
  });
}

function bindCoverMirror() {
  const cover = document.getElementById('coverTitle');
  if (!cover) return;
  cover.addEventListener('input', () => {
    const magTitle = document.getElementById('magTitle');
    if (magTitle) magTitle.value = cover.textContent.trim();
  });
}

function init() {
  const preview = document.getElementById('magazinePreview');
  if (!preview) return;

  bindGenerate(preview);
  bindPreview();
  bindExport(preview);
  bindAlignment(preview);
  wireDragAndDrop();
  wireToolbarMirrors();
  wirePanels();
  wireLayoutSuggestions();
  wireStyleCards();
  wire3DFlip();
  wireGuidesToggle();
  wireZoom();
  wireTypographyControls();
  wireColorPickers();
  wireUndoRedo(preview);
  wireSaveDraft(preview);
  bindStorageButtons();
  wireTimelineClicks(preview);
  initFocusGlow();
  bindCoverMirror();

  document.querySelectorAll('.theme-chip').forEach(chip => chip.addEventListener('click', () => applyTheme(chip.dataset.theme)));
  applyTheme('cyber');
  setTypography();
  updateColors();
}

document.addEventListener('DOMContentLoaded', init);
