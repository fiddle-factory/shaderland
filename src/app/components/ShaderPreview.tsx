'use client';

import React, { useEffect, useRef } from 'react';

interface ShaderPreviewProps {
  html: string;
  onClick: () => void;
  className?: string;
}

export function ShaderPreview({ html, onClick, className = '' }: ShaderPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      
      // Use data URL approach to avoid variable conflicts
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      iframe.src = dataUrl;
    }
  }, [html]);

  if (!html) {
    return (
      <div className={`bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No shader</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-gray-800 border border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors ${className}`}
      onClick={onClick}
    >
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        style={{ border: 'none' }}
        title="Shader Preview"
      />
      <div className="absolute inset-0 hover:bg-blue-500/10 transition-colors" />
    </div>
  );
}