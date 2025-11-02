// ===========================================================
// 🚀 STARFLEET DOCX ENGINE v2.0
// Autor: Více admirál Jiřík & admirál Chatbot
// Kompatibilita: MS Word, LibreOffice, Firestore, Offline
// ===========================================================

// 🧩 Inicializace editoru
const editor = document.getElementById('editor');
const docTitle = document.getElementById('docTitle');

// ===========================================================
// ⚙️ Pomocné funkce
// ===========================================================
function getEditorHtml() {
  return editor.innerHTML.trim();
}

function saveBlob(blob, filename) {
  saveAs(blob, filename);
  console.log(`💾 Soubor ${filename} úspěšně uložen.`);
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
// 🧩 DOCX EXPORT (HTML → DOCX plná verze)
// ===========================================================
async function exportDocx(title) {
  const html = getEditorHtml();
  if (!html || html === '<p>Začni psát svůj dokument zde...</p>') {
    alert('⚠️ Editor je prázdný!');
    return;
  }

  if (!window.docx) {
    alert('❌ Knihovna docx.js není načtena!');
    console.error('Chybí docx.js – zkontroluj index.html');
    return;
  }

  const { Document, Packer, Paragraph, HeadingLevel } = window.docx;
  console.log('🪐 DOCX export spuštěn...');

  const paragraphs = html
    .split(/<\/p>/i)
    .filter(p => p.trim().length > 0)
    .map(p => new Paragraph({
      children: parseHtmlToDocxRuns(p),
      spacing: { after: 240 }
    }));

  const doc = new Document({
    creator: "Více admirál Jiřík",
    title: title || "Bez názvu",
    description: "Flotilový projekt RTF Editor",
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
  console.log(`✅ DOCX export dokončen: ${title}.docx`);
  alert('📄 Dokument úspěšně exportován jako DOCX!');
}

// ===========================================================
// 🧠 Cloud Firestore – Uložení
// ===========================================================
document.getElementById('saveToCloud').addEventListener('click', async () => {
  const title = docTitle.value.trim();
  const content = editor.innerHTML;
  if (!title) return alert('⚠️ Zadej název dokumentu!');
  if (!content.trim()) return alert('⚠️ Editor je prázdný!');
  
  if (window.FirestoreAPI) {
    const success = await window.FirestoreAPI.saveDocument(title, content);
    if (success) console.log(`☁️ Dokument uložen do Cloudu: ${title}`);
  } else {
    alert('❌ Firestore není inicializován!');
  }
});

// ===========================================================
// 📄 Stahování jako TXT (fallback)
// ===========================================================
document.getElementById('downloadTXT').addEventListener('click', () => {
  const text = editor.innerText.trim();
  const title = docTitle.value.trim() || 'dokument';
  if (!text) return alert('⚠️ Editor je prázdný!');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${title}.txt`);
  console.log('🧾 TXT export dokončen.');
});

// ===========================================================
// 🖱️ Ostatní akce
// ===========================================================
document.getElementById('downloadDOCX').addEventListener('click', () => {
  const title = docTitle.value.trim() || 'dokument';
  exportDocx(title);
});

document.getElementById('clearEditor').addEventListener('click', () => {
  if (confirm('Opravdu chceš vymazat celý obsah editoru?')) {
    editor.innerHTML = '<p>Začni psát svůj dokument zde...</p>';
    console.log('🧹 Editor byl vyčištěn.');
  }
});

console.log('✅ script.js v2.0 načten – připraven ke službě flotily.');
