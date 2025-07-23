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

  // Dock effect: scale and translate neighbors
  const safeHoveredIndex = hoveredIndex ?? null;
  let scale = 1;
  let zIndex = 1;
  let translateX = 0;
  const SHIFT = 24; // px, how much to move immediate neighbors
  const SHIFT2 = 12; // px, for second neighbors

  if (safeHoveredIndex !== null && typeof index === 'number') {
    if (safeHoveredIndex === index) {
      scale = 1.5;
      zIndex = 10;
      translateX = 0;
    } else if (safeHoveredIndex - index === 1) {
      // immediate left neighbor
      scale = 1.15;
      zIndex = 3;
      translateX = -SHIFT;
    } else if (safeHoveredIndex - index === -1) {
      // immediate right neighbor
      scale = 1.15;
      zIndex = 3;
      translateX = SHIFT;
    } else if (safeHoveredIndex - index === 2) {
      // second left neighbor
      translateX = -SHIFT2;
    } else if (safeHoveredIndex - index === -2) {
      // second right neighbor
      translateX = SHIFT2;
    }
  }

  // Keyboard accessibility: trigger onClick with Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      className={`relative bg-gray-800 border border-gray-600 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors w-20 aspect-square ${className}`}
      onClick={onClick}
      onMouseEnter={() => setHoveredIndex && typeof index === 'number' && setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex && setHoveredIndex(null)}
      animate={{ scale, zIndex, x: translateX }}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ zIndex, transformOrigin: 'bottom' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Shader Preview"
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