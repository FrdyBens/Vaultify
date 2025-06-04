import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UiTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUiTheme: UiTheme;
  onSetUiTheme: (theme: UiTheme) => void;
  youtubeApiKey: string;
  onSetYoutubeApiKey: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUiTheme,
  onSetUiTheme,
  youtubeApiKey,
  onSetYoutubeApiKey,
}) => {
  const [localYoutubeKey, setLocalYoutubeKey] = useState(youtubeApiKey);

  useEffect(() => {
    setLocalYoutubeKey(youtubeApiKey);
  }, [youtubeApiKey, isOpen]); // Reset local key when modal opens or prop changes

  const handleSaveSettings = () => {
    onSetYoutubeApiKey(localYoutubeKey);
    // UI theme is set directly via onSetUiTheme, so no explicit save here for it
    onClose(); // Close modal after saving
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 sm:text-sm text-slate-900 dark:text-slate-100";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Settings">
      <div className="space-y-6">
        {/* UI Theme Setting */}
        <div>
          <label htmlFor="uiTheme" className={labelClass}>UI Theme</label>
          <select
            id="uiTheme"
            value={currentUiTheme}
            onChange={(e) => onSetUiTheme(e.target.value as UiTheme)}
            className={inputClass}
          >
            <option value="current">Current Theme</option>
            <option value="visual">Visual Theme</option>
            {/* Add more themes here if needed */}
          </select>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Change the look and feel of the application.
          </p>
        </div>

        {/* YouTube API Key Setting */}
        <div>
          <label htmlFor="youtubeApiKey" className={labelClass}>YouTube Data API v3 Key</label>
          <input
            type="password" // Use password type to obscure the key
            id="youtubeApiKey"
            value={localYoutubeKey}
            onChange={(e) => setLocalYoutubeKey(e.target.value)}
            className={inputClass}
            placeholder="Enter your YouTube API Key"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Required for fetching accurate YouTube video titles, descriptions, and tags. Your key is stored locally.
          </p>
           <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-sky-600 dark:text-sky-400 hover:underline">
            How to get a YouTube API Key?
          </a>
        </div>
        
        {/* Gemini API Key Info */}
        <div>
            <h4 className={`${labelClass} mb-1`}>Gemini API Key (for AI features)</h4>
            <p className="text-sm p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md text-slate-600 dark:text-slate-300">
                The Gemini API key for AI-powered title/description generation and categorization is managed via an environment variable (<code>process.env.API_KEY</code>) and is not set through this interface.
            </p>
        </div>


        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-md focus:outline-none"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
