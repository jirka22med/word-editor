// script.js - RTF export (GitHub Pages friendly)
// Verze: Admirál Jiřík - GitHub build

// Globální prvky
let editor, docTitle;

document.addEventListener('DOMContentLoaded', () => {
  editor = document.getElementById('editor');
  docTitle = document.getElementById('docTitle');
  setupNavigation();
  setupToolbar();
  setupActionButtons();
  setupDocumentsPage();
  console.log('🚀 App ready (GitHub-ready RTF export).');
});

/* ---------------- NAVIGACE & TOOLBAR (zkráceno) ---------------- */
function setupNavigation() {
  const editorBtn = document.getElementById('editorBtn');
  const documentsBtn = document.getElementById('documentsBtn');
  const editorPage = document.getElementById('editorPage');
  const documentsPage = document.getElementById('documentsPage');
  editorBtn.addEventListener('click', () => {
    editorBtn.classList.add('active'); documentsBtn.classList.remove('active');
    editorPage.classList.add('active'); documentsPage.classList.remove('active');
  });
  documentsBtn.addEventListener('click', () => {
    documentsBtn.classList.add('active'); editorBtn.classList.remove('active');
    documentsPage.classList.add('active'); editorPage.classList.remove('active');
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

function setupToolbar() {
  document.getElementById('boldBtn').addEventListener('click', () => { document.execCommand('bold'); editor.focus(); });
  document.getElementById('italicBtn').addEventListener('click', () => { document.execCommand('italic'); editor.focus(); });
  document.getElementById('underlineBtn').addEventListener('click', () => { document.execCommand('underline'); editor.focus(); });
  document.getElementById('fontSize').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach(el => { el.removeAttribute('size'); el.style.fontSize = e.target.value + 'px'; });
    editor.focus();
  });
  document.getElementById('textColor').addEventListener('change', (e) => { document.execCommand('foreColor', false, e.target.value); editor.focus(); });
  document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = ev => {
        const img = document.createElement('img'); img.src = ev.target.result;
        img.style.width = '20px'; img.style.height = '20px'; img.style.border = '2px solid #64c8ff'; img.style.margin = '15px 0'; img.style.borderRadius = '8px';
        const sel = window.getSelection();
        if (sel.rangeCount) { const range = sel.getRangeAt(0); range.insertNode(img); range.collapse(false); }
        else editor.appendChild(img);
      };
      r.readAsDataURL(file);
    }
    e.target.value = '';
  });
}

/* ---------------- RTF HELPERS ---------------- */

// Escape RTF specials
function escapeRtf(text) {
  return text.replace(/[\\{}]/g, m => "\\" + m);
}

// Convert to \uXXXX? sequences for non-ascii
function toRtfUnicode(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code < 128) out += escapeRtf(ch);
    else out += "\\u" + code + "?";
  }
  return out;
}

// Fallback HTML -> RTF (if external lib unavailable)
// Keeps simple formatting: b,i,u, p, br, img placeholder
function convertHtmlToRtfFallback(editorElement) {
  const tmp = editorElement.cloneNode(true);
  tmp.querySelectorAll("*").forEach(el => { el.removeAttribute('class'); el.removeAttribute('style'); el.removeAttribute('tabindex'); el.removeAttribute('dir'); });
  let h = tmp.innerHTML
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<b>|<strong>/gi, "{\\b ")
    .replace(/<\/b>|<\/strong>/gi, "\\b0}")
    .replace(/<i>|<em>/gi, "{\\i ")
    .replace(/<\/i>|<\/em>/gi, "\\i0}")
    .replace(/<u>/gi, "{\\ul ")
    .replace(/<\/u>/gi, "\\ulnone}")
    .replace(/<\/p>/gi, "\\par\\par\n")
    .replace(/<p>/gi, "")
    .replace(/<br\s*\/?>/gi, "\\line\n")
    .replace(/<img[^>]*>/gi, "[OBRÁZEK]\\par\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();

  let rtf = toRtfUnicode(h);
  rtf = rtf.replace(/^(\s*\\par\s*)+/g, "");
  rtf = rtf.replace(/(\s*\\par\s*)+$/g, "");
  rtf = rtf.replace(/(\\par\s*){3,}/g, "\\par\\par");
  return rtf;
}

// Build RTF document with header
function buildRtfDocument(title, rtfContent) {
  const header = "{\\rtf1\\ansi\\deff0\\ansicpg1250\\uc1" + "{\\fonttbl{\\f0 Arial;}}" + "{\\info{\\title " + escapeRtf(title) + "}}" + "\\viewkind4\\pard\\f0\\fs24\n";
  const footer = "\n}";
  return header + rtfContent + footer;
}

// Offline-safe download: use application/msword + BOM to help Word
function downloadRtf(filename, rtfString) {
  const content = "\ufeff" + rtfString; // BOM helps detection when opening from disk
  const blob = new Blob([content], { type: "application/msword;charset=utf-8" });

  if (typeof saveAs !== "undefined") {
    try { saveAs(blob, filename); return; } catch (e) { console.warn("FileSaver fallback:", e); }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ---------------- ACTIONS (RTF using html-rtf lib if possible) ---------------- */

function setupActionButtons() {
  // Save to cloud ...
  document.getElementById("saveToCloud").addEventListener("click", async () => {
    const title = docTitle.value.trim();
    const content = editor.innerHTML;
    if (!title) { alert('⚠️ Zadej prosím název dokumentu!'); docTitle.focus(); return; }
    if (content.trim() === "" || content === "<p>Začni psát svůj dokument zde...</p>") { alert('⚠️ Editor je prázdný!'); return; }
    if (window.FirestoreAPI) {
      const success = await window.FirestoreAPI.saveDocument(title, content);
      if (success) console.log("✅ Dokument uložen:", title);
    } else alert('❌ Firestore není inicializován!');
  });

  // RTF export button
  document.getElementById("downloadDOCX").addEventListener("click", () => {
    const title = docTitle.value.trim() || "dokument";
    const content = editor.innerHTML;
    if (content.trim() === "" || content === "<p>Začni psát svůj dokument zde...</p>") { alert('⚠️ Editor je prázdný!'); return; }

    try {
      let rtfBody = null;

      // 1) Preferovaná cesta: pokud je dostupná externí knihovna (HtmlRtf nebo htmlToRtf)
      if (window.HtmlRtf && typeof window.HtmlRtf.fromHTML === 'function') {
        // html-rtf-js (API: HtmlRtf.fromHTML(html) -> rtf string)
        rtfBody = window.HtmlRtf.fromHTML(editor.innerHTML);
      } else if (window.htmlToRtf && typeof window.htmlToRtf === 'function') {
        // some libs expose function directly
        rtfBody = window.htmlToRtf(editor.innerHTML);
      } else if (window.html_rtf && typeof window.html_rtf === 'function') {
        rtfBody = window.html_rtf(editor.innerHTML);
      } else {
        // 2) Fallback: our internal converter (works, ale méně perfektní)
        rtfBody = convertHtmlToRtfFallback(editor);
        console.warn('⚠️ Používám fallback converter. Pro lepší výsledky nasadit html-rtf.js na GitHub Pages.');
      }

      const rtfDoc = buildRtfDocument(title, rtfBody);
      downloadRtf(title + '.rtf', rtfDoc);
      console.log('✅ RTF export dokončen:', title);
      alert('✅ Dokument stažen jako .RTF (pokud je GitHub Pages + html-rtf.js, výsledek bude nejlepší).');
    } catch (err) {
      console.error('❌ Chyba exportu RTF:', err);
      alert('❌ Chyba při exportu: ' + (err && err.message ? err.message : String(err)));
    }
  });

  // TXT export (bez problémů)
  document.getElementById("downloadTXT").addEventListener("click", () => {
    const title = docTitle.value.trim() || "dokument";
    const raw = editor.innerText;
    if (raw.trim() === "" || raw === "Začni psát svůj dokument zde...") { alert('⚠️ Editor je prázdný!'); return; }
    const blob = new Blob([raw], { type: "text/plain;charset=utf-8" });
    if (typeof saveAs !== "undefined") saveAs(blob, title + '.txt');
    else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = title + '.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
    alert('✅ TXT stažen.');
  });

  // Clear editor
  document.getElementById("clearEditor").addEventListener("click", () => {
    if (confirm('🗑️ Opravdu chceš vymazat celý obsah editoru?')) { editor.innerHTML = "<p>Začni psát svůj dokument zde...</p>"; docTitle.value = ""; }
  });
}

/* ---------------- OTHER PAGES, LOAD, DELETE, BEFOREUNLOAD ---------------- */

function setupDocumentsPage() {
  document.getElementById("refreshDocs").addEventListener("click", () => {
    console.log('🔄 Refresh docs');
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

window.loadDocument = async function(title) {
  if (!window.FirestoreAPI) { alert('❌ Firestore není inicializován!'); return; }
  const doc = await window.FirestoreAPI.loadDocument(title);
  if (doc) { document.getElementById('editorBtn').click(); docTitle.value = doc.title; editor.innerHTML = doc.content; alert('✅ Dokument načten.'); }
};

window.deleteDocument = async function(title) {
  if (!window.FirestoreAPI) { alert('❌ Firestore není inicializován!'); return; }
  const ok = await window.FirestoreAPI.deleteDocument(title);
  if (ok) console.log('✅ Dokument smazán');
};

window.addEventListener('beforeunload', (e) => {
  const content = document.getElementById('editor')?.innerHTML;
  if (content && content.trim() !== '' && content !== '<p>Začni psát svůj dokument zde...</p>') { e.preventDefault(); e.returnValue = ''; }
});

console.log('script.js loaded (GitHub-ready).');
