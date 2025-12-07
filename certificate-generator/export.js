// Export engine for the new certificate canvas.
// Exports the visible certificate (without scrollbars) to PNG and PDF.

export async function exportCanvasPNG(canvasEl) {
  if (!canvasEl) return;
  const prevTransform = canvasEl.style.transform;
  canvasEl.style.transform = 'none';

  const rect = canvasEl.getBoundingClientRect();
  const canvas = await html2canvas(canvasEl, {
    backgroundColor: null,
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    width: rect.width,
    height: rect.height
  });

  canvasEl.style.transform = prevTransform;
  const dataURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'certificate.png';
  a.click();
}

export async function exportCanvasPDF(canvasEl, orientationHint = 'landscape') {
  if (!canvasEl) return;
  const prevTransform = canvasEl.style.transform;
  canvasEl.style.transform = 'none';

  const rect = canvasEl.getBoundingClientRect();
  const canvas = await html2canvas(canvasEl, {
    backgroundColor: null,
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    width: rect.width,
    height: rect.height
  });

  canvasEl.style.transform = prevTransform;

  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const { jsPDF } = window.jspdf;
  const orientation = rect.width > rect.height ? 'landscape' : orientationHint;
  const pdf = new jsPDF({ orientation, unit: 'px', format: [rect.width, rect.height] });
  pdf.addImage(imgData, 'JPEG', 0, 0, rect.width, rect.height);
  pdf.save('certificate.pdf');
}
