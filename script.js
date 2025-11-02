// ===========================================================
// 🚀 STARFLEET DOCX ENGINE v2.0 – Final Integration
// Autor: Více admirál Jiřík & Admirál Chatbot
// ===========================================================
// ===========================================================
// 💾 Pomocná funkce pro stahování souborů
// ===========================================================
function saveBlob(blob, filename) {
  if (typeof saveAs === 'undefined') {
    console.error('❌ FileSaver.js není načten!');
    alert('❌ Chyba: FileSaver.js knihovna není dostupná!');
    return;
  }
  saveAs(blob, filename);
  console.log(`💾 Soubor uložen jako: ${filename}`);
}

let editor, docTitle;

document.addEventListener('DOMContentLoaded', () => {
  editor = document.getElementById('editor');
  docTitle = document.getElementById('docTitle');
  setupNavigation();
  setupToolbar();
  setupActionButtons();
  setupDocumentsPage();
  console.log('🚀 App ready: Starfleet DOCX engine aktivní.');
});

// ===========================================================
// ⚙️ Navigace
// ===========================================================
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

// ===========================================================
// 🧰 Toolbar
// ===========================================================
function setupToolbar() {
  document.getElementById('boldBtn').addEventListener('click', () => {
    document.execCommand('bold'); editor.focus();
  });
  document.getElementById('italicBtn').addEventListener('click', () => {
    document.execCommand('italic'); editor.focus();
  });
  document.getElementById('underlineBtn').addEventListener('click', () => {
    document.execCommand('underline'); editor.focus();
  });

  document.getElementById('fontSize').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = e.target.value + 'px';
    });
    editor.focus();
  });

  document.getElementById('textColor').addEventListener('change', (e) => {
    document.execCommand('foreColor', false, e.target.value);
    editor.focus();
  });

  // Obrázky
  document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) { e.target.value=''; return; }
    const r = new FileReader();
    r.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result; // Base64 data URL
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
// 📄 DOCX EXPORT (Word kompatibilní)
// ===========================================================
async function exportDocx(title) {
  const html = editor.innerHTML.trim();
  if (!html || html.includes('Začni psát')) {
    alert('⚠️ Editor je prázdný!');
    return;
  }

  if (!window.docx) {
    alert('❌ Knihovna docx.js není načtena!');
    return;
  }

  const { Document, Packer, Paragraph, HeadingLevel } = window.docx;

  const paragraphs = html.split(/<\/p>/i)
    .filter(p => p.trim().length > 0)
    .map(p => new Paragraph({
      children: parseHtmlToDocxRuns(p),
      spacing: { after: 240 }
    }));

  const doc = new Document({
    creator: "Více admirál Jiřík",
    title: title || "Bez názvu",
    description: "Flotilový RTF Editor",
    sections: [
      {
        children: [
          new Paragraph({
            text: title || "Bez názvu",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 }
          }),
          ...paragraphs
        ]
      }
    ]
  });

  const blob = await window.docx.Packer.toBlob(doc);
  saveBlob(blob, `${title || 'dokument'}.docx`);
  console.log('✅ DOCX export hotov:', title);
  alert('📄 Dokument úspěšně exportován jako DOCX!');
}

// ===========================================================
// 🧾 TXT EXPORT
// ===========================================================
function exportTxt(title) {
  const text = editor.innerText.trim();
  if (!text || text.includes('Začni psát')) {
    alert('⚠️ Editor je prázdný!');
    return;
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveBlob(blob, `${title}.txt`);
  console.log('🧾 TXT export dokončen.');
}

// ===========================================================
// 💾 Firestore Uložení + Tlačítka
// ===========================================================
function setupActionButtons() {
  document.getElementById('saveToCloud').addEventListener('click', async () => {
    const title = docTitle.value.trim();
    const content = editor.innerHTML;
    if (!title) { alert('⚠️ Zadej název dokumentu!'); return; }
    if (!content.trim()) { alert('⚠️ Editor je prázdný!'); return; }
    if (window.FirestoreAPI) {
      const ok = await window.FirestoreAPI.saveDocument(title, content);
      if (ok) console.log('☁️ Uloženo do Firestore:', title);
    }
  });

  document.getElementById('downloadDOCX').addEventListener('click', () => {
    const title = docTitle.value.trim() || 'dokument';
    exportDocx(title);
  });

  document.getElementById('downloadTXT').addEventListener('click', () => {
    const title = docTitle.value.trim() || 'dokument';
    exportTxt(title);
  });

  document.getElementById('clearEditor').addEventListener('click', () => {
    if (confirm('🗑️ Opravdu vymazat obsah editoru?')) {
      editor.innerHTML = '<p>Začni psát svůj dokument zde...</p>';
      docTitle.value = '';
    }
  });
}

// ===========================================================
// 📚 Dokumenty – Firestore Tabulka
// ===========================================================
function setupDocumentsPage() {
  document.getElementById('refreshDocs').addEventListener('click', () => {
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

window.loadDocument = async function(title) {
  if (!window.FirestoreAPI) return alert('❌ Firestore není inicializován!');
  const doc = await window.FirestoreAPI.loadDocument(title);
  if (doc) {
    document.getElementById('editorBtn').click();
    docTitle.value = doc.title;
    editor.innerHTML = doc.content;
    alert('✅ Dokument načten.');
  }
};

window.deleteDocument = async function(title) {
  if (!window.FirestoreAPI) return alert('❌ Firestore není inicializován!');
  const ok = await window.FirestoreAPI.deleteDocument(title);
  if (ok) console.log('🗑️ Dokument smazán:', title);
};

window.addEventListener('beforeunload', (e) => {
  const content = editor?.innerHTML;
  if (content && content.trim() !== '' && !content.includes('Začni psát')) {
    e.preventDefault(); e.returnValue = '';
  }
});

console.log('✅ script.js v2.0 – Starfleet engine aktivní.');

