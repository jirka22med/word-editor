// Globální proměnné
let editor;
let docTitle;

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplikace spuštěna!');
    editor = document.getElementById('editor');
    docTitle = document.getElementById('docTitle');
    setupNavigation();
    setupToolbar();
    setupActionButtons();
    setupDocumentsPage();
});

// === NAVIGACE ===
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

// === TOOLBAR ===
function setupToolbar() {
    document.getElementById('boldBtn').addEventListener('click', () => {
        document.execCommand('bold', false, null);
        editor.focus();
    });
    document.getElementById('italicBtn').addEventListener('click', () => {
        document.execCommand('italic', false, null);
        editor.focus();
    });
    document.getElementById('underlineBtn').addEventListener('click', () => {
        document.execCommand('underline', false, null);
        editor.focus();
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

    document.getElementById('imageUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '20px';
                img.style.height = '20px';
                img.style.border = '2px solid #64c8ff';
                img.style.maxWidth = 'none';
                img.style.margin = '15px 0';
                img.style.borderRadius = '8px';
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.insertNode(img);
                    range.collapse(false);
                } else {
                    editor.appendChild(img);
                }
                console.log('✅ Obrázek přidán do editoru (20x20px)');
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
}

// ═══════════════════════════════════════════════════════════════════════
// 🔥 NOVÁ RTF LOGIKA: STABILNÍ UNICODE PŘEVOD (verze 3.1 Admirál Jiřík)
// ═══════════════════════════════════════════════════════════════════════

function escapeRtf(text) {
    return text.replace(/[\\{}]/g, m => "\\" + m);
}

function toRtfUnicode(text) {
    let out = "";
    for (const ch of text) {
        const code = ch.codePointAt(0);
        if (code < 128) out += escapeRtf(ch);
        else out += `\\u${code}?`;
    }
    return out;
}

function convertHtmlToRtfContent(editorElement) {
    const tempDiv = editorElement.cloneNode(true);
    tempDiv.querySelectorAll("*").forEach(el => {
        el.removeAttribute("class");
        el.removeAttribute("style");
        el.removeAttribute("tabindex");
        el.removeAttribute("dir");
    });

    let htmlContent = tempDiv.innerHTML
        .replace(/<p>\s*<\/p>/gi, "")
        .replace(/<b>|<strong>/gi, "{\\b ")
        .replace(/<\/b>|<\/strong>/gi, "\\b0}")
        .replace(/<i>|<em>/gi, "{\\i ")
        .replace(/<\/i>|<\/em>/gi, "\\i0}")
        .replace(/<u>/gi, "{\\ul ")
        .replace(/<\/u>/gi, "\\ulnone}")
        .replace(/<\/p>/gi, "\\par\\par\n") // dvojitý odstavec pro přehlednost
        .replace(/<p>/gi, "")
        .replace(/<br\s*\/?>/gi, "\\line\n")
        .replace(/<img[^>]*>/gi, "[OBRÁZEK]\\par\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .trim();

    let rtf = toRtfUnicode(htmlContent);
    rtf = rtf.replace(/^(\s*\\par\s*)+/g, "");
    rtf = rtf.replace(/(\s*\\par\s*)+$/g, "");
    rtf = rtf.replace(/(\\par\s*){3,}/g, "\\par\\par");
    return rtf;
}

function buildRtfDocument(title, rtfContent) {
    const header =
        "{\\rtf1\\ansi\\deff0\\ansicpg1250\\uc1" +
        "{\\fonttbl{\\f0 Arial;}}" +
        `{\\info{\\title ${escapeRtf(title)}}}` +
        "\\viewkind4\\pard\\f0\\fs24\n";
    const footer = "\n}";
    return header + rtfContent + footer;
}

function downloadRtf(filename, rtfString) {
    const blob = new Blob([rtfString], { type: "application/rtf;charset=utf-8" });
    if (typeof saveAs === "undefined") {
        console.error("❌ FileSaver.js není načten!");
        alert("❌ Chyba: FileSaver.js knihovna není dostupná!");
        return;
    }
    saveAs(blob, filename);
}

// ═══════════════════════════════════════════════════════════════════════
// === AKČNÍ TLAČÍTKA ===
function setupActionButtons() {
    // ☁️ Uložení do cloudu
    document.getElementById("saveToCloud").addEventListener("click", async () => {
        const title = docTitle.value.trim();
        const content = editor.innerHTML;

        if (!title) {
            alert("⚠️ Zadej prosím název dokumentu!");
            docTitle.focus();
            return;
        }
        if (content.trim() === "" || content === "<p>Začni psát svůj dokument zde...</p>") {
            alert("⚠️ Editor je prázdný!");
            return;
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
        const content = editor.innerHTML;
        if (content.trim() === "" || content === "<p>Začni psát svůj dokument zde...</p>") {
            alert("⚠️ Editor je prázdný!");
            return;
        }

        try {
            const rtfContent = convertHtmlToRtfContent(editor);
            const rtfDocument = buildRtfDocument(title, rtfContent);
            downloadRtf(`${title}.rtf`, rtfDocument);
            console.log("✅ RTF (Unicode) export dokončen:", title);
            alert("✅ Dokument stažen jako .RTF (Unicode).");
        } catch (e) {
            console.error("❌ Chyba při vytváření RTF:", e);
            alert("❌ Chyba: " + e.message);
        }
    });

    // 📝 TXT EXPORT
    document.getElementById("downloadTXT").addEventListener("click", () => {
        const title = docTitle.value.trim() || "dokument";
        const rawContent = editor.innerText;

        if (rawContent.trim() === "" || rawContent === "Začni psát svůj dokument zde...") {
            alert("⚠️ Editor je prázdný!");
            return;
        }

        try {
            const blob = new Blob([rawContent], { type: "text/plain;charset=utf-8" });
            if (typeof saveAs === "undefined") {
                console.error("❌ FileSaver.js není načten!");
                alert("❌ Chyba: FileSaver.js knihovna není dostupná!");
                return;
            }
            saveAs(blob, `${title}.txt`);
            console.log("✅ TXT stažen:", title);
            alert("✅ Dokument byl úspěšně stažen jako TXT!");
        } catch (error) {
            console.error("❌ Chyba při vytváření TXT:", error);
            alert("❌ Chyba při vytváření TXT: " + error.message);
        }
    });

    // 🗑️ Vymazání editoru
    document.getElementById("clearEditor").addEventListener("click", () => {
        if (confirm("🗑️ Opravdu chceš vymazat celý obsah editoru?")) {
            editor.innerHTML = "<p>Začni psát svůj dokument zde...</p>";
            docTitle.value = "";
            console.log("✅ Editor vymazán");
        }
    });
}

// === STRÁNKA DOKUMENTŮ ===
function setupDocumentsPage() {
    document.getElementById("refreshDocs").addEventListener("click", () => {
        console.log("🔄 Manuální obnovení dokumentů...");
        if (window.FirestoreAPI) window.FirestoreAPI.updateTable();
    });
}

// === GLOBÁLNÍ FUNKCE PRO NAČÍTÁNÍ A MAZÁNÍ ===
window.loadDocument = async function(docTitle) {
    if (!window.FirestoreAPI) {
        alert("❌ Firestore není inicializován!");
        return;
    }
    const docData = await window.FirestoreAPI.loadDocument(docTitle);
    if (docData) {
        document.getElementById("editorBtn").click();
        document.getElementById("docTitle").value = docData.title;
        document.getElementById("editor").innerHTML = docData.content;
        console.log("✅ Dokument načten do editoru:", docData.title);
        alert("✅ Dokument byl načten do editoru!");
    }
};

window.deleteDocument = async function(docTitle) {
    if (!window.FirestoreAPI) {
        alert("❌ Firestore není inicializován!");
        return;
    }
    const success = await window.FirestoreAPI.deleteDocument(docTitle);
    if (success) console.log("✅ Dokument smazán a tabulka aktualizována");
};

// Prevence ztráty dat
window.addEventListener("beforeunload", (e) => {
    const content = document.getElementById("editor")?.innerHTML;
    if (content && content.trim() !== "" && content !== "<p>Začni psát svůj dokument zde...</p>") {
        e.preventDefault();
        e.returnValue = "";
    }
});

console.log("✅ Script.js načten úspěšně!");
