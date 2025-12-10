import { aiSuggestWording } from '/certificate-generator/ai-hooks.js';
import { initCertificateExport } from '/certificate-generator/export.js';

const CERT_STORAGE_KEY = 'certificate-generator-state';

const state = {
  templateId: 'classic',
  layout: {
    background: '#ffffff',
    borderColor: '#d4af37',
    fontFamily: 'serif',
    primaryColor: '#222222',
    accentColor: '#d4af37'
  },
  content: {
    title: 'Certificate of Achievement',
    subtitle: 'This certifies that',
    recipient: 'Recipient Name',
    description: 'For outstanding performance and dedication.',
    date: 'December 10, 2025',
    signatureLabel: 'Authorized Signature'
  },
  positions: {
    title: { x: 50, y: 20 },
    subtitle: { x: 50, y: 32 },
    recipient: { x: 50, y: 45 },
    description: { x: 50, y: 60 },
    date: { x: 20, y: 80 },
    signatureLabel: { x: 70, y: 80 }
  }
};

let dragging = null;
let dragOffset = { x: 0, y: 0 };

function initCertificateDesigner() {
  loadState();
  renderCertificate();
  wireControls();
  initCertificateExport();
}

function renderCertificate() {
  const canvas = document.getElementById('certificateCanvas');
  canvas.innerHTML = '';

  // Apply background and border
  canvas.style.backgroundColor = state.layout.background;
  canvas.style.borderColor = state.layout.borderColor;

  // Create text elements
  const fields = ['title', 'subtitle', 'recipient', 'description', 'date', 'signatureLabel'];
  fields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'certificate-text';
    div.dataset.field = field;
    div.textContent = state.content[field];
    div.style.left = `${state.positions[field].x}%`;
    div.style.top = `${state.positions[field].y}%`;
    div.style.fontFamily = state.layout.fontFamily;
    div.style.color = field === 'title' || field === 'recipient' ? state.layout.primaryColor : state.layout.accentColor;

    // Add event listeners for dragging
    div.addEventListener('mousedown', startDrag);
    canvas.appendChild(div);
  });
}

function startDrag(e) {
  dragging = e.target;
  const rect = dragging.getBoundingClientRect();
  const canvasRect = document.getElementById('certificateCanvas').getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  dragging.classList.add('dragging');
}

function drag(e) {
  if (!dragging) return;
  const canvas = document.getElementById('certificateCanvas');
  const canvasRect = canvas.getBoundingClientRect();
  const x = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100;
  const y = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;

  const field = dragging.dataset.field;
  state.positions[field].x = Math.max(0, Math.min(100, x));
  state.positions[field].y = Math.max(0, Math.min(100, y));

  dragging.style.left = `${state.positions[field].x}%`;
  dragging.style.top = `${state.positions[field].y}%`;
}

function stopDrag() {
  if (dragging) {
    dragging.classList.remove('dragging');
    saveState();
  }
  dragging = null;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}

function wireControls() {
  // Template selector
  document.getElementById('templateSelect').addEventListener('change', (e) => {
    state.templateId = e.target.value;
    applyTemplate();
  });

  // Text inputs
  const textFields = ['certTitleInput', 'certSubtitleInput', 'recipientInput', 'descriptionInput', 'dateInput', 'signatureLabelInput'];
  textFields.forEach(id => {
    const field = id.replace('Input', '').toLowerCase().replace('cert', '');
    document.getElementById(id).addEventListener('input', (e) => {
      state.content[field] = e.target.value;
      renderCertificate();
      saveState();
    });
  });

  // Style controls
  document.getElementById('fontFamilySelect').addEventListener('change', (e) => {
    state.layout.fontFamily = e.target.value;
    renderCertificate();
    saveState();
  });

  document.getElementById('fontSizeRange').addEventListener('input', (e) => {
    // This could be used to scale all text, but for simplicity, we'll keep it as is
  });

  document.getElementById('primaryColorInput').addEventListener('input', (e) => {
    state.layout.primaryColor = e.target.value;
    renderCertificate();
    saveState();
  });

  document.getElementById('accentColorInput').addEventListener('input', (e) => {
    state.layout.accentColor = e.target.value;
    renderCertificate();
    saveState();
  });

  // Buttons
  document.getElementById('applyTemplateBtn').addEventListener('click', applyTemplate);
  document.getElementById('resetBtn').addEventListener('click', resetCertificate);
  document.getElementById('aiSuggestBtn').addEventListener('click', async () => {
    try {
      const suggestions = await aiSuggestWording({});
      state.content.title = suggestions.title;
      state.content.subtitle = suggestions.subtitle;
      state.content.description = suggestions.description;
      updateInputs();
      renderCertificate();
      saveState();
    } catch (error) {
      console.warn('AI suggest failed:', error);
    }
  });
}

function applyTemplate() {
  const templates = {
    classic: {
      background: '#ffffff',
      borderColor: '#d4af37',
      fontFamily: 'serif',
      primaryColor: '#222222',
      accentColor: '#d4af37'
    },
    minimal: {
      background: '#ffffff',
      borderColor: '#000000',
      fontFamily: 'sans-serif',
      primaryColor: '#000000',
      accentColor: '#666666'
    },
    gradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderColor: '#ffffff',
      fontFamily: "'Montserrat', sans-serif",
      primaryColor: '#ffffff',
      accentColor: '#f0f0f0'
    }
  };

  const template = templates[state.templateId] || templates.classic;
  state.layout = { ...template };
  renderCertificate();
  saveState();
}

function resetCertificate() {
  Object.assign(state, {
    templateId: 'classic',
    layout: {
      background: '#ffffff',
      borderColor: '#d4af37',
      fontFamily: 'serif',
      primaryColor: '#222222',
      accentColor: '#d4af37'
    },
    content: {
      title: 'Certificate of Achievement',
      subtitle: 'This certifies that',
      recipient: 'Recipient Name',
      description: 'For outstanding performance and dedication.',
      date: 'December 10, 2025',
      signatureLabel: 'Authorized Signature'
    },
    positions: {
      title: { x: 50, y: 20 },
      subtitle: { x: 50, y: 32 },
      recipient: { x: 50, y: 45 },
      description: { x: 50, y: 60 },
      date: { x: 20, y: 80 },
      signatureLabel: { x: 70, y: 80 }
    }
  });
  updateInputs();
  renderCertificate();
  saveState();
}

function updateInputs() {
  document.getElementById('certTitleInput').value = state.content.title;
  document.getElementById('certSubtitleInput').value = state.content.subtitle;
  document.getElementById('recipientInput').value = state.content.recipient;
  document.getElementById('descriptionInput').value = state.content.description;
  document.getElementById('dateInput').value = state.content.date;
  document.getElementById('signatureLabelInput').value = state.content.signatureLabel;
  document.getElementById('templateSelect').value = state.templateId;
  document.getElementById('fontFamilySelect').value = state.layout.fontFamily;
  document.getElementById('primaryColorInput').value = state.layout.primaryColor;
  document.getElementById('accentColorInput').value = state.layout.accentColor;
}

async function saveState() {
  try {
    if (window.AppStorage && AppStorage.save) {
      await AppStorage.save(CERT_STORAGE_KEY, state);
    } else {
      localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.warn('Certificate save failed', err);
  }
}

async function loadState() {
  try {
    let loaded = null;
    if (window.AppStorage && AppStorage.load) {
      loaded = await AppStorage.load(CERT_STORAGE_KEY);
    } else {
      const raw = localStorage.getItem(CERT_STORAGE_KEY);
      loaded = raw ? JSON.parse(raw) : null;
    }
    if (loaded && typeof loaded === 'object') {
      Object.assign(state, loaded);
    }
  } catch (err) {
    console.warn('Certificate load failed', err);
  }
  updateInputs();
}

document.addEventListener('DOMContentLoaded', initCertificateDesigner);
