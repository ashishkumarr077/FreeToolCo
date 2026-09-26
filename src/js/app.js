/* FreeToolCo front-end engine: plugin registry + shared tool renderers. */
(() => {
  const tools = window.FTC_TOOLS || [];
  const categories = window.FTC_CATEGORIES || [];
  const basePath = String(window.FTC_BASE_PATH || '').replace(/\/+$/g, '');
  const siteUrl = String(window.FTC_SITE_URL || 'https://freetoolco.com').replace(/\/+$/g, '');
  const withBase = (url) => (!basePath || !url.startsWith('/')) ? url : (url === '/' ? `${basePath}/` : `${basePath}${url}`);
  const currentSlug = window.FTC_TOOL_SLUG || '';
  const currentTool = tools.find((tool) => tool.slug === currentSlug);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const slugify = (value = '') => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const fmtBytes = (bytes = 0) => {
    if (!Number.isFinite(bytes)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i += 1; }
    return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };
  const fmtNum = (number, digits = 2) => Number(number || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
  const todayISO = () => new Date().toISOString().slice(0, 10);

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard.');
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      toast('Copied to clipboard.');
    }
  }

  function toast(message) {
    let node = $('#ftc-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'ftc-toast';
      node.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:120;background:#0f172a;color:white;padding:12px 16px;border-radius:999px;font-weight:800;box-shadow:0 12px 30px rgba(0,0,0,.22);opacity:0;transition:opacity .18s ease';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.opacity = '1';
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.style.opacity = '0'; }, 1800);
  }

  function friendlyError(error) {
    const message = String(error?.message || error || 'Unknown error');
    if (/password|encrypted/i.test(message)) return 'This PDF appears to be password-protected or encrypted. Please unlock it first and try again.';
    if (/pdf|xref|trailer|parse|invalid|corrupt|header/i.test(message)) return 'This file could not be read as a valid PDF. Please check the file and try another one.';
    if (/image|decode|load/i.test(message)) return 'This image could not be opened. Please try a valid JPG, PNG, or WebP file.';
    if (/base64|atob/i.test(message)) return 'The Base64 input is not valid. Please check the pasted data and try again.';
    if (/json/i.test(message)) return 'The JSON input is not valid. Please fix the syntax and try again.';
    return message.replace(/file:\/\/[^\s)]+/g, '[internal path]').slice(0, 240);
  }

  async function runWithBusy(button, busyLabel, task) {
    if (!button || button.dataset.running === 'true') return;
    const original = button.innerHTML;
    button.dataset.running = 'true';
    button.disabled = true;
    button.innerHTML = `⏳ ${busyLabel || 'Processing...'}`;
    setProgress(5);
    try {
      return await task();
    } finally {
      button.disabled = false;
      button.dataset.running = 'false';
      button.innerHTML = original;
    }
  }

  function setProgress(percent) {
    const bar = $('.progress');
    const fill = $('.progress span');
    if (!bar || !fill) return;
    bar.style.display = 'block';
    fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (percent >= 100) setTimeout(() => { bar.style.display = 'none'; fill.style.width = '0%'; }, 700);
  }

  function renderFileList(files) {
    const list = $('.file-list');
    if (!list) return;
    const arr = [...files];
    list.innerHTML = arr.length
      ? arr.map((file, index) => `<div class="file-pill"><span>${index + 1}. ${esc(file.name)}</span><strong>${fmtBytes(file.size)}</strong></div>`).join('')
      : '';
  }

  function renderManagedFileList(list, files, { reorder = false } = {}) {
    if (!list) return;
    if (!files.length) {
      list.innerHTML = '<div class="notice">No files selected yet.</div>';
      return;
    }
    list.innerHTML = files.map((file, index) => `<div class="file-pill managed-file" data-index="${index}">
      <span>${index + 1}. ${esc(file.name)}</span>
      <strong>${fmtBytes(file.size)}</strong>
      <span class="file-actions">
        ${reorder ? `<button type="button" class="mini-btn" data-action="up" aria-label="Move ${esc(file.name)} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="mini-btn" data-action="down" aria-label="Move ${esc(file.name)} down" ${index === files.length - 1 ? 'disabled' : ''}>↓</button>` : ''}
        <button type="button" class="mini-btn" data-action="remove" aria-label="Remove ${esc(file.name)}">Remove</button>
      </span>
    </div>`).join('');
  }

  function out(html, type = '') {
    const box = $('#tool-output');
    if (!box) return;
    box.className = `output-box ${type}`.trim();
    box.innerHTML = html;
  }

  function relationTools(tool, count = 6) {
    if (!tool) return tools.slice(0, count);
    return tools.filter((item) => item.slug !== tool.slug && item.category === tool.category).slice(0, count);
  }

  function initShell() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    const darkToggle = $('#dark-toggle');
    const savedTheme = localStorage.getItem('ftc-theme');
    if (savedTheme === 'dark') document.body.classList.add('dark');
    if (darkToggle) {
      darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('ftc-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      });
    }

    const mobile = $('#mobile-menu');
    const nav = $('#nav-links');
    if (mobile && nav) {
      mobile.addEventListener('click', () => {
        nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
        nav.style.position = 'absolute';
        nav.style.left = '22px';
        nav.style.right = '22px';
        nav.style.top = '64px';
        nav.style.background = 'var(--surface)';
        nav.style.border = '1px solid var(--line)';
        nav.style.borderRadius = '18px';
        nav.style.padding = '12px';
        nav.style.flexDirection = 'column';
        nav.style.alignItems = 'stretch';
      });
    }

    initSearch();
    initHomepageSearch();
    initAllToolsFilter();
  }

  function initSearch() {
    const modal = $('#search-modal');
    const input = $('#search-input');
    const results = $('#search-results');
    const triggers = $$('.search-trigger, [data-open-search]');
    if (!modal || !input || !results) return;

    const open = () => {
      modal.classList.add('open');
      input.value = '';
      renderSearch('');
      setTimeout(() => input.focus(), 50);
    };
    const close = () => modal.classList.remove('open');
    triggers.forEach((trigger) => trigger.addEventListener('click', open));
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { event.preventDefault(); open(); }
      if (event.key === 'Escape') close();
    });
    input.addEventListener('input', () => renderSearch(input.value));

    function renderSearch(query) {
      const q = query.trim().toLowerCase();
      const matched = tools
        .filter((tool) => !q || `${tool.name} ${tool.description} ${(tool.keywords || []).join(' ')}`.toLowerCase().includes(q))
        .slice(0, 18);
      results.innerHTML = matched.map((tool) => {
        const category = categories.find((cat) => cat.id === tool.category);
        return `<a class="search-result" href="${withBase(`/${tool.slug}/`)}"><strong>${esc(tool.name)}</strong><small>${esc(category?.shortName || '')} · ${esc(tool.privacy || 'Runs in your browser')}</small></a>`;
      }).join('') || '<div class="search-result"><strong>No tools found</strong><small>Try PDF, image, calculator, JSON, QR, word counter.</small></div>';
    }
  }

  function initHomepageSearch() {
    const input = $('#home-tool-search');
    const grid = $('#popular-tools-grid');
    if (!input || !grid) return;
    const cards = $$('.tool-card', grid);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach((card) => {
        const match = card.dataset.search.includes(q);
        card.style.display = match ? '' : 'none';
      });
    });
  }

  function initAllToolsFilter() {
    const wrap = $('#all-tools-page');
    if (!wrap) return;
    const buttons = $$('.filter-btn', wrap);
    const cards = $$('.tool-card', wrap);
    buttons.forEach((button) => button.addEventListener('click', () => {
      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      cards.forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.style.display = visible ? '' : 'none';
      });
    }));
  }

  function initTool() {
    const mount = $('#tool-app');
    if (!mount || !currentTool) return;
    const engine = currentTool.engine;
    if (engine.startsWith('pdf-')) return renderPdfTool(mount, currentTool);
    if (engine.startsWith('image-') || ['passport-photo-resizer', 'signature-resizer', 'favicon-generator', 'base64-to-image'].includes(engine)) return renderImageTool(mount, currentTool);
    if (engine.startsWith('calculator-')) return renderCalculatorTool(mount, currentTool);
    if (engine.startsWith('text-') || engine.startsWith('dev-') || engine.startsWith('security-') || engine === 'qr-generator') return renderTextDevTool(mount, currentTool);
    mount.innerHTML = '<div class="notice error">This tool plugin is not registered yet.</div>';
  }

  function baseToolChrome(inner) {
    return `${inner}<div class="progress"><span></span></div><div id="tool-output" class="output-box"></div><div class="preview-grid" id="preview-grid"></div>`;
  }

  function uploadHtml({ accept = '*/*', multiple = false, title = 'Drop files here', hint = 'or choose files from your device' } = {}) {
    return `<label class="upload-zone" id="upload-zone">
      <input id="file-input" type="file" accept="${accept}" ${multiple ? 'multiple' : ''}>
      <div class="big-icon">☁️</div>
      <h3>${esc(title)}</h3>
      <p>${esc(hint)}</p>
      <span class="btn primary">Choose file${multiple ? 's' : ''}</span>
    </label><div class="file-list"></div>`;
  }

  function bindUpload(input, zone, onFiles) {
    if (!input || !zone) return;
    input.addEventListener('change', () => { renderFileList(input.files); onFiles?.(input.files); });
    ['dragenter', 'dragover'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.remove('dragover'); }));
    zone.addEventListener('drop', (event) => {
      input.files = event.dataTransfer.files;
      renderFileList(input.files);
      onFiles?.(input.files);
    });
  }

  // ---------- PDF tools ----------
  function renderPdfTool(mount, tool) {
    const isImagePdf = tool.engine === 'pdf-image-to-pdf';
    const isMultiPdf = ['pdf-merge', 'pdf-page-counter'].includes(tool.engine);
    const accept = isImagePdf ? 'image/jpeg,image/png,image/webp' : 'application/pdf';
    const multiple = isImagePdf || isMultiPdf;
    let options = '';

    if (isImagePdf) {
      options = `<div class="form-grid">
        <div class="form-row"><label>Page size</label><select id="page-size"><option value="a4">A4 document</option><option value="letter">Letter</option><option value="auto">Auto image size</option></select></div>
        <div class="form-row"><label>Orientation</label><select id="orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
        <div class="form-row"><label>Margin</label><select id="margin"><option value="24">Small</option><option value="0">No margin</option><option value="48">Medium</option></select></div>
        <div class="form-row"><label>Image fit</label><select id="image-fit"><option value="contain">Fit page</option><option value="cover">Fill page</option></select></div>
      </div>`;
    } else if (tool.engine === 'pdf-split') {
      options = `<div class="form-grid"><div class="form-row full"><label>Page ranges to split/extract (optional)</label><input id="page-ranges" placeholder="Example: 1-3,5,8-10. Leave blank to export every page separately."></div></div>`;
    } else if (['pdf-extract', 'pdf-delete-pages'].includes(tool.engine)) {
      options = `<div class="form-grid"><div class="form-row full"><label>Page numbers or ranges</label><input id="page-ranges" placeholder="Example: 1,3-5,9" required></div></div>`;
    } else if (tool.engine === 'pdf-rotate') {
      options = `<div class="form-grid"><div class="form-row"><label>Rotation</label><select id="rotation"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></div><div class="form-row"><label>Pages</label><input id="page-ranges" placeholder="All pages or 1,3-5"></div></div>`;
    } else if (tool.engine === 'pdf-reorder') {
      options = `<div class="form-grid"><div class="form-row full"><label>New page order</label><input id="page-order" placeholder="Example: 3,1,2,4-6" required></div></div>`;
    } else if (tool.engine === 'pdf-page-numbers') {
      options = `<div class="form-grid"><div class="form-row"><label>Position</label><select id="position"><option value="bottom-center">Bottom center</option><option value="bottom-right">Bottom right</option><option value="top-center">Top center</option><option value="top-right">Top right</option></select></div><div class="form-row"><label>Start number</label><input id="start-number" type="number" value="1"></div><div class="form-row"><label>Font size</label><input id="font-size" type="number" value="12"></div></div>`;
    } else if (tool.engine === 'pdf-watermark') {
      options = `<div class="form-grid"><div class="form-row full"><label>Watermark text</label><input id="watermark-text" value="CONFIDENTIAL"></div><div class="form-row"><label>Opacity</label><input id="opacity" type="number" min="0.05" max="1" step="0.05" value="0.18"></div><div class="form-row"><label>Angle</label><input id="angle" type="number" value="-35"></div><div class="form-row"><label>Font size</label><input id="font-size" type="number" value="48"></div></div>`;
    } else if (tool.engine === 'pdf-to-image') {
      options = `<div class="form-grid"><div class="form-row"><label>Pages</label><input id="page-ranges" placeholder="All pages or 1-3"></div><div class="form-row"><label>Scale</label><select id="scale"><option value="1.5">Balanced</option><option value="2">High quality</option><option value="1">Small</option></select></div><div class="form-row"><label>JPG quality</label><input id="jpg-quality" type="number" min="0.3" max="1" step="0.05" value="0.88"></div></div>`;
    }

    const warning = tool.engine === 'pdf-compress-basic'
      ? '<div class="notice">Professional note: browser PDF optimization can reduce structure overhead but cannot always recompress embedded images like server-side Ghostscript tools. This page is honest and SEO-safe.</div>'
      : '';

    mount.innerHTML = baseToolChrome(`${uploadHtml({ accept, multiple, title: isImagePdf ? 'Drop images to create a PDF' : 'Drop PDF file here', hint: `${tool.privacy}. Files are processed on this device when your browser supports it.` })}${options}${warning}<div class="result-actions"><button class="btn primary" id="process-btn">Run ${esc(tool.name)}</button><button class="btn" id="clear-btn">Clear</button></div>`);

    const input = $('#file-input', mount);
    const list = $('.file-list', mount);
    let managedFiles = [];
    const isManagedMerge = tool.engine === 'pdf-merge';
    const refreshManaged = () => renderManagedFileList(list, managedFiles, { reorder: isManagedMerge });
    bindUpload(input, $('#upload-zone', mount), (files) => {
      if (isManagedMerge) {
        managedFiles = [...files];
        refreshManaged();
      }
    });
    if (isManagedMerge) {
      refreshManaged();
      list.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const row = button.closest('.managed-file');
        const index = Number(row?.dataset.index);
        if (!Number.isInteger(index)) return;
        const action = button.dataset.action;
        if (action === 'up' && index > 0) [managedFiles[index - 1], managedFiles[index]] = [managedFiles[index], managedFiles[index - 1]];
        if (action === 'down' && index < managedFiles.length - 1) [managedFiles[index + 1], managedFiles[index]] = [managedFiles[index], managedFiles[index + 1]];
        if (action === 'remove') managedFiles.splice(index, 1);
        refreshManaged();
      });
    }
    $('#clear-btn', mount)?.addEventListener('click', () => { input.value = ''; managedFiles = []; isManagedMerge ? refreshManaged() : renderFileList([]); out(''); $('#preview-grid').innerHTML = ''; });
    $('#process-btn', mount)?.addEventListener('click', async (event) => runWithBusy(event.currentTarget, 'Processing...', async () => {
      try {
        out('<strong>Processing…</strong> Please keep this tab open.', 'notice'); $('#preview-grid').innerHTML = '';
        const files = isManagedMerge ? managedFiles : [...(input.files || [])];
        if (!files.length) throw new Error('Please choose at least one file.');
        await handlePdf(tool, files);
      } catch (error) {
        out(`<strong>Could not process file:</strong> ${esc(friendlyError(error))}`, 'error');
      } finally {
        setProgress(100);
      }
    }));
  }

  async function handlePdf(tool, files) {
    if (typeof PDFLib === 'undefined') throw new Error('PDF engine did not load. Please refresh the page.');
    const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;
    setProgress(8);

    if (tool.engine === 'pdf-image-to-pdf') {
      const pdfDoc = await PDFDocument.create();
      const pageSize = $('#page-size').value;
      const orientation = $('#orientation').value;
      const margin = Number($('#margin').value || 0);
      const fit = $('#image-fit').value;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageBytes = await file.arrayBuffer();
        let embedBytes = imageBytes;
        let type = file.type;
        if (type === 'image/webp') {
          const converted = await convertImageFile(file, { format: 'png' });
          embedBytes = await converted.blob.arrayBuffer();
          type = 'image/png';
        }
        const img = type.includes('png') ? await pdfDoc.embedPng(embedBytes) : await pdfDoc.embedJpg(embedBytes);
        let width = 595.28, height = 841.89;
        if (pageSize === 'letter') { width = 612; height = 792; }
        if (pageSize === 'auto') { width = img.width * 0.75; height = img.height * 0.75; }
        if (orientation === 'landscape' && height > width) [width, height] = [height, width];
        const page = pdfDoc.addPage([width, height]);
        const maxW = width - margin * 2;
        const maxH = height - margin * 2;
        const scale = fit === 'cover' ? Math.max(maxW / img.width, maxH / img.height) : Math.min(maxW / img.width, maxH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        page.drawImage(img, { x: (width - drawW) / 2, y: (height - drawH) / 2, width: drawW, height: drawH });
        setProgress(8 + (i + 1) / files.length * 70);
      }
      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, `${tool.slug}-${Date.now()}.pdf`);
      out(successHtml('PDF created', `Created ${fmtBytes(blob.size)} from ${files.length} image file(s).`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-merge') {
      const outDoc = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const srcDoc = await PDFDocument.load(await files[i].arrayBuffer(), { ignoreEncryption: true });
        const copied = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copied.forEach((page) => outDoc.addPage(page));
        setProgress(8 + (i + 1) / files.length * 72);
      }
      const bytes = await outDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, 'merged-free-toolco.pdf');
      out(successHtml('PDF files merged', `${files.length} PDFs combined into ${fmtBytes(blob.size)}.`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-page-counter') {
      const rows = [];
      let total = 0;
      for (const file of files) {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const pages = pdf.getPageCount();
        total += pages;
        rows.push(`<tr><td>${esc(file.name)}</td><td>${pages}</td><td>${fmtBytes(file.size)}</td></tr>`);
      }
      out(`<strong>Total pages: ${total}</strong><table style="width:100%;margin-top:12px;border-collapse:collapse"><thead><tr><th align="left">File</th><th align="left">Pages</th><th align="left">Size</th></tr></thead><tbody>${rows.join('')}</tbody></table>`, 'success-note');
      return;
    }

    const file = files[0];
    const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();
    setProgress(18);

    if (tool.engine === 'pdf-metadata-viewer') {
      out(`<strong>PDF metadata</strong>\n\nFile: ${esc(file.name)}\nSize: ${fmtBytes(file.size)}\nPages: ${totalPages}\nTitle: ${esc(pdfDoc.getTitle() || 'Not set')}\nAuthor: ${esc(pdfDoc.getAuthor() || 'Not set')}\nSubject: ${esc(pdfDoc.getSubject() || 'Not set')}\nCreator: ${esc(pdfDoc.getCreator() || 'Not set')}\nProducer: ${esc(pdfDoc.getProducer() || 'Not set')}\nCreation date: ${pdfDoc.getCreationDate() || 'Not set'}\nModification date: ${pdfDoc.getModificationDate() || 'Not set'}`, 'success-note');
      return;
    }

    if (tool.engine === 'pdf-compress-basic') {
      const before = file.size;
      const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const diff = before - blob.size;
      downloadBlob(blob, `optimized-${file.name.replace(/\.pdf$/i, '')}.pdf`);
      const detail = diff > 0
        ? `Before: ${fmtBytes(before)} · After: ${fmtBytes(blob.size)} · Saved ${fmtBytes(diff)}.`
        : `Before: ${fmtBytes(before)} · After: ${fmtBytes(blob.size)}. This PDF was already optimized or contains images that browser-only optimization cannot recompress.`;
      out(successHtml('PDF optimization complete', detail), diff > 0 ? 'success-note' : 'notice');
      return;
    }

    if (tool.engine === 'pdf-metadata-cleaner') {
      pdfDoc.setTitle(''); pdfDoc.setAuthor(''); pdfDoc.setSubject(''); pdfDoc.setKeywords([]); pdfDoc.setProducer(''); pdfDoc.setCreator('');
      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, `metadata-cleaned-${file.name}`);
      out(successHtml('Common metadata fields cleaned', `Saved cleaned PDF: ${fmtBytes(blob.size)}. Note: some advanced XMP/custom metadata may remain depending on the source file.`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-to-image') return pdfToImages(tool, file, totalPages);
    if (tool.engine === 'pdf-to-text') return pdfToText(file);

    const outputDoc = await PDFDocument.create();
    const ranges = $('#page-ranges')?.value || '';
    const selectedPages = parsePages(ranges, totalPages, tool.engine === 'pdf-delete-pages' ? [] : null);

    if (tool.engine === 'pdf-split') {
      const zip = new JSZip();
      if (!ranges.trim()) {
        for (let i = 0; i < totalPages; i++) {
          const doc = await PDFDocument.create();
          const [page] = await doc.copyPages(pdfDoc, [i]);
          doc.addPage(page);
          zip.file(`page-${i + 1}.pdf`, await doc.save({ useObjectStreams: true }));
          setProgress(20 + (i + 1) / totalPages * 62);
        }
      } else {
        const doc = await PDFDocument.create();
        const copied = await doc.copyPages(pdfDoc, selectedPages);
        copied.forEach((page) => doc.addPage(page));
        zip.file(`pages-${ranges.replace(/[^0-9,-]/g, '')}.pdf`, await doc.save({ useObjectStreams: true }));
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'split-pdf-pages.zip');
      out(successHtml('PDF split completed', `ZIP created: ${fmtBytes(blob.size)}.`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-extract') {
      if (!selectedPages.length) throw new Error('Enter valid pages to extract.');
      const copied = await outputDoc.copyPages(pdfDoc, selectedPages);
      copied.forEach((page) => outputDoc.addPage(page));
    }

    if (tool.engine === 'pdf-delete-pages') {
      const remove = new Set(parsePages(ranges, totalPages));
      const keep = [...Array(totalPages)].map((_, i) => i).filter((i) => !remove.has(i));
      if (!keep.length) throw new Error('You cannot delete all pages.');
      const copied = await outputDoc.copyPages(pdfDoc, keep);
      copied.forEach((page) => outputDoc.addPage(page));
    }

    if (tool.engine === 'pdf-reorder') {
      const order = parsePages($('#page-order').value, totalPages);
      if (!order.length) throw new Error('Enter a valid page order.');
      const copied = await outputDoc.copyPages(pdfDoc, order);
      copied.forEach((page) => outputDoc.addPage(page));
    }

    if (tool.engine === 'pdf-rotate') {
      const angle = Number($('#rotation').value || 90);
      const set = new Set(ranges.trim() ? parsePages(ranges, totalPages) : [...Array(totalPages)].map((_, i) => i));
      const pages = pdfDoc.getPages();
      pages.forEach((page, i) => {
        if (set.has(i)) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      });
      const blob = new Blob([await pdfDoc.save({ useObjectStreams: true })], { type: 'application/pdf' });
      downloadBlob(blob, `rotated-${file.name}`);
      out(successHtml('PDF rotated', `Rotated ${set.size} page(s).`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-page-numbers') {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const start = Number($('#start-number').value || 1);
      const fontSize = Number($('#font-size').value || 12);
      const position = $('#position').value;
      pdfDoc.getPages().forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = String(start + i);
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const x = position.endsWith('right') ? width - textWidth - 32 : (width - textWidth) / 2;
        const y = position.startsWith('top') ? height - 32 : 24;
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.15, 0.18, 0.25) });
      });
      const blob = new Blob([await pdfDoc.save({ useObjectStreams: true })], { type: 'application/pdf' });
      downloadBlob(blob, `numbered-${file.name}`);
      out(successHtml('Page numbers added', `Numbered ${totalPages} page(s).`), 'success-note');
      return;
    }

    if (tool.engine === 'pdf-watermark') {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text = $('#watermark-text').value || 'CONFIDENTIAL';
      const opacity = Math.max(0.05, Math.min(1, Number($('#opacity').value || 0.18)));
      const angle = Number($('#angle').value || -35);
      const fontSize = Number($('#font-size').value || 48);
      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, { x: (width - textWidth) / 2, y: height / 2, size: fontSize, font, color: rgb(0.15, 0.18, 0.25), opacity, rotate: degrees(angle) });
      });
      const blob = new Blob([await pdfDoc.save({ useObjectStreams: true })], { type: 'application/pdf' });
      downloadBlob(blob, `watermarked-${file.name}`);
      out(successHtml('Watermark added', `Watermarked ${totalPages} page(s).`), 'success-note');
      return;
    }

    if (['pdf-extract', 'pdf-delete-pages', 'pdf-reorder'].includes(tool.engine)) {
      const blob = new Blob([await outputDoc.save({ useObjectStreams: true })], { type: 'application/pdf' });
      downloadBlob(blob, `${tool.slug}-${file.name}`);
      out(successHtml('PDF ready', `Created ${fmtBytes(blob.size)} output file.`), 'success-note');
    }
  }

  function parsePages(input, totalPages, fallbackAll = null) {
    if (!input || !input.trim()) {
      return fallbackAll === null ? [...Array(totalPages)].map((_, i) => i) : fallbackAll;
    }
    const pages = new Set();
    input.split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => {
      const range = part.split('-').map((n) => Number(n.trim()));
      if (range.length === 2 && range.every(Number.isFinite)) {
        const [start, end] = range;
        const step = start <= end ? 1 : -1;
        for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
          if (page >= 1 && page <= totalPages) pages.add(page - 1);
        }
      } else {
        const page = Number(part);
        if (Number.isFinite(page) && page >= 1 && page <= totalPages) pages.add(page - 1);
      }
    });
    return [...pages];
  }

  async function loadPdfJs() {
    const pdfjs = await import('./vendor/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = withBase('/assets/vendor/pdf.worker.mjs');
    return pdfjs;
  }

  async function pdfToImages(tool, file, totalPages) {
    const pdfjs = await loadPdfJs();
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const ranges = $('#page-ranges')?.value || '';
    const pages = parsePages(ranges, totalPages);
    const scale = Number($('#scale').value || 1.5);
    const quality = Number($('#jpg-quality').value || 0.88);
    const zip = new JSZip();
    const preview = $('#preview-grid');
    for (let index = 0; index < pages.length; index++) {
      const pageNumber = pages[index] + 1;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const mime = tool.outputFormat === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(canvas, mime, quality);
      zip.file(`page-${pageNumber}.${tool.outputFormat === 'png' ? 'png' : 'jpg'}`, blob);
      if (index < 6 && preview) {
        const url = URL.createObjectURL(blob);
        preview.insertAdjacentHTML('beforeend', `<div class="preview-card"><img alt="PDF page ${pageNumber}" src="${url}"><strong>Page ${pageNumber}</strong><p>${fmtBytes(blob.size)}</p></div>`);
      }
      setProgress(20 + (index + 1) / pages.length * 70);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${tool.slug}-pages.zip`);
    out(successHtml('PDF pages converted', `${pages.length} page(s) exported as ${tool.outputFormat.toUpperCase()} in ${fmtBytes(zipBlob.size)} ZIP.`), 'success-note');
  }

  async function pdfToText(file) {
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const lines = [];
    let extractedChars = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ').trim();
      extractedChars += pageText.length;
      lines.push(`--- Page ${i} ---`);
      lines.push(pageText);
      setProgress(15 + i / pdf.numPages * 75);
    }
    if (!extractedChars) {
      out('<strong>No selectable text found.</strong><br>This PDF may be scanned or image-only. Use an OCR tool for scanned documents.', 'notice');
      return;
    }
    const text = lines.join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    out(`<div class="result-actions"><button class="btn primary" id="copy-pdf-text">Copy text</button><button class="btn" id="download-pdf-text">Download TXT</button></div><pre>${esc(text.slice(0, 10000))}${text.length > 10000 ? '\n\n…preview truncated; download the full text.' : ''}</pre>`, 'success-note');
    $('#copy-pdf-text')?.addEventListener('click', () => copyText(text));
    $('#download-pdf-text')?.addEventListener('click', () => downloadBlob(blob, `${file.name.replace(/\.pdf$/i, '')}.txt`));
  }

  function successHtml(title, detail) {
    return `<strong>✅ ${esc(title)}</strong><br>${esc(detail)}`;
  }

  // ---------- Image tools ----------
  function renderImageTool(mount, tool) {
    if (tool.engine === 'base64-to-image') {
      mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row full"><label>Paste Base64 image data</label><textarea id="base64-input" placeholder="data:image/png;base64,..."></textarea></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Convert to image</button></div>`);
      $('#process-btn').addEventListener('click', (event) => runWithBusy(event.currentTarget, 'Converting...', async () => handleBase64ToImage()));
      return;
    }

    let options = imageOptions(tool);
    mount.innerHTML = baseToolChrome(`${uploadHtml({ accept: 'image/*', multiple: ['image-convert', 'image-compress', 'image-target-size', 'favicon-generator'].includes(tool.engine), title: 'Drop image file here', hint: `${tool.privacy}. JPG, PNG, and WebP are supported.` })}${options}<div class="result-actions"><button class="btn primary" id="process-btn">Run ${esc(tool.name)}</button><button class="btn" id="clear-btn">Clear</button></div>`);
    const input = $('#file-input', mount);
    bindUpload(input, $('#upload-zone', mount));
    $('#clear-btn')?.addEventListener('click', () => { input.value = ''; renderFileList([]); out(''); $('#preview-grid').innerHTML = ''; });
    $('#process-btn')?.addEventListener('click', async (event) => runWithBusy(event.currentTarget, 'Processing...', async () => {
      try {
        out('<strong>Processing…</strong> Large images can take a moment on mobile devices.', 'notice'); $('#preview-grid').innerHTML = '';
        const files = [...(input.files || [])];
        if (!files.length) throw new Error('Please choose an image file.');
        await handleImage(tool, files);
      } catch (error) {
        out(`<strong>Could not process image:</strong> ${esc(friendlyError(error))}`, 'error');
      } finally { setProgress(100); }
    }));
  }

  function imageOptions(tool) {
    const quality = `<div class="form-row"><label>Quality</label><input id="quality" type="number" min="0.1" max="1" step="0.05" value="0.86"></div>`;
    const format = `<div class="form-row"><label>Output format</label><select id="format"><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>`;
    if (tool.engine === 'image-resize') return `<div class="form-grid"><div class="form-row"><label>Width px</label><input id="width" type="number" placeholder="Auto"></div><div class="form-row"><label>Height px</label><input id="height" type="number" placeholder="Auto"></div><div class="form-row"><label>Keep aspect ratio</label><select id="aspect"><option value="yes">Yes</option><option value="no">No</option></select></div>${format}${quality}</div>`;
    if (tool.engine === 'image-compress') return `<div class="form-grid">${format}${quality}</div>`;
    if (tool.engine === 'image-target-size') return `<div class="form-grid"><div class="form-row"><label>Target KB</label><input id="target-kb" type="number" value="${tool.targetKB || 50}"></div><div class="form-row"><label>Max width px</label><input id="max-width" type="number" value="1600"></div><div class="form-row"><label>Format</label><select id="format"><option value="jpeg">JPG</option><option value="webp">WebP</option></select></div></div>`;
    if (tool.engine === 'image-convert') return `<div class="form-grid"><div class="form-row"><label>Output format</label><select id="format"><option value="${tool.outputFormat || 'png'}">${(tool.outputFormat || 'png').toUpperCase()}</option><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>${quality}</div>`;
    if (tool.engine === 'image-crop') return `<div class="form-grid"><div class="form-row"><label>X</label><input id="crop-x" type="number" value="0"></div><div class="form-row"><label>Y</label><input id="crop-y" type="number" value="0"></div><div class="form-row"><label>Width</label><input id="crop-w" type="number" placeholder="Auto"></div><div class="form-row"><label>Height</label><input id="crop-h" type="number" placeholder="Auto"></div>${format}${quality}</div>`;
    if (tool.engine === 'image-rotate') return `<div class="form-grid"><div class="form-row"><label>Angle</label><select id="angle"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>${format}${quality}</div>`;
    if (tool.engine === 'image-flip') return `<div class="form-grid"><div class="form-row"><label>Flip direction</label><select id="flip"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="both">Both</option></select></div>${format}${quality}</div>`;
    if (tool.engine === 'image-watermark') return `<div class="form-grid"><div class="form-row full"><label>Watermark text</label><input id="watermark-text" value="FreeToolCo"></div><div class="form-row"><label>Position</label><select id="position"><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="center">Center</option><option value="top-right">Top right</option></select></div><div class="form-row"><label>Opacity</label><input id="opacity" type="number" min="0.05" max="1" step="0.05" value="0.5"></div><div class="form-row"><label>Font size</label><input id="font-size" type="number" value="48"></div>${format}${quality}</div>`;
    if (tool.engine === 'passport-photo-resizer') return `<div class="form-grid"><div class="form-row"><label>Preset size</label><select id="preset"><option value="413x531">3.5cm × 4.5cm at 300DPI</option><option value="200x200">200 × 200 px</option><option value="600x600">600 × 600 px</option><option value="350x450">350 × 450 px</option></select></div><div class="form-row"><label>Fit</label><select id="fit"><option value="cover">Crop to fill</option><option value="contain">Fit with white background</option></select></div>${quality}</div>`;
    if (tool.engine === 'signature-resizer') return `<div class="form-grid"><div class="form-row"><label>Width px</label><input id="width" type="number" value="300"></div><div class="form-row"><label>Height px</label><input id="height" type="number" value="100"></div><div class="form-row"><label>Target KB optional</label><input id="target-kb" type="number" placeholder="Example: 20"></div>${quality}</div>`;
    if (tool.engine === 'favicon-generator') return '<div class="notice">Creates a ZIP with 16, 32, 48, 180, and 512 pixel PNG icons.</div>';
    if (tool.engine === 'image-to-base64') return '<div class="notice">Base64 output is generated locally and can be copied for HTML, CSS, or development use.</div>';
    return `<div class="form-grid">${format}${quality}</div>`;
  }

  async function handleImage(tool, files) {
    if (tool.engine === 'image-to-base64') {
      const file = files[0];
      const dataUrl = await fileToDataURL(file);
      out(`<div class="result-actions"><button class="btn primary" id="copy-base64">Copy Base64</button><button class="btn" id="download-base64">Download TXT</button></div><textarea class="input" style="min-height:220px">${esc(dataUrl)}</textarea>`, 'success-note');
      $('#copy-base64')?.addEventListener('click', () => copyText(dataUrl));
      $('#download-base64')?.addEventListener('click', () => downloadBlob(new Blob([dataUrl], { type: 'text/plain' }), `${file.name}.base64.txt`));
      return;
    }

    if (tool.engine === 'favicon-generator') return makeFavicons(files[0]);

    const outputs = [];
    for (let i = 0; i < files.length; i++) {
      const result = await convertImageFile(files[i], imageJobOptions(tool));
      outputs.push(result);
      renderImagePreview(result, i);
      setProgress(10 + (i + 1) / files.length * 78);
    }
    if (outputs.length === 1) {
      downloadBlob(outputs[0].blob, outputs[0].filename);
      const warning = outputs[0].warning ? ` ${outputs[0].warning}` : '';
      out(successHtml('Image ready', `Before: ${fmtBytes(outputs[0].before)} · After: ${fmtBytes(outputs[0].blob.size)}.${warning}`), outputs[0].warning ? 'notice' : 'success-note');
    } else {
      const zip = new JSZip();
      outputs.forEach((item) => zip.file(item.filename, item.blob));
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${tool.slug}-images.zip`);
      out(successHtml('Images ready', `${outputs.length} files exported in ${fmtBytes(blob.size)} ZIP.`), 'success-note');
    }
  }

  function imageJobOptions(tool) {
    const opts = { engine: tool.engine, quality: Number($('#quality')?.value || 0.86), format: $('#format')?.value || tool.outputFormat || 'jpeg' };
    if (tool.engine === 'image-resize') Object.assign(opts, { width: Number($('#width').value || 0), height: Number($('#height').value || 0), aspect: $('#aspect').value });
    if (tool.engine === 'image-target-size') Object.assign(opts, { targetKB: Number($('#target-kb').value || tool.targetKB || 50), maxWidth: Number($('#max-width').value || 1600), format: $('#format').value });
    if (tool.engine === 'image-crop') Object.assign(opts, { cropX: Number($('#crop-x').value || 0), cropY: Number($('#crop-y').value || 0), cropW: Number($('#crop-w').value || 0), cropH: Number($('#crop-h').value || 0) });
    if (tool.engine === 'image-rotate') opts.angle = Number($('#angle').value || 90);
    if (tool.engine === 'image-flip') opts.flip = $('#flip').value;
    if (tool.engine === 'image-watermark') Object.assign(opts, { text: $('#watermark-text').value, position: $('#position').value, opacity: Number($('#opacity').value || 0.5), fontSize: Number($('#font-size').value || 48) });
    if (tool.engine === 'passport-photo-resizer') Object.assign(opts, { preset: $('#preset').value, fit: $('#fit').value, format: 'jpeg' });
    if (tool.engine === 'signature-resizer') Object.assign(opts, { width: Number($('#width').value || 300), height: Number($('#height').value || 100), targetKB: Number($('#target-kb').value || 0), format: 'jpeg' });
    if (tool.engine === 'image-metadata-remover') Object.assign(opts, { format: 'jpeg', quality: 0.92 });
    if (tool.engine === 'image-grayscale') Object.assign(opts, { grayscale: true });
    return opts;
  }

  async function convertImageFile(file, opts = {}) {
    const img = await loadImage(file);
    const warnings = [];
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    let width = sw, height = sh;
    if (opts.engine === 'image-crop') {
      sx = Math.max(0, opts.cropX || 0); sy = Math.max(0, opts.cropY || 0);
      sw = Math.max(1, Math.min(sw - sx, opts.cropW || sw)); sh = Math.max(1, Math.min(sh - sy, opts.cropH || sh));
      width = sw; height = sh;
    }
    if (opts.engine === 'image-resize') {
      width = opts.width || (opts.height && opts.aspect === 'yes' ? Math.round(sw * opts.height / sh) : sw);
      height = opts.height || (opts.width && opts.aspect === 'yes' ? Math.round(sh * opts.width / sw) : sh);
    }
    if (opts.engine === 'image-target-size' && opts.maxWidth && sw > opts.maxWidth) {
      width = opts.maxWidth; height = Math.round(sh * opts.maxWidth / sw);
    }
    if (opts.engine === 'passport-photo-resizer') {
      const [w, h] = opts.preset.split('x').map(Number); width = w; height = h;
    }
    if (opts.engine === 'signature-resizer') { width = opts.width; height = opts.height; }
    if (opts.engine === 'image-rotate' && [90, 270].includes(opts.angle)) { width = sh; height = sw; }

    const MAX_CANVAS_PIXELS = 25000000;
    if (width * height > MAX_CANVAS_PIXELS) {
      const scale = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
      warnings.push('Very large input was safely downscaled to prevent browser memory issues.');
    }

    let canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    let ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (opts.engine === 'image-rotate') {
      ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(opts.angle * Math.PI / 180); ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
    } else if (opts.engine === 'image-flip') {
      ctx.translate(opts.flip === 'horizontal' || opts.flip === 'both' ? canvas.width : 0, opts.flip === 'vertical' || opts.flip === 'both' ? canvas.height : 0);
      ctx.scale(opts.flip === 'horizontal' || opts.flip === 'both' ? -1 : 1, opts.flip === 'vertical' || opts.flip === 'both' ? -1 : 1);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else if (opts.engine === 'passport-photo-resizer') {
      drawFitted(ctx, img, 0, 0, canvas.width, canvas.height, opts.fit || 'cover');
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    }

    if (opts.grayscale || opts.engine === 'image-grayscale') applyGrayscale(ctx, canvas);
    if (opts.engine === 'image-watermark') drawImageWatermark(ctx, canvas, opts);

    let mime = `image/${opts.format || 'jpeg'}`.replace('jpg', 'jpeg');
    if (opts.engine === 'image-target-size' || (opts.engine === 'signature-resizer' && opts.targetKB)) {
      const targetKB = Math.max(1, opts.targetKB || 50);
      let quality = 0.94;
      let blob = await canvasToBlob(canvas, mime, quality);
      let attempts = 0;
      while (blob.size / 1024 > targetKB && attempts < 28) {
        attempts += 1;
        if (quality > 0.30) {
          quality -= 0.07;
        } else if (canvas.width > 240 && canvas.height > 240) {
          const next = document.createElement('canvas');
          next.width = Math.max(1, Math.round(canvas.width * 0.88));
          next.height = Math.max(1, Math.round(canvas.height * 0.88));
          next.getContext('2d').drawImage(canvas, 0, 0, next.width, next.height);
          canvas = next;
          ctx = canvas.getContext('2d');
          quality = 0.82;
        } else {
          break;
        }
        blob = await canvasToBlob(canvas, mime, quality);
      }
      const missed = blob.size / 1024 > targetKB;
      if (missed) warnings.push(`Could not reach ${targetKB}KB without making the image extremely small; result is ${fmtBytes(blob.size)}.`);
      return { blob, filename: outputName(file.name, opts.format || 'jpeg'), before: file.size, warning: warnings.join(' ') };
    }
    const blob = await canvasToBlob(canvas, mime, opts.quality || 0.86);
    return { blob, filename: outputName(file.name, opts.format || 'jpeg'), before: file.size, warning: warnings.join(' ') };
  }

  function drawFitted(ctx, img, x, y, width, height, fit = 'cover') {
    const scale = fit === 'cover' ? Math.max(width / img.naturalWidth, height / img.naturalHeight) : Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, x + (width - drawW) / 2, y + (height - drawH) / 2, drawW, drawH);
  }

  function applyGrayscale(ctx, canvas) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const gray = imgData.data[i] * 0.299 + imgData.data[i + 1] * 0.587 + imgData.data[i + 2] * 0.114;
      imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function drawImageWatermark(ctx, canvas, opts) {
    const text = opts.text || 'FreeToolCo';
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, opts.opacity || 0.5));
    ctx.font = `700 ${opts.fontSize || 48}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(15,23,42,.55)'; ctx.lineWidth = 3;
    const textW = ctx.measureText(text).width;
    let x = canvas.width - textW - 28, y = canvas.height - 28;
    if (opts.position === 'bottom-left') { x = 28; y = canvas.height - 28; }
    if (opts.position === 'top-right') { x = canvas.width - textW - 28; y = 62; }
    if (opts.position === 'center') { x = (canvas.width - textW) / 2; y = canvas.height / 2; }
    ctx.strokeText(text, x, y); ctx.fillText(text, x, y); ctx.restore();
  }

  async function makeFavicons(file) {
    const img = await loadImage(file);
    const zip = new JSZip();
    const sizes = [16, 32, 48, 180, 512];
    for (const size of sizes) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      drawFitted(ctx, img, 0, 0, size, size, 'contain');
      zip.file(`favicon-${size}x${size}.png`, await canvasToBlob(canvas, 'image/png'));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'favicons-free-toolco.zip');
    out(successHtml('Favicons generated', `Created ${sizes.length} icons in ${fmtBytes(blob.size)} ZIP.`), 'success-note');
  }

  function handleBase64ToImage() {
    try {
      const value = $('#base64-input').value.trim();
      if (!value) return out('Paste Base64 image data first.', 'error');
      const src = value.startsWith('data:') ? value.replace(/\s+/g, '') : `data:image/png;base64,${value.replace(/\s+/g, '')}`;
      const match = src.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) throw new Error('Only Base64 PNG, JPG, WebP, or GIF image data is supported.');
      atob(match[2].slice(0, 128));
      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const preview = $('#preview-grid');
      preview.innerHTML = `<div class="preview-card"><img src="${esc(src)}" alt="Base64 image preview"><button class="btn primary" id="download-base64-img">Download image</button></div>`;
      $('#download-base64-img')?.addEventListener('click', async () => {
        const blob = await (await fetch(src)).blob();
        downloadBlob(blob, `base64-image.${ext}`);
      });
      out(successHtml('Image preview ready', 'Check the preview and download the decoded image.'), 'success-note');
    } catch (error) {
      out(`<strong>Could not decode image:</strong> ${esc(friendlyError(error))}`, 'error');
    }
  }

  function renderImagePreview(result, index) {
    const preview = $('#preview-grid');
    if (!preview || index >= 6) return;
    const url = URL.createObjectURL(result.blob);
    preview.insertAdjacentHTML('beforeend', `<div class="preview-card"><img src="${url}" alt="Processed image preview"><strong>${esc(result.filename)}</strong><p>${fmtBytes(result.before)} → ${fmtBytes(result.blob.size)}</p></div>`);
  }

  function outputName(filename, format) {
    const ext = format === 'jpeg' ? 'jpg' : format;
    return `${filename.replace(/\.[^.]+$/, '')}-${Date.now()}.${ext}`;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = typeof file === 'string' ? file : URL.createObjectURL(file);
      img.onload = () => { if (typeof file !== 'string') URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => reject(new Error('Could not load image.'));
      img.src = url;
    });
  }

  function canvasToBlob(canvas, mime = 'image/jpeg', quality = 0.86) {
    return new Promise((resolve, reject) => canvas.toBlob((blob) => {
      if (!blob) reject(new Error(`Your browser could not export ${mime}. Try a different output format.`));
      else resolve(blob);
    }, mime, quality));
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------- Calculator tools ----------
  const calcForms = {
    'calculator-age': [ ['birth', 'Date of birth', 'date', '1995-01-01'], ['target', 'Age on date', 'date', todayISO()] ],
    'calculator-bmi': [ ['weight', 'Weight kg', 'number', 70], ['height', 'Height cm', 'number', 170] ],
    'calculator-percentage': [ ['mode', 'Mode', 'select', 'percentOf', [['percentOf', 'What is X% of Y?'], ['whatPercent', 'X is what % of Y?'], ['increase', 'Percentage increase/decrease']]], ['a', 'X / first value', 'number', 20], ['b', 'Y / second value', 'number', 100] ],
    'calculator-emi': [ ['amount', 'Loan amount', 'number', 500000], ['rate', 'Annual interest %', 'number', 9], ['months', 'Tenure months', 'number', 60] ],
    'calculator-loan': [ ['amount', 'Loan amount', 'number', 100000], ['rate', 'Annual interest %', 'number', 10], ['months', 'Tenure months', 'number', 24] ],
    'calculator-gst': [ ['mode', 'Mode', 'select', 'add', [['add', 'Add GST'], ['remove', 'Remove GST']]], ['amount', 'Amount', 'number', 1000], ['rate', 'GST rate %', 'number', 18] ],
    'calculator-discount': [ ['price', 'Original price', 'number', 1000], ['discount', 'Discount %', 'number', 20] ],
    'calculator-compound-interest': [ ['principal', 'Principal', 'number', 100000], ['rate', 'Annual rate %', 'number', 8], ['years', 'Years', 'number', 5], ['frequency', 'Compounds per year', 'number', 12] ],
    'calculator-sip': [ ['monthly', 'Monthly investment', 'number', 5000], ['rate', 'Annual return %', 'number', 12], ['years', 'Years', 'number', 10] ],
    'calculator-date-add': [ ['date', 'Start date', 'date', todayISO()], ['operation', 'Operation', 'select', 'add', [['add', 'Add'], ['subtract', 'Subtract']]], ['days', 'Days', 'number', 0], ['weeks', 'Weeks', 'number', 0], ['months', 'Months', 'number', 0], ['years', 'Years', 'number', 0] ],
    'calculator-days-between': [ ['start', 'Start date', 'date', todayISO()], ['end', 'End date', 'date', todayISO()], ['inclusive', 'Inclusive?', 'select', 'no', [['no', 'No'], ['yes', 'Yes']]] ],
    'calculator-unit-converter': [ ['type', 'Unit type', 'select', 'length', [['length', 'Length'], ['weight', 'Weight'], ['temperature', 'Temperature'], ['area', 'Area'], ['volume', 'Volume']]], ['value', 'Value', 'number', 1], ['from', 'From', 'text', 'meter'], ['to', 'To', 'text', 'kilometer'] ],
    'calculator-unix-time': [ ['timestamp', 'Unix timestamp', 'number', Math.floor(Date.now() / 1000)], ['date', 'Date/time', 'datetime-local', new Date().toISOString().slice(0, 16)] ]
  };

  function renderCalculatorTool(mount, tool) {
    const fields = calcForms[tool.engine] || [];
    const formHtml = fields.map(fieldHtml).join('');
    mount.innerHTML = baseToolChrome(`<form id="calc-form" class="form-grid">${formHtml}</form><div class="result-actions"><button class="btn primary" id="process-btn">Calculate</button><button class="btn" id="copy-calc">Copy result</button></div>`);
    $('#process-btn').addEventListener('click', () => runCalculator(tool));
    $('#copy-calc').addEventListener('click', () => copyText($('#tool-output').innerText));
    $('#calc-form').addEventListener('input', () => runCalculator(tool));
    runCalculator(tool);
  }

  function fieldHtml([name, label, type, value, options]) {
    if (type === 'select') return `<div class="form-row"><label for="${name}">${esc(label)}</label><select id="${name}" name="${name}">${options.map(([val, lab]) => `<option value="${esc(val)}" ${val === value ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select></div>`;
    return `<div class="form-row"><label for="${name}">${esc(label)}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}"></div>`;
  }

  function getFormData(formId = 'calc-form') {
    return Object.fromEntries(new FormData($(`#${formId}`)).entries());
  }

  function runCalculator(tool) {
    try {
      const v = getFormData();
      const result = calculate(tool.engine, v);
      out(result, 'success-note');
    } catch (error) { out(esc(friendlyError(error)), 'error'); }
  }

  function readNumber(value, label, { min = -Infinity, max = Infinity, allowZero = true } = {}) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${label} must be a valid number.`);
    if (!allowZero && n === 0) throw new Error(`${label} cannot be zero.`);
    if (n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
    return n;
  }

  function parseDateInput(value, label) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date.`);
    return date;
  }

  function addMonthsClamped(date, months) {
    const result = new Date(date.getTime());
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
  }

  function calculate(engine, v) {
    if (engine === 'calculator-age') {
      const birth = parseDateInput(v.birth, 'Date of birth'); const target = parseDateInput(v.target, 'Target date');
      if (target < birth) throw new Error('Target date must be after date of birth.');
      let years = target.getFullYear() - birth.getFullYear();
      let months = target.getMonth() - birth.getMonth();
      let days = target.getDate() - birth.getDate();
      if (days < 0) { months--; days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); }
      if (months < 0) { years--; months += 12; }
      const totalDays = Math.floor((target - birth) / 86400000);
      return `<strong>Age: ${years} years, ${months} months, ${days} days</strong><br>Total days lived: ${fmtNum(totalDays, 0)}`;
    }
    if (engine === 'calculator-bmi') {
      const weight = readNumber(v.weight, 'Weight', { min: 1, max: 1000 });
      const height = readNumber(v.height, 'Height', { min: 30, max: 300 });
      const bmi = weight / ((height / 100) ** 2);
      const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obesity range';
      return `<strong>BMI: ${fmtNum(bmi, 1)}</strong><br>Category: ${category}`;
    }
    if (engine === 'calculator-percentage') {
      const a = readNumber(v.a, 'First value');
      const b = readNumber(v.b, 'Second value');
      if (v.mode === 'percentOf') return `<strong>${fmtNum(a)}% of ${fmtNum(b)} = ${fmtNum(a / 100 * b)}</strong>`;
      if (v.mode === 'whatPercent') {
        if (b === 0) throw new Error('Second value cannot be zero for percentage comparison.');
        return `<strong>${fmtNum(a)} is ${fmtNum(a / b * 100)}% of ${fmtNum(b)}</strong>`;
      }
      if (a === 0) throw new Error('First value cannot be zero for percentage change.');
      return `<strong>Change from ${fmtNum(a)} to ${fmtNum(b)}: ${fmtNum((b - a) / a * 100)}%</strong>`;
    }
    if (['calculator-emi', 'calculator-loan'].includes(engine)) {
      const p = readNumber(v.amount, 'Loan amount', { min: 0 });
      const annual = readNumber(v.rate, 'Annual interest rate', { min: 0, max: 100 });
      const n = readNumber(v.months, 'Tenure months', { min: 1, max: 1200 });
      const r = annual / 12 / 100;
      const emi = r === 0 ? p / n : p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1);
      return `<strong>Monthly payment: ${fmtNum(emi)}</strong><br>Total payment: ${fmtNum(emi * n)}<br>Total interest: ${fmtNum(emi * n - p)}`;
    }
    if (engine === 'calculator-gst') {
      const amount = readNumber(v.amount, 'Amount', { min: 0 });
      const rate = readNumber(v.rate, 'GST rate', { min: 0, max: 100 }) / 100;
      if (v.mode === 'add') return `<strong>Total including GST: ${fmtNum(amount * (1 + rate))}</strong><br>GST amount: ${fmtNum(amount * rate)}`;
      const base = amount / (1 + rate); return `<strong>Base amount: ${fmtNum(base)}</strong><br>GST amount: ${fmtNum(amount - base)}`;
    }
    if (engine === 'calculator-discount') {
      const price = readNumber(v.price, 'Original price', { min: 0 });
      const discount = readNumber(v.discount, 'Discount', { min: 0, max: 100 });
      const saved = price * discount / 100; return `<strong>Final price: ${fmtNum(price - saved)}</strong><br>You save: ${fmtNum(saved)}`;
    }
    if (engine === 'calculator-compound-interest') {
      const principal = readNumber(v.principal, 'Principal', { min: 0 });
      const rate = readNumber(v.rate, 'Annual rate', { min: -99, max: 1000 });
      const years = readNumber(v.years, 'Years', { min: 0, max: 200 });
      const frequency = readNumber(v.frequency, 'Compounds per year', { min: 1, max: 365 });
      const amount = principal * ((1 + (rate / 100) / frequency) ** (frequency * years));
      return `<strong>Maturity amount: ${fmtNum(amount)}</strong><br>Interest earned: ${fmtNum(amount - principal)}`;
    }
    if (engine === 'calculator-sip') {
      const monthly = readNumber(v.monthly, 'Monthly investment', { min: 0 });
      const annual = readNumber(v.rate, 'Annual return', { min: -99, max: 200 });
      const years = readNumber(v.years, 'Years', { min: 0, max: 100 });
      const r = annual / 12 / 100, n = years * 12;
      const amount = r === 0 ? monthly * n : monthly * ((((1 + r) ** n) - 1) / r) * (1 + r);
      return `<strong>Expected value: ${fmtNum(amount)}</strong><br>Invested amount: ${fmtNum(monthly * n)}<br>Estimated returns: ${fmtNum(amount - monthly * n)}`;
    }
    if (engine === 'calculator-date-add') {
      const base = parseDateInput(v.date, 'Start date'); const direction = v.operation === 'subtract' ? -1 : 1;
      const years = readNumber(v.years, 'Years', { min: 0, max: 10000 });
      const months = readNumber(v.months, 'Months', { min: 0, max: 120000 });
      const weeks = readNumber(v.weeks, 'Weeks', { min: 0, max: 520000 });
      const days = readNumber(v.days, 'Days', { min: 0, max: 3650000 });
      const monthAdjusted = addMonthsClamped(base, direction * (years * 12 + months));
      monthAdjusted.setDate(monthAdjusted.getDate() + direction * (days + weeks * 7));
      return `<strong>Result date: ${monthAdjusted.toDateString()}</strong>`;
    }
    if (engine === 'calculator-days-between') {
      const a = parseDateInput(v.start, 'Start date'), b = parseDateInput(v.end, 'End date');
      let days = Math.round((b - a) / 86400000); if (v.inclusive === 'yes') days += days >= 0 ? 1 : -1;
      return `<strong>Difference: ${fmtNum(Math.abs(days), 0)} days</strong><br>Weeks: ${fmtNum(Math.abs(days) / 7)} · Months approx: ${fmtNum(Math.abs(days) / 30.437)}`;
    }
    if (engine === 'calculator-unit-converter') return convertUnits(v);
    if (engine === 'calculator-unix-time') {
      const timestamp = readNumber(v.timestamp, 'Unix timestamp');
      const date = parseDateInput(v.date, 'Date/time'); const timestampDate = new Date(timestamp * 1000);
      if (Number.isNaN(timestampDate.getTime())) throw new Error('Unix timestamp is out of range.');
      return `<strong>Timestamp to date:</strong> ${timestampDate.toUTCString()}<br><strong>Date to timestamp:</strong> ${Math.floor(date.getTime() / 1000)}`;
    }
    return 'Calculator not available.';
  }

  function normalizeUnitName(value) {
    return String(value || '').toLowerCase().trim().replace(/²/g, '2').replace(/³/g, '3').replace(/\s+/g, '_');
  }

  function convertUnits(v) {
    const maps = {
      length: { meter: 1, meters: 1, m: 1, kilometer: 1000, kilometers: 1000, km: 1000, centimeter: 0.01, centimeters: 0.01, cm: 0.01, millimeter: 0.001, mm: 0.001, inch: 0.0254, inches: 0.0254, foot: 0.3048, feet: 0.3048, ft: 0.3048, yard: 0.9144, yd: 0.9144, mile: 1609.344, mi: 1609.344 },
      weight: { kilogram: 1, kilograms: 1, kg: 1, gram: 0.001, grams: 0.001, g: 0.001, milligram: 0.000001, mg: 0.000001, pound: 0.45359237, pounds: 0.45359237, lb: 0.45359237, lbs: 0.45359237, ounce: 0.0283495, ounces: 0.0283495, oz: 0.0283495, tonne: 1000, ton: 907.18474 },
      area: { square_meter: 1, sqm: 1, m2: 1, square_kilometer: 1000000, km2: 1000000, square_centimeter: 0.0001, cm2: 0.0001, square_foot: 0.09290304, ft2: 0.09290304, square_yard: 0.83612736, yd2: 0.83612736, acre: 4046.8564224, hectare: 10000 },
      volume: { liter: 1, litre: 1, l: 1, milliliter: 0.001, millilitre: 0.001, ml: 0.001, cubic_meter: 1000, m3: 1000, cubic_centimeter: 0.001, cm3: 0.001, gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473, cup: 0.2365882365 }
    };
    const value = readNumber(v.value, 'Value');
    const from = normalizeUnitName(v.from);
    const to = normalizeUnitName(v.to);
    if (v.type === 'temperature') {
      const f = from[0], t = to[0];
      if (!['c', 'f', 'k'].includes(f) || !['c', 'f', 'k'].includes(t)) throw new Error('Temperature units supported: Celsius, Fahrenheit, Kelvin.');
      let c = f === 'f' ? (value - 32) * 5 / 9 : f === 'k' ? value - 273.15 : value;
      const result = t === 'f' ? c * 9 / 5 + 32 : t === 'k' ? c + 273.15 : c;
      return `<strong>${fmtNum(value)} ${esc(v.from)} = ${fmtNum(result)} ${esc(v.to)}</strong>`;
    }
    const map = maps[v.type];
    if (!map) throw new Error('Unsupported unit type.');
    if (!map[from] || !map[to]) return `<strong>Supported ${esc(v.type)} units:</strong> ${Object.keys(map).slice(0, 24).join(', ')}`;
    return `<strong>${fmtNum(value)} ${esc(v.from)} = ${fmtNum(value * map[from] / map[to])} ${esc(v.to)}</strong>`;
  }

  // ---------- Text, developer, security, QR tools ----------
  function renderTextDevTool(mount, tool) {
    if (tool.engine === 'security-password-generator') return renderPasswordGenerator(mount);
    if (tool.engine === 'dev-uuid-generator') return renderUuidGenerator(mount);
    if (tool.engine === 'dev-hash-generator') return renderHashGenerator(mount);
    if (tool.engine === 'dev-regex-tester') return renderRegexTester(mount);
    if (tool.engine === 'qr-generator') return renderQrGenerator(mount);

    const controls = textControls(tool.engine);
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row full"><label>Input</label><textarea id="text-input" placeholder="Paste your text or data here..."></textarea></div>${controls}</div><div class="result-actions"><button class="btn primary" id="process-btn">Run tool</button><button class="btn" id="copy-output">Copy result</button><button class="btn" id="download-output">Download TXT</button></div>`);
    $('#process-btn').addEventListener('click', () => runTextDev(tool));
    $('#copy-output').addEventListener('click', () => copyText($('#tool-output').innerText));
    $('#download-output').addEventListener('click', () => downloadBlob(new Blob([$('#tool-output').innerText], { type: 'text/plain' }), `${tool.slug}.txt`));
    $('#text-input').addEventListener('input', () => { if (['text-word-counter', 'text-character-counter'].includes(tool.engine)) runTextDev(tool); });
    if (['text-word-counter', 'text-character-counter'].includes(tool.engine)) runTextDev(tool);
  }

  function textControls(engine) {
    if (engine === 'text-case-converter') return `<div class="form-row"><label>Case style</label><select id="mode"><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option><option value="sentence">Sentence case</option><option value="camel">camelCase</option><option value="snake">snake_case</option><option value="kebab">kebab-case</option></select></div>`;
    if (engine === 'text-find-replace') return `<div class="form-row"><label>Find</label><input id="find" placeholder="Text to find"></div><div class="form-row"><label>Replace with</label><input id="replace" placeholder="Replacement"></div><div class="form-row"><label>Mode</label><select id="mode"><option value="plain">Plain text</option><option value="regex">Regular expression</option></select></div>`;
    if (engine === 'text-sorter') return `<div class="form-row"><label>Sort</label><select id="mode"><option value="az">A to Z</option><option value="za">Z to A</option></select></div>`;
    if (engine === 'dev-base64') return `<div class="form-row"><label>Mode</label><select id="mode"><option value="encode">Encode</option><option value="decode">Decode</option></select></div>`;
    if (engine === 'dev-url-codec') return `<div class="form-row"><label>Mode</label><select id="mode"><option value="encode">Encode</option><option value="decode">Decode</option></select></div>`;
    if (engine === 'dev-json-formatter') return `<div class="form-row"><label>Indent spaces</label><input id="indent" type="number" value="2"></div>`;
    return '';
  }

  function runTextDev(tool) {
    try {
      const input = $('#text-input')?.value || '';
      const result = transformText(tool.engine, input);
      out(result.html, result.type || 'success-note');
    } catch (error) { out(esc(friendlyError(error)), 'error'); }
  }

  function transformText(engine, input) {
    if (engine === 'text-word-counter' || engine === 'text-character-counter') {
      const words = input.trim() ? input.trim().split(/\s+/).length : 0;
      const chars = input.length; const charsNoSpaces = input.replace(/\s/g, '').length; const lines = input ? input.split(/\n/).length : 0; const sentences = (input.match(/[.!?]+/g) || []).length;
      return { html: `<strong>Words: ${words}</strong><br>Characters: ${chars}<br>Characters without spaces: ${charsNoSpaces}<br>Lines: ${lines}<br>Sentences: ${sentences}<br>Reading time: ${Math.max(1, Math.ceil(words / 220))} min` };
    }
    if (engine === 'text-case-converter') {
      const mode = $('#mode').value; let output = input;
      if (mode === 'upper') output = input.toUpperCase();
      if (mode === 'lower') output = input.toLowerCase();
      if (mode === 'title') output = input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      if (mode === 'sentence') output = input.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
      if (mode === 'camel') output = slugify(input).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
      if (mode === 'snake') output = slugify(input).replace(/-/g, '_');
      if (mode === 'kebab') output = slugify(input);
      return { html: `<textarea class="input">${esc(output)}</textarea>` };
    }
    if (engine === 'text-remove-spaces') return { html: `<textarea class="input">${esc(input.split('\n').map((line) => line.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n'))}</textarea>` };
    if (engine === 'text-duplicate-line-remover') {
      const seen = new Set(); const lines = input.split(/\n/); const unique = lines.filter((line) => { const key = line.trim(); if (!key || seen.has(key)) return false; seen.add(key); return true; });
      return { html: `<strong>Removed ${lines.length - unique.length} duplicate/empty line(s).</strong><textarea class="input">${esc(unique.join('\n'))}</textarea>` };
    }
    if (engine === 'text-sorter') {
      const lines = input.split(/\n/).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); if ($('#mode').value === 'za') lines.reverse();
      return { html: `<textarea class="input">${esc(lines.join('\n'))}</textarea>` };
    }
    if (engine === 'text-find-replace') {
      const find = $('#find').value; const repl = $('#replace').value; const mode = $('#mode').value;
      if (!find) throw new Error('Enter text to find.');
      const rx = mode === 'regex' ? new RegExp(find, 'g') : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const output = input.replace(rx, repl);
      return { html: `<textarea class="input">${esc(output)}</textarea>` };
    }
    if (engine === 'text-slug-generator') return { html: `<strong>${esc(slugify(input))}</strong>` };
    if (engine === 'dev-json-formatter' || engine === 'dev-json-validator' || engine === 'dev-json-minifier') {
      const parsed = JSON.parse(input);
      const output = engine === 'dev-json-minifier' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, Number($('#indent')?.value || 2));
      return { html: `<strong>Valid JSON</strong><textarea class="input">${esc(output)}</textarea>` };
    }
    if (engine === 'dev-csv-to-json') {
      const rows = parseCsv(input); const headers = rows.shift() || []; const json = rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
      return { html: `<textarea class="input">${esc(JSON.stringify(json, null, 2))}</textarea>` };
    }
    if (engine === 'dev-json-to-csv') {
      const arr = JSON.parse(input); if (!Array.isArray(arr)) throw new Error('Input must be a JSON array of objects.');
      const headers = [...new Set(arr.flatMap((obj) => Object.keys(obj)))];
      const csv = [headers.join(','), ...arr.map((obj) => headers.map((h) => csvEscape(obj[h] ?? '')).join(','))].join('\n');
      return { html: `<textarea class="input">${esc(csv)}</textarea>` };
    }
    if (engine === 'dev-base64') {
      const mode = $('#mode').value; const output = mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input.trim())));
      return { html: `<textarea class="input">${esc(output)}</textarea>` };
    }
    if (engine === 'dev-url-codec') {
      const output = $('#mode').value === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
      return { html: `<textarea class="input">${esc(output)}</textarea>` };
    }
    return { html: 'Tool ready.' };
  }

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', quote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], next = text[i + 1];
      if (c === '"' && quote && next === '"') { cell += '"'; i++; }
      else if (c === '"') quote = !quote;
      else if (c === ',' && !quote) { row.push(cell); cell = ''; }
      else if ((c === '\n' || c === '\r') && !quote) { if (c === '\r' && next === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell); rows.push(row);
    return rows.filter((r) => r.some((c) => c !== ''));
  }
  const csvEscape = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);

  function renderPasswordGenerator(mount) {
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row"><label>Length</label><input id="length" type="number" value="18" min="6" max="128"></div><div class="form-row"><label>Include symbols</label><select id="symbols"><option value="yes">Yes</option><option value="no">No</option></select></div><div class="form-row"><label>Quantity</label><input id="quantity" type="number" value="5" min="1" max="50"></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Generate passwords</button><button class="btn" id="copy-output">Copy</button></div>`);
    $('#process-btn').addEventListener('click', generatePasswords); $('#copy-output').addEventListener('click', () => copyText($('#tool-output').innerText)); generatePasswords();
  }
  function generatePasswords() {
    const len = Math.max(6, Math.min(128, Number($('#length').value || 18)));
    const qty = Math.max(1, Math.min(50, Number($('#quantity').value || 5)));
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + ($('#symbols').value === 'yes' ? '!@#$%^&*()-_=+[]{};:,.?/|' : '');
    const passwords = []; const array = new Uint32Array(len * qty); crypto.getRandomValues(array);
    for (let q = 0; q < qty; q++) passwords.push([...array.slice(q * len, (q + 1) * len)].map((n) => chars[n % chars.length]).join(''));
    out(`<textarea class="input">${esc(passwords.join('\n'))}</textarea>`, 'success-note');
  }

  function renderUuidGenerator(mount) {
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row"><label>Quantity</label><input id="quantity" type="number" value="10" min="1" max="500"></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Generate UUIDs</button><button class="btn" id="copy-output">Copy</button></div>`);
    $('#process-btn').addEventListener('click', () => { const q = Math.max(1, Math.min(500, Number($('#quantity').value || 10))); const rows = Array.from({ length: q }, () => crypto.randomUUID ? crypto.randomUUID() : uuidFallback()); out(`<textarea class="input">${rows.join('\n')}</textarea>`, 'success-note'); });
    $('#copy-output').addEventListener('click', () => copyText($('#tool-output').innerText)); $('#process-btn').click();
  }
  function uuidFallback() { return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }

  function renderHashGenerator(mount) {
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row full"><label>Input text</label><textarea id="text-input"></textarea></div><div class="form-row"><label>Algorithm</label><select id="algorithm"><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option><option>SHA-1</option></select></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Generate hash</button><button class="btn" id="copy-output">Copy</button></div>`);
    $('#process-btn').addEventListener('click', async () => { const data = new TextEncoder().encode($('#text-input').value); const hash = await crypto.subtle.digest($('#algorithm').value, data); out(`<strong>${$('#algorithm').value}</strong><br>${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')}`, 'success-note'); });
    $('#copy-output').addEventListener('click', () => copyText($('#tool-output').innerText));
  }

  function renderRegexTester(mount) {
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row"><label>Pattern</label><input id="pattern" placeholder="\\bword\\b"></div><div class="form-row"><label>Flags</label><input id="flags" value="gi"></div><div class="form-row full"><label>Test text</label><textarea id="text-input"></textarea></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Test regex</button></div>`);
    $('#process-btn').addEventListener('click', () => {
      try {
        const flagsRaw = $('#flags').value || '';
        const flags = [...new Set((flagsRaw.includes('g') ? flagsRaw : `${flagsRaw}g`).split(''))].join('');
        const rx = new RegExp($('#pattern').value, flags);
        const text = $('#text-input').value;
        const matches = [...text.matchAll(rx)];
        out(`<strong>${matches.length} match(es)</strong><br>${matches.map((m, i) => `${i + 1}. ${esc(m[0])} at index ${m.index}${m.length > 1 ? ` · groups: ${m.slice(1).map((g) => esc(g ?? '')).join(', ')}` : ''}`).join('<br>')}`, 'success-note');
      } catch (e) { out(`<strong>Invalid regular expression:</strong> ${esc(e.message)}`, 'error'); }
    });
  }

  function renderQrGenerator(mount) {
    mount.innerHTML = baseToolChrome(`<div class="form-grid"><div class="form-row full"><label>QR content</label><textarea id="qr-input">${esc(siteUrl || 'https://freetoolco.com')}</textarea></div><div class="form-row"><label>Size</label><input id="size" type="number" value="320"></div><div class="form-row"><label>Foreground</label><input id="fg" type="color" value="#0f172a"></div><div class="form-row"><label>Background</label><input id="bg" type="color" value="#ffffff"></div><div class="form-row"><label>Error correction</label><select id="ecc"><option value="M">M</option><option value="L">L</option><option value="Q">Q</option><option value="H">H</option></select></div></div><div class="result-actions"><button class="btn primary" id="process-btn">Generate QR code</button><button class="btn" id="download-png">Download PNG</button><button class="btn" id="download-svg">Download SVG</button></div>`);
    let lastCanvas = null, lastSvg = '';
    const generate = () => {
      try {
        const text = $('#qr-input').value || 'https://freetoolco.com';
        const size = Math.max(128, Math.min(2048, Number($('#size').value || 320)));
        const fg = $('#fg').value || '#0f172a';
        const bg = $('#bg').value || '#ffffff';
        const qr = qrcode(0, $('#ecc').value); qr.addData(text); qr.make();
        const count = qr.getModuleCount(); const cell = size / count; const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; const ctx = canvas.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0,0,size,size); ctx.fillStyle = fg;
        const path = [];
        for (let r=0;r<count;r++) for (let c=0;c<count;c++) if (qr.isDark(r,c)) { ctx.fillRect(Math.round(c*cell), Math.round(r*cell), Math.ceil(cell), Math.ceil(cell)); path.push(`M${c+2} ${r+2}h1v1h-1z`); }
        const view = count + 4;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${esc(bg)}"/><path d="${path.join(' ')}" fill="${esc(fg)}"/></svg>`;
        lastCanvas = canvas; lastSvg = svg; $('#preview-grid').innerHTML = `<div class="preview-card"></div>`; $('#preview-grid .preview-card').append(canvas); out(successHtml('QR code generated', 'Download as PNG or SVG.'), 'success-note');
      } catch (error) { out(`<strong>Could not generate QR code:</strong> ${esc(friendlyError(error))}`, 'error'); }
    };
    $('#process-btn').addEventListener('click', generate);
    $('#download-png').addEventListener('click', async () => { if (!lastCanvas) generate(); downloadBlob(await canvasToBlob(lastCanvas, 'image/png'), 'qr-code-freetoolco.png'); });
    $('#download-svg').addEventListener('click', () => { if (!lastSvg) generate(); downloadBlob(new Blob([lastSvg], { type: 'image/svg+xml' }), 'qr-code-freetoolco.svg'); });
    generate();
  }

  document.addEventListener('DOMContentLoaded', () => { initShell(); initTool(); });
})();
