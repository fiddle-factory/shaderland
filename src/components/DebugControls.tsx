'use client';

import React from 'react';
import { useDebug, AIModel } from '../contexts/DebugContext';

export function DebugControls() {
  const { debugMode, setDebugMode, selectedModel, setSelectedModel } = useDebug();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <button
        onClick={() => setDebugMode(!debugMode)}
        className={`p-2 rounded transition-all duration-200 ${debugMode
          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          : 'bg-transparent text-gray-600 hover:text-gray-500'
          }`}
        aria-label="Toggle debug mode"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="transition-opacity duration-200"
        >
          <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.42.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
        </svg>
      </button>

      {debugMode && (
        <div className="bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-700 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="w-full bg-gray-700 text-gray-300 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
            <option value="mistral-small-2503">mistral-small-2503</option>
            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
          </select>
        </div>
      )}
    </div>
  );
}