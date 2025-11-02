# 🚀 Word Editor - Flotilový Projekt

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Aktivní-brightgreen)](https://jirka22med.github.io/word-editor/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com/)
[![HTML5](https://img.shields.io/badge/Frontend-HTML5%2FCSS3%2FJS-blue)](https://developer.mozilla.org/)

> **Moderní webový editor dokumentů s cloud synchronizací a exportem do DOCX/TXT formátů**

Vytvoření dokumentů přímo v prohlížeči s plnou podporou české diakritiky, formátování textu, vkládání obrázků a real-time synchronizací přes Firebase Firestore.

---

## 📋 **Obsah**

- [✨ Funkce](#-funkce)
- [🎯 Live Demo](#-live-demo)
- [🛠️ Technologie](#️-technologie)
- [📦 Instalace](#-instalace)
- [🚀 Použití](#-použití)
- [📂 Struktura projektu](#-struktura-projektu)
- [🔧 Konfigurace](#-konfigurace)
- [🤝 Přispívání](#-přispívání)
- [👥 Autoři](#-autoři)
- [📄 Licence](#-licence)

---

## ✨ **Funkce**

### 📝 **Editor**
- ✅ **Formátování textu**: Tučné, kurzíva, podtržené
- ✅ **Velikost písma**: 12-32px
- ✅ **Barva textu**: Výběr libovolné barvy
- ✅ **Vkládání obrázků**: Base64 s proporcionálním škálováním
- ✅ **Plná podpora češtiny**: UTF-8 encoding

### ☁️ **Cloud Firestore**
- ✅ **Real-time synchronizace**: Okamžité ukládání změn
- ✅ **CRUD operace**: Vytváření, načítání, mazání dokumentů
- ✅ **Automatické zálohy**: Vše uloženo v cloudu
- ✅ **Multi-device sync**: Přístup odkudkoli

### 📄 **Export**
- ✅ **DOCX export**: 100% Word kompatibilní (docx.js)
- ✅ **TXT export**: Čistý text s UTF-8
- ✅ **Podpora formátování**: Zachování tučného, kurzívy, obrázků
- ✅ **Proporcionální obrázky**: Automatické škálování

### 🎨 **UI/UX**
- ✅ **Moderní design**: Futuristický styl flotily
- ✅ **Responzivní**: Funguje na PC, tabletu i mobilu
- ✅ **Tmavý režim**: Příjemné pro oči
- ✅ **Animace**: Plynulé přechody

---

## 🎯 **Live Demo**

🌐 **Otevři aplikaci**: [https://jirka22med.github.io/word-editor/](https://jirka22med.github.io/word-editor/)

### **Jak vyzkoušet:**
1. Otevři odkaz výše
2. Napiš text do editoru
3. Použij toolbar pro formátování
4. Vložit obrázek (ikona 🖼️)
5. Ulož do cloudu (☁️ Uložit do Cloudu)
6. Stáhni jako DOCX nebo TXT

---

## 🛠️ **Technologie**

| Technologie | Verze | Účel |
|-------------|-------|------|
| **HTML5** | - | Struktura aplikace |
| **CSS3** | - | Styling (Gradient, Flexbox, Animations) |
| **JavaScript (ES6+)** | - | Logika aplikace |
| **Firebase Firestore** | 9.22.0 | Cloud databáze |
| **docx.js** | 8.0.0 | DOCX export |
| **FileSaver.js** | 2.0.5 | Stahování souborů |

---

## 📦 **Instalace**

### **Varianta A: Lokální spuštění**

```bash
# 1. Naklonuj repozitář
git clone https://github.com/jirka22med/word-editor.git

# 2. Přejdi do složky
cd word-editor

# 3. Otevři v prohlížeči
# Otevři soubor index.html přímo v Chrome/Firefox/Edge

# NEBO použij Live Server (VS Code extension)
# Pravý klik na index.html → "Open with Live Server"
```

### **Varianta B: GitHub Pages**

Aplikace je automaticky nasazena na GitHub Pages:
```
https://jirka22med.github.io/word-editor/
```

---

## 🚀 **Použití**

### **1️⃣ Vytvoření dokumentu**

1. **Zadej název** do pole "Název dokumentu..."
2. **Piš text** do bílého editoru
3. **Použij toolbar**:
   - 🅱️ Tučné
   - 🅸 Kurzíva
   - 🆄 Podtržené
   - 🎨 Barva textu
   - 📏 Velikost písma

### **2️⃣ Vložení obrázku**

1. Klikni na **🖼️ Obrázek**
2. Vyber soubor ze svého PC
3. Obrázek se automaticky škáluje (max 600x400px)

### **3️⃣ Uložení do cloudu**

1. Klikni **☁️ Uložit do Cloudu**
2. Dokument se automaticky synchronizuje
3. Najdeš ho v záložce **📚 Dokumenty**

### **4️⃣ Export dokumentu**

- **📄 Stáhnout RTF**: Stáhne jako `.docx` (Word formát)
- **📝 Stáhnout TXT**: Stáhne jako `.txt` (čistý text)

### **5️⃣ Správa dokumentů**

1. Přejdi do **📚 Dokumenty**
2. Vidíš seznam všech uložených dokumentů
3. **📂 Načíst**: Otevře dokument v editoru
4. **🗑️ Smazat**: Smaže dokument z cloudu

---

## 📂 **Struktura projektu**

```
word-editor/
├── index.html              # Hlavní HTML struktura
├── style.css               # Styly (Gradient design, Flexbox)
├── script.js               # Hlavní JavaScript logika
├── cloud-firestore.js      # Firebase integrace
├── html-to-docx-browser.js # DOCX konvertor (alternativa)
├── README.md               # Tato dokumentace
└── LICENSE                 # MIT License
```

### **Popis souborů:**

| Soubor | Popis |
|--------|-------|
| `index.html` | HTML struktura, toolbar, editor, tabulka dokumentů |
| `style.css` | CSS styly, responzivní design, animace |
| `script.js` | Editor logika, DOCX/TXT export, Firebase volání |
| `cloud-firestore.js` | Firebase inicializace, CRUD operace, real-time sync |
| `html-to-docx-browser.js` | Alternativní DOCX konvertor (backup) |

---

## 🔧 **Konfigurace**

### **Firebase Setup**

Projekt používá Firebase Firestore. Konfigurace je v `cloud-firestore.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCTTSAKHs5p4gl_weYoqkdlLtAQnWQDN1c",
    authDomain: "pdf-projekt-vice-admiral-jirik.firebaseapp.com",
    projectId: "pdf-projekt-vice-admiral-jirik",
    storageBucket: "pdf-projekt-vice-admiral-jirik.firebasestorage.app",
    messagingSenderId: "969245793655",
    appId: "1:969245793655:web:28180a43dbc1f8dd021572",
    measurementId: "G-41BEV6J0CS"
};
```

**Pro vlastní projekt:**
1. Vytvoř Firebase projekt na [console.firebase.google.com](https://console.firebase.google.com/)
2. Aktivuj Firestore Database
3. Zkopíruj konfiguraci do `cloud-firestore.js`

---

## 🤝 **Přispívání**

Přispívání je vítáno! 🎉

### **Postup:**

1. **Fork** repozitář
2. **Vytvoř branch**: `git checkout -b feature/nova-funkce`
3. **Commit změny**: `git commit -m "Přidána nová funkce"`
4. **Push**: `git push origin feature/nova-funkce`
5. **Otevři Pull Request**

### **Návrhy na vylepšení:**

- [ ] **PDF Export** (jsPDF)
- [ ] **Markdown Export**
- [ ] **Kolaborativní editace** (více uživatelů současně)
- [ ] **Autentifikace** (Firebase Auth)
- [ ] **Šablony dokumentů**
- [ ] **Export-module.js** (separátní modul pro export)

---

## 👥 **Autoři**

### **Více Admirál Jiřík** 🎖️
- **Role**: Projektový architekt a hlavní správce
- **Odpovědnost**: Celková vize, testování, strategická rozhodnutí
- **GitHub**: [@jirka22med](https://github.com/jirka22med)

### **Admirál Claude.AI** 🤖
- **Role**: Hlavní konstruktér systému
- **Odpovědnost**: Architektura, Firebase integrace, RTF export, česká diakritika
- **Technologie**: Modularizace, clean code, debugging

### **Admirál Chatbot GPT-5** 🚀
- **Role**: Finalizátor mise
- **Odpovědnost**: DOCX export optimalizace, proporcionální obrázky, HTML parsing
- **Technologie**: docx.js integrace, profesionální výstup

---

## 🏆 **Ocenění**

> **"Společná mise tří admirálů - ukázka dokonalé spolupráce člověka a umělé inteligence v duchu Hvězdné flotily."**

- ⭐ **100% funkční DOCX export**
- ⭐ **Real-time cloud synchronizace**
- ⭐ **Plná podpora české diakritiky**
- ⭐ **Profesionální design**

---

## 📄 **Licence**

Tento projekt je licencován pod **MIT License** - viz soubor [LICENSE](LICENSE) pro detaily.

### **MIT License Summary:**
✅ Komerční použití  
✅ Modifikace  
✅ Distribuce  
✅ Soukromé použití  
❌ Žádná odpovědnost autora  

---

## 📞 **Kontakt**

- **GitHub Issues**: [Nahlásit bug/návrh](https://github.com/jirka22med/word-editor/issues)
- **Email**: jirka22med@gmail.com (pokud máš)
- **Live Demo**: [https://jirka22med.github.io/word-editor/](https://jirka22med.github.io/word-editor/)

---

## 🎉 **Poděkování**

Děkujeme všem, kdo přispěli k tomuto projektu! 🙏

- **Firebase** za cloud infrastrukturu
- **docx.js** za profesionální DOCX export
- **OpenAI Claude & GPT-5** za AI asistenci
- **GitHub Pages** za hosting

---

## 🚀 **Warp Motor Aktivován!**

```
⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀
⠀⠀⠀⠀⢰⣿⣿⣿⠟⠋⠉⠙⠻⣿⣿⣿⣿⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⠃⠀⠀⠀⠀⠀⠘⣿⣿⣿⡇⠀⠀
⠀⠀⠀⢠⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⠀⠀
⠀⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀
⠀⠀⠀⠸⣿⣿⣷⡀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡿⠀⠀
⠀⠀⠀⠀⠹⣿⣿⣿⣦⣀⣀⣀⣴⣿⣿⣿⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠈⠻⢿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀
```

**Mise dokončena. Warpový motor zastaven.** 🖖

---

*Poslední aktualizace: Listopad 2025*
