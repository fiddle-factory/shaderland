import { NextRequest, NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

interface ShaderRequest {
  prompt: string;
  model?: "claude-3-5-sonnet-20241022" | "mistral-small-2503" | "gemini-2.0-flash-exp";
}

interface ShaderResponse {
  html: string;
  config: Record<string, unknown>;
}

const shaderPrompt = (
  userPrompt: string
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
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_PARAMS') {
    // Update shader uniforms with event.data.params
  }
});
\`\`\`

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

## User Request: 
${userPrompt}

Generate the shader HTML and TweakPane config in the specified format!`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "claude-3-5-sonnet-20241022" }: ShaderRequest =
      await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
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

    const result = await generateText({
      model: aiModel,
      prompt: shaderPrompt(prompt),
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
      console.log("Raw response:", result.text);
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
      console.log("Config text:", configMatch[1]);
      return NextResponse.json(
        {
          error: "Invalid TweakPane configuration format",
        },
        { status: 500 }
      );
    }

    const html = htmlMatch[1].trim();

    console.log("=== PARSED RESPONSE ===");
    console.log("HTML length:", html.length);
    console.log("Config keys:", Object.keys(tweakpaneConfig));
    console.log("=== END PARSED RESPONSE ===");

    return NextResponse.json({
      html,
      config: tweakpaneConfig,
    } as ShaderResponse);
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
