import React, { useState, useEffect, useCallback } from 'react';
import PinInput from './components/PinInput';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';
import { Bookmark, EncryptedData, BookmarkCategory, EncryptedFileFormat } from './types';
import { LOCAL_STORAGE_KEY, THEME_STORAGE_KEY } from './constants';
import * as cryptoService from './services/cryptoService';
import SpinnerIcon from './components/icons/SpinnerIcon';

// Generate a UUID (simple version for client-side)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'clipboard';
  actionButton?: { text: string; onClick: () => void };
  duration?: number;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [storedSalt, setStoredSalt] = useState<Uint8Array | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); // For initial load check
  const [actionLoading, setActionLoading] = useState(false); // For PIN submit, save operations
  const [pinError, setPinError] = useState<string | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lastClipboardText, setLastClipboardText] = useState<string>('');
  const [quickAddUrl, setQuickAddUrl] = useState<string | null>(null);


  // Theme management
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setCurrentTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    // Update meta theme-color for PWA dynamic theming
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', currentTheme === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, [currentTheme]);

  const handleToggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Clipboard detection
  useEffect(() => {
    const handleFocus = async () => {
      if (!isAuthenticated || !navigator.clipboard || !navigator.clipboard.readText) return;
      try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboardText) {
          setLastClipboardText(text);
          // Basic URL detection (can be improved)
          if (text.startsWith('http://') || text.startsWith('https://')) {
            try {
              new URL(text); // Validate if it's a proper URL
              // Check if this URL already exists
              const urlExists = bookmarks.some(bm => bm.url === text);
              if (!urlExists) {
                setToast({
                  id: `clipboard-${Date.now()}`,
                  message: `Add "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"?`,
                  type: 'clipboard',
                  actionButton: {
                    text: "Add Link",
                    onClick: () => {
                        setQuickAddUrl(text); // This will trigger Dashboard to open modal
                        setToast(null);
                    }
                  },
                  duration: 10000 // 10 seconds or until action/dismiss
                });
              }
            } catch (e) { /* Not a valid URL, ignore */ }
          }
        }
      } catch (err) {
        // console.warn('Failed to read clipboard contents: ', err);
        // Can happen if permission is not granted or page is not focused.
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, lastClipboardText, bookmarks]);


  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const encryptedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (encryptedDataString) {
        try {
          const parsedData: EncryptedData = JSON.parse(encryptedDataString);
          const saltBuffer = cryptoService.base64ToArrayBuffer(parsedData.salt);
          setStoredSalt(new Uint8Array(saltBuffer));
          setIsInitialSetup(false);
        } catch (error) {
          console.error("Failed to parse stored data, treating as initial setup:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setIsInitialSetup(true);
          setToast({id: 'init-error', message: 'Corrupted data found, resetting application.', type: 'error'});
        }
      } else {
        setIsInitialSetup(true);
      }
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const saveDataToLocalStorage = useCallback(async (key: CryptoKey, salt: Uint8Array, dataToSave: Bookmark[]) => {
    try {
      const jsonData = JSON.stringify(dataToSave);
      const { iv, ciphertext } = await cryptoService.encryptData(key, jsonData);
      const encryptedPayload: EncryptedData = {
        salt: cryptoService.arrayBufferToBase64(salt),
        iv: cryptoService.arrayBufferToBase64(iv),
        ciphertext: cryptoService.arrayBufferToBase64(ciphertext),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(encryptedPayload));
    } catch (error) {
      console.error("Error saving data:", error);
      setPinError("Failed to save data. Check console for details.");
      setToast({id: 'save-error', message: 'Failed to save data securely.', type: 'error'});
      throw error;
    }
  }, []);

  const handlePinSubmit = useCallback(async (pin: string) => {
    setActionLoading(true);
    setPinError(null);

    try {
      if (isInitialSetup) {
        const newSalt = cryptoService.generateSalt();
        const key = await cryptoService.deriveKey(pin, newSalt);
        setDerivedKey(key);
        setStoredSalt(newSalt);
        const initialBookmarks: Bookmark[] = [];
        setBookmarks(initialBookmarks);
        await saveDataToLocalStorage(key, newSalt, initialBookmarks);
        setIsAuthenticated(true);
        setIsInitialSetup(false);
        setToast({id: 'init-success', message: 'Secure storage initialized!', type: 'success'});
      } else if (storedSalt) {
        const key = await cryptoService.deriveKey(pin, storedSalt);
        const encryptedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!encryptedDataString) throw new Error("Stored data not found for decryption.");
        
        const parsedData: EncryptedData = JSON.parse(encryptedDataString);
        const iv = cryptoService.base64ToArrayBuffer(parsedData.iv);
        const ciphertext = cryptoService.base64ToArrayBuffer(parsedData.ciphertext);
        
        const decryptedJson = await cryptoService.decryptData(key, new Uint8Array(iv), new Uint8Array(ciphertext));
        const loadedBookmarks: Bookmark[] = JSON.parse(decryptedJson);
        
        setDerivedKey(key);
        setBookmarks(loadedBookmarks);
        setIsAuthenticated(true);
      } else {
        throw new Error("Salt not available for PIN processing.");
      }
    } catch (error) {
      console.error("PIN processing error:", error);
      setPinError(isInitialSetup ? "Failed to initialize. Try a different PIN or check console." : "Invalid PIN or corrupted data. Check console.");
      setIsAuthenticated(false);
      setDerivedKey(null);
    } finally {
      setActionLoading(false);
    }
  }, [isInitialSetup, storedSalt, saveDataToLocalStorage]);

  const handleSaveBookmark = useCallback(async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'obfuscatedId' | 'lastVisited'> & { id?: string }) => {
    if (!derivedKey || !storedSalt) {
      setPinError("Encryption key not available. Please re-authenticate.");
      setIsAuthenticated(false);
      return;
    }
    setActionLoading(true);
    try {
      let updatedBookmarks;
      if (bookmarkData.id) { // Editing existing
        updatedBookmarks = bookmarks.map(bm => 
          bm.id === bookmarkData.id ? { ...bm, ...bookmarkData, id: bm.id, createdAt: bm.createdAt, lastVisited: bm.lastVisited } : bm
        );
      } else { // Adding new
        const newBookmark: Bookmark = {
          ...bookmarkData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          category: bookmarkData.category || BookmarkCategory.OTHER,
          tags: bookmarkData.tags || [],
        };
        updatedBookmarks = [...bookmarks, newBookmark];
      }
      setBookmarks(updatedBookmarks);
      await saveDataToLocalStorage(derivedKey, storedSalt, updatedBookmarks);
      setToast({id: 'save-bm-success', message: `Bookmark "${bookmarkData.name.substring(0,20)}..." saved.`, type: 'success'});
    } catch (error) {
       console.error("Failed to save bookmark:", error);
       // Error displayed by saveDataToLocalStorage
    } finally {
      setActionLoading(false);
    }
  }, [bookmarks, derivedKey, storedSalt, saveDataToLocalStorage]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string) => {
    if (!derivedKey || !storedSalt) {
      setPinError("Encryption key not available. Please re-authenticate.");
      setIsAuthenticated(false);
      return;
    }
    setActionLoading(true);
    try {
      const bookmarkToDelete = bookmarks.find(bm => bm.id === bookmarkId);
      const updatedBookmarks = bookmarks.filter(bm => bm.id !== bookmarkId);
      setBookmarks(updatedBookmarks);
      await saveDataToLocalStorage(derivedKey, storedSalt, updatedBookmarks);
      if (bookmarkToDelete) {
        setToast({id: 'delete-bm-success', message: `Bookmark "${bookmarkToDelete.name.substring(0,20)}..." deleted.`, type: 'info'});
      }
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    } finally {
      setActionLoading(false);
    }
  }, [bookmarks, derivedKey, storedSalt, saveDataToLocalStorage]);
  
  const handleBookmarkVisited = useCallback(async (bookmarkId: string) => {
    if (!derivedKey || !storedSalt) return; // Silently fail if not authenticated
    
    const updatedBookmarks = bookmarks.map(bm => 
        bm.id === bookmarkId ? { ...bm, lastVisited: new Date().toISOString() } : bm
    );
    setBookmarks(updatedBookmarks); // Optimistic update
    try {
        await saveDataToLocalStorage(derivedKey, storedSalt, updatedBookmarks);
    } catch (error) {
        console.error("Failed to update lastVisited status:", error);
        // Optionally revert or show error
    }
  }, [bookmarks, derivedKey, storedSalt, saveDataToLocalStorage]);

  const handleLock = () => {
    setIsAuthenticated(false);
    setDerivedKey(null);
    setBookmarks([]);
    setPinError(null);
    setToast(null); // Clear any active toasts
    // StoredSalt remains for next login.
  };

  const handleExportBookmarks = useCallback(async () => {
    if (!derivedKey || !storedSalt || bookmarks.length === 0) {
      setToast({id: 'export-fail', message: "No data to export or not authenticated.", type: 'error'});
      return;
    }
    setActionLoading(true);
    try {
      // Data to export is the current bookmarks array, salt, and a new IV for this specific export
      const jsonData = JSON.stringify(bookmarks);
      const { iv, ciphertext } = await cryptoService.encryptData(derivedKey, jsonData);
      
      const exportData: EncryptedFileFormat = {
        salt: cryptoService.arrayBufferToBase64(storedSalt), // Use the app's current salt
        iv: cryptoService.arrayBufferToBase64(iv),
        ciphertext: cryptoService.arrayBufferToBase64(ciphertext),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0,10);
      a.download = `securemark_bookmarks_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({id: 'export-success', message: "Bookmarks exported successfully!", type: 'success'});
    } catch (error) {
      console.error("Export failed:", error);
      setToast({id: 'export-error', message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error'});
    } finally {
      setActionLoading(false);
    }
  }, [derivedKey, storedSalt, bookmarks]);

  const handleImportBookmarks = useCallback(async (file: File) => {
    setActionLoading(true);
    setPinError(null);
    try {
      const fileContent = await file.text();
      const importedData: EncryptedFileFormat = JSON.parse(fileContent);

      if (!importedData.salt || !importedData.iv || !importedData.ciphertext) {
        throw new Error("Invalid import file format.");
      }
      
      // Prompt for PIN. For simplicity, re-using the main PIN input mechanism logic.
      // A dedicated modal for import PIN might be better UX.
      const pin = window.prompt("Enter the PIN used to encrypt this backup file:");
      if (!pin) {
        setToast({id: 'import-cancel', message: "Import cancelled.", type: 'info'});
        setActionLoading(false);
        return;
      }

      const importSalt = cryptoService.base64ToArrayBuffer(importedData.salt);
      const importKey = await cryptoService.deriveKey(pin, new Uint8Array(importSalt));
      
      const iv = cryptoService.base64ToArrayBuffer(importedData.iv);
      const ciphertext = cryptoService.base64ToArrayBuffer(importedData.ciphertext);
      
      const decryptedJson = await cryptoService.decryptData(importKey, new Uint8Array(iv), new Uint8Array(ciphertext));
      const loadedBookmarks: Bookmark[] = JSON.parse(decryptedJson);

      // Successfully decrypted. Now replace current data.
      setDerivedKey(importKey);
      setStoredSalt(new Uint8Array(importSalt));
      setBookmarks(loadedBookmarks);
      await saveDataToLocalStorage(importKey, new Uint8Array(importSalt), loadedBookmarks); // Save imported data as current
      
      setIsAuthenticated(true); // Ensure authenticated state
      setIsInitialSetup(false); // No longer initial setup
      setToast({id: 'import-success', message: `Successfully imported ${loadedBookmarks.length} bookmarks.`, type: 'success'});

    } catch (error) {
      console.error("Import failed:", error);
      setPinError(`Import failed: ${error instanceof Error ? error.message : 'Corrupted file or incorrect PIN.'}`);
      setToast({id: 'import-error', message: `Import failed: ${error instanceof Error ? error.message : 'Corrupted file or incorrect PIN.'}`, type: 'error'});
      // Don't change current auth state or data if import fails
    } finally {
      setActionLoading(false);
    }
  }, [saveDataToLocalStorage]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
        <SpinnerIcon className="w-12 h-12 text-sky-500 dark:text-sky-400" />
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <PinInput onSubmit={handlePinSubmit} isLoading={actionLoading} error={pinError} isInitialSetup={isInitialSetup} />
      ) : (
        <Dashboard 
          bookmarks={bookmarks} 
          onSaveBookmark={handleSaveBookmark} 
          onDeleteBookmark={handleDeleteBookmark}
          onVisitBookmark={handleBookmarkVisited}
          onLock={handleLock}
          isSaving={actionLoading}
          currentTheme={currentTheme}
          onToggleTheme={handleToggleTheme}
          onExportBookmarks={handleExportBookmarks}
          onImportBookmarks={handleImportBookmarks}
          quickAddUrl={quickAddUrl}
          onClearQuickAddUrl={() => setQuickAddUrl(null)}
        />
      )}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          actionButton={toast.actionButton}
          duration={toast.duration}
        />
      )}
    </>
  );
};

export default App;