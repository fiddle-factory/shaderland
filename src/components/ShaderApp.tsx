'use client'

import { useState, useEffect, useCallback } from 'react'
import ShaderPlayground from './ShaderPlayground'
import { DebugControls } from './DebugControls'
import Dock from './Dock'
import { useDebug } from '../contexts/DebugContext'
import { useUserId } from '../contexts/UserIdContext'
import { Shader } from '../lib/types'


interface ShaderAppProps {
  initialShaderData?: Shader | null
}

export default function ShaderApp({ initialShaderData }: ShaderAppProps) {
  const { selectedModel } = useDebug()
  const { userId } = useUserId()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shaderData, setShaderData] = useState<Shader | null>(initialShaderData || null)
  const [error, setError] = useState<string | null>(null)
  const [recentShaders, setRecentShaders] = useState<Shader[]>([])
  const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied'>('idle')
  const [showDock, setShowDock] = useState(true);
  const [isNewProject, setIsNewProject] = useState(false)

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
      const requestBody = {
        prompt,
        model: selectedModel,
        creator_id: userId,
        parent_shader: !isNewProject && shaderData ? shaderData : undefined
      };

      const response = await fetch('/api/generate-shader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        throw new Error('Invalid JSON response from server')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate shader')
      }

      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)

      setShaderData(data)

      // Reset New Project mode after successful generation
      setIsNewProject(false)

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
      const response = await fetch(`/api/recent-shaders?limit=15`);
      if (response.ok) {
        const data = await response.json() as { shaders: Shader[] };
        setRecentShaders(data.shaders || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent shaders:', error);
    }
  }, [userId]);

  const loadShader = (shader: Shader) => {
    setShaderData(shader);

    // Update URL with shallow routing to prevent reload
    window.history.pushState({}, '', `/s/${shader.id}`)
  };

  useEffect(() => {
    if (userId) {
      fetchRecentShaders();
    }
  }, [userId, fetchRecentShaders]);

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
            config={shaderData?.json ?? {}}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            generateShader={generateShader}
            error={error}
            onShare={handleShare}
            shareButtonState={shareButtonState}
            isNewProject={isNewProject}
            onToggleNewProject={() => setIsNewProject(!isNewProject)}
          />

        </div >
      </div >
      <DebugControls />
      {/* Dock Notch and Dock at bottom */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 4, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
        {/* Notch */}
        <div
          onClick={() => setShowDock(v => !v)}
          style={{
            width: 20,
            height: 4,
            borderRadius: 4,
            background: '#fffff19',
            marginBottom: showDock ? 2 : 0,
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'background 0.2s',
            opacity: 0.8
          }}
          title={showDock ? 'Hide dock' : 'Show dock'}
        />
        {/* Dock */}
        {showDock && (
          <div className="App" style={{ pointerEvents: 'auto' }}>
            <Dock
              items={recentShaders.map(shader => ({
                icon: (
                  <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 8, background: 'transparent' }}>
                    <iframe
                      srcDoc={shader.html ?? ''}
                      style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' /* disables interaction until selected */ }}
                      title="Shader Preview"
                    />
                    <button
                      onClick={() => loadShader(shader)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                      aria-label="Select shader"
                    />
                  </div>
                ),
                action: () => loadShader(shader)
              }))}
            />
          </div>
        )}
      </div>
    </div >
  )
}