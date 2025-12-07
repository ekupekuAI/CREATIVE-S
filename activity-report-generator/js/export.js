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

  if (!window.html2canvas) {
    console.warn("html2canvas not loaded. Export may not work.");
  }
  if (!window.jspdf) {
    console.warn("jsPDF not loaded. PDF export may not work.");
  }

  btnPdf?.addEventListener("click", () => exportPDF(addWatermark.checked));
  btnWord?.addEventListener("click", exportWord);
  btnPng?.addEventListener("click", () => exportPNG(addWatermark.checked));
});

// ---------- EXPORT PDF ----------
async function exportPDF(withWatermark = false) {
  try {
    const node = document.getElementById("reportCanvas");
    if (!node || !node.innerHTML.trim()) {
      alert("No report content to export. Please add some content first.");
      return;
    }
    const clonedNode = node.cloneNode(true);
    if (withWatermark) applyWatermark(clonedNode);

    // Temporarily append to DOM for html2canvas
    clonedNode.style.position = 'absolute';
    clonedNode.style.left = '-9999px';
    document.body.appendChild(clonedNode);

    console.log("Generating PDF...");
    const canvas = await html2canvas(clonedNode, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    document.body.removeChild(clonedNode);

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert("PDF library not loaded. Please refresh the page.");
      return;
    }
    const pdf = new jsPDF("p", "pt", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

    const date = new Date().toISOString().split("T")[0];
    pdf.save(`Activity_Report_${date}.pdf`);
    console.log("PDF exported successfully.");
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to export PDF. Check console for details.");
  }
}

// ---------- EXPORT WORD ----------
function exportWord() {
  try {
    const content = document.getElementById("reportCanvas").innerHTML;
    if (!content.trim()) {
      alert("No report content to export. Please add some content first.");
      return;
    }
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Activity Report</title></head><body>${content}</body></html>`,
      ],
      { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Activity_Report.docx";
    a.click();
    URL.revokeObjectURL(a.href);
    console.log("Word export initiated.");
  } catch (error) {
    console.error("Word export failed:", error);
    alert("Failed to export Word document. Check console for details.");
  }
}

// ---------- EXPORT PNG ----------
async function exportPNG(withWatermark = false) {
  try {
    const node = document.getElementById("reportCanvas");
    if (!node || !node.innerHTML.trim()) {
      alert("No report content to export. Please add some content first.");
      return;
    }
    const clonedNode = node.cloneNode(true);
    if (withWatermark) applyWatermark(clonedNode);

    // Temporarily append to DOM for html2canvas
    clonedNode.style.position = 'absolute';
    clonedNode.style.left = '-9999px';
    document.body.appendChild(clonedNode);

    console.log("Generating PNG...");
    const canvas = await html2canvas(clonedNode, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    document.body.removeChild(clonedNode);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    const date = new Date().toISOString().split("T")[0];
    link.download = `Activity_Report_${date}.png`;
    link.click();
    console.log("PNG exported successfully.");
  } catch (error) {
    console.error("PNG export failed:", error);
    alert("Failed to export PNG. Check console for details.");
  }
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
