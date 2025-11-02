// ===========================================================
// 🚀 Starfleet RTF Engine – Full App Build (Více admirále Jiřík)
// Verze: 4.0 (Unicode fix, GitHub Pages ready, offline fallback)
// ===========================================================

// ====== Globální proměnné ======
let editor;
let docTitle;

// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Aplikace spuštěna!');
  editor   = document.getElementById('editor');
  docTitle = document.getElementById('docTitle');
  setupNavigation();
  setupToolbar();
  setupActionButtons();
  setupDocumentsPage();
});

// ====== Navigace ======
function setupNavigation() {
  const editorBtn    = document.getElementById('editorBtn');
  const documentsBtn = document.getElementById('documentsBtn');
  const editorPage   = document.getElementById('editorPage');
  const documentsPage= document.getElementById('documentsPage');

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

// ====== Toolbar ======
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
    document.execCommand('foreColor', false, e.target.value); editor.focus();
  });

  document.getElementById('imageUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.border = '2px solid #64c8ff';
        img.style.maxWidth = 'none';
        img.style.margin = '15px 0';
        img.style.borderRadius = '8px';
        const sel = window.getSelection();
        if (sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.insertNode(img); range.collapse(false);
        } else {
          editor.appendChild(img);
        }
        console.log('✅ Obrázek přidán (20×20)');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🔥 RTF LOGIKA: Unicode + GitHub Pages + Offline fallback
// ═══════════════════════════════════════════════════════════════════════

// Escapování RTF znaků
function escapeRtf(text) {
  return text.replace(/[\\{}]/g, m => "\\" + m);
}

// ✅ Unicode převod: \uXXXX + reálný znak (žádné '?')
function toRtfUnicode(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code < 128) out += escapeRtf(ch);
    else out += "\\u" + code + ch; // kód + znak jako fallback
  }
  return out;
}

// ✅ Fallback HTML → RTF (když není k dispozici externí knihovna)
function convertHtmlToRtfFallback(editorElement) {
  const tmp = editorElement.cloneNode(true);
  tmp.querySelectorAll("*").forEach(el => {
    el.removeAttribute('class');
    el.removeAttribute('style');
    el.removeAttribute('tabindex');
    el.removeAttribute('dir');
  });

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
    .replace(/<br\s*\/?>/gi, "\\line\n")         // ← opravený regex
    .replace(/<img[^>]*>/gi, "[OBRÁZEK]\\par\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();

  let rtf = toRtfUnicode(h);
  rtf = rtf.replace(/^(\s*\\par\s*)+/g, "");     // začátek
  rtf = rtf.replace(/(\s*\\par\s*)+$/g, "");     // konec
  rtf = rtf.replace(/(\\par\s*){3,}/g, "\\par\\par");
  return rtf;
}

// ✅ RTF dokument (Unicode enforcement)
function buildRtfDocument(title, rtfContent) {
  const header =
    "{\\rtf1\\ansi\\deff0\\ansicpg65001\\uc1\\adeflang1025" + // UTF-8 + vynucení Unicode
    "{\\fonttbl{\\f0 Arial;}}" +
    "{\\info{\\title " + escapeRtf(title) + "}}" +
    "\\viewkind4\\pard\\f0\\fs24\n";
  const footer = "\n}";
  return header + rtfContent + footer;
}

// ✅ Stahování: žádný BOM, správný MIME, fallback bez FileSaver
function downloadRtf(filename, rtfString) {
  const blob = new Blob([rtfString], { type: "text/rtf" }); // žádný BOM!

  if (typeof saveAs !== "undefined") {
    try { saveAs(blob, filename); return; }
    catch (e) { console.warn("FileSaver fallback:", e); }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

// ✅ Hlavní export: preferuj html-rtf.js, jinak fallback
function exportRtfDocument(title, editor) {
  const html = editor.innerHTML;
  if (html.trim() === "" || html === "<p>Začni psát svůj dokument zde...</p>") {
    alert("⚠️ Editor je prázdný!"); return;
  }

  try {
    let rtfBody = null;

    // Externí knihovny (GitHub Pages)
    if (window.HtmlRtf && typeof window.HtmlRtf.fromHTML === "function") {
      rtfBody = window.HtmlRtf.fromHTML(html);
    } else if (window.htmlToRtf && typeof window.htmlToRtf === "function") {
      rtfBody = window.htmlToRtf(html);
    } else if (window.html_rtf && typeof window.html_rtf === "function") {
      rtfBody = window.html_rtf(html);
    } else {
      console.warn("⚠️ html-rtf.js nenalezena – používám interní fallback.");
      rtfBody = convertHtmlToRtfFallback(editor);
    }

    const rtfDoc = buildRtfDocument(title, rtfBody);
    downloadRtf(`${title}.rtf`, rtfDoc);
    console.log("✅ RTF export dokončen:", title);
    alert("✅ RTF dokument úspěšně stažen!");
  } catch (err) {
    console.error("❌ Chyba exportu RTF:", err);
    alert("❌ Chyba při exportu RTF: " + (err.message || err));
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ====== AKČNÍ TLAČÍTKA ======
function setupActionButtons() {
  // Uložení do cloudu
  document.getElementById("saveToCloud").addEventListener("click", async () => {
    const title   = docTitle.value.trim();
    const content = editor.innerHTML;

    if (!title) { alert("⚠️ Zadej prosím název dokumentu!"); docTitle.focus(); return; }
    if (content.trim() === "" || content === "<p>Začni psát svůj dokument zde...</p>") {
      alert("⚠️ Editor je prázdný!"); return;
    }

    if (window.FirestoreAPI) {
      const success = await window.FirestoreAPI.saveDocument(title, content);
      if (success) console.log("✅ Dokument uložen:", title);
    } else {
      alert("❌ Firestore není inicializován!");
    }
  });

  // 📄 RTF EXPORT
  document.getElementById("downloadDOCX").addEventListener("click", () => {
    const title = docTitle.value.trim() || "dokument";
    exportRtfDocument(title, editor);
  });

  // 📝 TXT EXPORT
  document.getElementById("downloadTXT").addEventListener("click", () => {
    const title = docTitle.value.trim() || "dokument";
    const raw   = editor.innerText;
    if (raw.trim() === "" || raw === "Začni psát svůj dokument zde...") {
      alert("⚠️ Editor je prázdný!"); return;
    }
    try {
      const blob = new Blob([raw], { type: "text/plain;charset=utf-8" });
      if (typeof saveAs !== "undefined") saveAs(blob, `${title}.txt`);
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${title}.txt`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
      }
      console.log("✅ TXT stažen:", title);
      alert("✅ TXT soubor úspěšně stažen!");
    } catch (e) {
      console.error("❌ Chyba při vytváření TXT:", e);
      alert("❌ Chyba při vytváření TXT: " + (e.message || e));
    }
  });

  // 🗑️ Vymazat editor
  document.getElementById("clearEditor").addEventListener("click", () => {
    if (confirm("🗑️ Opravdu chceš vymazat celý obsah editoru?")) {
      editor.innerHTML = "<p>Začni psát svůj dokument zde...</p>";
      docTitle.value = "";
      console.log("✅ Editor vymazán");
    }
  });
}

// ====== Stránka dokumentů ======
function setupDocumentsPage() {
  document.getElementById("refreshDocs").addEventListener("click", () => {
    console.log("🔄 Obnovení dokumentů…");
    if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
  });
}

// ====== Globální akce (načtení/smazání) ======
window.loadDocument = async function(title) {
  if (!window.FirestoreAPI) { alert("❌ Firestore není inicializován!"); return; }
  const doc = await window.FirestoreAPI.loadDocument(title);
  if (doc) {
    document.getElementById("editorBtn").click();
    docTitle.value     = doc.title;
    editor.innerHTML   = doc.content;
    console.log("✅ Dokument načten:", doc.title);
    alert("✅ Dokument byl načten do editoru!");
  }
};

window.deleteDocument = async function(title) {
  if (!window.FirestoreAPI) { alert("❌ Firestore není inicializován!"); return; }
  const ok = await window.FirestoreAPI.deleteDocument(title);
  if (ok) console.log("✅ Dokument smazán a tabulka aktualizována");
};

// Prevence ztráty dat
window.addEventListener("beforeunload", (e) => {
  const content = document.getElementById("editor")?.innerHTML;
  if (content && content.trim() !== "" && content !== "<p>Začni psát svůj dokument zde...</p>") {
    e.preventDefault(); e.returnValue = "";
  }
});

console.log("✅ script.js načten (v4.0)");
