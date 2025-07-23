'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AIModel = 'claude-3-5-sonnet-20241022' | 'mistral-small-2503' | 'gemini-2.0-flash-exp';

interface DebugContextType {
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugMode, setDebugModeState] = useState(false);
  const [selectedModel, setSelectedModelState] = useState<AIModel>('claude-3-5-sonnet-20241022');

  // Load from localStorage on mount
  useEffect(() => {
    const savedDebugMode = localStorage.getItem('debugMode');
    const savedModel = localStorage.getItem('selectedModel');
    
    if (savedDebugMode !== null) {
      setDebugModeState(JSON.parse(savedDebugMode));
    }
    
    if (savedModel && ['claude-3-5-sonnet-20241022', 'mistral-small-2503', 'gemini-2.0-flash-exp'].includes(savedModel)) {
      setSelectedModelState(savedModel as AIModel);
    }
  }, []);

  const setDebugMode = (mode: boolean) => {
    setDebugModeState(mode);
    localStorage.setItem('debugMode', JSON.stringify(mode));
  };

  const setSelectedModel = (model: AIModel) => {
    setSelectedModelState(model);
    localStorage.setItem('selectedModel', model);
  };

  return (
    <DebugContext.Provider value={{
      debugMode,
      setDebugMode,
      selectedModel,
      setSelectedModel,
    }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}