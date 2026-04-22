export interface ModelLimit {
  rpm: number
  rpd: number
  tpm: number
  tpm_daily?: number
}

export type AIModelType = 'chat' | 'tts' | 'stt'

export type ChatParams = {
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
  reasoning_effort?: 'low' | 'medium' | 'high' | 'default'
}

export type TTSParams = {
  voice?: string
}

export type ModelParams = ChatParams | TTSParams

export interface AIModel {
  id: string
  name: string
  provider: string
  type: AIModelType
  description: string
  limits: ModelLimit
  params?: ModelParams

  capabilities?: {
    streaming?: boolean
    function_calling?: boolean
    vision?: boolean
    audio?: boolean
  }

  pricing?: {
    input_per_1k_tokens?: number
    output_per_1k_tokens?: number
  }
}

export const AI_CATALOG: AIModel[] = [
  {
    id: 'llama-3-private',
    name: 'Ramsha (Private AI)',
    provider: 'N&L Foundation',
    type: 'chat',
    description: 'Built-in local intelligence running on your own infrastructure. Fully private and free.',
    limits: { rpm: 100, rpd: 5000, tpm: 1000000 },
    params: { temperature: 0.6, max_tokens: 4096, stream: true },
    capabilities: { streaming: true }
  }
]