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
   
    // ===========================================================
// 🖼️ Vkládání obrázku jako Base64 – zachování poměru stran
// ===========================================================

document.getElementById('imageUpload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result; // data:image/png;base64,...
    const img = new Image();

    img.onload = function () {
      const maxWidth = 600;  // maximální šířka v editoru
      const maxHeight = 400; // maximální výška v editoru
      let width = img.width;
      let height = img.height;

      // zachování poměru stran
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      const finalImg = document.createElement('img');
      finalImg.src = base64;
      finalImg.style.width = `${width}px`;
      finalImg.style.height = `${height}px`;
      finalImg.style.display = 'block';
      finalImg.style.margin = '10px auto';
      finalImg.style.borderRadius = '6px';
      finalImg.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';
      editor.appendChild(finalImg);
    };

    img.src = base64;
  };

  reader.readAsDataURL(file);
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
// 🧩 HTML → DOCX parser (tučné, kurzíva, podtržení, obrázky)
// ===========================================================

function parseHtmlToDocxRuns(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const runs = [];

  div.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push(new docx.TextRun({ text: node.textContent }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      switch (node.tagName.toLowerCase()) {
        case 'b': case 'strong':
          runs.push(new docx.TextRun({ text: node.textContent, bold: true }));
          break;
        case 'i': case 'em':
          runs.push(new docx.TextRun({ text: node.textContent, italics: true }));
          break;
        case 'u':
          runs.push(new docx.TextRun({ text: node.textContent, underline: {} }));
          break;
        case 'img':
          const src = node.getAttribute('src');
          if (src && src.startsWith('data:image')) {
            const base64 = src.split(',')[1];
            runs.push(new docx.ImageRun({
              data: Uint8Array.from(atob(base64), c => c.charCodeAt(0)),
              transformation: { width: 300, height: 200 }
            }));
          }
          break;
        default:
          runs.push(...parseHtmlToDocxRuns(node.innerHTML)); // Rekurze
      }
    }
  });
  return runs;
}



// ===========================================================
// 🧩 DOCX EXPORT (HTML → DOCX) – 100% Word kompatibilní verze
// ===========================================================
async function exportDocx(title) {
  const html = getEditorHtml();
  if (!html || html.trim() === '' || html.includes('Začni psát')) {
    alert('⚠️ Editor je prázdný!'); 
    console.warn('🟡 DOCX export zrušen – prázdný obsah.');
    return;
  }

  // Ověření knihovny docx.js
  if (!window.docx) {
    alert('❌ Knihovna docx.js není načtena! Přidej ji do index.html:');
    console.error('Chybí <script src="https://cdn.jsdelivr.net/npm/docx@8.0.0/build/index.min.js"></script>');
    return;
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

  console.log('🚀 Knihovna docx.js detekována – inicializuji export...');

  // Rozsekání HTML na odstavce podle <p> tagů
  const cleanHtml = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // odstraní vložené CSS
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // odstraní JS
    .replace(/\n+/g, ' ')
    .trim();

  const paragraphs = cleanHtml
    .split(/<\/p>/i)
    .filter(p => p.trim().length > 0)
    .map(p => p.replace(/<[^>]+>/g, '').trim());

  // Převedeme HTML na DOCX odstavce – s podporou tučného, kurzívy, podtržení a obrázků
  const docParagraphs = cleanHtml
    .split(/<\/p>/i)
    .filter(p => p.trim().length > 0)
    .map(p => new Paragraph({
      children: parseHtmlToDocxRuns(p),
      spacing: { after: 240 }
    }));

  // Vytvoření dokumentu
  const doc = new Document({
    creator: "Více admirál Jiřík – Flotilový projekt",
    title: title || "Bez názvu",
    description: "Dokument vytvořen v RTF Editoru flotily",
    sections: [
      {
        children: [
          new Paragraph({
            text: title || "Bez názvu",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),
          ...docParagraphs
        ]
      }
    ]
  });

  // Převod do Blobu
  const blob = await window.docx.Packer.toBlob(doc);
  saveBlob(blob, `${title || 'dokument'}.docx`);

  console.log('✅ DOCX export hotov a uložen:', title);
  alert('📄 Dokument úspěšně exportován jako DOCX!');
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


