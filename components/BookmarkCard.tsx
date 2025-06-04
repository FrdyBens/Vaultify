
import React from 'react';
import { Bookmark } from '../types';
import { CATEGORY_COLORS } from '../constants';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import { encodeNumber } from '../services/obfuscationService';
import LockIcon from './icons/LockIcon'; // A generic icon for placeholder

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onVisit: (bookmarkId: string) => void; // For updating lastVisited
  numericId?: number;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit, onDelete, onVisit, numericId }) => {
  const categoryColor = CATEGORY_COLORS[bookmark.category] || 'bg-slate-500 dark:bg-slate-600';
  const obfuscatedDisplayId = typeof numericId === 'number' ? encodeNumber(numericId) : bookmark.id.substring(0, 6);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onVisit(bookmark.id); // Update lastVisited timestamp
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const displayImageUrl = bookmark.thumbnailUrl || bookmark.iconUrl;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-sky-500/20 dark:hover:shadow-sky-400/20 hover:ring-1 hover:ring-sky-500 dark:hover:ring-sky-600 flex flex-col">
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
            {bookmark.category}
          </span>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-all mb-1">
          <a href={bookmark.url} onClick={handleLinkClick} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {bookmark.url.length > 60 ? `${bookmark.url.substring(0, 60)}...` : bookmark.url}
          </a>
        </p>

        {bookmark.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-3 flex-grow min-h-[2.5rem] max-h-20 overflow-y-auto pr-1 custom-scrollbar">
            {bookmark.description}
          </p>
        )}
        {!bookmark.description && <div className="flex-grow"></div>}


        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="mt-2 mb-3">
            {bookmark.tags.slice(0, 5).map(tag => ( // Show up to 5 tags
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
