'use client'

import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'
import { ArrowCounterClockwise } from 'phosphor-react'

// Define types for controls
interface ControlConfig {
  value: number | number[] | string | string[]
  min?: number
  max?: number
  step?: number
  options?: unknown
  label?: string
}

interface ShaderPlaygroundProps {
  html: string
  config?: Record<string, Record<string, ControlConfig>>
  prompt: string
  setPrompt: (v: string) => void
  isLoading: boolean
  generateShader: () => void
  error?: string | null
}

// Default shader HTML (orange-purple noisy gradient)
const defaultShaderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Default Shader</title>
  <style>
    html, body { height: 100%; margin: 0; background: #222; }
    body { display: flex; align-items: center; justify-content: center; height: 100vh; }
    canvas { width: 100vw; height: 100vh; display: block; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script id="vertShader" type="x-shader/x-vertex">
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }
  </script>
  <script id="fragShader" type="x-shader/x-fragment">
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_noise;
    uniform float u_speed;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    // Simple 2D noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      // Animate the noise field with time and swirl
      float angle = u_time * u_speed * 0.2 + uv.x * 6.2831;
      vec2 swirl = uv + 0.15 * vec2(cos(angle), sin(angle));
      float n = noise(swirl * 12.0 + u_time * u_speed * 0.7) * 0.7 * u_noise;
      float n2 = noise(swirl * 24.0 - u_time * u_speed * 0.3) * 0.3 * u_noise;
      float noisyMix = clamp(uv.x + n + n2, 0.0, 1.0);
      vec3 color = mix(u_color1, u_color2, noisyMix);
      gl_FragColor = vec4(color, 1.0);
    }
  </script>
  <script>
    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl');
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    window.addEventListener('resize', resize);
    resize();
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }
    const vertSrc = document.getElementById('vertShader').textContent;
    const fragSrc = document.getElementById('fragShader').textContent;
    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    // Quad
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    // Uniforms
    const u_time = gl.getUniformLocation(program, 'u_time');
    const u_res = gl.getUniformLocation(program, 'u_resolution');
    const u_noise = gl.getUniformLocation(program, 'u_noise');
    const u_color1 = gl.getUniformLocation(program, 'u_color1');
    const u_color2 = gl.getUniformLocation(program, 'u_color2');
    const u_speed = gl.getUniformLocation(program, 'u_speed');
    // Helper to convert hex to [r,g,b] 0-1
    function hexToRgbNorm(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const num = parseInt(hex, 16);
      return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255
      ];
    }
    // Default params
    let params = {
      noise: 0.2,
      speed: 1.0,
      color1: '#ff8000', // orange
      color2: '#8000ff', // purple
    };
    // Listen for param updates
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'UPDATE_PARAMS') {
        if (e.data.params.noise !== undefined) params.noise = e.data.params.noise;
        if (e.data.params.speed !== undefined) params.speed = e.data.params.speed;
        if (e.data.params.color1 !== undefined) params.color1 = e.data.params.color1;
        if (e.data.params.color2 !== undefined) params.color2 = e.data.params.color2;
      }
    });
    function render(time) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u_time, time * 0.001);
      gl.uniform2f(u_res, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(u_noise, params.noise);
      gl.uniform1f(u_speed, params.speed);
      gl.uniform3fv(u_color1, hexToRgbNorm(params.color1));
      gl.uniform3fv(u_color2, hexToRgbNorm(params.color2));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    render(0);
  </script>
</body>
</html>`;

// Default controls config for the default shader
const defaultControlsConfig = {
  'Gradient': {
    color1: {
      value: '#ff8000', // orange
      label: 'Color 1',
      options: undefined,
    },
    color2: {
      value: '#8000ff', // purple
      label: 'Color 2',
      options: undefined,
    },
  },
  'Noise': {
    noise: {
      value: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
      label: 'Noise Amount',
    },
    speed: {
      value: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.01,
      label: 'Speed',
    },
  },
};

export default function ShaderPlayground({ html, config, prompt, setPrompt, isLoading, generateShader, error }: ShaderPlaygroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<Pane | null>(null)
  const paramsRef = useRef<Record<string, number | number[] | string | string[]>>({})
  const [loadError, setLoadError] = useState(false)

  // Use defaults if html/config are not provided or empty
  const effectiveHtml = html && html.trim() ? html : defaultShaderHtml;
  const effectiveConfig = config || defaultControlsConfig;

  // Initialize TweakPane controls
  useEffect(() => {
    if (!effectiveConfig || !controlsRef.current) return

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
    Object.entries(effectiveConfig).forEach(([folderName, controls]) => {
      const folder = pane.addFolder({ title: folderName, expanded: true })

      Object.entries(controls as Record<string, ControlConfig>).forEach(([paramName, controlConfig]) => {
        const cfg = controlConfig as ControlConfig
        paramsRef.current[paramName] = cfg.value

        folder
          .addBinding(paramsRef.current, paramName, {
            ...(cfg.min !== undefined && { min: cfg.min }),
            ...(cfg.max !== undefined && { max: cfg.max }),
            ...(cfg.step !== undefined && { step: cfg.step }),
            ...(typeof cfg.options === 'object' && cfg.options !== null ? { options: cfg.options } : {}),
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
  }, [effectiveConfig])

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
    if (!iframeRef.current || !effectiveHtml) return

    // Create a blob URL for the HTML content
    const blob = new Blob([effectiveHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    setLoadError(false)

    const loadTimeout = setTimeout(() => {
      setLoadError(true)
    }, 10000)

    const handleLoad = () => {
      clearTimeout(loadTimeout)
      setLoadError(false)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        iframeRef.current.removeEventListener('error', handleError)
      }
    }
  }, [effectiveHtml])

  const reloadShader = () => {
    if (iframeRef.current && effectiveHtml) {
      const blob = new Blob([effectiveHtml], { type: 'text/html' })
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
      {/* Main content area with shader and controls */}
      <div className="flex">
        {/* Shader Canvas/Iframe with reload icon */}
        <div className="flex-1 aspect-square relative group">
          {/* Reload Icon Button (appears on hover) */}
          <button
            onClick={reloadShader}
            className="absolute top-3 right-3 z-10 p-2 rounded bg-white/10 hover:bg-white/20 text-white shadow transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
            style={{ marginTop: '0px', marginRight: '0px' }}
            aria-label="Reload Shader"
            tabIndex={0}
          >
            <ArrowCounterClockwise size={16} weight="bold" />
          </button>
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
              className="w-full h-full border-none rounded"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              title="Shader Preview"
            />
          )}
        </div>

        {/* TweakPane Controls and input */}
        {effectiveConfig && (
          <div className="w-80 bg-zinc-900 flex flex-col">
            {/* Input and button above controls */}
            <div className="p-4">
              <div className="flex items-center bg-white/5 rounded-sm overflow-hidden px-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the shader you want to create (e.g., 'a swirling galaxy with adjustable colors')"
                  className="flex-1 py-2 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  onKeyDown={e => e.key === 'Enter' && generateShader()}
                />
                {prompt.trim() && (
                  <button
                    onClick={generateShader}
                    disabled={isLoading}
                    className="h-full px-2 py-1 bg-white/10 hover:bg-white/20 
                    disabled:opacity-50 disabled:cursor-not-allowed rounded-none rounded-r-sm 
                    flex items-center justify-center text-xs"
                    aria-label="Generate Shader"
                  >
                    ↵
                  </button>
                )}
              </div>
              {error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="p-4 flex-1 overflow-auto">
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