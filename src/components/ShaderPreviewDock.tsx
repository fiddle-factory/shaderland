import React, { useState } from "react";
import { ShaderPreview } from "./ShaderPreview";
import { RecentShader } from "./ShaderApp";

interface ShaderPreviewDockProps {
  shaders: RecentShader[];
  onPreviewClick: (shader: RecentShader) => void;
  className?: string;
}

export default function ShaderPreviewDock({ shaders, onPreviewClick, className = "" }: ShaderPreviewDockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={`flex items-end overflow-x-auto gap-4 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${className}`}>
      {shaders.map((shader, idx) => (
        <ShaderPreview
          key={shader.id}
          html={shader.html}
          onClick={() => onPreviewClick(shader)}
          index={idx}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      ))}
    </div>
  );
} 