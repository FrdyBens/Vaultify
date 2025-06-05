import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCategory, AiGeneratedInfo, AiCategorizationInfo, YouTubeVideoDetails } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import { generateBookmarkInfo, generateAiCategorization, isAiServiceAvailable } from '../services/aiService';
import { getFaviconUrl, getYouTubeThumbnailUrl, isDirectImageUrl, extractYouTubeVideoId, getYouTubeVideoDetails, isYouTubeUrl } from '../services/metadataService';

interface BookmarkFormProps {
  bookmarkToEdit?: Bookmark | null;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'obfuscatedId' | 'lastVisited'> & { id?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
  initialUrlFromClipboard?: string;
  youtubeApiKey?: string; // Pass API key from App.tsx
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({ bookmarkToEdit, onSave, onCancel, isSaving, initialUrlFromClipboard, youtubeApiKey }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>(BookmarkCategory.OTHER);
  const [tagsString, setTagsString] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [notes, setNotes] = useState('');

  // AI Categorization fields
  const [primaryCategoryAI, setPrimaryCategoryAI] = useState('');
  const [secondaryCategoryAI, setSecondaryCategoryAI] = useState('');
  const [subcategoriesAIString, setSubcategoriesAIString] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false); // For the main "Generate" button
  const [isRegeneratingInfo, setIsRegeneratingInfo] = useState(false); // For Name, Desc, Tags
  const [isRegeneratingCategories, setIsRegeneratingCategories] = useState(false); // For AI Categories
  const [aiError, setAiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback((urlToSet?: string) => {
    const defaultUrl = urlToSet || initialUrlFromClipboard || '';
    setName('');
    setUrl(defaultUrl);
    setDescription('');
    setCategory(BookmarkCategory.OTHER);
    setTagsString('');
    setIconUrl('');
    setThumbnailUrl('');
    setNotes('');
    setPrimaryCategoryAI('');
    setSecondaryCategoryAI('');
    setSubcategoriesAIString('');
    setAiError(null);
    setFormError(null);
    if (defaultUrl) {
        handleUrlChange(defaultUrl, true); // Pass true to indicate it's an initial fill
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
      setNotes(bookmarkToEdit.notes || '');
      setPrimaryCategoryAI(bookmarkToEdit.primaryCategoryAI || '');
      setSecondaryCategoryAI(bookmarkToEdit.secondaryCategoryAI || '');
      setSubcategoriesAIString(bookmarkToEdit.subcategoriesAI?.join(', ') || '');
    } else {
      resetForm();
    }
  }, [bookmarkToEdit, resetForm]);

  // Debounced URL handler or direct handler
  const handleUrlChange = async (newUrl: string, isInitialFill = false) => {
    setUrl(newUrl);
    setFormError(null);
    setIconUrl(''); // Clear old icon/thumbnail immediately
    setThumbnailUrl('');

    if (!newUrl) return;

    try {
      new URL(newUrl); // Validate URL format
      
      const fetchedFavicon = getFaviconUrl(newUrl);
      const directImage = isDirectImageUrl(newUrl) ? newUrl : null;

      if (directImage) {
        setThumbnailUrl(directImage);
      } else {
         const ytThumbnail = getYouTubeThumbnailUrl(newUrl); // Try YT thumb first
         if (ytThumbnail) setThumbnailUrl(ytThumbnail);
      }
      
      if (fetchedFavicon && !thumbnailUrl) { // Only set favicon if no thumbnail already set
        setIconUrl(fetchedFavicon);
      }
      
      // If it's a YouTube URL and API key is available, fetch details
      if (isYouTubeUrl(newUrl) && youtubeApiKey && isInitialFill) { // Only on initial fill or explicit action to avoid too many API calls
        const videoId = extractYouTubeVideoId(newUrl);
        if (videoId) {
          setIsAiLoading(true); // Use AI loading spinner for this
          setAiError(null);
          try {
            const ytDetails = await getYouTubeVideoDetails(videoId, youtubeApiKey);
            if (ytDetails) {
              setName(prev => prev || ytDetails.title);
              setDescription(prev => prev || ytDetails.description.substring(0, 200) + (ytDetails.description.length > 200 ? '...' : '')); // Limit description length
              setTagsString(prev => prev || ytDetails.tags.slice(0, 5).join(', ')); // Limit tags
              if (ytDetails.thumbnailUrl) setThumbnailUrl(ytDetails.thumbnailUrl); // Prefer API thumbnail
            }
          } catch (error) {
            console.error("YouTube API fetch failed:", error);
            setAiError(error instanceof Error ? error.message : "Failed to fetch YouTube video details.");
          } finally {
            setIsAiLoading(false);
          }
        }
      }
    } catch (_) {
      // Invalid URL format
    }
  };

  const handleRegenerateTitleDescriptionTags = async () => {
    if (!url || !isAiServiceAvailable()) {
      setAiError("URL is required and AI service must be available.");
      return;
    }
    setIsRegeneratingInfo(true);
    setAiError(null);
    try {
      const genInfo: AiGeneratedInfo = await generateBookmarkInfo(url);
      setName(genInfo.title || ''); // Reset to new value or empty
      setDescription(genInfo.description || '');
      setTagsString(genInfo.tags?.join(', ') || '');
    } catch (error) {
      console.error("AI info re-generation failed:", error);
      setAiError(error instanceof Error ? error.message : "AI info re-generation failed.");
    } finally {
      setIsRegeneratingInfo(false);
    }
  };

  const handleRegenerateCategories = async () => {
    if (!url || !name || !isAiServiceAvailable()) { // Name and URL are important inputs for categorization
      setAiError("URL and Name are required for category re-generation, and AI service must be available.");
      return;
    }
    setIsRegeneratingCategories(true);
    setAiError(null);
    try {
      const currentTags = tagsString.split(',').map(t => t.trim()).filter(t => t);
      const catInfo: AiCategorizationInfo = await generateAiCategorization(name, description, currentTags, url);
      setPrimaryCategoryAI(catInfo.primaryCategoryAI || ''); // Reset to new value or empty
      setSecondaryCategoryAI(catInfo.secondaryCategoryAI || '');
      setSubcategoriesAIString(catInfo.subcategoriesAI?.join(', ') || '');
    } catch (error) {
      console.error("AI category re-generation failed:", error);
      setAiError(error instanceof Error ? error.message : "AI category re-generation failed.");
    } finally {
      setIsRegeneratingCategories(false);
    }
  };

  const handleGenerateWithAi = async () => {
    if (!url) {
      setAiError("Please enter a URL first.");
      return;
    }
    try {
      new URL(url);
    } catch (_) {
      setAiError("Invalid URL format. Cannot generate info.");
      return;
    }

    setIsAiLoading(true); // This is for the main button that does both
    setAiError(null);
    let infoGenerated = false;
    try {
        // Prioritize YouTube API if applicable for initial fetch
        if (isYouTubeUrl(url) && youtubeApiKey) {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                const ytDetails = await getYouTubeVideoDetails(videoId, youtubeApiKey);
                if (ytDetails) {
                    setName(ytDetails.title || name);
                    setDescription(ytDetails.description || description);
                    setTagsString(ytDetails.tags?.join(', ') || tagsString);
                    if(ytDetails.thumbnailUrl) setThumbnailUrl(ytDetails.thumbnailUrl);
                    infoGenerated = true;
                }
            }
        }

        // Fallback or for non-YouTube URLs, use general AI for info
        if (!infoGenerated) {
            const genInfo: AiGeneratedInfo = await generateBookmarkInfo(url);
            setName(genInfo.title || name); // If name is already set, user might prefer it. Let's fill if empty.
            setDescription(genInfo.description || description);
            setTagsString(genInfo.tags?.join(', ') || tagsString);
        }

        // After generating title/desc/tags, attempt categorization
        const currentTagsValue = tagsString.split(',').map(t => t.trim()).filter(t => t); // Use current state value
        const currentNameValue = name; // Use current state value
        const currentDescriptionValue = description; // Use current state value

        const catInfo: AiCategorizationInfo = await generateAiCategorization(currentNameValue, currentDescriptionValue, currentTagsValue, url);
        setPrimaryCategoryAI(catInfo.primaryCategoryAI);
        setSecondaryCategoryAI(catInfo.secondaryCategoryAI || '');
        setSubcategoriesAIString(catInfo.subcategoriesAI.join(', '));

    } catch (error) {
      console.error("AI processing failed:", error);
      setAiError(error instanceof Error ? error.message : "AI processing failed.");
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
      new URL(url);
    } catch (_) {
      setFormError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }
    
    const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
    const subcategoriesAI = subcategoriesAIString.split(',').map(t => t.trim()).filter(t => t);
    
    onSave({
      ...(bookmarkToEdit && { id: bookmarkToEdit.id }),
      name,
      url,
      description,
      category,
      tags,
      iconUrl: thumbnailUrl ? '' : iconUrl,
      thumbnailUrl,
      primaryCategoryAI: primaryCategoryAI || undefined, // Ensure empty strings become undefined
      secondaryCategoryAI: secondaryCategoryAI || undefined,
      subcategoriesAI: subcategoriesAI.length > 0 ? subcategoriesAI : undefined,
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
              title="Generate Info & Categories with AI"
              className="p-2.5 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white rounded-md disabled:opacity-50 flex items-center justify-center"
            >
              {isAiLoading ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
        {aiError && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{aiError}</p>}
      </div>

      {/* Name Field */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="name" className={labelClass}>Name</label>
          {isAiServiceAvailable() && url && (
            <button type="button" onClick={handleRegenerateTitleDescriptionTags} disabled={isRegeneratingInfo || isAiLoading || isSaving || !url} title="Re-generate Name, Description, and Tags with AI" className="text-xs text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-50 flex items-center">
              {isRegeneratingInfo ? <SpinnerIcon className="w-3.5 h-3.5 mr-1" /> : <SparklesIcon className="w-3.5 h-3.5 mr-1" />}
              Re-gen Info
            </button>
          )}
        </div>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Awesome Site"/>
      </div>
      
      {/* Description Field */}
      <div>
        <label htmlFor="description" className={labelClass}>Description (Optional)</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="A brief description of the bookmark..."></textarea>
      </div>

      {/* Tags Field */}
      <div>
        <label htmlFor="tags" className={labelClass}>Tags (comma-separated)</label>
        <input type="text" id="tags" value={tagsString} onChange={(e) => setTagsString(e.target.value)} className={inputClass} placeholder="tech, news, cool stuff"/>
      </div>

      {/* Notes Field - No AI for this one */}
      <div>
        <label htmlFor="notes" className={labelClass}>Notes (Optional)</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputClass} placeholder="Add any personal notes for this bookmark..."></textarea>
      </div>

      {/* User Category Field */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4"> {/* Changed to 1 col as tags is separate now */}
        <div>
            <label htmlFor="category" className={labelClass}>Your Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as BookmarkCategory)} className={inputClass}>
            {Object.values(BookmarkCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
            </select>
        </div>
      </div>
      
      {(iconUrl || thumbnailUrl) && (
        <div className="mt-2">
            <p className={labelClass}>Preview:</p>
            <div className="flex items-center space-x-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
            {(thumbnailUrl || iconUrl) && <img src={thumbnailUrl || iconUrl} alt="Preview" className="w-10 h-10 object-cover rounded"/>}
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{name || url}</span>
            </div>
        </div>
      )}

      {/* AI Categorization Fields Display/Edit */}
      <div className="p-3 border border-dashed border-sky-300 dark:border-sky-700 rounded-md space-y-3 bg-sky-50 dark:bg-sky-900/30">
        <div className="flex justify-between items-center">
          <p className={`${labelClass} text-sky-600 dark:text-sky-400`}>AI Suggested Categories (Editable)</p>
          {isAiServiceAvailable() && url && name && ( // Name is also an input for category generation
            <button type="button" onClick={handleRegenerateCategories} disabled={isRegeneratingCategories || isAiLoading || isSaving || !url || !name} title="Re-generate AI Categories" className="text-xs text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-50 flex items-center">
              {isRegeneratingCategories ? <SpinnerIcon className="w-3.5 h-3.5 mr-1" /> : <SparklesIcon className="w-3.5 h-3.5 mr-1" />}
              Re-gen Categories
            </button>
          )}
        </div>
        {!isAiServiceAvailable() && <p className="text-xs text-slate-500 dark:text-slate-400">AI features disabled. Add Gemini API Key in settings.</p>}

        <div>
            <label htmlFor="primaryCategoryAI" className={`${labelClass} text-xs`}>Primary AI Category</label>
            <input type="text" id="primaryCategoryAI" value={primaryCategoryAI} onChange={(e) => setPrimaryCategoryAI(e.target.value)} className={`${inputClass} text-sm`} placeholder="e.g., Technology"/>
        </div>
        <div>
            <label htmlFor="secondaryCategoryAI" className={`${labelClass} text-xs`}>Secondary AI Category</label>
            <input type="text" id="secondaryCategoryAI" value={secondaryCategoryAI} onChange={(e) => setSecondaryCategoryAI(e.target.value)} className={`${inputClass} text-sm`} placeholder="e.g., Software"/>
        </div>
        <div>
            <label htmlFor="subcategoriesAI" className={`${labelClass} text-xs`}>AI Subcategories (comma-separated)</label>
            <input type="text" id="subcategoriesAI" value={subcategoriesAIString} onChange={(e) => setSubcategoriesAIString(e.target.value)} className={`${inputClass} text-sm`} placeholder="e.g., web, frontend, react"/>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-6">
        <button type="button" onClick={onCancel} disabled={isSaving || isAiLoading || isRegeneratingInfo || isRegeneratingCategories} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSaving || isAiLoading || isRegeneratingInfo || isRegeneratingCategories} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors disabled:opacity-50 flex items-center">
          {(isSaving || isAiLoading || isRegeneratingInfo || isRegeneratingCategories) && <SpinnerIcon className="w-4 h-4 mr-2" />}
          {isSaving ? 'Saving...' : (bookmarkToEdit ? 'Update Bookmark' : 'Add Bookmark')}
        </button>
      </div>
    </form>
  );
};

export default BookmarkForm;
