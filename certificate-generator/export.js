// Export functions for the certificate generator

export function initCertificateExport() {
  document.getElementById('exportPngBtn').addEventListener('click', () => {
    exportPNG();
  });
  document.getElementById('exportPdfBtn').addEventListener('click', () => {
    exportPDF();
  });
}

function getExportTarget() {
  return document.querySelector('#certificateCanvas');
}

async function exportPNG() {
  const target = getExportTarget();
  if (!target) return;

  try {
    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });
    const dataURL = canvas.toDataURL('image/png');
    downloadFile(dataURL, 'certificate.png');
  } catch (error) {
    console.error('PNG export failed:', error);
  }
}

async function exportPDF() {
  const target = getExportTarget();
  if (!target) return;

  try {
    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save('certificate.pdf');
  } catch (error) {
    console.error('PDF export failed:', error);
  }
}

function downloadFile(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
