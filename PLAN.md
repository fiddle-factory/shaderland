Okay we're gonna make shaderland -> based on Shader Toy.

This will use HTML Shader fragments.

We have an existing implemnentation of this in a more complex repo, but this is going to be much simpler.

For now, our initial v1 plan  is as follows:

- Backend endpoint that takes in a user request, makes the appropriate LLM call via Vercel AI SDK, probably to Claude, parses the response -> returns this "shader'
- Note that the parsing + prompting is a bit tricky -> you want eg: XML tags, and need to parse those out   
- A shader is "code" + "config" for tweakpane, so we return these two things to the client
- The client should render it using Tweakpane.

-------
Later on there will be bits like:
- User provided API keys
- DB persistence

But for now, this is unnecessary - we'll just use a single "ANTHROPIC_API_KEY" from the environment.

