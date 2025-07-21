'use client'

import { useState } from 'react'
import ShaderPlayground from './components/ShaderPlayground'
import { DebugControls } from './components/DebugControls'
import { useDebug } from './contexts/DebugContext'

// Match the ControlConfig type from ShaderPlayground
interface ControlConfig {
  value: number | number[] | string | string[]
  min?: number
  max?: number
  step?: number
  options?: unknown
  label?: string
}

export default function Home() {
  const { selectedModel } = useDebug()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shaderData, setShaderData] = useState<{
    html: string
    config?: Record<string, Record<string, ControlConfig>>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ prompt, model: selectedModel }),
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
      
      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)
      
      console.log(`🚀 Request completed: ${timeTaken}ms using ${selectedModel}`)
      
      setShaderData(data)
    } catch (err) {
      const endTime = performance.now()
      const timeTaken = Math.round(endTime - startTime)
      
      console.log(`❌ Request failed: ${timeTaken}ms using ${selectedModel}`)
      
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top-left header */}
      <div className="pt-8 pl-8">
        <h1 className="text-md font-bold text-gray-900 dark:text-white mb-2 text-left">
          shaderland
        </h1>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Removed input, button, and error display. Pass as props to ShaderPlayground. */}
          <ShaderPlayground 
            html={shaderData?.html ?? ''}
            config={shaderData?.config}
            prompt={prompt}
            setPrompt={setPrompt}
            isLoading={isLoading}
            generateShader={generateShader}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
