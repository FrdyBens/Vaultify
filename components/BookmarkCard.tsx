import React from 'react';
import { Bookmark, UiTheme } from '../types';
import { CATEGORY_COLORS } from '../constants';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import { encodeNumber } from '../services/obfuscationService';
import LockIcon from './icons/LockIcon'; // Placeholder

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onVisit: (bookmarkId: string) => void;
  numericId?: number;
  uiTheme: UiTheme;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit, onDelete, onVisit, numericId, uiTheme }) => {
  const categoryColor = CATEGORY_COLORS[bookmark.category] || 'bg-slate-500 dark:bg-slate-600';
  const obfuscatedDisplayId = typeof numericId === 'number' ? encodeNumber(numericId) : bookmark.id.substring(0, 6);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onVisit(bookmark.id);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const displayImageUrl = bookmark.thumbnailUrl || bookmark.iconUrl;

  // Visual Theme Card
  if (uiTheme === 'visual') {
    return (
      <div className="bookmark-card-visual group"> {/* Added group for hover effects on children */}
        {/* Thumbnail Area */}
        {(bookmark.thumbnailUrl || bookmark.iconUrl) && (
          <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="visual-thumbnail-area block">
            <img src={bookmark.thumbnailUrl || bookmark.iconUrl} alt={`${bookmark.name} preview`} className="w-full h-full object-cover" />
            {/* Show favicon on top of thumbnail if thumbnail exists and favicon also exists */}
            {bookmark.thumbnailUrl && bookmark.iconUrl && (
                <div className="visual-favicon-overlay">
                    <img src={bookmark.iconUrl} alt="" />
                </div>
            )}
          </a>
        )}
         {/* Placeholder if no image */}
        {!(bookmark.thumbnailUrl || bookmark.iconUrl) && (
             <div className="visual-thumbnail-area bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <LockIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 opacity-50" />
            </div>
        )}


        <div className="visual-content-area">
          <h3 className="visual-title">
            <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" title={bookmark.url}>
              {bookmark.name}
            </a>
          </h3>
          <p className="visual-url">
             <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer">
                {bookmark.url}
             </a>
          </p>

          {bookmark.description && (
            <p className="visual-description">{bookmark.description}</p>
          )}
          {!bookmark.description && <div className="flex-grow"></div>}

          {/* AI Categories */}
          {(bookmark.primaryCategoryAI || bookmark.secondaryCategoryAI || (bookmark.subcategoriesAI && bookmark.subcategoriesAI.length > 0)) && (
            <div className="visual-ai-categories">
              {bookmark.primaryCategoryAI && <p><span className="ai-category-label">AI Primary:</span> <span className="ai-category-value">{bookmark.primaryCategoryAI}</span></p>}
              {bookmark.secondaryCategoryAI && <p><span className="ai-category-label">AI Secondary:</span> <span className="ai-category-value">{bookmark.secondaryCategoryAI}</span></p>}
              {bookmark.subcategoriesAI && bookmark.subcategoriesAI.length > 0 && (
                <p><span className="ai-category-label">AI Sub:</span> <span className="ai-category-value">{bookmark.subcategoriesAI.join(', ')}</span></p>
              )}
            </div>
          )}


          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="visual-tags mt-2 mb-1">
              {bookmark.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {bookmark.tags.length > 3 && <span className="tag">+{bookmark.tags.length - 3} more</span>}
            </div>
          )}
          
          <div className="visual-footer">
            <div className="text-xs text-slate-400 dark:text-slate-500">
                <span>Added: {new Date(bookmark.createdAt).toLocaleDateString()}</span>
                {bookmark.lastVisited && <span className="ml-2">Visited: {new Date(bookmark.lastVisited).toLocaleDateString()}</span>}
            </div>
            <div className="visual-actions">
              <button onClick={() => onEdit(bookmark)} title="Edit"><PencilIcon className="w-5 h-5" /></button>
              <button onClick={() => onDelete(bookmark.id)} title="Delete"><TrashIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Current (Original) Theme Card
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-sky-500/20 dark:hover:shadow-sky-400/20 hover:ring-1 hover:ring-sky-500 dark:hover:ring-sky-600 flex flex-col bookmark-card-current">
      <div className={`h-1.5 ${categoryColor}`}></div>
      
      {bookmark.thumbnailUrl && (
        <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="block overflow-hidden h-40">
          <img src={bookmark.thumbnailUrl} alt={`${bookmark.name} thumbnail`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
        </a>
      )}

      <div className="p-4 sm:p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg sm:text-xl font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 flex-grow mr-2">
            <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" title={bookmark.url} className="flex items-start">
              {!bookmark.thumbnailUrl && bookmark.iconUrl && (
                <img src={bookmark.iconUrl} alt="" className="w-5 h-5 mr-2 mt-0.5 rounded-sm object-contain flex-shrink-0" />
              )}
              {!bookmark.thumbnailUrl && !bookmark.iconUrl && (
                 <span className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500"><LockIcon className="w-full h-full opacity-50"/></span>
              )}
              <span className="break-words">{bookmark.name}</span>
            </a>
          </h3>
          <span className={`px-2 py-0.5 text-xs font-semibold ${categoryColor} text-white rounded-full whitespace-nowrap self-start`}>
            {bookmark.category} {/* User Category */}
          </span>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-all mb-1">
          <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {bookmark.url.length > 60 ? `${bookmark.url.substring(0, 60)}...` : bookmark.url}
          </a>
        </p>

        {bookmark.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-1 flex-grow min-h-[2.5rem] max-h-20 overflow-y-auto pr-1 custom-scrollbar">
            {bookmark.description}
          </p>
        )}
        {!bookmark.description && <div className="flex-grow"></div>}

        {/* AI Categories Display */}
        {(bookmark.primaryCategoryAI || bookmark.secondaryCategoryAI || (bookmark.subcategoriesAI && bookmark.subcategoriesAI.length > 0)) && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                {bookmark.primaryCategoryAI && <p><strong>AI Primary:</strong> {bookmark.primaryCategoryAI}</p>}
                {bookmark.secondaryCategoryAI && <p><strong>AI Secondary:</strong> {bookmark.secondaryCategoryAI}</p>}
                {bookmark.subcategoriesAI && bookmark.subcategoriesAI.length > 0 && <p><strong>AI Sub:</strong> {bookmark.subcategoriesAI.join(', ')}</p>}
            </div>
        )}

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="mt-2 mb-3">
            {bookmark.tags.slice(0, 5).map(tag => (
              <span key={tag} className="inline-block bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium mr-1.5 mb-1.5 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
            <span>ID: {obfuscatedDisplayId}</span>
            <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
          </div>
          {bookmark.lastVisited && (
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Visited: {new Date(bookmark.lastVisited).toLocaleDateString()}</p>
          )}
          <div className="flex space-x-1 justify-end mt-2">
            <button
              onClick={() => onEdit(bookmark)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit bookmark"
            >
              <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => onDelete(bookmark.id)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Delete bookmark"
            >
              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569; /* slate-600 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-400 */
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b; /* slate-500 */
        }
      `}
      </style>
    </div>
  );
};

export default BookmarkCard;
