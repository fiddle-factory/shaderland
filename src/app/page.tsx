'use client'

import { useState } from 'react'
import ShaderPlayground from './components/ShaderPlayground'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shaderData, setShaderData] = useState<{
    html: string
    config?: any
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateShader = async () => {
    if (!prompt.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-shader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })
      
      console.log('=== FRONTEND RESPONSE ===')
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('Raw response length:', responseText.length)
      console.log('Raw response first 200 chars:', responseText.substring(0, 200))
      console.log('Is JSON?', responseText.startsWith('{'))
      console.log('=== END FRONTEND RESPONSE ===')
      
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
      setShaderData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ShaderLand
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate interactive WebGL shaders with AI
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the shader you want to create (e.g., 'a swirling galaxy with adjustable colors')"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && generateShader()}
              />
              <button
                onClick={generateShader}
                disabled={isLoading || !prompt.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
                {error}
              </div>
            )}
          </div>

          {shaderData && (
            <ShaderPlayground 
              html={shaderData.html}
              config={shaderData.config}
              renderMode="iframe"
            />
          )}
        </div>
      </div>
    </div>
  )
}
