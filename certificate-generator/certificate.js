/* New Certificate Studio logic */
import { aiSuggestWording, aiAutoFillCertificate, aiDesignEnhancer } from '/certificate-generator/ai-hooks.js';
import { exportCanvasPNG, exportCanvasPDF } from '/certificate-generator/export.js';

const state = {
  page: { width: 2480, height: 1754, bg: '#ffffff', gradient: '', border: 'none', borderImage: '' },
  items: [],
  history: [],
  future: [],
  selectedId: null,
  zoom: 'fit',
  zoomScalar: 1,
  selectedTemplateId: null
};

const defaultPage = { width: 2480, height: 1754, bg: '#ffffff', gradient: '', border: 'none', borderImage: '' };

const el = {
  templateList: document.getElementById('cg-template-list'),
  templateFilter: document.getElementById('cg-template-filter'),
  canvasViewport: document.getElementById('cg-canvas-viewport'),
  canvas: document.getElementById('cg-canvas'),
  gridToggle: document.getElementById('cg-grid-toggle'),
  undo: document.getElementById('cg-undo'),
  redo: document.getElementById('cg-redo'),
  reset: document.getElementById('cg-reset'),
  save: document.getElementById('cg-save'),
  load: document.getElementById('cg-load'),
  exportPng: document.getElementById('cg-export-png'),
  exportPdf: document.getElementById('cg-export-pdf'),
  zoomButtons: Array.from(document.querySelectorAll('.cg-zoom-btn')),
  pageSize: document.getElementById('cg-page-size'),
  bgColor: document.getElementById('cg-bg-color'),
  bgGradient: document.getElementById('cg-bg-gradient'),
  borderStyle: document.getElementById('cg-border-style'),
  borderImage: document.getElementById('cg-border-image'),
  logoInput: document.getElementById('cg-logo-input'),
  sealInput: document.getElementById('cg-seal-input'),
  signatureInput: document.getElementById('cg-signature-input'),
  textContent: document.getElementById('cg-text-content'),
  fontFamily: document.getElementById('cg-font-family'),
  fontSize: document.getElementById('cg-font-size'),
  fontWeight: document.getElementById('cg-font-weight'),
  textColor: document.getElementById('cg-text-color'),
  alignButtons: Array.from(document.querySelectorAll('.cg-align-btn')),
  selectionLabel: document.getElementById('cg-selection-label'),
};

function pushHistory() {
  const snap = JSON.stringify({
    page: { ...state.page },
    items: state.items.map(i => ({ ...i, style: { ...i.style } })),
    selectedId: state.selectedId,
    zoom: state.zoom,
    selectedTemplateId: state.selectedTemplateId
  });
  state.history.push(snap);
  if (state.history.length > 50) state.history.shift();
  state.future = [];
}

function undo() {
  if (!state.history.length) return;
  state.future.push(JSON.stringify({
    page: { ...state.page },
    items: state.items.map(i => ({ ...i, style: { ...i.style } })),
    selectedId: state.selectedId,
    zoom: state.zoom,
    selectedTemplateId: state.selectedTemplateId
  }));
  const prev = JSON.parse(state.history.pop());
  state.page = prev.page;
  state.items = prev.items;
  state.selectedId = prev.selectedId;
  state.zoom = prev.zoom;
  state.selectedTemplateId = prev.selectedTemplateId;
  render();
}

function redo() {
  if (!state.future.length) return;
  state.history.push(JSON.stringify({
    page: { ...state.page },
    items: state.items.map(i => ({ ...i, style: { ...i.style } })),
    selectedId: state.selectedId,
    zoom: state.zoom,
    selectedTemplateId: state.selectedTemplateId
  }));
  const next = JSON.parse(state.future.pop());
  state.page = next.page;
  state.items = next.items;
  state.selectedId = next.selectedId;
  state.zoom = next.zoom;
  state.selectedTemplateId = next.selectedTemplateId;
  render();
}

function saveLocal() {
  try {
    localStorage.setItem('cg.state.v2', JSON.stringify(state));
    showStatus('Saved locally');
  } catch {}
}

function loadLocal() {
  const s = localStorage.getItem('cg.state.v2');
  if (s) {
    try {
      Object.assign(state, JSON.parse(s));
      showStatus('Loaded draft');
    } catch {}
  }
}

let templatesCache = [];

function showStatus(msg) {
  const bar = document.createElement('div');
  bar.className = 'cg-toast';
  bar.textContent = msg;
  document.body.appendChild(bar);
  setTimeout(() => bar.classList.add('show'), 10);
  setTimeout(() => { bar.classList.remove('show'); bar.remove(); }, 1800);
}

async function loadTemplates() {
  try {
    const resp = await fetch('/certificate-generator/templates.json');
    if (!resp.ok) throw new Error('Templates not found');
    const data = await resp.json();
    templatesCache = data.templates || [];
    renderTemplateList();
    el.templateFilter.addEventListener('change', renderTemplateList);
    // Auto-apply first template if none loaded
    if (!state.items.length && templatesCache.length) {
      applyTemplate(templatesCache[0], false);
    }
  } catch (e) {
    console.error('Failed to load templates', e);
  }
}

function renderTemplateList() {
  const cat = el.templateFilter.value;
  el.templateList.innerHTML = '';
  templatesCache
    .filter(t => cat === 'all' || t.category === cat)
    .forEach(t => {
      const card = document.createElement('div');
      card.className = 'cg-template-card';
      card.addEventListener('click', () => applyTemplate(t));

      const thumb = document.createElement('div');
      thumb.className = 'cg-template-thumb';
      const inner = document.createElement('div');
      inner.className = 'cg-template-thumb-inner';
      thumb.appendChild(inner);

      const meta = document.createElement('div');
      meta.className = 'cg-template-meta';
      const name = document.createElement('div');
      name.className = 'cg-template-name';
      name.textContent = t.name;
      const type = document.createElement('div');
      type.className = 'cg-template-type';
      type.textContent = t.category;
      meta.appendChild(name);
      meta.appendChild(type);

      card.appendChild(thumb);
      card.appendChild(meta);
      if (t.id === state.selectedTemplateId) card.classList.add('active');
      el.templateList.appendChild(card);
    });
}

function applyTemplate(tpl, push=true) {
  if (push) pushHistory();
  state.selectedTemplateId = tpl.id || null;
  state.page.width = tpl.canvas?.width || 2480;
  state.page.height = tpl.canvas?.height || 1754;
  state.page.bg = tpl.canvas?.bg || '#ffffff';
  state.page.gradient = tpl.canvas?.gradient || '';
  state.page.border = tpl.border?.style || 'none';
  state.page.borderImage = tpl.border?.image || '';
  state.items = (tpl.elements || []).map((e, idx) => ({
    id: e.id || `item-${Date.now()}-${idx}`,
    type: e.type,
    role: e.role || '',
    x: e.x || 0,
    y: e.y || 0,
    w: e.w || 200,
    h: e.h || 60,
    align: e.align || 'left',
    style: e.style || {},
    src: e.src || '',
    text: e.text || ''
  }));
  render();
  saveLocal();
  renderTemplateList();
  showStatus(`Applied template: ${tpl.name}`);
}

function render() {
  el.canvas.innerHTML = '';

  const canvasInner = document.createElement('div');
  canvasInner.style.position = 'relative';
  canvasInner.style.width = state.page.width + 'px';
  canvasInner.style.height = state.page.height + 'px';
  canvasInner.style.background = state.page.gradient || state.page.bg;

   // Border styles
  canvasInner.classList.remove('cg-border-single','cg-border-double','cg-border-gold','cg-border-silver');
  canvasInner.style.borderImage = '';
  canvasInner.style.border = '';
  if (state.page.border === 'single') canvasInner.classList.add('cg-border-single');
  if (state.page.border === 'double') canvasInner.classList.add('cg-border-double');
  if (state.page.border === 'gold') canvasInner.classList.add('cg-border-gold');
  if (state.page.border === 'silver') canvasInner.classList.add('cg-border-silver');
  if (state.page.border === 'image' && state.page.borderImage) {
    canvasInner.style.border = '40px solid transparent';
    canvasInner.style.borderImage = `url(${state.page.borderImage}) 40 stretch`;
  }

  if (el.gridToggle?.checked) {
    canvasInner.classList.add('cg-canvas-grid');
  }

  state.items.forEach(item => {
    const node = document.createElement('div');
    node.className = 'cg-item';
    node.style.left = item.x + 'px';
    node.style.top = item.y + 'px';
    node.style.width = item.w + 'px';
    node.style.height = item.h + 'px';
    node.dataset.id = item.id;

    if (item.type === 'text') {
      const t = document.createElement('div');
      t.className = 'cg-text';
      t.contentEditable = 'true';
      t.textContent = item.text;
      t.style.fontFamily = item.style.fontFamily || 'system-ui';
      t.style.fontSize = (item.style.fontSize || 24) + 'px';
      t.style.fontWeight = item.style.fontWeight || '400';
      t.style.color = item.style.color || '#111827';
      t.style.lineHeight = item.style.lineHeight || 1.25;
      t.style.textAlign = item.align;
      t.addEventListener('input', () => {
        item.text = t.textContent;
        syncSelectionToSidebar();
        saveLocal();
      });
      node.appendChild(t);
    } else if (item.type === 'image') {
      const img = document.createElement('img');
      img.className = 'cg-image';
      img.src = item.src || '';
      node.appendChild(img);
    }

    const h = document.createElement('div');
    h.className = 'cg-handle';
    node.appendChild(h);

    node.addEventListener('mousedown', () => {
      state.selectedId = item.id;
      updateSelectionStyles();
      syncSelectionToSidebar();
    });

    enableDragResize(node, item);
    canvasInner.appendChild(node);
  });

  const scale = computeZoomScalar();
  state.zoomScalar = scale;
  canvasInner.style.transform = `scale(${scale})`;
  el.canvas.appendChild(canvasInner);
}

function enableDragResize(node, item) {
  let dragging = false, resizing = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startW = 0, startH = 0;

  node.addEventListener('pointerdown', (e) => {
    const isHandle = e.target.classList.contains('cg-handle');
    dragging = !isHandle; resizing = isHandle;
    node.setPointerCapture(e.pointerId);
    startX = e.clientX; startY = e.clientY;
    startLeft = item.x; startTop = item.y; startW = item.w; startH = item.h;
  });

  node.addEventListener('pointermove', (e) => {
    if (!dragging && !resizing) return;
    // Adjust for scaling: convert screen delta to canvas units
    const dz = state.zoomScalar || 1;
    const dx = (e.clientX - startX) / dz;
    const dy = (e.clientY - startY) / dz;
    if (dragging) {
      // Snap to 8px grid & bounding box
      item.x = Math.round((startLeft + dx) / 8) * 8;
      item.y = Math.round((startTop + dy) / 8) * 8;
      item.x = Math.max(0, Math.min(item.x, state.page.width - item.w));
      item.y = Math.max(0, Math.min(item.y, state.page.height - item.h));
    } else if (resizing) {
      item.w = Math.max(40, Math.round((startW + dx) / 8) * 8);
      item.h = Math.max(40, Math.round((startH + dy) / 8) * 8);
      // Keep within bounds
      item.w = Math.min(item.w, state.page.width - item.x);
      item.h = Math.min(item.h, state.page.height - item.y);
    }
    render();
  });

  node.addEventListener('pointerup', () => {
    dragging = false; resizing = false; pushHistory(); saveLocal();
  });
}
function computeZoomScalar() {
  if (!el.canvasViewport) return 1;
  const viewportRect = el.canvasViewport.getBoundingClientRect();
  const availableW = viewportRect.width - 32;
  const availableH = viewportRect.height - 32;
  const sx = availableW / state.page.width;
  const sy = availableH / state.page.height;
  if (state.zoom === 'fit') return Math.min(sx, sy, 1);
  const asNumber = typeof state.zoom === 'number' ? state.zoom : parseFloat(state.zoom);
  if (!isFinite(asNumber) || asNumber <= 0) return 1;
  return asNumber;
}

function updateSelectionStyles() {
  document.querySelectorAll('.cg-item').forEach(n => n.classList.remove('selected'));
  if (!state.selectedId) return;
  const node = document.querySelector(`.cg-item[data-id="${state.selectedId}"]`);
  if (node) node.classList.add('selected');
}

function getSelectedItem() {
  return state.items.find(i => i.id === state.selectedId) || null;
}

function syncSelectionToSidebar() {
  const item = getSelectedItem();
  if (!item || item.type !== 'text') {
    el.selectionLabel.textContent = 'Nothing selected';
    el.textContent.value = '';
    return;
  }
  el.selectionLabel.textContent = `Editing: ${item.role || 'Text block'}`;
  el.textContent.value = item.text || '';
  el.fontFamily.value = item.style.fontFamily || '';
  el.fontSize.value = item.style.fontSize || '';
  el.fontWeight.value = item.style.fontWeight || '400';
  el.textColor.value = item.style.color || '#111827';
}

function bindControls() {
  el.undo.addEventListener('click', undo);
  el.redo.addEventListener('click', redo);
  el.reset.addEventListener('click', () => {
    pushHistory();
    Object.assign(state.page, { ...defaultPage });
    state.items = [];
    state.selectedId = null;
    render();
    saveLocal();
    showStatus('Canvas reset');
  });

  el.save.addEventListener('click', () => {
    saveLocal();
  });

  el.load.addEventListener('click', () => {
    loadLocal();
    render();
  });

  el.pageSize.addEventListener('change', () => {
    pushHistory();
    if (el.pageSize.value === 'a4') {
      state.page.width = 2480;
      state.page.height = 1754;
    } else {
      state.page.width = 2550;
      state.page.height = 1650;
    }
    render();
    saveLocal();
  });

  el.bgColor.addEventListener('input', () => {
    pushHistory();
    state.page.bg = el.bgColor.value;
    state.page.gradient = '';
    render();
    saveLocal();
  });

  el.bgGradient.addEventListener('input', () => {
    pushHistory();
    state.page.gradient = el.bgGradient.value;
    render();
    saveLocal();
  });

  el.borderStyle.addEventListener('change', () => {
    pushHistory();
    state.page.border = el.borderStyle.value;
    render();
    saveLocal();
  });

  el.borderImage.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.page.border = 'image';
      state.page.borderImage = reader.result;
      render();
      saveLocal();
    };
    reader.readAsDataURL(file);
  });

  function bindImageInput(input, role) {
    if (!input) return;
    input.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const target = state.items.find(i => i.role === role);
        if (!target) return;
        target.src = reader.result;
        render();
        saveLocal();
      };
      reader.readAsDataURL(file);
    });
  }
  bindImageInput(el.logoInput, 'logo');
  bindImageInput(el.sealInput, 'seal');
  bindImageInput(el.signatureInput, 'signature');

  el.textContent.addEventListener('input', () => {
    const item = getSelectedItem();
    if (!item || item.type !== 'text') return;
    item.text = el.textContent.value;
    render();
    saveLocal();
  });

  el.fontFamily.addEventListener('change', () => {
    const item = getSelectedItem();
    if (!item || item.type !== 'text') return;
    item.style.fontFamily = el.fontFamily.value || undefined;
    render();
    saveLocal();
  });

  el.fontSize.addEventListener('input', () => {
    const item = getSelectedItem();
    if (!item || item.type !== 'text') return;
    const v = Number(el.fontSize.value);
    if (!isFinite(v) || v <= 0) return;
    item.style.fontSize = v;
    render();
    saveLocal();
  });

  el.fontWeight.addEventListener('change', () => {
    const item = getSelectedItem();
    if (!item || item.type !== 'text') return;
    item.style.fontWeight = el.fontWeight.value;
    render();
    saveLocal();
  });

  el.textColor.addEventListener('input', () => {
    const item = getSelectedItem();
    if (!item || item.type !== 'text') return;
    item.style.color = el.textColor.value;
    render();
    saveLocal();
  });

  el.alignButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getSelectedItem();
      if (!item || item.type !== 'text') return;
      item.align = btn.dataset.align || 'left';
      render();
      saveLocal();
    });
  });

  el.zoomButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const z = btn.dataset.zoom;
      state.zoom = z === 'fit' ? 'fit' : Number(z);
      render();
    });
  });

  if (el.gridToggle) {
    el.gridToggle.addEventListener('change', () => {
      render();
    });
  }

  el.exportPng.addEventListener('click', () => {
    if (!el.canvas.firstElementChild) { showStatus('Nothing to export'); return; }
    exportCanvasPNG(el.canvas.firstElementChild);
  });

  el.exportPdf.addEventListener('click', () => {
    if (!el.canvas.firstElementChild) { showStatus('Nothing to export'); return; }
    exportCanvasPDF(el.canvas.firstElementChild, 'landscape');
  });

  // Optional AI hooks - keep simple buttons on keyboard shortcuts later if needed
  document.addEventListener('keydown', async (e) => {
    if (!e.altKey) return;
    if (e.key === '1') {
      const res = await aiSuggestWording({});
      const title = state.items.find(i => i.role === 'title');
      const subtitle = state.items.find(i => i.role === 'subtitle');
      const desc = state.items.find(i => i.role === 'description');
      if (title) title.text = res.title || title.text;
      if (subtitle) subtitle.text = res.subtitle || subtitle.text;
      if (desc) desc.text = res.description || desc.text;
      render();
      saveLocal();
    }
    if (e.key === '2') {
      const res = await aiAutoFillCertificate(state);
      const recipient = state.items.find(i => i.role === 'recipient');
      const signLabel = state.items.find(i => i.role === 'signatureLabel' || i.role === 'signLabel');
      if (recipient) recipient.text = res.recipient || recipient.text;
      if (signLabel) signLabel.text = res.signatureLabel || signLabel.text;
      render();
      saveLocal();
    }
    if (e.key === '3') {
      await aiDesignEnhancer(state);
    }
  });
}

// Export buttons hookup implemented in export.js

function init() {
  loadLocal();
  bindControls();
  loadTemplates();
  render();
}

document.addEventListener('DOMContentLoaded', init);
