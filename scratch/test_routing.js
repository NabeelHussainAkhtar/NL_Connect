// Mock AI routing logic test
const JARVIS_SYSTEM_PROMPT = "system prompt";

const mockEnv = {
  GROQ_API_KEY: "groq_key",
  AGENT_ROUTER_TOKEN: "router_token",
  OPENAI_API_KEY: "openai_key"
};

function getRouting(body, env) {
  let model = body.model || 'llama-3.3-70b-versatile';
  
  // Handle decommissioned models
  if (model === 'mixtral-8x7b-32768') {
    model = 'llama-3.3-70b-versatile';
  }

  const isDeepSeek = model.includes('deepseek');
  const isGPT = model.startsWith('gpt');
  const isClaude = model.startsWith('claude');
  const isRouterExplicit = body.provider === 'agentrouter';
  
  let apiKey = env.GROQ_API_KEY;
  let baseURL = 'https://api.groq.com/openai/v1';

  if (isDeepSeek || isClaude || (isGPT && !env.OPENAI_API_KEY) || isRouterExplicit) {
    apiKey = env.AGENT_ROUTER_TOKEN;
    baseURL = 'https://agentrouter.org/v1';
  } else if (isGPT && env.OPENAI_API_KEY) {
    apiKey = env.OPENAI_API_KEY;
    baseURL = 'https://api.openai.com/v1';
  }

  return { apiKey, baseURL, model };
}

// Test cases
const tests = [
  { name: "Default (Groq)", body: { model: "llama-3.3-70b-versatile" }, expected: "groq_key", url: "https://api.groq.com/openai/v1" },
  { name: "Decommissioned Mixtral", body: { model: "mixtral-8x7b-32768" }, expected: "groq_key", url: "https://api.groq.com/openai/v1", expectedModel: "llama-3.3-70b-versatile" },
  { name: "DeepSeek (Router)", body: { model: "deepseek-v3" }, expected: "router_token", url: "https://agentrouter.org/v1" },
  { name: "Claude (Router)", body: { model: "claude-3-5-sonnet" }, expected: "router_token", url: "https://agentrouter.org/v1" },
  { name: "GPT (OpenAI)", body: { model: "gpt-4o" }, expected: "openai_key", url: "https://api.openai.com/v1" },
  { name: "GPT (Router Fallback)", body: { model: "gpt-5" }, env: { ...mockEnv, OPENAI_API_KEY: "" }, expected: "router_token", url: "https://agentrouter.org/v1" }
];

tests.forEach(t => {
  const result = getRouting(t.body, t.env || mockEnv);
  const pass = result.apiKey === t.expected && result.baseURL === t.url && (!t.expectedModel || result.model === t.expectedModel);
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${t.name}`);
  if (!pass) console.log(`  Result: ${result.apiKey}, ${result.baseURL}, ${result.model}`);
});
