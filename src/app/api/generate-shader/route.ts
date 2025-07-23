import { NextRequest, NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { insertShader } from "../../../lib/db";
import { Shader } from "@/lib/types";
import { nanoid } from "../../../lib/nanoid";

interface ShaderRequest {
  prompt: string;
  model?:
    | "claude-3-5-sonnet-20241022"
    | "mistral-small-2503"
    | "gemini-2.0-flash-exp";
  creator_id: string;
  parent_shader?: Shader;
}

const audioPrompt = `
If the user asks you to build a shader that uses mic input, you should use navigator.mediaDevices.getUserMedia to get the audio stream. 
Here's an example using audioLevel, but you can use it in other more complex manners too.

// Initialize audio
let audioContext;
let analyser;
let audioLevel = 0;

async function setupAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
    } catch (err) {
        console.error('Mic access error:', err);
    }
}

function getAudioLevel() {
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length / 255;
}

...

setupAudio().then(() => {
    requestAnimationFrame(render);
});
`;

const shaderPrompt = (
  userPrompt: string,
  parent_shader: Shader | undefined
) => `You are an expert WebGL fragment shader programmer. Your task is to generate shader content based on the user's request.

IMPORTANT: You must return your response in this EXACT format:

<SHADER_HTML>
[Complete HTML document for the shader]
</SHADER_HTML>

<TWEAKPANE_CONFIG>
[JSON configuration object for TweakPane controls]
</TWEAKPANE_CONFIG>

## Requirements:

### HTML Document Structure:
- Complete HTML with DOCTYPE, head, and body
- WebGL fragment shader that creates visually interesting effects  
- Canvas element with id="shader-canvas"
- NO TweakPane controls or UI elements (these will be rendered externally)
- PostMessage listener to receive parameter updates from external controls
- Animation loop using requestAnimationFrame

### Shader Requirements:
- Always use WebGL 2.0
- Use WebGL fragment shader with gl_FragCoord for pixel coordinates
- Always include: uniform float u_time; uniform vec2 u_resolution;
- Add custom uniforms for user-controllable parameters
- Canvas should fill the available space (width: 100%, height: 100vh)

### PostMessage Integration:
- Listen for messages with type 'UPDATE_PARAMS'
- Update shader uniforms when receiving parameter changes
- Example listener:
\`\`\`javascript
// Listen for param updates
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'UPDATE_PARAMS') {
    if (e.data.params.noise !== undefined) params.noise = e.data.params.noise;
    if (e.data.params.speed !== undefined) params.speed = e.data.params.speed;
    if (e.data.params.color1 !== undefined) params.color1 = e.data.params.color1;
    if (e.data.params.color2 !== undefined) params.color2 = e.data.params.color2;
  }
});
\`\`\`
- Make sure your example uses params that include: floats, and colors as hex strings, eg:
\`\`\`javascript
// Default params
let params = {
  noise: 0.2,
  speed: 1.0,
  color1: '#ff8000', // orange
  color2: '#8000ff', // purple
};
\`\`\`
- Note that the above params are examples - and the actual values will depend on the user's request. 
- Don't always use the above colors, instead choose colors appropriate to the user's request.

### Audio Input

${audioPrompt}

### HTML Template:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shader</title>
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100vh; display: block; }
    </style>
</head>
<body>
    <canvas id="shader-canvas"></canvas>
    <script>
        // WebGL setup, shader compilation, postMessage listener, animation loop
        // NO TweakPane code here!
    </script>
</body>
</html>
\`\`\`

### TweakPane Configuration:
Return a JSON object with this structure:
\`\`\`json
{
  "Controls": {
    "paramName": {
      "value": 1.0,
      "min": 0.0, 
      "max": 2.0,
      "step": 0.1
    },
    "colorParam": {
      "value": "#ff0000"
    },
    "selectParam": {
      "value": "option1",
      "options": {
        "Option 1": "option1",
        "Option 2": "option2"
      }
    }
  }
}
\`\`\`

${
  parent_shader
    ? `
## Existing Shader:
The user has requested to remix the following shader, so base off it but add additional changes as required:

### HTML:
${parent_shader.html}

### TweakPane Config:
${JSON.stringify(parent_shader.json)}
`
    : ""
}

## User Request: 
${userPrompt}

Generate the shader HTML and TweakPane config in the specified format!`;

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      model = "claude-3-5-sonnet-20241022",
      creator_id,
      parent_shader,
    }: ShaderRequest = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!creator_id) {
      return NextResponse.json(
        { error: "Creator ID is required" },
        { status: 400 }
      );
    }

    let aiModel;

    switch (model) {
      case "claude-3-5-sonnet-20241022":
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          return NextResponse.json(
            { error: "ANTHROPIC_API_KEY not configured" },
            { status: 500 }
          );
        }
        const anthropic = createAnthropic({ apiKey: anthropicKey });
        aiModel = anthropic("claude-3-5-sonnet-20241022");
        break;

      case "mistral-small-2503":
        const mistralKey = process.env.MISTRAL_API_KEY;
        if (!mistralKey) {
          return NextResponse.json(
            { error: "MISTRAL_API_KEY not configured" },
            { status: 500 }
          );
        }
        const mistral = createMistral({ apiKey: mistralKey });
        aiModel = mistral("mistral-small-2503");
        break;

      case "gemini-2.0-flash-exp":
        const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!googleKey) {
          return NextResponse.json(
            { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
            { status: 500 }
          );
        }
        const google = createGoogleGenerativeAI({ apiKey: googleKey });
        aiModel = google("gemini-2.0-flash-exp");
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported model" },
          { status: 400 }
        );
    }

    const finalPrompt = shaderPrompt(prompt, parent_shader);

    const result = await generateText({
      model: aiModel,
      prompt: finalPrompt,
      maxTokens: 4096,
    });

    // Parse the structured response
    const htmlMatch = result.text.match(
      /<SHADER_HTML>([\s\S]*?)<\/SHADER_HTML>/
    );
    const configMatch = result.text.match(
      /<TWEAKPANE_CONFIG>([\s\S]*?)<\/TWEAKPANE_CONFIG>/
    );

    if (!htmlMatch || !configMatch) {
      console.error("Failed to parse structured response");
      return NextResponse.json(
        {
          error: "Invalid response format from AI model",
        },
        { status: 500 }
      );
    }

    let tweakpaneConfig;
    try {
      tweakpaneConfig = JSON.parse(configMatch[1].trim());
    } catch (configError) {
      console.error("Failed to parse TweakPane config:", configError);
      return NextResponse.json(
        {
          error: "Invalid TweakPane configuration format",
        },
        { status: 500 }
      );
    }

    const html = htmlMatch[1].trim();

    // Insert shader into database
    const id = nanoid();
    const shader = {
      id,
      creator_id,
      created_at: new Date(),
      lineage_id: parent_shader?.lineage_id ?? id,
      parent_id: parent_shader?.id ?? null,
      html,
      json: tweakpaneConfig,
      metadata: {
        prompt,
      },
    };
    await insertShader(shader);

    return NextResponse.json(shader);
  } catch (error) {
    console.error("Shader generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
