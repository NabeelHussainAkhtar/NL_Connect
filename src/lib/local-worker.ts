/**
 * N&L Connect Local Worker
 * Handles heavy processing off the main thread.
 */

// Basic fuzzy matching logic moved to worker for performance
function getScore(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  
  let overlap = 0
  const qSet = new Set(q)
  for (const char of t) if (qSet.has(char)) overlap++
  return (overlap / Math.max(t.length, q.length)) * 40
}

self.onmessage = (e) => {
  const { id, task } = e.data
  
  try {
    let result: any = null

    switch (task.type) {
      case 'AI_PARSE':
        // Extract Commands from AI markdown string
        const content = task.data.content || ''
        const commandMatch = content.match(/\{(?:[^{}]|(\{[^{}]*\}))*\}/g)
        let commands: any[] = []
        if (commandMatch) {
          commandMatch.forEach((m: string) => {
            try { 
              const parsed = JSON.parse(m)
              if (parsed.command) commands.push(parsed)
            } catch (e) {}
          })
        }
        result = { commands, cleanContent: content.replace(/\{.*\}/g, '').trim() }
        break

      case 'DISCOVERY_SEARCH':
        // Execute fuzzy search across data provided in task
        const { query, dataset } = task.data
        const searchResults = dataset.map((item: any) => {
          const score = Math.max(
            getScore(item.title || '', query),
            getScore(item.subtitle || '', query)
          )
          return { ...item, score }
        })
        .filter((item: any) => item.score > 30)
        .sort((a: any, b: any) => b.score - a.score)
        
        result = searchResults.slice(0, 10) // Top 10 for performance
        break

      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }

    self.postMessage({ id, result })
  } catch (error: any) {
    self.postMessage({ id, error: error.message })
  }
}
