// ===== Poster & Magazine Maker JavaScript =====

// Consolidated single-file implementation. This file wires the UI buttons
// in HTML to Fabric.js operations and provides magazine/fashion/tech templates.

// Canvas size presets (used by size selector)
const canvasSizes = {
  instagram: { w: 1080, h: 1080, name: 'Instagram Post' },
  a4: { w: 794, h: 1123, name: 'A4 Portrait' },
  'a4-landscape': { w: 1123, h: 794, name: 'A4 Landscape' },
  a3: { w: 1123, h: 1587, name: 'A3 Portrait' },
  facebook: { w: 820, h: 312, name: 'Facebook Cover' },
  twitter: { w: 1500, h: 500, name: 'Twitter Header' },
  custom: { w: 800, h: 600, name: 'Custom Size' }
};

// Templates (includes a 'magazine' group with multiple variants)
const posterTemplates = {
  blank: { name: 'Blank', variants: [{ id: 'blank-1', name: 'Blank' }] },
  fashion: { name: 'Fashion', variants: [{ id: 'fashion-1', name: 'Classic' }, { id: 'fashion-2', name: 'Minimal' }] },
  tech: { name: 'Tech', variants: [{ id: 'tech-1', name: 'Blue' }, { id: 'tech-2', name: 'Dark' }] },
  event: { name: 'Event', variants: [{ id: 'event-1', name: 'Event' }] },
  food: { name: 'Food', variants: [{ id: 'food-1', name: 'Promo' }] },
  music: { name: 'Music', variants: [{ id: 'music-1', name: 'Fest' }] },
  magazine: { name: 'Magazine', variants: [{ id: 'mag-1', name: 'Cover A' }, { id: 'mag-2', name: 'Cover B' }, { id: 'mag-3', name: 'Editorial' }] }
};

let canvas = null;
let undoStack = [];
let redoStack = [];
const maxUndo = 80;
let activeObj = null;

function initPoster() {
  if (typeof fabric === 'undefined') { console.error('Fabric.js missing'); return; }
  canvas = new fabric.Canvas('posterCanvas', { preserveObjectStacking: true });

  const el = document.getElementById('posterCanvas');
  const w = (el && el.width) ? el.width : canvasSizes.instagram.w;
  const h = (el && el.height) ? el.height : canvasSizes.instagram.h;
  setCanvasSize(w, h, false);

  bindUI();

  canvas.on('object:added', () => { pushState(); renderLayers(); });
  canvas.on('object:modified', () => { pushState(); renderLayers(); });
  canvas.on('object:removed', () => { pushState(); renderLayers(); });
  canvas.on('selection:created', populateProperties);
  canvas.on('selection:updated', populateProperties);
  canvas.on('selection:cleared', clearProperties);

  selectTemplate('blank');
  pushState();
  renderLayers();
}

function bindUI() {
  document.querySelectorAll('.poster-template-card').forEach(card => card.addEventListener('click', () => {
    const t = card.dataset.template; if (t) selectTemplate(t);
  }));

  const sizeEl = document.getElementById('canvasSize'); if (sizeEl) sizeEl.addEventListener('change', changeCanvasSize);
  const applyBtn = document.querySelector('#customSizeInputs button'); if (applyBtn) applyBtn.addEventListener('click', applyCustomSize);

  const hidden = document.getElementById('hiddenImageInput'); if (hidden) hidden.addEventListener('change', handleImageUpload);
  const bgColor = document.getElementById('backgroundColor'); if (bgColor) bgColor.addEventListener('change', changeBackgroundColor);
  const bgImage = document.getElementById('backgroundImage'); if (bgImage) bgImage.addEventListener('change', changeBackgroundImage);

  // clicking a template card also shows variants
  document.querySelectorAll('.poster-template-card').forEach(card => card.addEventListener('click', () => showTemplateVariants(card.dataset.template)));

  document.querySelectorAll('button[data-export]').forEach(btn => btn.addEventListener('click', () => exportDesign(btn.dataset.export)));
}

function setCanvasSize(w, h, push = true) { if (!canvas) return; canvas.setWidth(w); canvas.setHeight(h); if (canvas.lowerCanvasEl) { canvas.lowerCanvasEl.width = w; canvas.lowerCanvasEl.height = h; } if (canvas.upperCanvasEl) { canvas.upperCanvasEl.width = w; canvas.upperCanvasEl.height = h; } canvas.calcOffset(); canvas.renderAll(); if (push) pushState(); }

function changeCanvasSize() { const sel = document.getElementById('canvasSize'); if (!sel) return; if (sel.value === 'custom') { const panel = document.getElementById('customSizeInputs'); if (panel) panel.style.display = 'block'; return; } const s = canvasSizes[sel.value] || canvasSizes.instagram; setCanvasSize(s.w, s.h); }
function applyCustomSize() { const w = parseInt(document.getElementById('customWidth').value, 10); const h = parseInt(document.getElementById('customHeight').value, 10); if (!w || !h) { alert('Enter valid size'); return; } setCanvasSize(w, h); }

// Templates and variants
function showTemplateVariants(key) {
  const grid = document.querySelector('.template-grid'); if (!grid) return; const existing = document.getElementById('templateVariants'); if (existing) existing.remove(); const tpl = posterTemplates[key]; if (!tpl || !tpl.variants) return; const container = document.createElement('div'); container.id = 'templateVariants'; container.className = 'mt-2 d-flex gap-2 flex-wrap'; tpl.variants.forEach(v => { const btn = document.createElement('button'); btn.className = 'btn btn-sm btn-outline-secondary'; btn.innerText = v.name; btn.addEventListener('click', () => applyTemplateVariant(key, v.id)); container.appendChild(btn); }); grid.parentNode.insertBefore(container, grid.nextSibling);
}

function selectTemplate(key) { document.querySelectorAll('.poster-template-card').forEach(c => c.classList.remove('active')); const card = document.querySelector(`.poster-template-card[data-template="${key}"]`); if (card) card.classList.add('active'); showTemplateVariants(key); const def = posterTemplates[key] && posterTemplates[key].variants && posterTemplates[key].variants[0] ? posterTemplates[key].variants[0].id : null; applyTemplateVariant(key, def); }

function applyTemplateVariant(key, variantId) {
  if (!canvas) return; canvas.clear();
  switch (`${key}::${variantId}`) {
    case 'magazine::mag-1':
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
      addRect(30, 30, canvas.getWidth() - 60, canvas.getHeight() - 60, '#f8f9fa', 6);
      addText('MAGAZINE', 60, 60, { fontSize: 56, fontFamily: 'Playfair Display', fill: '#111' });
      addText('Spring 2025 • The Fashion Issue', 60, 140, { fontSize: 18, fill: '#333' });
      addRect(canvas.getWidth() - 360, 120, 300, 420, '#e9ecef', 6);
      break;
    case 'magazine::mag-2':
      canvas.setBackgroundColor('#0b0f1a', canvas.renderAll.bind(canvas));
      addText('THE MAG', 60, 60, { fontSize: 64, fontFamily: 'Playfair Display', fill: '#fff' });
      addText('Issue 12', 60, 140, { fontSize: 18, fill: '#9aa0b2' });
      addRect(60, 220, canvas.getWidth() - 120, canvas.getHeight() / 2, '#111827', 4);
      break;
    case 'magazine::mag-3':
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
      addText('EDITORIAL', 60, 60, { fontSize: 52, fontFamily: 'Playfair Display', fill: '#222' });
      addRect(60, 140, canvas.getWidth() - 120, 360, '#f1f5f9', 6);
      addText("Editor's Pick", 80, 180, { fontSize: 24, fill: '#444' });
      break;
    // existing template cases
    case 'fashion::fashion-2':
      canvas.setBackgroundColor('#f8e9f0', canvas.renderAll.bind(canvas)); addText('FASHION EDIT', 40, 40, { fontFamily: 'Playfair Display', fontSize: 64, fill: '#111' }); addText('Autumn Collection', 40, 120, { fontSize: 28, fill: '#333' }); addRect(canvas.getWidth() - 420, 60, 360, 480, '#e9e9e9', 8); break;
    case 'fashion::fashion-1': canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas)); addText('FASHION', 60, 60, { fontSize: 72, fontFamily: 'Playfair Display', fill: '#c2185b' }); addRect(60, 140, canvas.getWidth() - 120, canvas.getHeight() / 2, '#f5f5f5'); break;
    case 'tech::tech-2': canvas.setBackgroundColor('#0f1724', canvas.renderAll.bind(canvas)); addText('TECH MAG', 40, 40, { fontSize: 58, fill: '#00e5ff' }); break;
    case 'tech::tech-1': canvas.setBackgroundColor('#eaf6ff', canvas.renderAll.bind(canvas)); addText('TECH', 50, 50, { fontSize: 64, fill: '#064e3b' }); break;
    case 'event::event-1': canvas.setBackgroundColor('#fff8e1', canvas.renderAll.bind(canvas)); addText('CITY FEST', 40, 60, { fontSize: 72, fill: '#c62828' }); addText('Sat, 20 Dec • 7PM', 40, 160, { fontSize: 22, fill: '#5d4037' }); break;
    case 'food::food-1': canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas)); addRect(40, 80, canvas.getWidth() - 80, canvas.getHeight() / 2, '#f5f5f5'); addText('TASTE FEST', 60, 40, { fontSize: 56, fill: '#a52714' }); break;
    case 'music::music-1': canvas.setBackgroundColor('#0d0d0d', canvas.renderAll.bind(canvas)); addText('MUSIC FEST', 40, canvas.getHeight() - 140, { fontSize: 64, fill: '#ffffff' }); break;
    default: canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas)); break;
  }
  canvas.renderAll(); pushState(); renderLayers();
}

// Helpers to add objects
function addText(content = 'New text', left = 100, top = 100, opts = {}) { if (!canvas) return; const t = new fabric.Textbox(content, Object.assign({ left, top, width: 400, fontSize: 32, fontFamily: 'Poppins', fill: '#111' }, opts)); canvas.add(t); canvas.setActiveObject(t); canvas.renderAll(); pushState(); renderLayers(); }
function addRect(left, top, w, h, fill = '#ddd', rx = 0) { if (!canvas) return; const r = new fabric.Rect({ left, top, width: w, height: h, fill, rx, selectable: true }); canvas.add(r); canvas.setActiveObject(r); canvas.renderAll(); pushState(); renderLayers(); }
function addCircle(left = 100, top = 100, radius = 50, fill = '#5bc0de') { if (!canvas) return; const c = new fabric.Circle({ left, top, radius, fill, selectable: true }); canvas.add(c); canvas.setActiveObject(c); canvas.renderAll(); pushState(); renderLayers(); }

// Image upload
function handleImageUpload(e) { if (!e || !e.target || !e.target.files) return; const f = e.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = function (ev) { fabric.Image.fromURL(ev.target.result, function (img) { const maxW = canvas.getWidth() * 0.8, maxH = canvas.getHeight() * 0.8; let scale = Math.min(maxW / (img.width || maxW), maxH / (img.height || maxH), 1); if (!isFinite(scale) || scale <= 0) scale = 1; img.set({ left: 50, top: 50, scaleX: scale, scaleY: scale, selectable: true }); canvas.add(img); canvas.setActiveObject(img); canvas.renderAll(); pushState(); renderLayers(); }, { crossOrigin: 'anonymous' }); }; reader.readAsDataURL(f); e.target.value = ''; }

function addTextBox() { if (!canvas) return addText('New text', canvas.getWidth() / 2 - 150, canvas.getHeight() / 2 - 20, { fontSize: 36 }); }
function addImageBox() { const el = document.getElementById('hiddenImageInput'); if (el) el.click(); }
function addShape(type) { if (!canvas) return; if (type === 'rectangle') addRect(canvas.getWidth() / 2 - 100, canvas.getHeight() / 2 - 50, 200, 100, '#f0ad4e'); else addCircle(canvas.getWidth() / 2 - 50, canvas.getHeight() / 2 - 50, 50, '#5bc0de'); }

// Background controls
function changeBackgroundColor() { const el = document.getElementById('backgroundColor'); if (!el || !canvas) return; canvas.setBackgroundColor(el.value, canvas.renderAll.bind(canvas)); pushState(); }
function changeBackgroundImage() { const input = document.getElementById('backgroundImage'); if (!input || !input.files || !input.files[0] || !canvas) return; const f = input.files[0]; const reader = new FileReader(); reader.onload = (e) => { fabric.Image.fromURL(e.target.result, img => { const scale = Math.max(canvas.getWidth() / (img.width || 1), canvas.getHeight() / (img.height || 1)); img.set({ scaleX: scale, scaleY: scale, left: 0, top: 0, selectable: false, evented: false }); canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas)); pushState(); }); }; reader.readAsDataURL(f); input.value = ''; }
function removeBackgroundImage() { if (!canvas) return; canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas)); const el = document.getElementById('backgroundImage'); if (el) el.value = ''; pushState(); }

// Properties panel
function populateProperties() { const obj = canvas.getActiveObject(); activeObj = obj; const panel = document.getElementById('propertiesPanel'); if (!panel) return; if (!obj) { panel.innerHTML = '<p class="text-muted">Select an object to edit properties</p>'; return; } const isText = obj.type === 'textbox' || obj.type === 'text'; let html = ''; html += `<div class="mb-2"><label>X</label><input class="form-control form-control-sm" type="number" value="${Math.round(obj.left || 0)}" onchange="window.updateProperty('left', this.value)"></div>`; html += `<div class="mb-2"><label>Y</label><input class="form-control form-control-sm" type="number" value="${Math.round(obj.top || 0)}" onchange="window.updateProperty('top', this.value)"></div>`; html += `<div class="mb-2"><label>Rotate</label><input class="form-range" type="range" min="0" max="360" value="${obj.angle || 0}" onchange="window.updateProperty('angle', this.value)"></div>`; html += `<div class="mb-2"><label>Opacity</label><input class="form-range" type="range" min="0" max="1" step="0.1" value="${obj.opacity || 1}" onchange="window.updateProperty('opacity', this.value)"></div>`; if (isText) { html += `<div class="mb-2"><label>Text</label><input class="form-control form-control-sm" type="text" value="${(obj.text || '').replace(/"/g, '&quot;')}" onchange="window.updateProperty('text', this.value)"></div>`; html += `<div class="mb-2"><label>Font Size</label><input class="form-control form-control-sm" type="number" value="${obj.fontSize || 32}" onchange="window.updateProperty('fontSize', this.value)"></div>`; html += `<div class="mb-2"><label>Color</label><input class="form-control form-control-color" type="color" value="${obj.fill || '#000000'}" onchange="window.updateProperty('fill', this.value)"></div>`; } else if (obj.type === 'rect' || obj.type === 'circle') { html += `<div class="mb-2"><label>Fill</label><input class="form-control form-control-color" type="color" value="${obj.fill || '#000000'}" onchange="window.updateProperty('fill', this.value)"></div>`; } panel.innerHTML = html; }
function clearProperties() { const panel = document.getElementById('propertiesPanel'); if (panel) panel.innerHTML = '<p class="text-muted">Select an object to edit properties</p>'; activeObj = null; }
function updateProperty(prop, val) { if (!activeObj) return; const numProps = ['left', 'top', 'angle', 'opacity', 'fontSize']; if (numProps.includes(prop)) val = parseFloat(val); try { activeObj.set(prop, val); activeObj.setCoords(); canvas.renderAll(); pushState(); renderLayers(); } catch (e) { console.warn('updateProperty failed', e); } }
window.updateProperty = updateProperty;

// Layers
  function renderLayers() { const list = document.getElementById('layersList'); if (!list || !canvas) return; list.innerHTML = ''; const objs = canvas.getObjects().slice().reverse(); if (!objs.length) { list.innerHTML = '<p class="text-muted p-3">No layers yet</p>'; return; } objs.forEach((obj, idx) => { const realIndex = canvas.getObjects().length - 1 - idx; const item = document.createElement('div'); item.className = 'layer-item d-flex align-items-center justify-content-between p-1 mb-1 border'; const name = (obj.type === 'textbox' || obj.type === 'text') ? (obj.text || 'Text') : (obj.type || 'Object'); const left = document.createElement('div'); left.innerHTML = `<small>${name}</small>`; const right = document.createElement('div'); const selBtn = document.createElement('button'); selBtn.className = 'btn btn-sm btn-outline-secondary'; selBtn.innerHTML = '&#128065;'; selBtn.onclick = (ev) => { ev.stopPropagation(); canvas.setActiveObject(canvas.getObjects()[realIndex]); canvas.requestRenderAll(); populateProperties(); }; right.appendChild(selBtn); item.appendChild(left); item.appendChild(right); item.onclick = () => { canvas.setActiveObject(canvas.getObjects()[realIndex]); canvas.requestRenderAll(); populateProperties(); }; list.appendChild(item); }); }
  function moveLayerUp() { const a = canvas.getActiveObject(); if (a) { canvas.bringForward(a); renderLayers(); pushState(); } }
  function moveLayerDown() { const a = canvas.getActiveObject(); if (a) { canvas.sendBackwards(a); renderLayers(); pushState(); } }
  function toggleLayerVisibility(index) { if (!canvas) return; if (typeof index === 'number') { const objs = canvas.getObjects(); if (objs[index]) { objs[index].visible = !objs[index].visible; canvas.renderAll(); renderLayers(); pushState(); } } else { const a = canvas.getActiveObject(); if (a) { a.visible = !a.visible; canvas.renderAll(); renderLayers(); pushState(); } } }
  function lockLayer() { const a = canvas.getActiveObject(); if (a) { a.selectable = !a.selectable; a.evented = a.selectable; canvas.renderAll(); renderLayers(); } }

  // actions
  function duplicateObject() { const a = canvas.getActiveObject(); if (!a) return; a.clone(cloned => { cloned.set({ left: (a.left || 0) + 20, top: (a.top || 0) + 20 }); canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll(); pushState(); renderLayers(); }); }
  function deleteObject() { const a = canvas.getActiveObject(); if (!a) return; canvas.remove(a); clearProperties(); pushState(); renderLayers(); }
  function alignObjects(pos) { const a = canvas.getActiveObject(); if (!a) return; if (pos === 'left') a.left = 0; else if (pos === 'center') a.left = (canvas.getWidth() - (a.getScaledWidth ? a.getScaledWidth() : a.width)) / 2; else if (pos === 'right') a.left = canvas.getWidth() - (a.getScaledWidth ? a.getScaledWidth() : a.width); a.setCoords(); canvas.renderAll(); pushState(); renderLayers(); }
  function distributeObjects() { const objs = canvas.getObjects(); if (!objs.length) return; const left = 0, right = canvas.getWidth(); const gap = (right - left) / (objs.length + 1); objs.forEach((o, i) => { o.left = gap * (i + 1); o.setCoords(); }); canvas.renderAll(); pushState(); renderLayers(); }

  // undo/redo
  function pushState() { try { const s = JSON.stringify(canvas.toJSON()); undoStack.push(s); if (undoStack.length > maxUndo) undoStack.shift(); redoStack = []; } catch (e) {} }
  function undoAction() { if (undoStack.length < 2) return; const cur = undoStack.pop(); redoStack.push(cur); const prev = undoStack[undoStack.length - 1]; if (!prev) return; canvas.loadFromJSON(prev, () => { canvas.renderAll(); renderLayers(); }); }
  function redoAction() { if (!redoStack.length) return; const s = redoStack.pop(); undoStack.push(s); canvas.loadFromJSON(s, () => { canvas.renderAll(); renderLayers(); }); }

  // save/load
  function saveDesign() { try { const data = { canvas: canvas.toJSON(), savedAt: new Date().toISOString() }; localStorage.setItem('poster_design', JSON.stringify(data)); alert('Design saved locally'); } catch (e) { alert('Failed to save design'); } }
  function loadDesign() { const raw = localStorage.getItem('poster_design'); if (!raw) { alert('No saved design found'); return; } try { const data = JSON.parse(raw); canvas.loadFromJSON(data.canvas, () => { canvas.renderAll(); renderLayers(); clearProperties(); pushState(); alert('Design loaded'); }); } catch (e) { alert('Failed to load design'); } }

  // export
  function exportDesign(format) { if (!canvas) return; const data = canvas.toDataURL({ format: 'png', multiplier: 2 }); if (format === 'png' || !format) { const a = document.createElement('a'); a.href = data; a.download = `poster-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); } else if (format === 'pdf') { const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null); if (!jsPDF) { alert('PDF export library unavailable'); return; } const pdf = new jsPDF({ orientation: canvas.getWidth() > canvas.getHeight() ? 'landscape' : 'portrait', unit: 'px', format: [canvas.getWidth(), canvas.getHeight()] }); pdf.addImage(data, 'PNG', 0, 0, canvas.getWidth(), canvas.getHeight()); pdf.save(`poster-${Date.now()}.pdf`); } }

  // expose for HTML inline handlers
  window.addTextBox = addTextBox; window.addImageBox = addImageBox; window.addShape = addShape; window.handleImageUpload = handleImageUpload; window.changeBackgroundColor = changeBackgroundColor; window.changeBackgroundImage = changeBackgroundImage; window.removeBackgroundImage = removeBackgroundImage; window.undoAction = undoAction; window.redoAction = redoAction; window.duplicateObject = duplicateObject; window.deleteObject = deleteObject; window.saveDesign = saveDesign; window.loadDesign = loadDesign; window.alignObjects = alignObjects; window.distributeObjects = distributeObjects; window.moveLayerUp = moveLayerUp; window.moveLayerDown = moveLayerDown; window.toggleLayerVisibility = toggleLayerVisibility; window.lockLayer = lockLayer; window.exportDesign = exportDesign; window.applyCustomSize = applyCustomSize; window.changeCanvasSize = changeCanvasSize; window.selectTemplate = selectTemplate; window.showTemplateVariants = showTemplateVariants;

  document.addEventListener('DOMContentLoaded', () => { initPoster(); });

  console.log('poster.js initialized');