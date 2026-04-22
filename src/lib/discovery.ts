import { mockContacts, mockPosts, mockGames } from './mockData'

export interface DiscoveryResult {
  id: string
  type: 'module' | 'contact' | 'post' | 'game' | 'prompt'
  title: string
  subtitle?: string
  image?: string
  path?: string
  accent?: string
  score?: number
}

export const PROJECT_MODULES: DiscoveryResult[] = [
  { id: 'mod-home',   type: 'module', title: 'Home',   subtitle: 'Dashboard', path: '/home',   accent: '#4f7dff' },
  { id: 'mod-chat',   type: 'module', title: 'Chat',   subtitle: 'Messages',  path: '/comms',  accent: '#4f7dff' },
  { id: 'mod-music',  type: 'module', title: 'Music',  subtitle: 'YT Music',  path: '/media',  accent: '#bf5af2' },
  { id: 'mod-video',  type: 'module', title: 'Video',  subtitle: 'WatchRoom', path: '/media',  accent: '#ffd60a' },
  { id: 'mod-ai',     type: 'module', title: 'AI',     subtitle: 'JARVIS',    path: '/ai',     accent: '#00f5d4' },
  { id: 'mod-games',  type: 'module', title: 'Games',  subtitle: 'Play Live', path: '/gaming', accent: '#30d158' },
  { id: 'mod-social', type: 'module', title: 'Feed',   subtitle: 'Social',    path: '/social', accent: '#ff375f' },
]

export const AI_SUGGESTIONS: string[] = [
  "Summarize my day",
  "Tell me a joke",
  "Search for music",
  "Generate an image of",
  "How is the weather?",
  "Who is Layla Hassan?",
  "Review my recent code",
  "Play some lo-fi music"
]

/** 
 * Simple Fuzzy Match Score
 * 100 for exact match
 * 80 for prefix match
 * 50 for contains match
 * Otherwise overlap score
 */
function getScore(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  
  // Basic overlap character match for typos
  let overlap = 0
  const qSet = new Set(q)
  for (const char of t) if (qSet.has(char)) overlap++
  return (overlap / Math.max(t.length, q.length)) * 40
}

export function searchProject(query: string): DiscoveryResult[] {
  if (!query.trim()) return []
  
  const results: DiscoveryResult[] = []

  // 1. Search Modules
  PROJECT_MODULES.forEach(m => {
    const score = Math.max(getScore(m.title, query), getScore(m.subtitle || '', query))
    if (score > 30) results.push({ ...m, score })
  })

  // 2. Search Contacts
  mockContacts.forEach(c => {
    const score = getScore(c.name, query)
    if (score > 30) {
      results.push({
        id: `contact-${c.id}`,
        type: 'contact',
        title: c.name,
        subtitle: c.lastMessage,
        image: c.avatar,
        path: `/comms?chat=${c.id}`,
        accent: '#4f7dff',
        score
      })
    }
  })

  // 3. Search Games
  mockGames.forEach(g => {
    const score = getScore(g.title, query)
    if (score > 30) {
      results.push({
        id: `game-${g.id}`,
        type: 'game',
        title: g.title,
        subtitle: g.category,
        image: g.thumbnail,
        path: '/gaming',
        accent: g.accent,
        score
      })
    }
  })

  // 4. Search AI Prompts (Only if context is AI or query is related)
  AI_SUGGESTIONS.forEach((p, i) => {
    const score = getScore(p, query)
    if (score > 40) {
      results.push({
        id: `prompt-${i}`,
        type: 'prompt',
        title: p,
        subtitle: 'AI Suggestion',
        accent: '#00f5d4',
        score: score * 0.9 // Slightly lower weight than modules/contacts
      })
    }
  })

  return results.sort((a, b) => b.score! - a.score!)
}

export function getAISuggestedPrompts(query: string): string[] {
  if (!query.trim()) return AI_SUGGESTIONS.slice(0, 4)
  return AI_SUGGESTIONS
    .filter(p => p.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => getScore(a, query) - getScore(b, query))
}

export function getSearchableDataset() {
  return [
    ...PROJECT_MODULES,
    ...mockContacts.map(c => ({
      id: `contact-${c.id}`,
      type: 'contact' as const,
      title: c.name,
      subtitle: c.lastMessage,
      image: c.avatar,
      path: `/comms?chat=${c.id}`,
      accent: '#4f7dff'
    })),
    ...mockGames.map(g => ({
      id: `game-${g.id}`,
      type: 'game' as const,
      title: g.title,
      subtitle: g.category,
      image: g.thumbnail,
      path: '/gaming',
      accent: g.accent
    })),
    ...AI_SUGGESTIONS.map((p, i) => ({
      id: `prompt-${i}`,
      type: 'prompt' as const,
      title: p,
      subtitle: 'AI Suggestion',
      accent: '#00f5d4'
    }))
  ]
}
