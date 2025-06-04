import React, { useState } from 'react';
import LockIcon from './icons/LockIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { APP_TITLE } from '../constants';

interface PinInputProps {
  onSubmit: (pin: string) => void;
  isLoading: boolean;
  error: string | null;
  isInitialSetup: boolean;
}

const PinInput: React.FC<PinInputProps> = ({ onSubmit, isLoading, error, isInitialSetup }) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      onSubmit(pin);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 md:p-8 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <LockIcon className="w-14 h-14 sm:w-16 sm:h-16 text-sky-500 dark:text-sky-400 mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{APP_TITLE}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-center">
            {isInitialSetup ? "Set a new PIN to secure your bookmarks." : "Enter your PIN to unlock."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {isInitialSetup ? "Create PIN (min. 4 characters)" : "PIN Code"}
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 sm:text-sm text-slate-900 dark:text-slate-100"
              placeholder="••••••••"
              minLength={4}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || pin.length < 4}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoading ? (
              <SpinnerIcon className="w-5 h-5" />
            ) : (
              isInitialSetup ? "Set PIN & Initialize" : "Unlock"
            )}
          </button>
        </form>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 text-center">
          All data is encrypted and stored locally in your browser. Your PIN is never stored.
        </p>
      </div>
    </div>
  );
};

export default PinInput;