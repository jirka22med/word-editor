// ===========================================================
// 🚀 Word Editor – DOCX build (HTML → DOCX v prohlížeči)
// Autor: Více admirál Jiřík & Admirál Chatbot
// Funkce: editor, Firestore, TXT export, DOCX export (html-to-docx)
// ===========================================================

// ---- Globální prvky
let editor, docTitle;

document.addEventListener('DOMContentLoaded', () => {
  editor   = document.getElementById('editor');
  docTitle = document.getElementById('docTitle');
  setupNavigation();
  setupToolbar();
  setupActionButtons();
  setupDocumentsPage();
  console.log('🚀 App ready: DOCX export zapnut.');
});

// ---- Navigace
function setupNavigation() {
  const editorBtn = document.getElementById('editorBtn');
  const documentsBtn = document.getElementById('documentsBtn');
  const editorPage = document.getElementById('editorPage');
  const documentsPage = document.getElementById('documentsPage');

  editorBtn.addEventListener('click', () => {
    editorBtn.classList.add('active');
    documentsBtn.classList.remove('active');
    editorPage.classList.add('active');
    documentsPage.classList.remove('active');
  });

  documentsBtn.addEventListener('click', () => {
    documentsBtn.classList.add('active');
    editorBtn.classList.remove('active');
    documentsPage.classList.add('active');
    editorPage.classList.remove('active');
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

// ---- Toolbar
function setupToolbar() {
  document.getElementById('boldBtn')
    .addEventListener('click', () => { document.execCommand('bold'); editor.focus(); });
  document.getElementById('italicBtn')
    .addEventListener('click', () => { document.execCommand('italic'); editor.focus(); });
  document.getElementById('underlineBtn')
    .addEventListener('click', () => { document.execCommand('underline'); editor.focus(); });

  document.getElementById('fontSize').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = e.target.value + 'px';
    });
    editor.focus();
  });

  document.getElementById('textColor')
    .addEventListener('change', (e) => { document.execCommand('foreColor', false, e.target.value); editor.focus(); });

  document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) { e.target.value=''; return; }
    const r = new FileReader();
    r.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;          // data URL → html-to-docx to umí vložit do DOCX
      img.style.maxWidth = '100%';
      img.style.border = '2px solid #64c8ff';
      img.style.borderRadius = '8px';
      img.style.margin = '12px 0';

      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.insertNode(img); range.collapse(false);
      } else {
        editor.appendChild(img);
      }
      editor.focus();
    };
    r.readAsDataURL(file);
    e.target.value = '';
  });
}

// ---- Pomocné: čisté získání HTML z editoru
function getEditorHtml() {
  // necháme základní inline styly (barva, font-size apod.), html-to-docx je zpracuje
  // jen odmažeme prázdné <p>
  const clone = editor.cloneNode(true);
  clone.querySelectorAll('p').forEach(p => {
    if (p.innerText.trim() === '') p.remove();
  });
  return clone.innerHTML.trim();
}

// ---- Stahování blobu (univerzální)
function saveBlob(blob, filename) {
  if (typeof saveAs !== 'undefined') { saveAs(blob, filename); return; } // FileSaver.js
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ===========================================================
// 🧩 DOCX EXPORT (HTML → DOCX) – Lokální knihovna html-to-docx-browser.js
// ===========================================================
async function exportDocx(title) {
  const html = getEditorHtml();
  if (!html || html === '<p>Začni psát svůj dokument zde...</p>') {
    alert('⚠️ Editor je prázdný!'); 
    return;
  }

  // Ověření, že je knihovna načtena
  if (!window.htmlToDocxBrowser || !window.htmlToDocxBrowser.generate) {
    alert('❌ Chyba: knihovna html-to-docx-browser není načtena!');
    console.error('html-to-docx-browser.js nebyl nalezen.');
    return;
  }

  // Nastavení názvu
  const safeTitle = title && title.trim() ? title.trim() : 'dokument';

  // Warpový převod HTML → DOCX
  try {
    htmlToDocxBrowser.generate(html, safeTitle + '.docx');
    console.log('✅ DOCX export dokončen:', safeTitle);
  } catch (error) {
    console.error('💥 Chyba při generování DOCX:', error);
    alert('❌ Export selhal – zkontroluj, zda je knihovna správně připojena.');
  }
}

// ===========================================================
// 🧾 TXT EXPORT (UTF-8)
// ===========================================================
function exportTxt(title) {
  const raw = editor.innerText;
  if (!raw || raw.trim() === '' || raw === 'Začni psát svůj dokument zde...') {
    alert('⚠️ Editor je prázdný!'); return;
  }
  const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
  saveBlob(blob, `${title}.txt`);
}

// ===========================================================
// 🎛️ Akční tlačítka
// ===========================================================
function setupActionButtons() {
  // Uložit do cloudu
  document.getElementById('saveToCloud').addEventListener('click', async () => {
    const title = docTitle.value.trim();
    const content = editor.innerHTML;
    if (!title) { alert('⚠️ Zadej prosím název dokumentu!'); docTitle.focus(); return; }
    if (!content || content.trim() === '' || content === '<p>Začni psát svůj dokument zde...</p>') {
      alert('⚠️ Editor je prázdný!'); return;
    }
    if (window.FirestoreAPI) {
      const ok = await window.FirestoreAPI.saveDocument(title, content);
      if (ok) console.log('✅ Uloženo do Firestore:', title);
    } else {
      alert('❌ Firestore není inicializován!');
    }
  });

  // DOCX
  document.getElementById('downloadDOCX').addEventListener('click', () => {
    const title = docTitle.value.trim() || 'dokument';
    exportDocx(title);
  });

  // TXT
  document.getElementById('downloadTXT').addEventListener('click', () => {
    const title = docTitle.value.trim() || 'dokument';
    exportTxt(title);
  });

  // Vymazat
  document.getElementById('clearEditor').addEventListener('click', () => {
    if (confirm('🗑️ Opravdu vymazat obsah?')) {
      editor.innerHTML = '<p>Začni psát svůj dokument zde...</p>';
      docTitle.value = '';
    }
  });
}

// ===========================================================
// 📚 Stránka Dokumenty (Firestore tabulka)
// ===========================================================
function setupDocumentsPage() {
  document.getElementById('refreshDocs').addEventListener('click', () => {
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

// ---- Globální akce Firestore (načtení/smazání)
window.loadDocument = async function(title) {
  if (!window.FirestoreAPI) { alert('❌ Firestore není inicializován!'); return; }
  const doc = await window.FirestoreAPI.loadDocument(title);
  if (doc) {
    document.getElementById('editorBtn').click();
    docTitle.value = doc.title;
    editor.innerHTML = doc.content;
    alert('✅ Dokument načten.');
  }
};

window.deleteDocument = async function(title) {
  if (!window.FirestoreAPI) { alert('❌ Firestore není inicializován!'); return; }
  const ok = await window.FirestoreAPI.deleteDocument(title);
  if (ok) console.log('✅ Dokument smazán.');
};

// ---- Ochrana proti zavření s neuloženým obsahem
window.addEventListener('beforeunload', (e) => {
  const content = editor?.innerHTML;
  if (content && content.trim() !== '' && content !== '<p>Začni psát svůj dokument zde...</p>') {
    e.preventDefault(); e.returnValue = '';
  }
});

console.log('✅ script.js načten – DOCX verze.');

