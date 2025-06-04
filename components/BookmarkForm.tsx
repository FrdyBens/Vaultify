import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCategory, AiGeneratedInfo } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import { generateBookmarkInfo, isAiServiceAvailable } from '../services/aiService';
import { getFaviconUrl, getYouTubeThumbnailUrl, isDirectImageUrl } from '../services/metadataService';

interface BookmarkFormProps {
  bookmarkToEdit?: Bookmark | null;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'obfuscatedId' | 'lastVisited'> & { id?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
  initialUrlFromClipboard?: string;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({ bookmarkToEdit, onSave, onCancel, isSaving, initialUrlFromClipboard }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>(BookmarkCategory.OTHER);
  const [tagsString, setTagsString] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setUrl(initialUrlFromClipboard || '');
    setDescription('');
    setCategory(BookmarkCategory.OTHER);
    setTagsString('');
    setIconUrl('');
    setThumbnailUrl('');
    setAiError(null);
    setFormError(null);
    if (initialUrlFromClipboard) {
        handleUrlChange(initialUrlFromClipboard);
    }
  }, [initialUrlFromClipboard]);
  
  useEffect(() => {
    if (bookmarkToEdit) {
      setName(bookmarkToEdit.name);
      setUrl(bookmarkToEdit.url);
      setDescription(bookmarkToEdit.description);
      setCategory(bookmarkToEdit.category);
      setTagsString(bookmarkToEdit.tags?.join(', ') || '');
      setIconUrl(bookmarkToEdit.iconUrl || '');
      setThumbnailUrl(bookmarkToEdit.thumbnailUrl || '');
    } else {
      resetForm();
    }
  }, [bookmarkToEdit, resetForm]);

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);
    setFormError(null); // Clear previous URL errors
    if (newUrl) {
      try {
        new URL(newUrl); // Validate URL format
        const fetchedFavicon = getFaviconUrl(newUrl);
        const ytThumbnail = getYouTubeThumbnailUrl(newUrl);
        const directImage = isDirectImageUrl(newUrl) ? newUrl : null;

        if (ytThumbnail) setThumbnailUrl(ytThumbnail);
        else if (directImage) setThumbnailUrl(directImage);
        else setThumbnailUrl(''); // Clear if not YT or direct image
        
        if (fetchedFavicon && !ytThumbnail && !directImage) setIconUrl(fetchedFavicon); // Prioritize thumbnail, then icon
        else if (!ytThumbnail && !directImage) setIconUrl(''); // Clear if YT/direct image set or no favicon

      } catch (_) {
        // URL is invalid, don't try to fetch metadata
        setIconUrl('');
        setThumbnailUrl('');
      }
    } else {
      setIconUrl('');
      setThumbnailUrl('');
    }
  };

  const handleGenerateWithAi = async () => {
    if (!url) {
      setAiError("Please enter a URL first.");
      return;
    }
    try {
      new URL(url); // Validate URL before sending to AI
    } catch (_) {
      setAiError("Invalid URL format. Cannot generate info.");
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    try {
      const info: AiGeneratedInfo = await generateBookmarkInfo(url);
      setName(info.title || name);
      setDescription(info.description || description);
      setTagsString(info.tags?.join(', ') || tagsString);
    } catch (error) {
      console.error("AI generation failed:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate info.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name || !url) {
      setFormError("Name and URL are required.");
      return;
    }
    try {
      new URL(url); // Final URL validation
    } catch (_) {
      setFormError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }
    
    const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
    
    onSave({
      ...(bookmarkToEdit && { id: bookmarkToEdit.id }),
      name,
      url,
      description,
      category,
      tags,
      iconUrl: thumbnailUrl ? '' : iconUrl, // If thumbnail exists, iconUrl is redundant for card display logic
      thumbnailUrl,
    });
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 sm:text-sm text-slate-900 dark:text-slate-100";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-center">{formError}</p>}
      
      <div>
        <label htmlFor="url" className={labelClass}>URL</label>
        <div className="flex items-center space-x-2">
          <input type="url" id="url" value={url} onChange={(e) => handleUrlChange(e.target.value)} required className={`${inputClass} flex-grow`} placeholder="https://example.com"/>
          {isAiServiceAvailable() && (
            <button 
              type="button" 
              onClick={handleGenerateWithAi} 
              disabled={isAiLoading || !url || isSaving}
              title="Generate info with AI"
              className="p-2.5 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-md disabled:opacity-50 flex items-center justify-center"
            >
              {isAiLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
        {aiError && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{aiError}</p>}
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Awesome Site"/>
      </div>
      
      <div>
        <label htmlFor="description" className={labelClass}>Description (Optional)</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="A brief description of the bookmark..."></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as BookmarkCategory)} className={inputClass}>
            {Object.values(BookmarkCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
            </select>
        </div>
        <div>
            <label htmlFor="tags" className={labelClass}>Tags (comma-separated)</label>
            <input type="text" id="tags" value={tagsString} onChange={(e) => setTagsString(e.target.value)} className={inputClass} placeholder="tech, news, cool stuff"/>
        </div>
      </div>
      
      {(iconUrl || thumbnailUrl) && (
        <div className="mt-2">
            <p className={labelClass}>Preview:</p>
            <div className="flex items-center space-x-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
            {(thumbnailUrl || iconUrl) && <img src={thumbnailUrl || iconUrl} alt="Preview" className="w-10 h-10 object-cover rounded"/>}
            <span className="text-sm text-slate-600 dark:text-slate-300">{name || url}</span>
            </div>
        </div>
      )}


      <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-6">
        <button type="button" onClick={onCancel} disabled={isSaving || isAiLoading} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSaving || isAiLoading} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors disabled:opacity-50 flex items-center">
          {isSaving && <SpinnerIcon className="w-4 h-4 mr-2" />}
          {isSaving ? 'Saving...' : (bookmarkToEdit ? 'Update Bookmark' : 'Add Bookmark')}
        </button>
      </div>
    </form>
  );
};

export default BookmarkForm;