'use client'

import { useState, useEffect, useCallback } from 'react'
import ShaderPlayground from './ShaderPlayground'
import { DebugControls } from './DebugControls'
import { ShaderPreview } from './ShaderPreview'
import { useDebug } from '../contexts/DebugContext'
import { useUserId } from '../contexts/UserIdContext'

// Match the ControlConfig type from ShaderPlayground
export interface ControlConfig {
  value: number | number[] | string | string[]
  min?: number
  max?: number
  step?: number
  options?: unknown
  label?: string
}

interface RecentShader {
  id: string;
  created_at: string;
  creator_id: string;
  lineage_id: string;
  parent_id: string | null;
  html: string;
  json: Record<string, Record<string, ControlConfig>>;
  metadata: Record<string, unknown>;
}

interface ShaderAppProps {
  initialShaderData?: {
    html: string
    config?: Record<string, Record<string, ControlConfig>>
  } | null
}

export default function ShaderApp({ initialShaderData }: ShaderAppProps) {
  const { selectedModel, debugMode } = useDebug()
  const { userId } = useUserId()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shaderData, setShaderData] = useState<{
    html: string
    config?: Record<string, Record<string, ControlConfig>>
  } | null>(initialShaderData || null)
  const [error, setError] = useState<string | null>(null)
  const [recentShaders, setRecentShaders] = useState<RecentShader[]>([])
  const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied'>('idle')
  const [hoveredPreviewIndex, setHoveredPreviewIndex] = useState<number | null>(null);

  // Get current shader ID from URL for sharing
  const getCurrentShaderId = () => {
    const match = window.location.pathname.match(/^\/s\/(.+)$/)
    return match ? match[1] : null
  }

  const handleShare = async () => {
    const shaderId = getCurrentShaderId()
    if (!shaderId) {
      return
    }

    // fallback to clipboard
    try {
      const shareUrl = `${window.location.origin}/s/${shaderId}`
      await navigator.clipboard.writeText(shareUrl)
      setShareButtonState('copied')
      setTimeout(() => setShareButtonState('idle'), 800)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Just silently fail, no error state
    }
  }

  const generateShader = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)

    const startTime = performance.now()

    try {
      const response = await fetch('/api/generate-shader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          creator_id: userId
        }),
      })

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.log('Failed to parse:', responseText.substring(0, 500))
        throw new Error('Invalid JSON response from server')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate shader')
      }

      console.log('Parsed data keys:', Object.keys(data))

      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)

      console.log(`🚀 Request completed: ${timeTaken}ms using ${selectedModel}`)

      setShaderData(data)

      // Update URL to new shader with shallow routing (no reload)
      if (data.id) {
        window.history.pushState({}, '', `/s/${data.id}`)
      }
    } catch (err) {
      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)

      console.log(`❌ Request failed: ${timeTaken}ms using ${selectedModel}`)

      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentShaders = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/recent-shaders?limit=12`);
      if (response.ok) {
        const data = await response.json() as { shaders: RecentShader[] };
        setRecentShaders(data.shaders || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent shaders:', error);
    }
  }, [userId]);

  const loadShader = (shader: RecentShader) => {
    console.log('Loading shader:', shader.id);
    console.log('Shader config type:', typeof shader.json);
    console.log('Shader config:', shader.json);

    setShaderData({
      html: shader.html,
      config: shader.json
    });

    // Update URL with shallow routing to prevent reload
    window.history.pushState({}, '', `/s/${shader.id}`)
  };

  useEffect(() => {
    if (debugMode && userId) {
      fetchRecentShaders();
    }
  }, [debugMode, userId, fetchRecentShaders]);

  useEffect(() => {
    if (shaderData) {
      fetchRecentShaders();
    }
  }, [shaderData, fetchRecentShaders]);

  return (
    <div className="min-h-screen bg-black">
      {/* Top-left header */}
      <div className="pt-8 pl-8">
        <h1 className="text-md font-bold text-gray-900 dark:text-white mb-2 text-left">
          shaderland
        </h1>
      </div>
      <DebugControls />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ShaderPlayground
            html={shaderData?.html ?? ''}
            config={shaderData?.config}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            generateShader={generateShader}
            error={error}
            onShare={handleShare}
            shareButtonState={shareButtonState}
          />

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Examples</h3>
            <div className="flex overflow-x-auto gap-4 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {recentShaders.map((shader, idx) => (
                <ShaderPreview
                  key={shader.id}
                  html={shader.html}
                  onClick={() => loadShader(shader)}
                  className=""
                  index={idx}
                  hoveredIndex={hoveredPreviewIndex}
                  setHoveredIndex={setHoveredPreviewIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <DebugControls />
    </div>
  )
}