import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bookmark, BookmarkCategory, SortOption, UiTheme } from '../types';
import BookmarkCard from './BookmarkCard';
import BookmarkForm from './BookmarkForm';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import LockIcon from './icons/LockIcon';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import CogIcon from './icons/CogIcon'; // For Settings
import SettingsModal from './SettingsModal'; // Import SettingsModal
import { APP_TITLE, UI_THEME_STORAGE_KEY, YOUTUBE_API_KEY_STORAGE_KEY } from '../constants';

interface DashboardProps {
  bookmarks: Bookmark[];
  onSaveBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'obfuscatedId' | 'lastVisited'> & { id?: string }, isQuickAdd?: boolean) => Promise<void>;
  onDeleteBookmark: (bookmarkId: string) => Promise<void>;
  onVisitBookmark: (bookmarkId: string) => void;
  onLock: () => void;
  isSaving: boolean;
  currentTheme: 'light' | 'dark'; // For dark/light mode
  onToggleTheme: () => void; // For dark/light mode
  onExportBookmarks: () => void;
  onImportBookmarks: (file: File) => void;
  quickAddUrl?: string | null;
  onClearQuickAddUrl?: () => void;

  // New props for UI theme and API key management
  uiTheme: UiTheme;
  onSetUiTheme: (theme: UiTheme) => void;
  youtubeApiKey: string;
  onSetYoutubeApiKey: (key: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  bookmarks, onSaveBookmark, onDeleteBookmark, onVisitBookmark, onLock, isSaving,
  currentTheme, onToggleTheme, onExportBookmarks, onImportBookmarks,
  quickAddUrl, onClearQuickAddUrl,
  uiTheme, onSetUiTheme, youtubeApiKey, onSetYoutubeApiKey
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for settings modal
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<BookmarkCategory | 'ALL'>('ALL');
  const [filterTag, setFilterTag] = useState<string | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const [initialUrlForForm, setInitialUrlForForm] = useState<string | undefined>(undefined);

  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickAddUrl) {
        if (!isModalOpen) {
            setInitialUrlForForm(quickAddUrl);
            handleAddBookmark(quickAddUrl);
            if(onClearQuickAddUrl) onClearQuickAddUrl();
        }
    }
  }, [quickAddUrl, isModalOpen, onClearQuickAddUrl]);


  const handleAddBookmark = (url?: string) => {
    setEditingBookmark(null);
    setInitialUrlForForm(url || undefined);
    setIsModalOpen(true);
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setInitialUrlForForm(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (window.confirm("Are you sure you want to delete this bookmark? This action cannot be undone.")) {
      await onDeleteBookmark(bookmarkId);
    }
  };

  const handleSave = async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'obfuscatedId' | 'lastVisited'> & { id?: string }) => {
    await onSaveBookmark(bookmarkData);
    setIsModalOpen(false);
    setEditingBookmark(null);
    setInitialUrlForForm(undefined);
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportBookmarks(file);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };
  
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    bookmarks.forEach(bm => bm.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [bookmarks]);

  const filteredAndSortedBookmarks = useMemo(() => {
    let processedBookmarks = [...bookmarks];
    processedBookmarks = processedBookmarks.filter(bm => {
      const categoryMatch = filterCategory === 'ALL' || bm.category === filterCategory;
      const tagMatch = filterTag === 'ALL' || (bm.tags && bm.tags.includes(filterTag));
      const searchParts = searchTerm.toLowerCase().split(" ").filter(p => p.length > 0);
      const searchMatch = searchParts.every(part => 
        bm.name.toLowerCase().includes(part) ||
        bm.url.toLowerCase().includes(part) ||
        bm.description.toLowerCase().includes(part) ||
        (bm.tags && bm.tags.some(tag => tag.toLowerCase().includes(part))) ||
        (bm.primaryCategoryAI && bm.primaryCategoryAI.toLowerCase().includes(part)) ||
        (bm.secondaryCategoryAI && bm.secondaryCategoryAI.toLowerCase().includes(part)) ||
        (bm.subcategoriesAI && bm.subcategoriesAI.some(sc => sc.toLowerCase().includes(part)))
      );
      return categoryMatch && tagMatch && searchMatch;
    });

    processedBookmarks.sort((a, b) => {
      switch (sortOption) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'lastVisited_asc':
          if (!a.lastVisited) return 1; if (!b.lastVisited) return -1;
          return new Date(a.lastVisited).getTime() - new Date(b.lastVisited).getTime();
        case 'lastVisited_desc':
          if (!a.lastVisited) return 1; if (!b.lastVisited) return -1;
          return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime();
        case 'createdAt_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'createdAt_desc': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return processedBookmarks;
  }, [bookmarks, searchTerm, filterCategory, filterTag, sortOption]);

  const inputClass = "w-full md:w-auto px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:outline-none transition-shadow appearance-none";
  const iconButtonClass = "p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors";
  const selectArrowSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;
  const darkSelectArrowSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;

  const dashboardGridClass = uiTheme === 'visual' ? 'dashboard-grid theme-visual' : 'dashboard-grid theme-current';

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-6 lg:p-8 transition-colors duration-300 ${uiTheme === 'visual' ? 'theme-visual' : 'theme-current'}`}>
      <header className="mb-6 sm:mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">{APP_TITLE}</h1>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button onClick={onToggleTheme} className={iconButtonClass} title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}>
                    {currentTheme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
                 <button onClick={() => setIsSettingsModalOpen(true)} className={iconButtonClass} title="Settings">
                    <CogIcon className="w-5 h-5" />
                </button>
                <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".json" style={{ display: 'none' }} />
                <button onClick={handleImportClick} className={iconButtonClass} title="Import Bookmarks"> <UploadIcon className="w-5 h-5" /> </button>
                <button onClick={onExportBookmarks} className={iconButtonClass} title="Export Bookmarks"> <DownloadIcon className="w-5 h-5" /> </button>
                <button
                    onClick={() => handleAddBookmark()}
                    className="bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center text-sm sm:text-base"
                >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Add
                </button>
                <button
                    onClick={onLock}
                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center text-sm sm:text-base"
                    title="Lock Application"
                >
                    <LockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Lock
                </button>
            </div>
        </div>
      </header>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
            <div className="relative flex-grow w-full lg:col-span-2">
            <input 
                type="text"
                placeholder="Search name, URL, description, tags, AI categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} w-full pl-10`}
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as BookmarkCategory | 'ALL')}
            className={inputClass}
            style={{ backgroundImage: currentTheme === 'dark' ? darkSelectArrowSvg : selectArrowSvg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '1.25em 1.25em' }}
            >
            <option value="ALL">All User Categories</option>
            {Object.values(BookmarkCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
            </select>
             <select 
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as string | 'ALL')}
              className={inputClass}
              disabled={allTags.length === 0}
              style={{ backgroundImage: currentTheme === 'dark' ? darkSelectArrowSvg : selectArrowSvg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '1.25em 1.25em' }}
            >
              <option value="ALL">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
        </div>
        <div className="mt-3 sm:mt-4">
            <label htmlFor="sortOption" className="block text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Sort by:</label>
            <select 
                id="sortOption"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className={`${inputClass} w-full sm:w-auto`}
                style={{ backgroundImage: currentTheme === 'dark' ? darkSelectArrowSvg : selectArrowSvg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '1.25em 1.25em' }}
            >
                <option value="createdAt_desc">Date Added (Newest First)</option>
                <option value="createdAt_asc">Date Added (Oldest First)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="lastVisited_desc">Last Visited (Newest First)</option>
                <option value="lastVisited_asc">Last Visited (Oldest First)</option>
            </select>
        </div>
      </div>

      {filteredAndSortedBookmarks.length > 0 ? (
        <div className={dashboardGridClass}>
          {filteredAndSortedBookmarks.map((bm) => (
            <BookmarkCard 
              key={bm.id} 
              bookmark={bm} 
              onEdit={handleEditBookmark} 
              onDelete={handleDeleteBookmark}
              onVisit={onVisitBookmark}
              numericId={bookmarks.findIndex(b => b.id === bm.id) + 1}
              uiTheme={uiTheme} // Pass current UI theme
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-16">
          <MagnifyingGlassIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-xl text-slate-500 dark:text-slate-400">
            {bookmarks.length === 0 ? "No bookmarks yet. Add your first one!" : "No bookmarks match your search or filters."}
          </p>
          {bookmarks.length > 0 && (
            <button 
                onClick={() => { setSearchTerm(''); setFilterCategory('ALL'); setFilterTag('ALL');}}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500"
            >
                Clear Search & Filters
            </button>
          )}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingBookmark(null); setInitialUrlForForm(undefined); }} 
        title={editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
      >
        <BookmarkForm
          bookmarkToEdit={editingBookmark}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingBookmark(null); setInitialUrlForForm(undefined); }}
          isSaving={isSaving}
          initialUrlFromClipboard={initialUrlForForm}
          youtubeApiKey={youtubeApiKey} // Pass YouTube API Key
        />
      </Modal>
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUiTheme={uiTheme}
        onSetUiTheme={onSetUiTheme}
        youtubeApiKey={youtubeApiKey}
        onSetYoutubeApiKey={onSetYoutubeApiKey}
      />
    </div>
  );
};

export default Dashboard;
