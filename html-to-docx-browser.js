/*
 * html-to-docx-browser.js
 * Lokální, prohlížečová verze HTML → DOCX konvertoru
 * Autor: Více Admirál Jiřík & Admirál Chatbot
 */

(function (global) {
  function htmlToDocx(html, fileName = 'dokument.docx') {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head>
      <body>${html}</body></html>`;

    const blob = new Blob(
      ['\ufeff', content],
      { type: 'application/msword' }
    );

    // Stáhnout soubor
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.docx') ? fileName : fileName + '.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export funkce do globálního prostoru
  global.htmlToDocxBrowser = { generate: htmlToDocx };
})(window);
