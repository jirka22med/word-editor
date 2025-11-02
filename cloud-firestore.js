// Firebase konfigurace
const firebaseConfig = {
    apiKey: "AIzaSyCTTSAKHs5p4gl_weYoqkdlLtAQnWQDN1c",
    authDomain: "pdf-projekt-vice-admiral-jirik.firebaseapp.com",
    projectId: "pdf-projekt-vice-admiral-jirik",
    storageBucket: "pdf-projekt-vice-admiral-jirik.firebasestorage.app",
    messagingSenderId: "969245793655",
    appId: "1:969245793655:web:28180a43dbc1f8dd021572",
    measurementId: "G-41BEV6J0CS"
};

// Inicializace Firebase
let db;

function initializeFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("🚀 Firebase inicializován úspěšně!");
        updateSyncStatus(true);
        setupRealtimeListener();
        return true;
    } catch (error) {
        console.error("❌ Chyba při inicializaci Firebase:", error);
        updateSyncStatus(false);
        return false;
    }
}

// Aktualizace statusu synchronizace
function updateSyncStatus(isConnected) {
    const statusElement = document.getElementById('syncStatus');
    if (statusElement) {
        if (isConnected) {
            statusElement.textContent = '⚡ Připojeno';
            statusElement.style.background = 'rgba(46, 204, 113, 0.2)';
            statusElement.style.borderColor = '#2ecc71';
            statusElement.style.color = '#2ecc71';
        } else {
            statusElement.textContent = '⚠️ Odpojeno';
            statusElement.style.background = 'rgba(231, 76, 60, 0.2)';
            statusElement.style.borderColor = '#e74c3c';
            statusElement.style.color = '#e74c3c';
        }
    }
}

// Uložení dokumentu do Firestore
async function saveDocumentToCloud(title, content) {
    if (!title || title.trim() === '') {
        alert('⚠️ Zadej prosím název dokumentu!');
        return false;
    }

    try {
        const docData = {
            title: title.trim(),
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('documents').doc(title.trim()).set(docData);
        console.log('✅ Dokument uložen do cloudu:', title);
        alert('✅ Dokument byl úspěšně uložen do cloudu!');
        return true;
    } catch (error) {
        console.error('❌ Chyba při ukládání:', error);
        alert('❌ Chyba při ukládání do cloudu: ' + error.message);
        return false;
    }
}

// Načtení dokumentu z Firestore
async function loadDocumentFromCloud(docTitle) {
    try {
        const docRef = db.collection('documents').doc(docTitle);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Dokument načten z cloudu:', docTitle);
            return data;
        } else {
            console.log('⚠️ Dokument neexistuje:', docTitle);
            alert('⚠️ Dokument nebyl nalezen!');
            return null;
        }
    } catch (error) {
        console.error('❌ Chyba při načítání:', error);
        alert('❌ Chyba při načítání z cloudu: ' + error.message);
        return null;
    }
}

// Smazání dokumentu z Firestore
async function deleteDocumentFromCloud(docTitle) {
    if (!confirm(`🗑️ Opravdu chceš smazat dokument "${docTitle}"?`)) {
        return false;
    }

    try {
        await db.collection('documents').doc(docTitle).delete();
        console.log('✅ Dokument smazán:', docTitle);
        alert('✅ Dokument byl úspěšně smazán!');
        return true;
    } catch (error) {
        console.error('❌ Chyba při mazání:', error);
        alert('❌ Chyba při mazání: ' + error.message);
        return false;
    }
}

// Načtení všech dokumentů
async function loadAllDocuments() {
    try {
        const snapshot = await db.collection('documents')
            .orderBy('createdAt', 'desc')
            .get();

        const documents = [];
        snapshot.forEach(doc => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ Načteno ${documents.length} dokumentů`);
        return documents;
    } catch (error) {
        console.error('❌ Chyba při načítání dokumentů:', error);
        return [];
    }
}

// Real-time listener pro synchronizaci
function setupRealtimeListener() {
    db.collection('documents').onSnapshot(
        (snapshot) => {
            console.log('🔄 Detekována změna v cloudu, aktualizuji tabulku...');
            updateDocumentsTable();
        },
        (error) => {
            console.error('❌ Chyba real-time listeneru:', error);
        }
    );
}

// Aktualizace tabulky dokumentů
async function updateDocumentsTable() {
    const tbody = document.getElementById('documentsBody');
    if (!tbody) return;

    const documents = await loadAllDocuments();

    if (documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-documents">Zatím žádné dokumenty...</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    documents.forEach(doc => {
        const row = document.createElement('tr');
        
        // Formátování data
        let dateString = 'Neznámé datum';
        if (doc.createdAt) {
            const date = doc.createdAt.toDate();
            dateString = date.toLocaleString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        row.innerHTML = `
            <td>📄 ${doc.title}</td>
            <td>${dateString}</td>
            <td class="doc-actions">
                <button class="doc-btn load-btn" onclick="loadDocument('${doc.id}')">📂 Načíst</button>
                <button class="doc-btn delete-btn" onclick="deleteDocument('${doc.id}')">🗑️ Smazat</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Export funkcí pro globální použití
window.FirestoreAPI = {
    initialize: initializeFirebase,
    saveDocument: saveDocumentToCloud,
    loadDocument: loadDocumentFromCloud,
    deleteDocument: deleteDocumentFromCloud,
    loadAllDocuments: loadAllDocuments,
    updateTable: updateDocumentsTable
};

// Inicializace při načtení stránky
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}