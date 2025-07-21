'use client'

import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'

interface ShaderPlaygroundProps {
  html: string
  config?: any
}

export default function ShaderPlayground({ html, config }: ShaderPlaygroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const paramsRef = useRef<Record<string, any>>({})
  const [loadError, setLoadError] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Initialize TweakPane controls
  useEffect(() => {
    if (!config || !controlsRef.current) return

    // Cleanup existing pane
    if (paneRef.current) {
      paneRef.current.dispose()
    }

    // Create new pane
    const pane = new Pane({
      container: controlsRef.current,
      title: 'Shader Controls'
    })

    paneRef.current = pane

    // Initialize parameters with default values
    Object.entries(config).forEach(([folderName, controls]: [string, any]) => {
      const folder = pane.addFolder({ title: folderName, expanded: true })

      Object.entries(controls).forEach(([paramName, controlConfig]: [string, any]) => {
        paramsRef.current[paramName] = controlConfig.value

        folder
          .addBinding(paramsRef.current, paramName, {
            ...(controlConfig.min !== undefined && { min: controlConfig.min }),
            ...(controlConfig.max !== undefined && { max: controlConfig.max }),
            ...(controlConfig.step !== undefined && { step: controlConfig.step }),
            ...(controlConfig.options && { options: controlConfig.options }),
            label: paramName
          })
          .on('change', () => {
            sendParamsUpdate()
          })
      })
    })

    return () => {
      if (paneRef.current) {
        paneRef.current.dispose()
        paneRef.current = null
      }
    }
  }, [config])

  // Send parameter updates to shader
  const sendParamsUpdate = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_PARAMS',
        params: paramsRef.current
      }, '*')
    }
  }

  // Initialize shader
  useEffect(() => {
    if (!iframeRef.current || !html) return

    // Create a blob URL for the HTML content
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    setLoadError(false)
    setIsReady(false)

    const loadTimeout = setTimeout(() => {
      setLoadError(true)
    }, 10000)

    const handleLoad = () => {
      clearTimeout(loadTimeout)
      setLoadError(false)
      setIsReady(true)
      // Send initial parameters once iframe is loaded
      setTimeout(() => {
        sendParamsUpdate()
      }, 100)
    }

    const handleError = () => {
      clearTimeout(loadTimeout)
      setLoadError(true)
    }

    iframeRef.current.addEventListener('load', handleLoad)
    iframeRef.current.addEventListener('error', handleError)

    // Set the iframe src to the blob URL
    iframeRef.current.src = url

    return () => {
      clearTimeout(loadTimeout)
      URL.revokeObjectURL(url)
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleLoad)
        iframeRef.current.removeEventListener('error', handleError)
      }
    }
  }, [html])

  const reloadShader = () => {
    if (iframeRef.current && html) {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
      setTimeout(() => {
        URL.revokeObjectURL(url)
        sendParamsUpdate()
      }, 1000)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interactive Shader
          </h3>
          <div className="flex gap-2">
            {config && (
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded">
                {Object.keys(config).length} control groups
              </span>
            )}
            <button
              onClick={reloadShader}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
            >
              Reload
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Shader Canvas/Iframe */}
        <div className="flex-1 aspect-square">
          {loadError ? (
            <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
              <div className="text-center p-4">
                <div className="text-red-600 dark:text-red-400 mb-2">⚠️ Shader Failed to Load</div>
                <div className="text-sm text-red-500 dark:text-red-300 mb-3">
                  The generated shader encountered an error
                </div>
                <button
                  onClick={reloadShader}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              title="Shader Preview"
            />
          )}
        </div>

        {/* TweakPane Controls */}
        {config && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Controls
              </h4>
              <div ref={controlsRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}