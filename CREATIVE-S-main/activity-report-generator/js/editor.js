/* =====================================================
   Activity Report Generator
   Editor & Layout Engine
   File: js/editor.js
   ===================================================== */

let undoStack = [];
let redoStack = [];
let chartInstance = null;
const chartElId = "activityChart";

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  setupLiveEditing();
  setupUndoRedo();
  setupAnalytics();
});

// ---------- LIVE EDITING ----------
function setupLiveEditing() {
  const editor = document.getElementById("reportCanvas");
  editor.addEventListener("input", () => {
    saveToStorage(); // reuse from report.js
    pushUndo(editor.innerHTML);
  });
}

// ---------- UNDO / REDO ----------
function setupUndoRedo() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
      undo();
    } else if (e.ctrlKey && e.key === "y") {
      e.preventDefault();
      redo();
    }
  });
}

function pushUndo(content) {
  undoStack.push(content);
  if (undoStack.length > 50) undoStack.shift();
}

function undo() {
  if (!undoStack.length) return;
  const current = document.getElementById("reportCanvas").innerHTML;
  redoStack.push(current);
  const prev = undoStack.pop();
  document.getElementById("reportCanvas").innerHTML = prev;
  saveToStorage();
}

function redo() {
  if (!redoStack.length) return;
  const current = document.getElementById("reportCanvas").innerHTML;
  undoStack.push(current);
  const next = redoStack.pop();
  document.getElementById("reportCanvas").innerHTML = next;
  saveToStorage();
}

// ---------- ANALYTICS / CHART ----------
function setupAnalytics() {
  const chartContainer = document.createElement("div");
  chartContainer.className = "card mt-3 shadow-sm";
  chartContainer.innerHTML = `
    <div class="card-header fw-semibold">Activity Summary</div>
    <div class="card-body text-center">
      <canvas id="${chartElId}" height="150"></canvas>
    </div>
  `;
  document
    .getElementById("tab-editor")
    .querySelector(".row")
    .appendChild(chartContainer);
  updateAnalytics();
}

function updateAnalytics() {
  const content = document.getElementById("reportCanvas").innerText.toLowerCase();
  const events = (content.match(/event/gi) || []).length;
  const participants = (content.match(/student|participant|member/gi) || []).length;
  const dates = (content.match(/\d{2}[-/]\d{2}[-/]\d{4}/g) || []).length;

  const ctx = document.getElementById(chartElId);
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Events", "Participants", "Dates"],
      datasets: [
        {
          label: "Count",
          data: [events, participants, dates],
          backgroundColor: ["#4f46e5", "#06b6d4", "#10b981"],
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, precision: 0 } },
    },
  });
}

// ---------- AUTO UPDATE CHART ----------
setInterval(updateAnalytics, 4000);
