export interface AIModel {
  id: string
  name: string
  features: ('text' | 'code' | 'vision')[]
  description: string
}

export const AI_MODELS: AIModel[] = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', features: ['text', 'code'], description: 'Fastest & light for daily chat.' },
  { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', features: ['text', 'code'], description: 'Balanced speed and intelligence.' },
  { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', features: ['text', 'code'], description: 'Highly intelligent reasoning.' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', features: ['text', 'code'], description: 'Professional grade power.' },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'Nemotron 12B VL', features: ['text', 'vision'], description: 'Understands images and text.' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen 3 Coder', features: ['code'], description: 'Specialized for coding tasks.' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', features: ['text', 'code'], description: 'Smooth and consistent replies.' },
  { id: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'Liquid Thinking', features: ['text'], description: 'Focused on logical reasoning.' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 Next', features: ['text', 'code'], description: 'The future of Gemma models.' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron Super', features: ['text'], description: 'Massive knowledge base.' },
  { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large', features: ['text', 'code'], description: 'Advanced logic preview.' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', features: ['text', 'code'], description: 'Open source GPT-like power.' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano', features: ['text'], description: 'Snappy general responses.' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron 9B V2', features: ['text'], description: 'Optimized for speed.' },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', features: ['text'], description: 'Creative and fluid text.' },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2:free', name: 'Nemotron Embed VL', features: ['vision'], description: 'Vision-centric processing.' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B', features: ['text', 'code'], description: 'Strong balanced reasoning.' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B', features: ['text'], description: 'Medium scale general AI.' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen 3 Next', features: ['text', 'code'], description: 'Next-gen coding and logic.' },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'Liquid Instruct', features: ['text'], description: 'Follows instructions perfectly.' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', features: ['text', 'code'], description: 'Large scale Gemma power.' },
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral', features: ['text'], description: 'Uncensored & creative chat.' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 Huge', features: ['text', 'code'], description: 'Massive logic and reasoning.' },
  { id: 'google/gemma-3n-e2b-it:free', name: 'Gemma 3n 2B', features: ['text'], description: 'Ultra-fast mini model.' },
  { id: 'google/gemma-3n-e4b-it:free', name: 'Gemma 3n 4B', features: ['text'], description: 'Fast and efficient chat.' },
  { id: 'openrouter/free', name: 'Auto-Free Router', features: ['text'], description: 'Automatically picks best free AI.' },
]
