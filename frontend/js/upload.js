import { initAppShell } from '/js/app-shell.js';
import { analyzeMedia, logAction } from '/js/api.js';
import { showToast, showLoading, updateLoading, hideLoading } from '/js/notify.js';
import { validateFile, MODELS } from '/js/detector.js';
import { generatePdfReport } from '/js/report.js';

// Skip admin guard for public upload page so the UI loads in development and production
const guard = await initAppShell(true);
const main = document.getElementById('main-content');

main.innerHTML = `
  <div class="page-header">
    <h1>New Detection</h1>
    <p>Upload an image or video for forensic deepfake analysis.</p>
  </div>

  <div class="glass" style="padding:32px;margin-bottom:24px;">
    <div class="upload-zone" id="drop-zone">
      <div class="upload-icon">⬆</div>
      <h3>Drag &amp; Drop your file here</h3>
      <p>or click to browse from your device</p>
      <input type="file" id="file-input" style="display:none;" accept=".jpg,.jpeg,.png,.webp,.mp4,.avi,.mov,.mkv" />
      <div class="file-types">
        <span class="file-type-chip">JPG</span><span class="file-type-chip">PNG</span><span class="file-type-chip">WEBP</span>
        <span class="file-type-chip">MP4</span><span class="file-type-chip">AVI</span><span class="file-type-chip">MOV</span><span class="file-type-chip">MKV</span>
      </div>
      <p style="margin-top:12px;font-size:12px;color:var(--muted);">Max file size: 50 MB</p>
    </div>

    <div class="preview-area" id="preview-area"></div>

    <div class="mt-24 flex gap-16 wrap">
      <div class="row" style="flex:1;min-width:200px;">
        <label class="label">Detection Model</label>
        <select class="select" id="model-select">
          ${Object.entries(MODELS).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" id="analyze-btn" disabled style="align-self:flex-end;">Run Detection</button>
    </div>
  </div>

  <div id="result-container"></div>
`;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const analyzeBtn = document.getElementById('analyze-btn');
let selectedFile = null;

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => {
  e.preventDefault(); dropZone.classList.add('dragover');
}));
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, (e) => {
  e.preventDefault(); dropZone.classList.remove('dragover');
}));
dropZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});

function handleFile(file) {
  if (!file) return;
  const v = validateFile(file);
  if (!v.ok) { showToast(v.error, 'error'); return; }
  selectedFile = file;
  previewArea.innerHTML = '';
  const item = document.createElement('div');
  item.className = 'preview-item';
  if (v.mediaType === 'image') {
    item.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="preview" /><button class="remove" type="button">✕</button>`;
  } else {
    item.innerHTML = `<video src="${URL.createObjectURL(file)}" muted></video><button class="remove" type="button">✕</button>`;
  }
  item.querySelector('.remove').addEventListener('click', () => {
    previewArea.innerHTML = ''; selectedFile = null; analyzeBtn.disabled = true;
  });
  previewArea.appendChild(item);
  analyzeBtn.disabled = false;
  showToast(`File loaded: ${file.name}`, 'info');
}

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  const modelKey = document.getElementById('model-select').value;
  analyzeBtn.disabled = true;
  showLoading('Uploading media...');
  try {
    const result = await analyzeMedia(selectedFile, modelKey);
    if (!result) throw new Error('Analysis returned no result.');

    result.modelUsed = result.model_name || result.modelUsed || 'Unknown';
    result.modelVersion = result.model_version || result.modelVersion || 'N/A';
    result.framesAnalyzed = result.frames_analyzed || result.framesAnalyzed || 0;
    result.reportId = result.report_id || result.reportId || 'RPT-UNKNOWN';
    result.filename = result.filename || selectedFile.name;
    result.file_size = result.file_size || selectedFile.size;
    result.created_at = result.created_at || new Date().toISOString();

    hideLoading();
    renderResult(result);
    await logAction('detection_run', `${selectedFile.name} -> ${result.prediction} (${result.confidence}%)`);
    showToast('Detection complete. Report ready.', 'success');
  } catch (err) {
    hideLoading();
    showToast(err.message || 'Detection failed', 'error');
    analyzeBtn.disabled = false;
  }
});

function renderResult(r) {
  const isAi = r.prediction === 'AI GENERATED';
  const container = document.getElementById('result-container');
  const recs = Array.isArray(r.recommendations) ? r.recommendations : String(r.recommendations || '').split('\n');
  container.innerHTML = `
    <div class="glass result-panel">
      <div class="result-verdict ${isAi ? 'ai' : 'human'}">
        <div class="verdict-icon">${isAi ? '⚠' : '✓'}</div>
        <h2>${r.prediction}</h2>
        <div class="conf">Confidence: ${r.confidence}% · Probability (AI): ${r.probability}% · Model: ${r.modelUsed}</div>
      </div>

      <div class="result-grid">
        <div class="result-stat"><div class="k">Processing Time</div><div class="v">${r.processingTime}s</div></div>
        <div class="result-stat"><div class="k">Frames Analyzed</div><div class="v">${r.framesAnalyzed}</div></div>
        <div class="result-stat"><div class="k">Media Type</div><div class="v" style="text-transform:capitalize;">${escapeHtml(r.mediaType)}</div></div>
        <div class="result-stat"><div class="k">Report ID</div><div class="v mono" style="font-size:13px;">${escapeHtml(r.reportId)}</div></div>
      </div>

      <h3 style="margin:24px 0 12px;font-size:16px;">Forensic Metrics</h3>
      <div class="grid-2">
        ${Object.entries(r.metrics || {}).map(([k, m]) => {
          if (m && typeof m === 'object') {
            return `
          <div class="result-stat">
            <div class="k">${k.toUpperCase()}</div>
            ${Object.entries(m).map(([sk, sv]) => `<div style="font-size:13px;color:var(--muted);margin-top:4px;"><span style="color:var(--text);">${sk}:</span> ${escapeHtml(sv)}</div>`).join('')}
          </div>`;
          }
          return `
          <div class="result-stat">
            <div class="k">${k.toUpperCase()}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">${escapeHtml(String(m))}</div>
          </div>`;
        }).join('')}
      </div>

      <h3 style="margin:24px 0 12px;font-size:16px;">Analysis Summary</h3>
      <p style="color:var(--muted);font-size:14px;line-height:1.6;">${escapeHtml(r.analysisSummary)}</p>

      <h3 style="margin:24px 0 12px;font-size:16px;">Recommendations</h3>
      <ol style="color:var(--muted);font-size:14px;line-height:1.8;padding-left:20px;">
        ${recs.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
      </ol>

      <h3 style="margin:24px 0 12px;font-size:16px;">Grok AI Insight</h3>
      <div class="glass" style="padding:18px;background:rgba(5,8,22,.9);border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-weight:700;color:var(--text);">AI Risk Level</div>
          <span class="badge ${r.aiRisk === 'HIGH' ? 'danger' : r.aiRisk === 'MEDIUM' ? 'warning' : 'accent'}">${escapeHtml(r.aiRisk)}</span>
        </div>
        <p style="color:var(--muted);font-size:13px;line-height:1.8;">${escapeHtml(r.aiSummary)}</p>
      </div>

      <div class="flex gap-12 wrap mt-24">
        <button class="btn btn-primary" id="dl-pdf">Download PDF</button>
        <button class="btn btn-ghost" id="print-pdf">Print</button>
        <button class="btn btn-ghost" id="share-btn">Share</button>
        <a href="/history.html" class="btn btn-ghost">View History</a>
      </div>
    </div>
  `;

  const fullRecord = {
    ...r,
    filename: r.filename,
    file_size: r.file_size,
    created_at: r.created_at,
  };
  document.getElementById('dl-pdf').addEventListener('click', async () => {
    showLoading('Generating PDF report...');
    try {
      const doc = await generatePdfReport(fullRecord, guard, r.reportId);
      doc.save(`${r.reportId}.pdf`);
      hideLoading();
      showToast('PDF report downloaded', 'success');
    } catch (err) {
      hideLoading();
      showToast('PDF generation failed: ' + err.message, 'error');
    }
  });
  document.getElementById('print-pdf').addEventListener('click', async () => {
    showLoading('Preparing print...');
    try {
      const doc = await generatePdfReport(fullRecord, guard, r.reportId);
      hideLoading();
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      hideLoading();
      showToast('Print failed: ' + err.message, 'error');
    }
  });
  document.getElementById('share-btn').addEventListener('click', async () => {
    const url = `${window.location.origin}/report.html?id=${r.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Deepfake Detection Report', text: `Verdict: ${r.prediction} (${r.confidence}%)`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Report link copied to clipboard', 'success');
      }
    } catch (e) {
      showToast('Share cancelled', 'info');
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
