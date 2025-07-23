'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ShaderPreviewProps {
  html: string;
  onClick: () => void;
  className?: string;
  index?: number;
  hoveredIndex?: number | null;
  setHoveredIndex?: (index: number | null) => void;
}

export function ShaderPreview({ html, onClick, className = '', index, hoveredIndex, setHoveredIndex }: ShaderPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      // Use srcdoc for better compatibility  
      iframe.srcdoc = html;
    }
  }, [html]);

  if (!html) {
    return (
      <div className={`bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No shader</span>
      </div>
    );
  }

  // Determine scale: 1.5 if hovered, 1.15 if neighbor, else 1
  const safeHoveredIndex = hoveredIndex ?? null;
  let scale = 1;
  if (safeHoveredIndex !== null && typeof index === 'number') {
    if (safeHoveredIndex === index) scale = 1.5;
    else if (Math.abs(safeHoveredIndex - index) === 1) scale = 1.15;
  }

  return (
    <motion.div
      className={`relative bg-gray-800 border border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors w-20 aspect-square ${className}`}
      onClick={onClick}
      onMouseEnter={() => setHoveredIndex && typeof index === 'number' && setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex && setHoveredIndex(null)}
      animate={{ scale, zIndex: safeHoveredIndex === index ? 10 : 1 }}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ zIndex: safeHoveredIndex === index ? 10 : 1 }}
    >
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        style={{ border: 'none' }}
        title="Shader Preview"
      />
      <div className="absolute inset-0 hover:bg-blue-500/10 transition-colors" />
    </motion.div>
  );
}