/* =====================================================
   Activity Report Generator
   Export & Sharing Utilities
   File: js/export.js
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const btnPdf = document.getElementById("btnPdf");
  const btnWord = document.getElementById("btnWord");
  const btnPng = document.getElementById("btnPng");
  const addWatermark = document.getElementById("addWatermark");

  btnPdf?.addEventListener("click", () => exportPDF(addWatermark.checked));
  btnWord?.addEventListener("click", exportWord);
  btnPng?.addEventListener("click", () => exportPNG(addWatermark.checked));
});

// ---------- EXPORT PDF ----------
async function exportPDF(withWatermark = false) {
  const node = document.getElementById("reportCanvas").cloneNode(true);
  if (withWatermark) applyWatermark(node);

  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

  const date = new Date().toISOString().split("T")[0];
  pdf.save(`Activity_Report_${date}.pdf`);
}

// ---------- EXPORT WORD ----------
function exportWord() {
  const content = document.getElementById("reportCanvas").innerHTML;
  const blob = new Blob(
    [
      `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Activity Report</title></head><body>${content}</body></html>`,
    ],
    { type: "application/msword" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Activity_Report.doc";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- EXPORT PNG ----------
async function exportPNG(withWatermark = false) {
  const node = document.getElementById("reportCanvas").cloneNode(true);
  if (withWatermark) applyWatermark(node);

  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  const date = new Date().toISOString().split("T")[0];
  link.download = `Activity_Report_${date}.png`;
  link.click();
}

// ---------- EXPORT HTML SNIPPET (Optional Utility) ----------
function exportHTMLSnippet() {
  const content = document.getElementById("reportCanvas").innerHTML;
  const blob = new Blob([content], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Activity_Report_Snippet.html";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- APPLY WATERMARK ----------
function applyWatermark(container) {
  const mark = document.createElement("div");
  mark.textContent = "OFFICIAL COPY";
  Object.assign(mark.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: "48px",
    color: "rgba(0,0,0,0.1)",
    fontWeight: "700",
    pointerEvents: "none",
    userSelect: "none",
  });

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "fit-content";
  wrapper.style.margin = "auto";
  wrapper.appendChild(container);
  wrapper.appendChild(mark);
  document.body.appendChild(wrapper);
  return wrapper;
}
