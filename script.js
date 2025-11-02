// ===========================================================
// 🚀 Starfleet RTF Engine – Unicode Edition (Více admirále Jiřík)
// ===========================================================

// Escapování RTF znaků
function escapeRtf(text) {
  return text.replace(/[\\{}]/g, m => "\\" + m);
}

// ✅ Unicode převod s reálnými znaky (žádné otazníky)
function toRtfUnicode(text) {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code < 128) {
      out += escapeRtf(ch);
    } else {
      out += "\\u" + code + ch; // kombinace kódu + reálného znaku
    }
  }
  return out;
}

// ✅ Tvorba čistého RTF dokumentu s UTF-8 hlavičkou
function buildRtfDocument(title, rtfContent) {
  const header =
    "{\\rtf1\\ansi\\deff0\\ansicpg65001\\uc1\\adeflang1025" + // Unicode (UTF-8)
    "{\\fonttbl{\\f0 Arial;}}" +
    "{\\info{\\title " + escapeRtf(title) + "}}" +
    "\\viewkind4\\pard\\f0\\fs24\n";

  const footer = "\n}";
  return header + rtfContent + footer;
}

// ✅ Offline / online bezpečný export bez BOM
function downloadRtf(filename, rtfString) {
  const blob = new Blob([rtfString], { type: "text/rtf" });

  if (typeof saveAs !== "undefined") {
    try {
      saveAs(blob, filename);
      return;
    } catch (e) {
      console.warn("FileSaver fallback:", e);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ✅ Zjednodušený převod HTML → RTF (fallback, když knihovna není dostupná)
function convertHtmlToRtfFallback(editorElement) {
  const tmp = editorElement.cloneNode(true);
  tmp.querySelectorAll("*").forEach(el => {
    el.removeAttribute("class");
    el.removeAttribute("style");
    el.removeAttribute("tabindex");
    el.removeAttribute("dir");
  });

  let html = tmp.innerHTML
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

  let rtf = toRtfUnicode(html);
  rtf = rtf.replace(/^(\s*\\par\s*)+/g, "");
  rtf = rtf.replace(/(\s*\\par\s*)+$/g, "");
  rtf = rtf.replace(/(\\par\s*){3,}/g, "\\par\\par");
  return rtf;
}

// ✅ Hlavní exportní logika (funguje i s knihovnou html-rtf.js)
function exportRtfDocument(title, editor) {
  try {
    let rtfBody = null;

    // Pokud existuje externí knihovna, použij ji
    if (window.HtmlRtf && typeof window.HtmlRtf.fromHTML === "function") {
      rtfBody = window.HtmlRtf.fromHTML(editor.innerHTML);
    } else if (window.htmlToRtf && typeof window.htmlToRtf === "function") {
      rtfBody = window.htmlToRtf(editor.innerHTML);
    } else {
      // fallback
      console.warn("⚠️ Používám interní převodník (html-rtf.js nenalezena)");
      rtfBody = convertHtmlToRtfFallback(editor);
    }

    const rtfDoc = buildRtfDocument(title, rtfBody);
    downloadRtf(title + ".rtf", rtfDoc);
    alert("✅ RTF dokument úspěšně stažen!");
  } catch (err) {
    console.error("❌ Chyba exportu RTF:", err);
    alert("❌ Chyba při exportu RTF: " + (err.message || err));
  }
}
