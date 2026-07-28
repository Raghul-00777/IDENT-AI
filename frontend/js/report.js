import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Generate a professional PDF forensic report
export async function generatePdfReport(prediction, user, reportId) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const isAi = prediction.prediction === 'AI GENERATED';
  const accent = isAi ? [255, 75, 92] : [0, 255, 136];
  const primary = [0, 245, 255];

  // ---- Header band ----
  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setFillColor(...primary);
  doc.rect(0, 88, pageW, 2, 'F');

  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DEEPFAKE DETECTION', margin, 40);
  doc.setFontSize(10);
  doc.setTextColor(160, 174, 192);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Forensics Laboratory — Forensic Analysis Report', margin, 58);
  doc.setTextColor(...accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isAi ? 'VERDICT: AI GENERATED' : 'VERDICT: AUTHENTIC', pageW - margin, 40, { align: 'right' });
  doc.setTextColor(160, 174, 192);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Report ID: ${reportId}`, pageW - margin, 58, { align: 'right' });

  // ---- Metadata block ----
  let y = 120;
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Case Information', margin, y);
  y += 8;
  doc.setDrawColor(...primary);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  const rows = [
    ['Analyst', user?.email || 'Unknown'],
    ['Full Name', user?.profile?.full_name || '—'],
    ['File Name', prediction.filename],
    ['File Size', formatBytes(prediction.file_size)],
    ['Media Type', prediction.mediaType || prediction.media_type || 'image'],
    ['Upload Date', new Date(prediction.created_at).toLocaleString()],
    ['Report ID', reportId],
    ['Model Used', prediction.modelUsed || prediction.model_used || 'EfficientNet-B4'],
    ['Processing Time', `${prediction.processingTime || prediction.processing_time || 0} s`],
  ];
  doc.setFontSize(10);
  for (const [k, v] of rows) {
    doc.setTextColor(100, 110, 130);
    doc.setFont('helvetica', 'bold');
    doc.text(k, margin, y);
    doc.setTextColor(20, 25, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), margin + 120, y);
    y += 18;
  }

  // ---- Verdict block ----
  y += 10;
  doc.setFillColor(...accent);
  doc.roundedRect(margin, y, pageW - margin * 2, 60, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(prediction.prediction, margin + 16, y + 26);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confidence: ${prediction.confidence}%   |   Probability (AI): ${prediction.probability}%`, margin + 16, y + 46);

  // ---- Probability bar ----
  y += 80;
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Probability Distribution', margin, y);
  y += 10;
  doc.setDrawColor(220, 225, 235);
  doc.setFillColor(230, 235, 245);
  doc.roundedRect(margin, y, pageW - margin * 2, 18, 4, 4, 'F');
  const barW = (pageW - margin * 2) * ((prediction.probability ?? 0) / 100);
  doc.setFillColor(...accent);
  if (barW > 0) doc.roundedRect(margin, y, barW, 18, 4, 4, 'F');
  doc.setTextColor(60, 70, 90);
  doc.setFontSize(9);
  doc.text('AI Generated', margin, y + 32);
  doc.text('Original / Human', pageW - margin, y + 32, { align: 'right' });

  // ---- Analysis summary ----
  y += 56;
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Analysis Summary', margin, y);
  y += 8;
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 55, 70);
  const summary = doc.splitTextToSize(prediction.analysisSummary || prediction.analysis_summary || '', pageW - margin * 2);
  doc.text(summary, margin, y);
  y += summary.length * 14 + 12;

  // ---- Metrics table ----
  if (prediction.metrics && typeof prediction.metrics === 'object') {
    doc.setTextColor(40, 40, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Forensic Metrics', margin, y);
    y += 8;
    doc.line(margin, y, pageW - margin, y);
    y += 16;
    doc.setFontSize(10);
    for (const [name, m] of Object.entries(prediction.metrics)) {
      doc.setTextColor(100, 110, 130);
      doc.setFont('helvetica', 'bold');
      doc.text(name.toUpperCase(), margin, y);
      doc.setTextColor(20, 25, 40);
      doc.setFont('helvetica', 'normal');
      const parts = Object.entries(m).map(([k, v]) => `${k}: ${v}`).join('    ');
      doc.text(doc.splitTextToSize(parts, pageW - margin * 2 - 100), margin + 100, y);
      y += 18;
    }
  }

  // ---- Recommendations ----
  y += 10;
  if (y > pageH - 160) { doc.addPage(); y = margin; }
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Recommendations', margin, y);
  y += 8;
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 55, 70);
  const recs = (prediction.recommendations || '');
  const recArr = Array.isArray(recs) ? recs : String(recs).split('\n').filter(Boolean);
  for (let i = 0; i < recArr.length; i++) {
    const line = `${i + 1}. ${recArr[i]}`;
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14 + 4;
  }

  // ---- QR code (bottom-right) ----
  try {
    const qrData = `REPORT:${reportId}|FILE:${prediction.filename}|VERDICT:${prediction.prediction}|CONF:${prediction.confidence}`;
    const qrUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 120 });
    doc.addImage(qrUrl, 'PNG', pageW - 120, pageH - 130, 80, 80);
  } catch (e) {
    console.warn('QR failed', e);
  }

  // ---- Footer ----
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(margin, pageH - 40, pageW - margin, pageH - 40);
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 150);
  doc.text('Generated by AI-Driven Deepfake Detection System — Forensic Analysis Report', margin, pageH - 24);
  doc.text(`Page 1 of 1  |  ${new Date().toISOString()}`, pageW - margin, pageH - 24, { align: 'right' });

  return doc;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(2)} ${units[i]}`;
}
